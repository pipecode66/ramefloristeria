import { Eye, MessageCircle } from "lucide-react";
import type { Arrangement } from "./data/arrangements";
import { getProductCategory } from "./data/productsStore";
import { createProductWhatsAppLink } from "./data/whatsapp";

interface ArrangementCardProps {
  arrangement: Arrangement;
  onClick: (arr: Arrangement) => void;
  mobileLayout?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);

export function ArrangementCard({
  arrangement,
  onClick,
  mobileLayout = false,
}: ArrangementCardProps) {
  const waLink = createProductWhatsAppLink(arrangement.name);
  const category = getProductCategory(arrangement);

  if (mobileLayout) {
    return (
      <article
        className="group relative flex flex-col rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        style={{
          backgroundColor: "#fff",
          boxShadow: "0 3px 18px rgba(58,46,38,0.11)",
          border: "1px solid #f0e8e0",
        }}
        onClick={() => onClick(arrangement)}
      >
        <div className="relative overflow-hidden" style={{ aspectRatio: "1 / 1.05" }}>
          <img
            src={arrangement.images[0]}
            alt={arrangement.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl shadow-md"
            style={{
              backgroundColor: "rgba(253,246,240,0.96)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "16px",
                fontWeight: 700,
                color: "#3a2e26",
              }}
            >
              {formatPrice(arrangement.price)}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-1.5">
          <p
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              color: "#9e7b5a",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {category}
          </p>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "19px",
              fontWeight: 600,
              color: "#3a2e26",
              lineHeight: 1.25,
            }}
          >
            {arrangement.name}
          </h3>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group relative flex flex-col rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
      style={{
        backgroundColor: "#fff",
        boxShadow: "0 2px 20px rgba(58,46,38,0.08)",
        border: "1px solid #f0e8e0",
      }}
      onClick={() => onClick(arrangement)}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <img
          src={arrangement.images[0]}
          alt={arrangement.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          style={{ backgroundColor: "rgba(58,46,38,0.35)" }}
        >
          <div
            className="flex items-center gap-2 px-5 py-2.5 rounded-full"
            style={{ backgroundColor: "#fdf6f0" }}
          >
            <Eye size={15} color="#4a6741" />
            <span
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#4a6741",
              }}
            >
              Ver detalles
            </span>
          </div>
        </div>

        {arrangement.badge && (
          <div
            className="absolute top-3 left-3 px-3 py-1 rounded-full"
            style={{
              backgroundColor: "#4a6741",
              color: "#fdf6f0",
              fontFamily: "'Lato', sans-serif",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {arrangement.badge}
          </div>
        )}

        <div
          className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl shadow-md"
          style={{
            backgroundColor: "rgba(253,246,240,0.95)",
            backdropFilter: "blur(4px)",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "16px",
              fontWeight: 700,
              color: "#3a2e26",
            }}
          >
            {formatPrice(arrangement.price)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-5 h-full">
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "17px",
            fontWeight: 600,
            color: "#3a2e26",
            lineHeight: 1.3,
          }}
        >
          {arrangement.name}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {arrangement.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: "#f5ede6",
                color: "#7a5a4a",
                fontFamily: "'Lato', sans-serif",
                fontSize: "11px",
                fontWeight: 400,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-1">
          <span
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "11px",
              color: "#9e7b5a",
            }}
          >
            Categoria: {category}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors duration-150 hover:opacity-90"
              style={{
                backgroundColor: "#4a6741",
                color: "#fdf6f0",
                fontFamily: "'Lato', sans-serif",
                fontSize: "12px",
                fontWeight: 700,
                textDecoration: "none",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <MessageCircle size={12} />
              WhatsApp
            </a>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors duration-150 hover:bg-[#4a6741] hover:text-[#fdf6f0]"
              style={{
                backgroundColor: "#f0ebe4",
                color: "#4a6741",
                fontFamily: "'Lato', sans-serif",
                fontSize: "12px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
              onClick={(event) => {
                event.stopPropagation();
                onClick(arrangement);
              }}
            >
              <Eye size={12} />
              Ver
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
