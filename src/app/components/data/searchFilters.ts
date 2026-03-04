import type { Arrangement } from "./arrangements";

export type ArrangementSortBy = "recent" | "price-asc" | "price-desc" | "popular";

export interface ArrangementSearchFilters {
  search: string;
  date: string;
  flowers: string[];
  occasion: string[];
  colors: string[];
  priceRange: string;
  sortBy: ArrangementSortBy;
}

export type GalleryTab = "featured" | "all";

export const DATE_OPTIONS = [
  "Día de la Mujer",
  "Día de la Madre",
  "Amor y Amistad",
  "Cumpleaños",
  "Aniversario",
  "Navidad",
] as const;

export const FLOWER_OPTIONS = [
  "Rosas",
  "Girasoles",
  "Orquídeas",
  "Peonías",
  "Tulipanes",
  "Mixtas",
] as const;

export const OCCASION_OPTIONS = [
  "Cumpleaños",
  "Condolencias",
  "Romance",
  "Gracias",
  "Graduación",
  "Decoración",
] as const;

export const COLOR_OPTIONS = [
  "Rosado",
  "Blanco",
  "Rojo",
  "Amarillo",
  "Pastel",
  "Multicolor",
] as const;

export const PRICE_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Hasta $80.000", value: "0-80000" },
  { label: "$80.000 - $150.000", value: "80000-150000" },
  { label: "$150.000 - $300.000", value: "150000-300000" },
  { label: "$300.000+", value: "300000-999999" },
] as const;

export const GALLERY_TABS: Array<{ key: GalleryTab; label: string }> = [
  { key: "featured", label: "🌸 Arreglos del mes" },
  { key: "all", label: "Ver todos" },
];

export const createDefaultArrangementFilters = (): ArrangementSearchFilters => ({
  search: "",
  date: "",
  flowers: [],
  occasion: [],
  colors: [],
  priceRange: "",
  sortBy: "recent",
});

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const parsePriceRange = (value: string) => {
  if (!value) return null;

  const [minRaw, maxRaw] = value.split("-");
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
};

const applySorting = (
  arrangements: Arrangement[],
  sortBy: ArrangementSortBy
): Arrangement[] => {
  const sorted = [...arrangements];

  if (sortBy === "price-asc") {
    sorted.sort((a, b) => a.price - b.price);
    return sorted;
  }

  if (sortBy === "price-desc") {
    sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }

  if (sortBy === "popular") {
    sorted.sort(
      (a, b) => Number(b.featured) - Number(a.featured) || b.id - a.id
    );
    return sorted;
  }

  sorted.sort((a, b) => b.id - a.id);
  return sorted;
};

export const applyArrangementFilters = (
  arrangements: Arrangement[],
  filters?: ArrangementSearchFilters | null
): Arrangement[] => {
  if (!filters) return [...arrangements];

  let result = [...arrangements];

  if (filters.search.trim()) {
    const query = normalize(filters.search);
    result = result.filter((arrangement) => {
      const searchableValues = [
        arrangement.name,
        ...arrangement.tags,
        ...arrangement.flowers,
        ...arrangement.occasion,
        ...arrangement.colors,
      ];
      return searchableValues.some((value) => normalize(value).includes(query));
    });
  }

  if (filters.date) {
    const selectedDate = normalize(filters.date);
    result = result.filter((arrangement) => normalize(arrangement.date) === selectedDate);
  }

  if (filters.flowers.length > 0) {
    const selectedFlowers = filters.flowers.map(normalize);
    result = result.filter((arrangement) =>
      selectedFlowers.some((flower) =>
        arrangement.flowers.some((item) => normalize(item) === flower)
      )
    );
  }

  if (filters.occasion.length > 0) {
    const selectedOccasion = filters.occasion.map(normalize);
    result = result.filter((arrangement) =>
      selectedOccasion.some((occasion) =>
        arrangement.occasion.some((item) => normalize(item) === occasion)
      )
    );
  }

  if (filters.colors.length > 0) {
    const selectedColors = filters.colors.map(normalize);
    result = result.filter((arrangement) =>
      selectedColors.some((color) =>
        arrangement.colors.some((item) => normalize(item) === color)
      )
    );
  }

  const range = parsePriceRange(filters.priceRange);
  if (range) {
    result = result.filter(
      (arrangement) => arrangement.price >= range.min && arrangement.price <= range.max
    );
  }

  return applySorting(result, filters.sortBy);
};
