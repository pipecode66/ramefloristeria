import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const API_PREFIX = "/api/admin";
const SESSION_COOKIE_NAME = "rame_admin_session";
const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const loadDotEnv = (envPath) => {
  if (!existsSync(envPath)) return;

  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || key in process.env) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
};

loadDotEnv(path.join(ROOT_DIR, ".env"));

const getAuthConfig = () => {
  const username = process.env.ADMIN_USERNAME?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
  const sessionMaxAgeSeconds = parsePositiveInteger(
    process.env.ADMIN_SESSION_MAX_AGE_SECONDS,
    DEFAULT_SESSION_MAX_AGE_SECONDS
  );

  return {
    username,
    password,
    secret,
    sessionMaxAgeSeconds,
    isConfigured: Boolean(username && password && secret),
  };
};

const toBase64Url = (value) => Buffer.from(value, "utf8").toString("base64url");

const signPayload = (encodedPayload, secret) =>
  createHmac("sha256", secret).update(encodedPayload).digest("base64url");

const createSessionToken = (username, secret, sessionMaxAgeSeconds) => {
  const payload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

const verifySessionToken = (token, secret) => {
  if (!token || !secret) return false;
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return false;

  const expectedSignature = signPayload(encodedPayload, secret);
  const received = Buffer.from(encodedSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (received.length !== expected.length) return false;
  if (!timingSafeEqual(received, expected)) return false;

  try {
    const payloadRaw = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(payloadRaw);
    if (!payload || typeof payload !== "object") return false;
    if (typeof payload.exp !== "number" || payload.exp <= Date.now() / 1000) {
      return false;
    }
    if (typeof payload.sub !== "string" || !payload.sub.trim()) return false;
    return true;
  } catch {
    return false;
  }
};

const parseCookies = (cookieHeader = "") => {
  const cookies = {};
  for (const fragment of cookieHeader.split(";")) {
    const [namePart, ...valueParts] = fragment.split("=");
    const name = namePart?.trim();
    if (!name) continue;
    const value = valueParts.join("=").trim();
    cookies[name] = value;
  }
  return cookies;
};

const serializeCookie = (
  name,
  value,
  { maxAge, expires, path: cookiePath = "/", httpOnly = true, secure = false }
) => {
  const parts = [`${name}=${value}`, `Path=${cookiePath}`, "SameSite=Lax"];
  if (typeof maxAge === "number") {
    parts.push(`Max-Age=${Math.max(0, Math.floor(maxAge))}`);
  }
  if (expires instanceof Date) {
    parts.push(`Expires=${expires.toUTCString()}`);
  }
  if (httpOnly) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  return parts.join("; ");
};

const sendJson = (res, statusCode, payload, headers = {}) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  res.end(body);
};

const readJsonBody = async (req, maxBytes = 12 * 1024) => {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const safeChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += safeChunk.length;
    if (totalBytes > maxBytes) {
      throw new Error("request_too_large");
    }
    chunks.push(safeChunk);
  }

  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("invalid_json");
  }
};

const getRequestUrl = (req) => {
  const host = req.headers.host ?? "localhost";
  return new URL(req.url ?? "/", `http://${host}`);
};

const hasSecureTransport = (req) => {
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string") {
    return forwardedProto.split(",")[0].trim().toLowerCase() === "https";
  }
  return process.env.NODE_ENV === "production";
};

