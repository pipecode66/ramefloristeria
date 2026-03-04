import { type FormEvent, useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { validateAdminCredentials } from "./data/adminAuth";

interface AdminLoginProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function AdminLogin({ onSuccess, onBack }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const result = await validateAdminCredentials(username.trim(), password);
    setIsSubmitting(false);

    if (result.ok) {
      setErrorMessage("");
      onSuccess();
      return;
    }

    setErrorMessage(
      result.error ?? "Credenciales invalidas. Verifica usuario y contrasena."
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10"
      style={{ backgroundColor: "#fdf6f0", fontFamily: "'Lato', sans-serif" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{
          backgroundColor: "#fff",
          border: "1px solid #f0e8e0",
          boxShadow: "0 12px 30px rgba(58,46,38,0.1)",
        }}
      >
        <div className="flex items-center justify-between mb-7">
          <div>
            <span
              style={{
                fontSize: "11px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#c9a96e",
                fontWeight: 700,
              }}
            >
              Ingreso administrativo
            </span>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "32px",
                lineHeight: 1.1,
                color: "#3a2e26",
                marginTop: "6px",
              }}
            >
              Panel RAME
            </h1>
          </div>
          <LockKeyhole color="#4a6741" size={28} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#5a4a3a" }}>
              Usuario
            </span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Usuario administrador"
              className="rounded-xl px-4 py-2.5 outline-none"
              style={{
                border: "1.5px solid #e8d5c4",
                backgroundColor: "#fdf9f6",
              }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#5a4a3a" }}>
              Contrasena
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contrasena"
              className="rounded-xl px-4 py-2.5 outline-none"
              style={{
                border: "1.5px solid #e8d5c4",
                backgroundColor: "#fdf9f6",
              }}
            />
          </label>

          {errorMessage && (
            <p
              className="rounded-xl px-3 py-2"
              style={{ backgroundColor: "#fbe4dc", color: "#8a3d2c", fontSize: "13px" }}
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="rounded-xl px-5 py-3 mt-1"
            style={{
              backgroundColor: "#4a6741",
              color: "#fdf6f0",
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
              opacity: isSubmitting ? 0.75 : 1,
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verificando..." : "Ingresar al panel"}
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-2"
          style={{
            background: "none",
            border: "none",
            color: "#7a5a4a",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          <ArrowLeft size={14} />
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

