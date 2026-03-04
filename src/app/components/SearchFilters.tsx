import { useState } from "react";
import { Search, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import {
  COLOR_OPTIONS,
  createDefaultArrangementFilters,
  DATE_OPTIONS,
  FLOWER_OPTIONS,
  OCCASION_OPTIONS,
  PRICE_OPTIONS,
  type ArrangementSearchFilters,
  type ArrangementSortBy,
} from "./data/searchFilters";

interface SearchFiltersProps {
  onFilter: (filters: ArrangementSearchFilters) => void;
}

type ChipFilterKey = "flowers" | "occasion" | "colors";

export function SearchFilters({ onFilter }: SearchFiltersProps) {
  const [filters, setFilters] = useState<ArrangementSearchFilters>(() =>
    createDefaultArrangementFilters()
  );
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = <K extends keyof ArrangementSearchFilters>(
    key: K,
    value: ArrangementSearchFilters[K]
  ) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const toggleChip = (key: ChipFilterKey, value: string) => {
    const values = filters[key];
    const updated = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
    updateFilter(key, updated);
  };

  const handleSearch = () => {
    onFilter(filters);
  };

  const clearAll = () => {
    const reset = createDefaultArrangementFilters();
    setFilters(reset);
    onFilter(reset);
  };

  const hasActiveFilters =
    filters.search ||
    filters.date ||
    filters.flowers.length > 0 ||
    filters.occasion.length > 0 ||
    filters.colors.length > 0 ||
    filters.priceRange;

  return (
    <section className="w-full py-10 px-6" style={{ backgroundColor: "#fdf6f0" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-8 h-[1px]" style={{ backgroundColor: "#c9a96e" }} />
          <span
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              color: "#c9a96e",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Encuentra tu arreglo perfecto
          </span>
          <div className="w-8 h-[1px]" style={{ backgroundColor: "#c9a96e" }} />
        </div>

        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4 mb-4 shadow-sm"
          style={{ backgroundColor: "#fff", border: "1.5px solid #e8d5c4" }}
        >
          <Search size={20} color="#9e7b5a" />
          <input
            type="text"
            placeholder="Busca por fecha, flor, ocasión, color..."
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSearch()}
            className="flex-1 outline-none bg-transparent"
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "15px",
              color: "#3a2e26",
            }}
          />

          {filters.search && (
            <button
              type="button"
              onClick={() => updateFilter("search", "")}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <X size={16} color="#9e7b5a" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowFilters((previous) => !previous)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-200"
            style={{
              backgroundColor: showFilters ? "#4a6741" : "#f0ebe4",
              color: showFilters ? "#fdf6f0" : "#4a6741",
              fontFamily: "'Lato', sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            <SlidersHorizontal size={15} />
            Filtros
            <ChevronDown
              size={13}
              style={{
                transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          <button
            type="button"
            onClick={handleSearch}
            className="px-6 py-2 rounded-xl transition-all duration-200 hover:shadow-md hover:opacity-90"
            style={{
              backgroundColor: "#4a6741",
              color: "#fdf6f0",
              fontFamily: "'Lato', sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Buscar
          </button>
        </div>

        {showFilters && (
          <div
            className="rounded-2xl p-6 shadow-sm"
            style={{ backgroundColor: "#fff", border: "1.5px solid #e8d5c4" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#3a2e26",
                    marginBottom: "10px",
                  }}
                >
                  Fecha especial
                </p>
                <div className="flex flex-wrap gap-2">
                  {DATE_OPTIONS.map((option) => (
                    <Chip
                      key={option}
                      label={option}
                      active={filters.date === option}
                      onClick={() =>
                        updateFilter("date", filters.date === option ? "" : option)
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#3a2e26",
                    marginBottom: "10px",
                  }}
                >
                  Tipo de flor
                </p>
                <div className="flex flex-wrap gap-2">
                  {FLOWER_OPTIONS.map((option) => (
                    <Chip
                      key={option}
                      label={option}
                      active={filters.flowers.includes(option)}
                      onClick={() => toggleChip("flowers", option)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#3a2e26",
                    marginBottom: "10px",
                  }}
                >
                  Ocasión
                </p>
                <div className="flex flex-wrap gap-2">
                  {OCCASION_OPTIONS.map((option) => (
                    <Chip
                      key={option}
                      label={option}
                      active={filters.occasion.includes(option)}
                      onClick={() => toggleChip("occasion", option)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <p
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#3a2e26",
                      marginBottom: "10px",
                    }}
                  >
                    Colores
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((option) => (
                      <Chip
                        key={option}
                        label={option}
                        active={filters.colors.includes(option)}
                        onClick={() => toggleChip("colors", option)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#3a2e26",
                      marginBottom: "10px",
                    }}
                  >
                    Rango de precio
                  </p>
                  <select
                    value={filters.priceRange}
                    onChange={(event) => updateFilter("priceRange", event.target.value)}
                    className="w-full rounded-xl px-3 py-2 outline-none"
                    style={{
                      border: "1.5px solid #e8d5c4",
                      fontFamily: "'Lato', sans-serif",
                      fontSize: "13px",
                      color: "#5a4a3a",
                      backgroundColor: "#fdf9f6",
                    }}
                  >
                    {PRICE_OPTIONS.map((priceOption) => (
                      <option key={priceOption.value} value={priceOption.value}>
                        {priceOption.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div
              className="flex items-center justify-between mt-6 pt-4"
              style={{ borderTop: "1px solid #f0e8e0" }}
            >
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    fontSize: "13px",
                    color: "#9e7b5a",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Limpiar filtros
                </button>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <span
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    fontSize: "13px",
                    color: "#9e7b5a",
                  }}
                >
                  Ordenar por:
                </span>
                <select
                  value={filters.sortBy}
                  onChange={(event) =>
                    updateFilter("sortBy", event.target.value as ArrangementSortBy)
                  }
                  className="rounded-xl px-3 py-2 outline-none"
                  style={{
                    border: "1.5px solid #e8d5c4",
                    fontFamily: "'Lato', sans-serif",
                    fontSize: "13px",
                    color: "#5a4a3a",
                    backgroundColor: "#fdf9f6",
                  }}
                >
                  <option value="recent">Más recientes</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="popular">Más vendidos</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1 rounded-full transition-all duration-150 hover:-translate-y-0.5"
      style={{
        backgroundColor: active ? "#4a6741" : "#f5ede6",
        color: active ? "#fdf6f0" : "#5a4a3a",
        fontFamily: "'Lato', sans-serif",
        fontSize: "12px",
        fontWeight: active ? 700 : 400,
        border: active ? "1.5px solid #4a6741" : "1.5px solid #e0cfc4",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}
