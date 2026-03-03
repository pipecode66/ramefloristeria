export type HeroButtonVariant = "filled" | "outline" | "light";

export interface HeroExtraButton {
  id: string;
  label: string;
  url: string;
  variant: HeroButtonVariant;
  enabled: boolean;
  openInNewTab: boolean;
}

export interface HeroContent {
  monthLabel: string;
  titleLineOne: string;
  titleLineTwo: string;
  subtitle: string;
  subtitleHighlight: string;
  bannerImage: string;
  showGalleryButton: boolean;
  galleryButtonLabel: string;
  showWhatsAppButton: boolean;
  whatsAppButtonLabel: string;
  extraButtons: HeroExtraButton[];
}

const STORAGE_KEY = "rame_hero_content_v1";
const DB_NAME = "rame_storage_v1";
const DB_STORE = "hero_content";
const DB_KEY = "main";

interface PersistResult {
  ok: boolean;
  error?: string;
}

interface HeroStoredPayload {
  content: HeroContent;
  updatedAt: number;
}

type PartialHeroLegacy = Partial<HeroContent> & {
  mainImage?: unknown;
};

export const defaultHeroContent: HeroContent = {
  monthLabel: "Marzo 2026",
  titleLineOne: "Mes de la",
  titleLineTwo: "Mujer 2026",
  subtitle: "Arreglos florales con pasion, amor y elegancia.",
  subtitleHighlight: "Cada flor, una historia. Cada bouquet, un abrazo.",
  bannerImage:
    "https://images.unsplash.com/photo-1771134572111-967700a8bb31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbnRpYyUyMHJvc2UlMjBib3VxdWV0JTIwcGluayUyMGZsb3dlcnMlMjBlbGVnYW50fGVufDF8fHx8MTc3MjU0NzQwNXww&ixlib=rb-4.1.0&q=80&w=1600",
  showGalleryButton: true,
  galleryButtonLabel: "Ver arreglos",
  showWhatsAppButton: true,
  whatsAppButtonLabel: "Pedir por WhatsApp",
  extraButtons: [],
};

const sanitizeText = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const sanitizeBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const sanitizeVariant = (
  value: unknown,
  fallback: HeroButtonVariant
): HeroButtonVariant =>
  value === "filled" || value === "outline" || value === "light"
    ? value
    : fallback;

const sanitizeButtons = (value: unknown): HeroExtraButton[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((button, index) => {
      if (!button || typeof button !== "object") return null;
      const parsed = button as Partial<HeroExtraButton>;

      return {
        id: sanitizeText(parsed.id, `hero-btn-${index + 1}`),
        label: sanitizeText(parsed.label, ""),
        url: sanitizeText(parsed.url, ""),
        variant: sanitizeVariant(parsed.variant, "outline"),
        enabled: sanitizeBoolean(parsed.enabled, true),
        openInNewTab: sanitizeBoolean(parsed.openInNewTab, true),
      } satisfies HeroExtraButton;
    })
    .filter((button): button is HeroExtraButton => Boolean(button));
};

const normalizeHeroContent = (value: unknown): HeroContent => {
  const parsed = ((value ?? {}) as PartialHeroLegacy) || {};

  return {
    monthLabel: sanitizeText(parsed.monthLabel, defaultHeroContent.monthLabel),
    titleLineOne: sanitizeText(parsed.titleLineOne, defaultHeroContent.titleLineOne),
    titleLineTwo: sanitizeText(parsed.titleLineTwo, defaultHeroContent.titleLineTwo),
    subtitle: sanitizeText(parsed.subtitle, defaultHeroContent.subtitle),
    subtitleHighlight: sanitizeText(
      parsed.subtitleHighlight,
      defaultHeroContent.subtitleHighlight
    ),
    bannerImage: sanitizeText(
      parsed.bannerImage ?? parsed.mainImage,
      defaultHeroContent.bannerImage
    ),
    showGalleryButton: sanitizeBoolean(
      parsed.showGalleryButton,
      defaultHeroContent.showGalleryButton
    ),
    galleryButtonLabel: sanitizeText(
      parsed.galleryButtonLabel,
      defaultHeroContent.galleryButtonLabel
    ),
    showWhatsAppButton: sanitizeBoolean(
      parsed.showWhatsAppButton,
      defaultHeroContent.showWhatsAppButton
    ),
    whatsAppButtonLabel: sanitizeText(
      parsed.whatsAppButtonLabel,
      defaultHeroContent.whatsAppButtonLabel
    ),
    extraButtons: sanitizeButtons(parsed.extraButtons),
  };
};

const parsePayload = (raw: unknown): HeroStoredPayload | null => {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Record<string, unknown>;

  if ("content" in parsed) {
    return {
      content: normalizeHeroContent(parsed.content),
      updatedAt:
        typeof parsed.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
          ? parsed.updatedAt
          : 0,
    };
  }

  return {
    content: normalizeHeroContent(parsed),
    updatedAt: 0,
  };
};

const readLocalPayload = (): HeroStoredPayload | null => {
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

const readIndexedDbPayload = async (): Promise<HeroStoredPayload | null> => {
  if (!supportsIndexedDb()) return null;

  try {
    const db = await openDb();
    const payload = await new Promise<HeroStoredPayload | null>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const store = tx.objectStore(DB_STORE);
      const request = store.get(DB_KEY);

      request.onsuccess = () => resolve(parsePayload(request.result));
      request.onerror = () =>
        reject(request.error ?? new Error("No se pudo leer el banner"));
    });
    db.close();
    return payload;
  } catch {
    return null;
  }
};

const writeIndexedDbPayload = async (payload: HeroStoredPayload): Promise<boolean> => {
  if (!supportsIndexedDb()) return false;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("No se pudo escribir banner"));
      tx.objectStore(DB_STORE).put(payload, DB_KEY);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
};

export const getHeroContentFromStorage = (): HeroContent =>
  readLocalPayload()?.content ?? defaultHeroContent;

export const getLatestHeroContentFromPersistence = async (): Promise<HeroContent> => {
  const localPayload = readLocalPayload();
  const indexedDbPayload = await readIndexedDbPayload();

  if (!localPayload && !indexedDbPayload) return defaultHeroContent;
  if (!localPayload) return indexedDbPayload?.content ?? defaultHeroContent;
  if (!indexedDbPayload) return localPayload.content;

  return indexedDbPayload.updatedAt > localPayload.updatedAt
    ? indexedDbPayload.content
    : localPayload.content;
};

const getStorageErrorMessage = (error: unknown) => {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "No hay espacio suficiente en el navegador para guardar este banner. Usa imagenes mas livianas o limpia datos del sitio.";
  }

  return "No se pudo guardar el banner en este navegador.";
};

export const persistHeroContentToStorage = async (
  content: HeroContent
): Promise<PersistResult> => {
  if (typeof window === "undefined") return { ok: true };

  const payload: HeroStoredPayload = {
    content,
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
