import { arrangements, type Arrangement } from "./arrangements";

const STORAGE_KEY = "rame_products_v1";
const FALLBACK_IMAGE = arrangements[0]?.images?.[0] ?? "";
export const PRODUCT_PRICE_MIN = 1;
export const PRODUCT_PRICE_MAX = 9_999_999_999;

interface PersistResult {
  ok: boolean;
  error?: string;
}

const cloneSeedProducts = (): Arrangement[] =>
  arrangements.map((item) => ({
    ...item,
    images: [...item.images],
    tags: [...item.tags],
    flowers: [...item.flowers],
    occasion: [...item.occasion],
    colors: [...item.colors],
  }));

const toStringArray = (value: unknown, fallback: string): string[] => {
  if (!Array.isArray(value)) return [fallback];
  const result = value.filter((item) => typeof item === "string" && item.trim());
  return result.length > 0 ? result : [fallback];
};

const normalizePrice = (price: number) =>
  Math.min(PRODUCT_PRICE_MAX, Math.max(PRODUCT_PRICE_MIN, Math.round(price)));

const normalizeProduct = (value: unknown, index: number): Arrangement | null => {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<Arrangement>;
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
    badge: typeof item.badge === "string" && item.badge.trim() ? item.badge : undefined,
  };
};

const uniqueValues = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

export interface AdminProductInput {
  name: string;
  description: string;
  image: string;
  category: string;
  price: number;
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
    featured: existing?.featured ?? false,
    badge: existing?.badge,
  };
};

export const getProductsFromStorage = (): Arrangement[] => {
  if (typeof window === "undefined") return cloneSeedProducts();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return cloneSeedProducts();

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return cloneSeedProducts();
    const normalized = parsed
      .map((item, index) => normalizeProduct(item, index))
      .filter((item): item is Arrangement => Boolean(item));
    return normalized.length > 0 ? normalized : cloneSeedProducts();
  } catch {
    return cloneSeedProducts();
  }
};

const getStorageErrorMessage = (error: unknown) => {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "No hay espacio suficiente en el navegador para guardar los productos. Usa imagenes mas livianas o limpia datos del sitio.";
  }

  return "No se pudieron guardar los productos en este navegador.";
};

export const persistProductsToStorage = (
  products: Arrangement[]
): PersistResult => {
  if (typeof window === "undefined") return { ok: true };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getStorageErrorMessage(error) };
  }
};
