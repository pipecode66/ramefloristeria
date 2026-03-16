import { arrangements, type Arrangement } from "./arrangements";
import {
  DEFAULT_BADGE_BACKGROUND_COLOR,
  DEFAULT_BADGE_TEXT_COLOR,
  normalizeBadge,
  sanitizeBadgeColor,
  type ArrangementBadge,
} from "./productBadges";

const STORAGE_KEY = "rame_products_v2";
const DB_NAME = "rame_products_storage_v1";
const DB_STORE = "products_catalog";
const DB_KEY = "main";
const FALLBACK_IMAGE = arrangements[0]?.images?.[0] ?? "";
export const PRODUCT_PRICE_MIN = 1;
export const PRODUCT_PRICE_MAX = 9_999_999_999;

interface PersistResult {
  ok: boolean;
  error?: string;
}

interface ProductsStoredPayload {
  products: Arrangement[];
  updatedAt: number;
}

interface LegacyArrangement extends Partial<Arrangement> {
  badge?: unknown;
}

const cloneSeedProducts = (): Arrangement[] =>
  arrangements.map((item) => ({
    ...item,
    images: [...item.images],
    tags: [...item.tags],
    flowers: [...item.flowers],
    occasion: [...item.occasion],
    colors: [...item.colors],
    badge: item.badge ? { ...item.badge } : undefined,
  }));

const toStringArray = (value: unknown, fallback: string): string[] => {
  if (!Array.isArray(value)) return [fallback];
  const result = value.filter((item) => typeof item === "string" && item.trim());
  return result.length > 0 ? result : [fallback];
};

const normalizePrice = (price: number) =>
  Math.min(PRODUCT_PRICE_MAX, Math.max(PRODUCT_PRICE_MIN, Math.round(price)));

const parseBadge = (value: unknown): ArrangementBadge | undefined => normalizeBadge(value);

const normalizeProduct = (value: unknown, index: number): Arrangement | null => {
  if (!value || typeof value !== "object") return null;
  const item = value as LegacyArrangement;
  const name = typeof item.name === "string" ? item.name.trim() : "";
  if (!name) return null;

  const categoryFallback =
    typeof item.date === "string" && item.date.trim() ? item.date.trim() : "General";
  const images = toStringArray(item.images, FALLBACK_IMAGE).slice(0, 6);

  return {
    id: typeof item.id === "number" && Number.isFinite(item.id) ? item.id : index + 1,
    name,
    description: typeof item.description === "string" ? item.description : "",
    price:
      typeof item.price === "number" && Number.isFinite(item.price)
        ? normalizePrice(item.price)
        : PRODUCT_PRICE_MIN,
    images,
    tags: toStringArray(item.tags, categoryFallback).slice(0, 8),
    flowers: toStringArray(item.flowers, categoryFallback).slice(0, 6),
    occasion: toStringArray(item.occasion, categoryFallback).slice(0, 6),
    colors: toStringArray(item.colors, "Multicolor").slice(0, 6),
    date: categoryFallback,
    featured: Boolean(item.featured),
    badge: parseBadge(item.badge),
  };
};

const uniqueValues = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const parsePayload = (raw: unknown): ProductsStoredPayload | null => {
  if (Array.isArray(raw)) {
    const normalized = raw
      .map((item, index) => normalizeProduct(item, index))
      .filter((item): item is Arrangement => Boolean(item));

    return {
      products: normalized.length > 0 ? normalized : cloneSeedProducts(),
      updatedAt: 0,
    };
  }

  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Record<string, unknown>;
  if (!Array.isArray(parsed.products)) return null;

  const normalized = parsed.products
    .map((item, index) => normalizeProduct(item, index))
    .filter((item): item is Arrangement => Boolean(item));

  return {
    products: normalized.length > 0 ? normalized : cloneSeedProducts(),
    updatedAt:
      typeof parsed.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
        ? parsed.updatedAt
        : 0,
  };
};

const readLocalPayload = (): ProductsStoredPayload | null => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return parsePayload(JSON.parse(raw));
  } catch {
    return null;
  }
};

const supportsIndexedDb = () =>
  typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (!supportsIndexedDb()) {
      reject(new Error("IndexedDB no disponible"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("No se pudo abrir IndexedDB"));
  });

