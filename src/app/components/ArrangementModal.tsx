import { useState, useEffect } from "react";
import { X, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import type { Arrangement } from "./data/arrangements";
import { createProductWhatsAppLink } from "./data/whatsapp";
import { formatBadgeLabel } from "./data/productBadges";

interface ArrangementModalProps {
  arrangement: Arrangement | null;
  onClose: () => void;
}

export function ArrangementModal({ arrangement, onClose }: ArrangementModalProps) {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    setCurrentImage(0);
    if (arrangement) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [arrangement]);

  if (!arrangement) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);

  const waLink = createProductWhatsAppLink(arrangement.name);
  const badgeLabel = formatBadgeLabel(arrangement.badge);

  const prevImage = () =>
    setCurrentImage((p) => (p === 0 ? arrangement.images.length - 1 : p - 1));
  const nextImage = () =>
    setCurrentImage((p) => (p === arrangement.images.length - 1 ? 0 : p + 1));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(40,30,24,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl flex flex-col md:flex-row shadow-2xl"
        style={{ backgroundColor: "#fdf6f0" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150"
          style={{
            backgroundColor: "rgba(253,246,240,0.95)",
            border: "1px solid #e8d5c4",
            cursor: "pointer",
          }}
        >
          <X size={18} color="#5a4a3a" />
        </button>

        <div className="relative md:w-[48%] flex-shrink-0" style={{ minHeight: "340px" }}>
          <img
            src={arrangement.images[currentImage]}
            alt={arrangement.name}
            className="w-full h-full object-cover"
            style={{
              borderRadius: "24px 24px 0 0",
              maxHeight: "460px",
            }}
          />
          {arrangement.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: "rgba(253,246,240,0.9)", border: "none", cursor: "pointer" }}
              >
                <ChevronLeft size={18} color="#4a6741" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: "rgba(253,246,240,0.9)", border: "none", cursor: "pointer" }}
              >
                <ChevronRight size={18} color="#4a6741" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {arrangement.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    style={{
                      width: i === currentImage ? 20 : 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor:
                        i === currentImage ? "#fdf6f0" : "rgba(253,246,240,0.5)",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {arrangement.badge && badgeLabel && (
            <div
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: arrangement.badge.backgroundColor,
                color: arrangement.badge.textColor,
                fontFamily: "'Lato', sans-serif",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {badgeLabel}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-5 p-7 md:p-8" style={{ borderRadius: "0 0 24px 24px" }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-[1px]" style={{ backgroundColor: "#c9a96e" }} />
            <span
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "10px",
                fontWeight: 700,
                color: "#c9a96e",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {arrangement.date}
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "26px",
              fontWeight: 700,
              color: "#3a2e26",
              lineHeight: 1.2,
            }}
          >
            {arrangement.name}
          </h2>

          <div className="flex flex-wrap gap-2">
            {arrangement.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "#f5ede6",
                  color: "#7a5a4a",
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "12px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <p
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "14px",
              fontWeight: 300,
              color: "#6b5044",
              lineHeight: 1.7,
            }}
          >
            {arrangement.description}
          </p>

          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "13px", color: "#9e7b5a" }}>
              Flores:
            </span>
            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "13px", color: "#5a4a3a", fontWeight: 600 }}>
              {arrangement.flowers.join(", ")}
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "1px",
              background: "linear-gradient(to right, #c9a96e, transparent)",
            }}
          />

          <div className="flex items-baseline gap-2">
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "32px",
                fontWeight: 700,
                color: "#4a6741",
              }}
            >
              {formatPrice(arrangement.price)}
            </span>
            <span
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "13px",
                color: "#9e7b5a",
              }}
            >
              COP
            </span>
          </div>

          <div className="flex flex-col gap-3 mt-1">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 py-4 rounded-2xl transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5"
              style={{
                backgroundColor: "#4a6741",
                color: "#fdf6f0",
                fontFamily: "'Lato', sans-serif",
                fontSize: "15px",
                fontWeight: 700,
                textDecoration: "none",
                letterSpacing: "0.04em",
              }}
            >
              <MessageCircle size={18} />
              Pedir por WhatsApp
            </a>
            <button
              onClick={onClose}
              className="py-3 rounded-2xl transition-all duration-150 hover:bg-[#e8d5c4]"
              style={{
                backgroundColor: "transparent",
                color: "#9e7b5a",
                fontFamily: "'Lato', sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                border: "1.5px solid #e8d5c4",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
