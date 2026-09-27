import { PutObjectCommand } from "@aws-sdk/client-s3";
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
  ALLOWED_FOLDERS,
  IMAGE_CACHE_CONTROL,
  IMAGE_CONTENT_TYPE,
  buildPublicUrl,
  createImageObjectKey,
  getMaxImageBytes,
  getR2Client,
  getR2Config,
} from "./_r2.js";

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

  const config = getR2Config();
  if (!config.isConfigured) {
    return sendJson(res, 500, {
      ok: false,
      error:
        "Cloudflare R2 no configurado. Define R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME y R2_PUBLIC_BASE_URL.",
    });
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "request_too_large"
        ? "La solicitud es demasiado grande."
        : "Formato JSON invalido.";
    return sendJson(res, 400, { ok: false, error: message });
  }

  const folder = typeof payload.folder === "string" ? payload.folder.trim() : "";
  if (!ALLOWED_FOLDERS.has(folder)) {
    return sendJson(res, 400, { ok: false, error: "Carpeta de imagen invalida." });
  }

  const dataUrl = typeof payload.dataUrl === "string" ? payload.dataUrl.trim() : "";
  let imageBuffer;
  try {
    const match = dataUrl.match(/^data:image\/webp;base64,([a-z0-9+/]+={0,2})$/i);
    if (!match?.[1]) {
      throw new Error("invalid_webp_data_url");
    }

    imageBuffer = Buffer.from(match[1], "base64");
    const isWebP =
      imageBuffer.length >= 12 &&
      imageBuffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      imageBuffer.subarray(8, 12).toString("ascii") === "WEBP";
    if (!isWebP) {
      throw new Error("invalid_webp_file");
    }
  } catch {
    return sendJson(res, 400, {
      ok: false,
      error: "La imagen debe estar convertida a WebP antes de subirla.",
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
    const objectKey = createImageObjectKey(folder, "webp");
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: imageBuffer,
      ContentLength: imageBuffer.byteLength,
      ContentType: IMAGE_CONTENT_TYPE,
      CacheControl: IMAGE_CACHE_CONTROL,
    });
    await getR2Client(config).send(command);

    return sendJson(res, 200, {
      ok: true,
      url: buildPublicUrl(config.publicBaseUrl, objectKey),
      path: objectKey,
    });
  } catch (error) {
    console.error("[api/admin/images] R2 upload failed", error);
    return sendJson(res, 502, {
      ok: false,
      error: "No se pudo subir la imagen a Cloudflare R2.",
    });
  }
}
