import { useState } from "react";
import { Menu, X, MessageCircle, LogIn } from "lucide-react";
import logoImg from "../../assets/rame-logo-transparent.png";
import { createGeneralWhatsAppLink } from "./data/whatsapp";

interface HeaderProps {
  onNavClick: (section: string) => void;
}

export function Header({ onNavClick }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const waLink = createGeneralWhatsAppLink();

  const navLinks = [
    { label: "Inicio", section: "hero" },
    { label: "Arreglos", section: "gallery" },
    { label: "Contacto", section: "contact" },
  ];

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ backgroundColor: "#fdf6f0", borderBottom: "1px solid #e8d5c4" }}
    >
      <div className="max-w-[90rem] mx-auto px-4 lg:px-6 py-2.5 flex items-center">
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onNavClick("hero")}
          style={{ background: "none", border: "none", padding: 0 }}
          aria-label="Ir al inicio"
        >
          <img
            src={logoImg}
            alt="RAME Floristeria y Decoraciones"
            style={{
              width: "120px",
              height: "33px",
              objectFit: "contain",
              backgroundColor: "transparent",
            }}
          />
        </button>

        <div className="hidden md:flex items-center ml-auto w-full justify-end gap-5">
          <nav className="flex items-center gap-7 mr-4">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => onNavClick(link.section)}
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#5a4a3a",
                  letterSpacing: "0.06em",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  position: "relative",
                }}
                className="hover:text-[#4a6741] transition-colors duration-200 group"
              >
                {link.label}
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: 0,
                    height: "1px",
                    backgroundColor: "#c9a96e",
                    transition: "width 0.3s ease",
                  }}
                  className="group-hover:w-full"
                />
              </button>
            ))}
          </nav>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-200 hover:opacity-90 hover:shadow-md"
            style={{
              backgroundColor: "#4a6741",
              color: "#fdf6f0",
              fontFamily: "'Lato', sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textDecoration: "none",
            }}
          >
            <MessageCircle size={15} />
            Pedir por WhatsApp
          </a>

          <a
            href="#admin"
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:opacity-90 hover:shadow-md"
            style={{
              backgroundColor: "#f0ebe4",
              color: "#4a6741",
              border: "1px solid #d9c9bc",
            }}
            aria-label="Ingresar al panel administrativo"
            title="Panel administrativo"
          >
            <LogIn size={18} />
          </a>
        </div>

        <button
          className="md:hidden p-2 ml-auto"
          style={{ color: "#4a6741" }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6 flex flex-col gap-4"
          style={{ backgroundColor: "#fdf6f0", borderTop: "1px solid #e8d5c4" }}
        >
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => {
                onNavClick(link.section);
                setMenuOpen(false);
              }}
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "15px",
                color: "#5a4a3a",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: "6px 0",
              }}
            >
              {link.label}
            </button>
          ))}

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full"
            style={{
              backgroundColor: "#4a6741",
              color: "#fdf6f0",
              fontFamily: "'Lato', sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <MessageCircle size={16} />
            Pedir por WhatsApp
          </a>

          <a
            href="#admin"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full"
            style={{
              backgroundColor: "#f0ebe4",
              color: "#4a6741",
              fontFamily: "'Lato', sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              border: "1px solid #d9c9bc",
            }}
          >
            <LogIn size={16} />
            Ingresar al panel
          </a>
        </div>
      )}
    </header>
  );
}
