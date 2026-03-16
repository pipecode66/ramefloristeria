import { normalizeHeroContent, type HeroContent } from "./heroStore";
import type { Arrangement } from "./arrangements";

interface SharedStoreResponse {
  ok: boolean;
  storageEnabled?: boolean;
  warning?: string;
  error?: string;
  heroContent?: unknown;
  products?: unknown;
}

interface SharedStorePatch {
  heroContent?: HeroContent;
  products?: Arrangement[];
  upsertProduct?: Arrangement;
  deleteProductId?: number;
}

interface SharedStoreReadResult {
  ok: boolean;
  storageEnabled: boolean;
  heroContent: HeroContent | null;
  products: Arrangement[] | null;
  error?: string;
}

interface SharedStoreWriteResult {
  ok: boolean;
  storageEnabled: boolean;
  error?: string;
}

const parseJsonResponse = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

export const getSharedStore = async (): Promise<SharedStoreReadResult> => {
  try {
    const response = await fetch("/api/store", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    const payload = await parseJsonResponse<SharedStoreResponse>(response);
    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        storageEnabled: Boolean(payload?.storageEnabled),
        heroContent: null,
        products: null,
        error: payload?.error ?? "No se pudo leer contenido compartido.",
      };
    }

    return {
      ok: true,
      storageEnabled: Boolean(payload.storageEnabled),
      heroContent: isObject(payload.heroContent)
        ? normalizeHeroContent(payload.heroContent)
        : null,
      products: Array.isArray(payload.products)
        ? (payload.products as Arrangement[])
        : null,
      error: payload.warning,
    };
  } catch {
    return {
      ok: false,
      storageEnabled: false,
      heroContent: null,
      products: null,
      error: "No se pudo conectar con el store compartido.",
    };
  }
};

export const syncSharedStorePatch = async (
  patch: SharedStorePatch
): Promise<SharedStoreWriteResult> => {
  try {
    const response = await fetch("/api/admin/store", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });

    const payload = await parseJsonResponse<SharedStoreResponse>(response);

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        storageEnabled: true,
        error: payload?.error ?? "No se pudo sincronizar el contenido compartido.",
      };
    }

    return {
      ok: true,
      storageEnabled: true,
    };
  } catch {
    return {
      ok: false,
      storageEnabled: false,
      error: "No se pudo conectar con el store compartido.",
    };
  }
};