const readIndexedDbPayload = async (): Promise<ProductsStoredPayload | null> => {
  if (!supportsIndexedDb()) return null;

  try {
    const db = await openDb();
    const payload = await new Promise<ProductsStoredPayload | null>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const store = tx.objectStore(DB_STORE);
      const request = store.get(DB_KEY);

      request.onsuccess = () => resolve(parsePayload(request.result));
      request.onerror = () =>
        reject(request.error ?? new Error("No se pudo leer el catalogo"));
    });
    db.close();
    return payload;
  } catch {
    return null;
  }
};

const writeIndexedDbPayload = async (payload: ProductsStoredPayload): Promise<boolean> => {
  if (!supportsIndexedDb()) return false;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("No se pudo escribir el catalogo"));
      tx.objectStore(DB_STORE).put(payload, DB_KEY);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
};

const getStorageErrorMessage = (error: unknown) => {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "No hay espacio suficiente en el navegador para guardar los productos. Usa imagenes mas livianas o limpia datos del sitio.";
  }

  return "No se pudieron guardar los productos en este navegador.";
};

export interface AdminProductInput {
  name: string;
  description: string;
  image: string;
  category: string;
  price: number;
  featured: boolean;
  badgeEnabled: boolean;
  badgeText: string;
  badgeEmoji: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
}

export const getProductCategory = (product: Arrangement): string =>
  product.tags[0] || product.occasion[0] || product.date || "General";

export const arrangementFromAdminInput = (
  input: AdminProductInput,
  existing: Arrangement | null,
  nextId: number
): Arrangement => {
  const safeCategory = input.category.trim() || "General";
  const normalizedImage = input.image.trim() || existing?.images?.[0] || FALLBACK_IMAGE;
  const safeFlowers =
    existing?.flowers && existing.flowers.length > 0 ? existing.flowers : ["Mixtas"];
  const safeOccasion =
    existing?.occasion && existing.occasion.length > 0
      ? existing.occasion
      : [safeCategory];
  const badgeText = input.badgeText.trim();
  const badgeEmoji = input.badgeEmoji.trim();
  const badge =
    input.badgeEnabled && badgeText
      ? {
          text: badgeText,
          emoji: badgeEmoji || undefined,
          backgroundColor: sanitizeBadgeColor(
            input.badgeBackgroundColor,
            DEFAULT_BADGE_BACKGROUND_COLOR
          ),
          textColor: sanitizeBadgeColor(
            input.badgeTextColor,
            DEFAULT_BADGE_TEXT_COLOR
          ),
        }
      : undefined;

  return {
    id: existing?.id ?? nextId,
    name: input.name.trim(),
    description: input.description.trim(),
    price: normalizePrice(input.price),
    images: uniqueValues([
      normalizedImage,
      ...(existing?.images ?? []).filter((image) => image !== normalizedImage),
    ]).slice(0, 6),
    tags: uniqueValues([safeCategory, ...(existing?.tags ?? [])]).slice(0, 8),
    flowers: safeFlowers.slice(0, 6),
    occasion: uniqueValues(safeOccasion).slice(0, 6),
    colors:
      existing?.colors && existing.colors.length > 0
        ? existing.colors
        : ["Multicolor"],
    date: safeCategory,
    featured: input.featured,
    badge,
  };
};

export const getProductsFromStorage = (): Arrangement[] =>
  readLocalPayload()?.products ?? cloneSeedProducts();

export const getLatestProductsFromPersistence = async (): Promise<Arrangement[]> => {
  const localPayload = readLocalPayload();
  const indexedDbPayload = await readIndexedDbPayload();

  if (!localPayload && !indexedDbPayload) return cloneSeedProducts();
  if (!localPayload) return indexedDbPayload?.products ?? cloneSeedProducts();
  if (!indexedDbPayload) return localPayload.products;

  return indexedDbPayload.updatedAt > localPayload.updatedAt
    ? indexedDbPayload.products
    : localPayload.products;
};

export const persistProductsToStorage = async (
  products: Arrangement[]
): Promise<PersistResult> => {
  if (typeof window === "undefined") return { ok: true };

  const payload: ProductsStoredPayload = {
    products,
    updatedAt: Date.now(),
  };

  let localError: unknown = null;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    localError = error;
  }

  const indexedDbSaved = await writeIndexedDbPayload(payload);

  if (!localError) {
    return { ok: true };
  }

  if (indexedDbSaved) {
    return { ok: true };
  }

  return {
    ok: false,
    error: getStorageErrorMessage(localError),
  };
};
