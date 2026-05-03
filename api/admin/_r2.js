import { randomUUID } from "node:crypto";
import { S3Client } from "@aws-sdk/client-s3";

export const DEFAULT_MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const SIGNED_UPLOAD_EXPIRES_SECONDS = 60 * 5;
export const IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const ALLOWED_FOLDERS = new Set(["banners", "products"]);
export const IMAGE_CONTENT_TYPE = "image/webp";

let cachedClient = null;
let cachedClientKey = "";

export const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export const getMaxImageBytes = () =>
  parsePositiveInteger(process.env.ADMIN_IMAGE_UPLOAD_MAX_BYTES, DEFAULT_MAX_IMAGE_BYTES);

export const getR2Config = () => {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() ?? "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "";
  const bucket = process.env.R2_BUCKET_NAME?.trim() ?? "";
  const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL?.trim() ?? "").replace(/\/+$/, "");

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl,
    endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "",
    isConfigured: Boolean(
      accountId && accessKeyId && secretAccessKey && bucket && publicBaseUrl
    ),
  };
};

export const getR2Client = (config) => {
  const cacheKey = `${config.accountId}::${config.accessKeyId}`;
  if (cachedClient && cachedClientKey === cacheKey) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  cachedClientKey = cacheKey;
  return cachedClient;
};

export const buildPublicUrl = (baseUrl, objectKey) => {
  const encodedKey = objectKey
    .split("/")
    .map((fragment) => encodeURIComponent(fragment))
    .join("/");
  return `${baseUrl}/${encodedKey}`;
};

export const createImageObjectKey = (folder, extension = "webp") =>
  `${folder}/${Date.now()}-${randomUUID()}.${extension}`;
