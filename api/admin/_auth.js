import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "rame_admin_session";
const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export const getAuthConfig = () => {
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

export const createSessionToken = (username, secret, sessionMaxAgeSeconds) => {
  const payload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

export const verifySessionToken = (token, secret) => {
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

export const parseCookies = (cookieHeader = "") => {
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

export const serializeCookie = (
  name,
  value,
  { maxAge, expires, path = "/", httpOnly = true, secure = false }
) => {
  const parts = [`${name}=${value}`, `Path=${path}`, "SameSite=Lax"];
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

export const isSecureRequest = (req) => {
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string") {
    return forwardedProto.split(",")[0].trim().toLowerCase() === "https";
  }
  return process.env.NODE_ENV === "production";
};

export const sendJson = (res, statusCode, payload, headers = {}) => {
  const body = JSON.stringify(payload);
  const mergedHeaders = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  };

  res.statusCode = statusCode;
  for (const [key, value] of Object.entries(mergedHeaders)) {
    res.setHeader(key, value);
  }
  res.end(body);
  return undefined;
};

const collectBody = async (req, maxBytes = 12 * 1024) => {
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

  return Buffer.concat(chunks).toString("utf8");
};

export const readJsonBody = async (req) => {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new Error("invalid_json");
    }
  }

  const raw = await collectBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("invalid_json");
  }
};

export const sendMethodNotAllowed = (res, allowedMethods) =>
  sendJson(
    res,
    405,
    { ok: false, error: "Metodo no permitido." },
    { Allow: allowedMethods.join(", ") }
  );
