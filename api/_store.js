import { createClient } from "@supabase/supabase-js";

const DEFAULT_TABLE_NAME = "shared_store";
const DEFAULT_STORE_KEY = "main";

let cachedClient = null;
let cachedClientKey = "";

const getErrorMessage = (error, fallback) =>
  error instanceof Error && error.message ? error.message : fallback;

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const table = process.env.SUPABASE_SHARED_STORE_TABLE?.trim() || DEFAULT_TABLE_NAME;
  const storeKey = process.env.SUPABASE_SHARED_STORE_KEY?.trim() || DEFAULT_STORE_KEY;

  return {
    url,
    serviceRoleKey,
    table,
    storeKey,
    isConfigured: Boolean(url && serviceRoleKey),
  };
};

const getSupabaseAdminClient = (config) => {
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

const safeStorePayload = (value) => {
  if (!value || typeof value !== "object") return {};
  const parsed = value;

  const result = {};
  if ("heroContent" in parsed && parsed.heroContent && typeof parsed.heroContent === "object") {
    result.heroContent = parsed.heroContent;
  }
  if ("products" in parsed && Array.isArray(parsed.products)) {
    result.products = parsed.products;
  }
  return result;
};

const mapRowToStore = (row) => {
  if (!row || typeof row !== "object") {
    return {};
  }

  return safeStorePayload({
    heroContent: row.hero_content,
    products: row.products,
  });
};

export const readSharedStore = async () => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return {
      ok: false,
      storageEnabled: false,
      error: "SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados.",
      store: {},
    };
  }

  try {
    const supabase = getSupabaseAdminClient(config);
    const { data, error } = await supabase
      .from(config.table)
      .select("hero_content,products,updated_at")
      .eq("store_key", config.storeKey)
      .limit(1);

    if (error) {
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : null;
    return {
      ok: true,
      storageEnabled: true,
      store: mapRowToStore(row),
    };
  } catch (error) {
    return {
      ok: false,
      storageEnabled: true,
      error: getErrorMessage(
        error,
        "Error leyendo store compartido desde Supabase."
      ),
      store: {},
    };
  }
};

export const writeSharedStore = async (nextStore) => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return {
      ok: false,
      storageEnabled: false,
      error: "SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados.",
    };
  }

  try {
    const supabase = getSupabaseAdminClient(config);
    const safeStore = safeStorePayload(nextStore);
    const row = {
      store_key: config.storeKey,
      hero_content: safeStore.heroContent ?? {},
      products: safeStore.products ?? [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(config.table)
      .upsert(row, { onConflict: "store_key" })
      .select("store_key")
      .single();

    if (error) {
      throw error;
    }

    return { ok: true, storageEnabled: true };
  } catch (error) {
    return {
      ok: false,
      storageEnabled: true,
      error: getErrorMessage(
        error,
        "Error escribiendo store compartido en Supabase."
      ),
    };
  }
};
