import { MessageCircle, ChevronDown } from "lucide-react";
import type { HeroContent } from "./data/heroStore";
import { createGeneralWhatsAppLink } from "./data/whatsapp";

interface HeroProps {
  onScrollToGallery: () => void;
  content: HeroContent;
}

export function Hero({ onScrollToGallery, content }: HeroProps) {
  const waLink = createGeneralWhatsAppLink(
    "Hola, quiero ver los arreglos destacados del banner principal."
  );

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #fdf0e8 0%, #fae6d9 35%, #f5ddd0 60%, #ecd9cc 100%)",
      }}
    >
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 80% 20%, #4a6741 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 80%, #4a6741 0%, transparent 60%)",
        }}
      />

      {[
        { top: "15%", left: "8%", size: 6 },
        { top: "70%", left: "5%", size: 4 },
        { top: "30%", right: "12%", size: 5 },
        { top: "80%", right: "8%", size: 7 },
        { top: "50%", left: "15%", size: 3 },
      ].map((dot, index) => (
        <div
          key={index}
          className="absolute rounded-full"
          style={{
            top: dot.top,
            left: (dot as { left?: string }).left,
            right: (dot as { right?: string }).right,
            width: dot.size,
            height: dot.size,
            backgroundColor: "#c9a96e",
            opacity: 0.5,
          }}
        />
      ))}

      <svg
        className="absolute top-16 right-[8%] opacity-20 pointer-events-none"
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
      >
        <path
          d="M60 10 C90 10, 110 40, 110 70 C110 95, 85 110, 60 110 C35 110, 10 95, 10 70 C10 40, 30 10, 60 10Z"
          fill="#4a6741"
        />
        <line x1="60" y1="10" x2="60" y2="110" stroke="#fdf6f0" strokeWidth="1.5" />
        <line x1="60" y1="45" x2="90" y2="30" stroke="#fdf6f0" strokeWidth="1" />
        <line x1="60" y1="60" x2="95" y2="55" stroke="#fdf6f0" strokeWidth="1" />
        <line x1="60" y1="75" x2="90" y2="80" stroke="#fdf6f0" strokeWidth="1" />
        <line x1="60" y1="45" x2="30" y2="30" stroke="#fdf6f0" strokeWidth="1" />
        <line x1="60" y1="60" x2="25" y2="55" stroke="#fdf6f0" strokeWidth="1" />
        <line x1="60" y1="75" x2="30" y2="80" stroke="#fdf6f0" strokeWidth="1" />
      </svg>

      <svg
        className="absolute bottom-24 left-[6%] opacity-15 pointer-events-none"
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
      >
        <path
          d="M40 5 C65 5, 75 25, 75 45 C75 65, 58 75, 40 75 C22 75, 5 65, 5 45 C5 25, 15 5, 40 5Z"
          fill="#4a6741"
        />
        <line x1="40" y1="5" x2="40" y2="75" stroke="#fdf6f0" strokeWidth="1.2" />
        <line x1="40" y1="30" x2="65" y2="22" stroke="#fdf6f0" strokeWidth="0.8" />
        <line x1="40" y1="45" x2="68" y2="42" stroke="#fdf6f0" strokeWidth="0.8" />
        <line x1="40" y1="30" x2="15" y2="22" stroke="#fdf6f0" strokeWidth="0.8" />
        <line x1="40" y1="45" x2="12" y2="42" stroke="#fdf6f0" strokeWidth="0.8" />
      </svg>

      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{
          background:
            "linear-gradient(to right, transparent, #c9a96e 30%, #c9a96e 70%, transparent)",
          opacity: 0.6,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-16 w-full">
        <div className="flex-1 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-[1px]" style={{ backgroundColor: "#c9a96e" }} />
            <span
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                color: "#c9a96e",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
              }}
            >
              {content.monthLabel}
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(42px, 6vw, 80px)",
              fontWeight: 600,
              color: "#3a2e26",
              lineHeight: 1.1,
              marginBottom: "8px",
            }}
          >
            {content.titleLineOne}
          </h1>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(48px, 7vw, 90px)",
              fontWeight: 700,
              color: "#4a6741",
              lineHeight: 1,
              marginBottom: "24px",
              fontStyle: "italic",
            }}
          >
            {content.titleLineTwo}
          </h1>

          <div
            className="mb-8"
            style={{
              width: "80px",
              height: "2px",
              background: "linear-gradient(to right, #c9a96e, #e8c87a)",
            }}
          />

          <p
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "clamp(16px, 2vw, 20px)",
              fontWeight: 300,
              color: "#6b5044",
              lineHeight: 1.7,
              maxWidth: "460px",
              marginBottom: "40px",
            }}
          >
            {content.subtitle}
            <br />
            <span style={{ color: "#9e7b5a", fontSize: "0.9em" }}>
              {content.subtitleHighlight}
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onScrollToGallery}
              className="px-8 py-3.5 rounded-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{
                backgroundColor: "#4a6741",
                color: "#fdf6f0",
                fontFamily: "'Lato', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                border: "none",
                cursor: "pointer",
              }}
            >
              Ver arreglos
            </button>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-3.5 rounded-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{
                backgroundColor: "transparent",
                color: "#4a6741",
                fontFamily: "'Lato', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                border: "2px solid #4a6741",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              <MessageCircle size={16} />
              Pedir por WhatsApp
            </a>
          </div>

          <div className="flex items-center gap-10 mt-14">
            {[
              { value: "+500", label: "Arreglos entregados" },
              { value: "100%", label: "Flores frescas" },
              { value: "+8", label: "Anos de experiencia" },
            ].map((stat, index) => (
              <div key={index} className="flex flex-col">
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "#4a6741",
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    fontSize: "11px",
                    fontWeight: 300,
                    color: "#9e7b5a",
                    letterSpacing: "0.04em",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative w-full max-w-[520px]">
          <div className="relative w-full" style={{ aspectRatio: "0.85" }}>
            <div
              className="absolute inset-0 rounded-[32px] overflow-hidden shadow-2xl"
              style={{ top: "5%", left: "5%", right: "5%", bottom: "5%" }}
            >
              <img
                src={content.mainImage}
                alt="Arreglo floral RAME"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(58,46,38,0.3) 0%, transparent 50%)",
                }}
              />
            </div>

            <div
              className="absolute bottom-[8%] left-0 rounded-2xl p-4 shadow-xl"
              style={{
                backgroundColor: "#fdf6f0",
                zIndex: 10,
                minWidth: "160px",
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#3a2e26",
                }}
              >
                {content.badgeTitle}
              </div>
              <div
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "11px",
                  color: "#9e7b5a",
                  marginTop: "2px",
                }}
              >
                {content.badgeSubtitle}
              </div>
            </div>

            <div
              className="absolute top-0 right-0 w-[44%] h-[44%] rounded-2xl overflow-hidden shadow-lg"
              style={{ zIndex: 10 }}
            >
              <img
                src={content.accentImage}
                alt="Detalle arreglo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onScrollToGallery}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
        style={{ border: "none", background: "none", cursor: "pointer" }}
      >
        <span
          style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: "10px",
            color: "#9e7b5a",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Explorar
        </span>
        <ChevronDown size={18} color="#9e7b5a" className="animate-bounce" />
      </button>
    </section>
  );
}
