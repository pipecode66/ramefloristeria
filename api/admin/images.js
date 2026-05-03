import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
  SIGNED_UPLOAD_EXPIRES_SECONDS,
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

  const contentType =
    typeof payload.contentType === "string" ? payload.contentType.trim() : "";
  if (contentType !== IMAGE_CONTENT_TYPE) {
    return sendJson(res, 400, {
      ok: false,
      error: "La imagen debe estar convertida a WebP antes de subirla.",
    });
  }

  const bytes = Number(payload.bytes);
  const maxImageBytes = getMaxImageBytes();
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > maxImageBytes) {
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
      ContentType: IMAGE_CONTENT_TYPE,
      CacheControl: IMAGE_CACHE_CONTROL,
    });

    const uploadUrl = await getSignedUrl(getR2Client(config), command, {
      expiresIn: SIGNED_UPLOAD_EXPIRES_SECONDS,
    });

    return sendJson(res, 200, {
      ok: true,
      uploadUrl,
      url: buildPublicUrl(config.publicBaseUrl, objectKey),
      path: objectKey,
      headers: {
        "Content-Type": IMAGE_CONTENT_TYPE,
        "Cache-Control": IMAGE_CACHE_CONTROL,
      },
    });
  } catch {
    return sendJson(res, 500, {
      ok: false,
      error: "No se pudo preparar la subida a Cloudflare R2.",
    });
  }
}