const handleApiRequest = async (req, res) => {
  const url = getRequestUrl(req);
  if (!url.pathname.startsWith(API_PREFIX)) return false;

  const authConfig = getAuthConfig();
  const secureCookie = hasSecureTransport(req);
  const method = (req.method ?? "GET").toUpperCase();

  if (url.pathname === `${API_PREFIX}/session` && method === "GET") {
    if (!authConfig.isConfigured) {
      sendJson(res, 200, { authenticated: false });
      return true;
    }

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];
    const authenticated = verifySessionToken(token, authConfig.secret);
    sendJson(res, 200, { authenticated });
    return true;
  }

  if (url.pathname === `${API_PREFIX}/login` && method === "POST") {
    if (!authConfig.isConfigured) {
      sendJson(res, 500, {
        ok: false,
        error:
          "Autenticacion administrativa no configurada. Define ADMIN_USERNAME, ADMIN_PASSWORD y ADMIN_SESSION_SECRET en el servidor.",
      });
      return true;
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      const message =
        error instanceof Error && error.message === "request_too_large"
          ? "La solicitud es demasiado grande."
          : "Formato JSON invalido.";
      sendJson(res, 400, { ok: false, error: message });
      return true;
    }

    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (
      username !== authConfig.username ||
      password !== authConfig.password
    ) {
      sendJson(res, 401, {
        ok: false,
        error: "Credenciales invalidas. Verifica usuario y contrasena.",
      });
      return true;
    }

    const token = createSessionToken(
      authConfig.username,
      authConfig.secret,
      authConfig.sessionMaxAgeSeconds
    );
    const cookie = serializeCookie(SESSION_COOKIE_NAME, token, {
      maxAge: authConfig.sessionMaxAgeSeconds,
      secure: secureCookie,
    });

    sendJson(
      res,
      200,
      { ok: true },
      {
        "Set-Cookie": cookie,
      }
    );
    return true;
  }

  if (url.pathname === `${API_PREFIX}/logout` && method === "POST") {
    const expiredCookie = serializeCookie(SESSION_COOKIE_NAME, "", {
      maxAge: 0,
      expires: new Date(0),
      secure: secureCookie,
    });
    sendJson(
      res,
      200,
      { ok: true },
      {
        "Set-Cookie": expiredCookie,
      }
    );
    return true;
  }

  sendJson(res, 404, { ok: false, error: "Endpoint no encontrado." });
  return true;
};

const sendFileResponse = async (res, filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] ?? "application/octet-stream";
  const fileContent = await readFile(filePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    "Content-Length": fileContent.byteLength,
    "X-Content-Type-Options": "nosniff",
  });
  res.end(fileContent);
};

const resolveDistPath = (pathname) => {
  const decodedPath = decodeURIComponent(pathname);
  const targetPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const relativePath = targetPath.replace(/^\/+/, "");
  return path.resolve(DIST_DIR, relativePath);
};

const handleStaticRequest = async (req, res) => {
  if (!existsSync(DIST_DIR)) {
    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("No existe la carpeta dist. Ejecuta npm run build antes de npm run start.");
    return;
  }

  const url = getRequestUrl(req);
  const candidatePath = resolveDistPath(url.pathname);
  const normalizedDist = path.resolve(DIST_DIR);
  if (!candidatePath.startsWith(normalizedDist)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Acceso denegado.");
    return;
  }

  try {
    const candidateStats = await stat(candidatePath);
    if (candidateStats.isFile()) {
      await sendFileResponse(res, candidatePath);
      return;
    }
  } catch {
    // If the file does not exist, fallback to SPA index.
  }

  const indexPath = path.join(DIST_DIR, "index.html");
  await sendFileResponse(res, indexPath);
};

const args = new Set(process.argv.slice(2));
const apiOnlyMode = args.has("--api-only");
const port = apiOnlyMode
  ? parsePositiveInteger(process.env.API_PORT, 8787)
  : parsePositiveInteger(process.env.PORT, 4173);

const server = createServer(async (req, res) => {
  try {
    const handledByApi = await handleApiRequest(req, res);
    if (handledByApi) return;

    if (apiOnlyMode) {
      sendJson(res, 404, { ok: false, error: "Endpoint no encontrado." });
      return;
    }

    await handleStaticRequest(req, res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    sendJson(res, 500, { ok: false, error: message });
  }
});

server.listen(port, () => {
  const modeLabel = apiOnlyMode ? "API" : "API + static";
  const authConfig = getAuthConfig();
  const authStatus = authConfig.isConfigured ? "configurada" : "sin configurar";
  // eslint-disable-next-line no-console
  console.log(`[server] ${modeLabel} escuchando en http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`[server] auth admin: ${authStatus}`);
});
