import { Buffer } from "node:buffer";
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
  buildPublicUrl,
  createImageObjectKey,
  getMaxImageBytes,
  getR2Client,
  getR2Config,
} from "./_r2.js";

const FETCH_TIMEOUT_MS = 15_000;
const ALLOWED_REMOTE_IMAGE_TYPES = new Map([
  ["image/webp", "webp"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/avif", "avif"],
]);

const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
];

const isBlockedHostname = (hostname) => {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "::1" ||
    PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(normalized))
  );
};

const parseRemoteUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (isBlockedHostname(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
};

const getResponseContentType = (response, sourceUrl) => {
  const headerType = response.headers.get("content-type")?.split(";")[0]?.toLowerCase() ?? "";
  if (ALLOWED_REMOTE_IMAGE_TYPES.has(headerType)) {
    return headerType;
  }

  const pathname = sourceUrl.pathname.toLowerCase();
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".avif")) return "image/avif";
  return "";
};

const fetchRemoteImage = async (sourceUrl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
        "User-Agent": "RameFloristeriaImageMigrator/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
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

  const sourceUrl = parseRemoteUrl(payload.url);
  if (!sourceUrl) {
    return sendJson(res, 400, { ok: false, error: "URL de imagen invalida." });
  }

  const maxImageBytes = getMaxImageBytes();

  try {
    const response = await fetchRemoteImage(sourceUrl);
    if (!response.ok) {
      return sendJson(res, 502, {
        ok: false,
        error:
          response.status === 402 || response.status === 403 || response.status === 429
            ? "La imagen origen esta bloqueada por el proveedor anterior."
            : "No se pudo descargar la imagen origen.",
      });
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxImageBytes) {
      return sendJson(res, 400, {
        ok: false,
        error: "La imagen origen supera el limite permitido.",
      });
    }

    const contentType = getResponseContentType(response, sourceUrl);
    const extension = ALLOWED_REMOTE_IMAGE_TYPES.get(contentType);
    if (!extension) {
      return sendJson(res, 400, {
        ok: false,
        error: "La URL origen no responde con una imagen compatible.",
      });
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    if (imageBuffer.byteLength <= 0 || imageBuffer.byteLength > maxImageBytes) {
      return sendJson(res, 400, {
        ok: false,
        error: "La imagen origen supera el limite permitido.",
      });
    }

    const objectKey = createImageObjectKey(folder, extension);
    await getR2Client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: objectKey,
        Body: imageBuffer,
        ContentType: contentType,
        CacheControl: IMAGE_CACHE_CONTROL,
      })
    );

    return sendJson(res, 200, {
      ok: true,
      url: buildPublicUrl(config.publicBaseUrl, objectKey),
      path: objectKey,
      bytes: imageBuffer.byteLength,
      contentType,
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error:
        error instanceof Error && error.name === "AbortError"
          ? "La descarga de la imagen origen tardo demasiado."
          : "No se pudo migrar la imagen a Cloudflare R2.",
    });
  }
}
