import { createClient } from "@supabase/supabase-js";

const DEFAULT_TABLE_NAME = "shared_store";
const DEFAULT_STORE_KEY = "main";
const DEFAULT_STORAGE_BUCKET = "rame-images";

let cachedClient = null;
let cachedClientKey = "";

export const getErrorMessage = (error, fallback) =>
  error instanceof Error && error.message ? error.message : fallback;

export const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const table = process.env.SUPABASE_SHARED_STORE_TABLE?.trim() || DEFAULT_TABLE_NAME;
  const storeKey = process.env.SUPABASE_SHARED_STORE_KEY?.trim() || DEFAULT_STORE_KEY;
  const storageBucket =
    process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_STORAGE_BUCKET;

  return {
    url,
    serviceRoleKey,
    table,
    storeKey,
    storageBucket,
    isConfigured: Boolean(url && serviceRoleKey),
  };
};

export const getSupabaseAdminClient = (config = getSupabaseConfig()) => {
  const cacheKey = `${config.url}::${config.serviceRoleKey}`;
  if (cachedClient && cachedClientKey === cacheKey) {
    return cachedClient;
  }

  cachedClient = createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  cachedClientKey = cacheKey;
  return cachedClient;
};
