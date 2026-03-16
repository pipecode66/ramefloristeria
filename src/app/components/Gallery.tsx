import { useEffect, useMemo, useState } from "react";
import { ArrangementCard } from "./ArrangementCard";
import { ArrangementModal } from "./ArrangementModal";
import type { Arrangement } from "./data/arrangements";
import {
  applyArrangementFilters,
  type ArrangementSearchFilters,
  type GalleryTab,
} from "./data/searchFilters";

interface GalleryProps {
  searchFilters?: ArrangementSearchFilters | null;
  products: Arrangement[];
  featuredLabel: string;
}

const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)";

export function Gallery({ searchFilters, products, featuredLabel }: GalleryProps) {
  const [selected, setSelected] = useState<Arrangement | null>(null);
  const [activeTab, setActiveTab] = useState<GalleryTab>("all");
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  });

  const tabs = useMemo(
    () => [
      { key: "featured" as const, label: featuredLabel },
      { key: "all" as const, label: "Ver todos" },
    ],
    [featuredLabel]
  );

  const featuredItems = useMemo(
    () => applyArrangementFilters(products.filter((item) => item.featured), searchFilters),
    [products, searchFilters]
  );
  const allItems = useMemo(
    () => applyArrangementFilters(products, searchFilters),
    [products, searchFilters]
  );

  const displayItems = activeTab === "featured" ? featuredItems : allItems;
  const visibleItems = displayItems;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);

    const applyMatches = (matches: boolean) => setIsMobile(matches);
    const handleChange = (event: MediaQueryListEvent) => applyMatches(event.matches);
    applyMatches(mediaQuery.matches);

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return (
    <>
      <section id="gallery" className="w-full py-16 px-6" style={{ backgroundColor: "#faf3ee" }}>
        <div className="max-w-7xl mx-auto">
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
                Coleccion RAME
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
              Cada pieza, diseniada con amor y atencion al detalle
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="px-6 py-2.5 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: activeTab === tab.key ? "#4a6741" : "transparent",
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

          {displayItems.length > 0 ? (
            <div
              className={
                isMobile
                  ? "grid grid-cols-2 gap-4"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              }
            >
              {visibleItems.map((arrangement) => (
                <ArrangementCard
                  key={arrangement.id}
                  arrangement={arrangement}
                  onClick={setSelected}
                  mobileLayout={isMobile}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 gap-4">
              <span style={{ fontSize: "48px" }}>{"\u{1F331}"}</span>
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
                Intenta con otras opciones o escribenos por WhatsApp
              </p>
            </div>
          )}
        </div>
      </section>

      <ArrangementModal arrangement={selected} onClose={() => setSelected(null)} />
    </>
  );
}
