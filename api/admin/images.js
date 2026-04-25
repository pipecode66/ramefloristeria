import { randomUUID } from "node:crypto";
import {
  getAuthConfig,
  parseCookies,
  readJsonBody,
  sendJson,
  sendMethodNotAllowed,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "./_auth.js";
import {
  getErrorMessage,
  getSupabaseAdminClient,
  getSupabaseConfig,
} from "../_supabase.js";

const DEFAULT_MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_CACHE_CONTROL_SECONDS = 60 * 60 * 24 * 365;
const ALLOWED_FOLDERS = new Set(["banners", "products"]);

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const getMaxImageBytes = () =>
  parsePositiveInteger(process.env.ADMIN_IMAGE_UPLOAD_MAX_BYTES, DEFAULT_MAX_IMAGE_BYTES);

const parseWebPDataUrl = (value) => {
  if (typeof value !== "string") {
    throw new Error("Imagen invalida.");
  }

  const match = value.match(/^data:image\/webp;base64,([a-z0-9+/=]+)$/i);
  if (!match?.[1]) {
    throw new Error("La imagen debe estar convertida a WebP antes de subirla.");
  }

  return Buffer.from(match[1], "base64");
};

const ensurePublicImageBucket = async (supabase, bucket, maxBytes) => {
  const options = {
    public: true,
    allowedMimeTypes: ["image/webp"],
    fileSizeLimit: maxBytes,
  };

  const { error: getBucketError } = await supabase.storage.getBucket(bucket);
  if (!getBucketError) {
    const { error: updateBucketError } = await supabase.storage.updateBucket(
      bucket,
      options
    );
    if (updateBucketError) {
      throw updateBucketError;
    }
    return;
  }

  const { error: createBucketError } = await supabase.storage.createBucket(
    bucket,
    options
  );
  if (createBucketError) {
    throw createBucketError;
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendMethodNotAllowed(res, ["POST"]);
  }

  const authConfig = getAuthConfig();
  if (!authConfig.isConfigured) {
    return sendJson(res, 500, {
      ok: false,
      error:
        "Autenticacion administrativa no configurada. Define ADMIN_USERNAME, ADMIN_PASSWORD y ADMIN_SESSION_SECRET.",
    });
  }

  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies[SESSION_COOKIE_NAME];
  const authenticated = verifySessionToken(sessionToken, authConfig.secret);
  if (!authenticated) {
    return sendJson(res, 401, { ok: false, error: "Sesion no valida." });
  }

  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return sendJson(res, 500, {
      ok: false,
      error: "SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados.",
    });
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "request_too_large"
        ? "La imagen es demasiado grande. Reduce el peso antes de subirla."
        : "Formato JSON invalido.";
    return sendJson(res, 400, { ok: false, error: message });
  }

  const folder = typeof payload.folder === "string" ? payload.folder.trim() : "";
  if (!ALLOWED_FOLDERS.has(folder)) {
    return sendJson(res, 400, { ok: false, error: "Carpeta de imagen invalida." });
  }

  let imageBuffer;
  try {
    imageBuffer = parseWebPDataUrl(payload.dataUrl);
  } catch (error) {
    return sendJson(res, 400, {
      ok: false,
      error: getErrorMessage(error, "Imagen invalida."),
    });
  }

  const maxImageBytes = getMaxImageBytes();
  if (imageBuffer.byteLength > maxImageBytes) {
    return sendJson(res, 400, {
      ok: false,
      error: "La imagen WebP supera el limite permitido.",
    });
  }

  try {
    const supabase = getSupabaseAdminClient(config);
    await ensurePublicImageBucket(supabase, config.storageBucket, maxImageBytes);

    const storagePath = `${folder}/${Date.now()}-${randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from(config.storageBucket)
      .upload(storagePath, imageBuffer, {
        contentType: "image/webp",
        cacheControl: String(IMAGE_CACHE_CONTROL_SECONDS),
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(config.storageBucket)
      .getPublicUrl(storagePath);

    return sendJson(res, 200, {
      ok: true,
      url: data.publicUrl,
      path: storagePath,
      bytes: imageBuffer.byteLength,
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: getErrorMessage(
        error,
        "No se pudo subir la imagen a Supabase Storage."
      ),
    });
  }
}
