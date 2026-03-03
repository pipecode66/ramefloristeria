export interface HeroContent {
  monthLabel: string;
  titleLineOne: string;
  titleLineTwo: string;
  subtitle: string;
  subtitleHighlight: string;
  mainImage: string;
  accentImage: string;
  badgeTitle: string;
  badgeSubtitle: string;
}

const STORAGE_KEY = "rame_hero_content_v1";

interface PersistResult {
  ok: boolean;
  error?: string;
}

export const defaultHeroContent: HeroContent = {
  monthLabel: "Marzo 2026",
  titleLineOne: "Mes de la",
  titleLineTwo: "Mujer",
  subtitle: "Arreglos florales con pasion, amor y elegancia.",
  subtitleHighlight: "Cada flor, una historia. Cada bouquet, un abrazo.",
  mainImage:
    "https://images.unsplash.com/photo-1771134572111-967700a8bb31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbnRpYyUyMHJvc2UlMjBib3VxdWV0JTIwcGluayUyMGZsb3dlcnMlMjBlbGVnYW50fGVufDF8fHx8MTc3MjU0NzQwNXww&ixlib=rb-4.1.0&q=80&w=1080",
  accentImage:
    "https://images.unsplash.com/photo-1510826079925-c32e6673a0bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcGVvbnklMjBmbG9yYWwlMjBib3VxdWV0JTIwZWxlZ2FudCUyMGJyaWRhbHxlbnwxfHx8fDE3NzI1NDc0MDl8MA&ixlib=rb-4.1.0&q=80&w=400",
  badgeTitle: "Arreglo especial",
  badgeSubtitle: "Mes de la Mujer",
};

const sanitize = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

export const getHeroContentFromStorage = (): HeroContent => {
  if (typeof window === "undefined") return defaultHeroContent;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultHeroContent;

  try {
    const parsed = JSON.parse(raw) as Partial<HeroContent>;
    return {
      monthLabel: sanitize(parsed.monthLabel, defaultHeroContent.monthLabel),
      titleLineOne: sanitize(parsed.titleLineOne, defaultHeroContent.titleLineOne),
      titleLineTwo: sanitize(parsed.titleLineTwo, defaultHeroContent.titleLineTwo),
      subtitle: sanitize(parsed.subtitle, defaultHeroContent.subtitle),
      subtitleHighlight: sanitize(
        parsed.subtitleHighlight,
        defaultHeroContent.subtitleHighlight
      ),
      mainImage: sanitize(parsed.mainImage, defaultHeroContent.mainImage),
      accentImage: sanitize(parsed.accentImage, defaultHeroContent.accentImage),
      badgeTitle: sanitize(parsed.badgeTitle, defaultHeroContent.badgeTitle),
      badgeSubtitle: sanitize(parsed.badgeSubtitle, defaultHeroContent.badgeSubtitle),
    };
  } catch {
    return defaultHeroContent;
  }
};

const getStorageErrorMessage = (error: unknown) => {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "No hay espacio suficiente en el navegador para guardar este banner. Usa imagenes mas livianas o limpia datos del sitio.";
  }

  return "No se pudo guardar el banner en este navegador.";
};

export const persistHeroContentToStorage = (
  content: HeroContent
): PersistResult => {
  if (typeof window === "undefined") return { ok: true };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getStorageErrorMessage(error) };
  }
};

