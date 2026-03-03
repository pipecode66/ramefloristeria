import { useState } from "react";
import { ArrangementCard } from "./ArrangementCard";
import { ArrangementModal } from "./ArrangementModal";
import type { Arrangement } from "./data/arrangements";

interface GalleryProps {
  searchFilters?: any;
  products: Arrangement[];
}

export function Gallery({ searchFilters, products }: GalleryProps) {
  const [selected, setSelected] = useState<Arrangement | null>(null);
  const [activeTab, setActiveTab] = useState<"featured" | "all">("all");

  const applyFilters = (arr: Arrangement[]) => {
    if (!searchFilters) return arr;
    let result = [...arr];
    if (searchFilters.search) {
      const q = searchFilters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.flowers.some((f) => f.toLowerCase().includes(q)) ||
          a.occasion.some((o) => o.toLowerCase().includes(q)) ||
          a.colors.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (searchFilters.date) {
      result = result.filter((a) => a.date === searchFilters.date);
    }
    if (searchFilters.flowers?.length > 0) {
      result = result.filter((a) =>
        searchFilters.flowers.some((f: string) => a.flowers.includes(f))
      );
    }
    if (searchFilters.occasion?.length > 0) {
      result = result.filter((a) =>
        searchFilters.occasion.some((o: string) => a.occasion.includes(o))
      );
    }
    if (searchFilters.colors?.length > 0) {
      result = result.filter((a) =>
        searchFilters.colors.some((c: string) => a.colors.includes(c))
      );
    }
    if (searchFilters.priceRange) {
      const [min, max] = searchFilters.priceRange.split("-").map(Number);
      result = result.filter((a) => a.price >= min && a.price <= max);
    }
    // Sort
    if (searchFilters.sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (searchFilters.sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (searchFilters.sortBy === "popular") {
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return result;
  };

  const featuredItems = applyFilters(products.filter((a) => a.featured));
  const allItems = applyFilters(products);

  const displayItems = activeTab === "featured" ? featuredItems : allItems;

  return (
    <>
      <section
        id="gallery"
        className="w-full py-16 px-6"
        style={{ backgroundColor: "#faf3ee" }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col items-center mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-[1px]" style={{ backgroundColor: "#c9a96e" }} />
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
                Colección RAMÉ
              </span>
              <div className="w-10 h-[1px]" style={{ backgroundColor: "#c9a96e" }} />
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 600,
                color: "#3a2e26",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Nuestros Arreglos
            </h2>
            <p
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "15px",
                fontWeight: 300,
                color: "#9e7b5a",
                marginTop: "8px",
                textAlign: "center",
              }}
            >
              Cada pieza, diseñada con amor y atención al detalle
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[
              { key: "featured", label: "🌸 Arreglos del mes" },
              { key: "all", label: "Ver todos" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="px-6 py-2.5 rounded-full transition-all duration-200"
                style={{
                  backgroundColor:
                    activeTab === tab.key ? "#4a6741" : "transparent",
                  color: activeTab === tab.key ? "#fdf6f0" : "#5a4a3a",
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "14px",
                  fontWeight: activeTab === tab.key ? 700 : 400,
                  border: "2px solid",
                  borderColor: activeTab === tab.key ? "#4a6741" : "#e8d5c4",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Count */}
          {displayItems.length > 0 && (
            <p
              className="text-center mb-8"
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "13px",
                color: "#9e7b5a",
              }}
            >
              Mostrando {displayItems.length} arreglo{displayItems.length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Grid */}
          {displayItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayItems.map((arr) => (
                <ArrangementCard
                  key={arr.id}
                  arrangement={arr}
                  onClick={setSelected}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 gap-4">
              <span style={{ fontSize: "48px" }}>🌱</span>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "20px",
                  color: "#9e7b5a",
                  textAlign: "center",
                }}
              >
                No encontramos arreglos con esos filtros
              </p>
              <p
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "14px",
                  color: "#b89a80",
                  textAlign: "center",
                }}
              >
                Intenta con otras opciones o escríbenos por WhatsApp
              </p>
            </div>
          )}
        </div>
      </section>

      <ArrangementModal arrangement={selected} onClose={() => setSelected(null)} />
    </>
  );
}
