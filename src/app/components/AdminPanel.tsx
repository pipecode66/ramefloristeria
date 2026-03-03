import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ImagePlus,
  LogOut,
  MessageCircle,
  Pencil,
  Save,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import type { Arrangement } from "./data/arrangements";
import type { HeroContent } from "./data/heroStore";
import {
  arrangementFromAdminInput,
  getProductCategory,
} from "./data/productsStore";
import { createProductWhatsAppLink } from "./data/whatsapp";

interface AdminPanelProps {
  products: Arrangement[];
  onProductsChange: (products: Arrangement[]) => void;
  heroContent: HeroContent;
  onHeroContentChange: (content: HeroContent) => void;
  onLogout: () => void;
}

interface ProductFormState {
  name: string;
  description: string;
  category: string;
  price: string;
  image: string;
}

type BannerMessage = {
  type: "success" | "error";
  text: string;
} | null;

const EMPTY_FORM: ProductFormState = {
  name: "",
  description: "",
  category: "",
  price: "",
  image: "",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);

export function AdminPanel({
  products,
  onProductsChange,
  heroContent,
  onHeroContentChange,
  onLogout,
}: AdminPanelProps) {
  const [heroForm, setHeroForm] = useState<HeroContent>(heroContent);
  const [bannerMessage, setBannerMessage] = useState<BannerMessage>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setHeroForm(heroContent);
  }, [heroContent]);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => b.id - a.id),
    [products]
  );

  const updateHeroField = (key: keyof HeroContent, value: string) => {
    setHeroForm((prev) => ({ ...prev, [key]: value }));
    if (bannerMessage) setBannerMessage(null);
  };

  const handleHeroImageUpload =
    (key: "mainImage" | "accentImage") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          updateHeroField(key, reader.result);
        }
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    };

  const handleSaveHero = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized: HeroContent = {
      monthLabel: heroForm.monthLabel.trim(),
      titleLineOne: heroForm.titleLineOne.trim(),
      titleLineTwo: heroForm.titleLineTwo.trim(),
      subtitle: heroForm.subtitle.trim(),
      subtitleHighlight: heroForm.subtitleHighlight.trim(),
      mainImage: heroForm.mainImage.trim(),
      accentImage: heroForm.accentImage.trim(),
      badgeTitle: heroForm.badgeTitle.trim(),
      badgeSubtitle: heroForm.badgeSubtitle.trim(),
    };

    if (!normalized.mainImage || !normalized.accentImage) {
      setBannerMessage({
        type: "error",
        text: "El banner principal y la imagen secundaria son obligatorios.",
      });
      return;
    }

    onHeroContentChange(normalized);
    setBannerMessage({ type: "success", text: "Banner principal actualizado." });
  };

  const updateField = (key: keyof ProductFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrorMessage("");
  };

  const getNextProductId = () =>
    products.length > 0 ? Math.max(...products.map((product) => product.id)) + 1 : 1;

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("image", reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();
    const category = form.category.trim();
    const price = Number(form.price);
    const image = form.image.trim();

    if (!name || !description || !category || !image) {
      setErrorMessage("Completa todos los campos y agrega una imagen.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setErrorMessage("El precio debe ser un numero mayor a 0.");
      return;
    }

    const existing = editingId
      ? products.find((product) => product.id === editingId) ?? null
      : null;

    const nextProduct = arrangementFromAdminInput(
      { name, description, category, image, price },
      existing,
      getNextProductId()
    );

    const nextProducts = existing
      ? products.map((product) =>
          product.id === nextProduct.id ? nextProduct : product
        )
      : [nextProduct, ...products];

    onProductsChange(nextProducts);
    resetForm();
  };

  const handleEdit = (product: Arrangement) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      category: getProductCategory(product),
      price: String(product.price),
      image: product.images[0] ?? "",
    });
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (product: Arrangement) => {
    const confirmed = window.confirm(
      `Quieres eliminar el producto "${product.name}"? Esta accion no se puede deshacer.`
    );
    if (!confirmed) return;

    const nextProducts = products.filter((item) => item.id !== product.id);
    onProductsChange(nextProducts);

    if (editingId === product.id) {
      resetForm();
    }
  };

  const goBackToSite = () => {
    if (window.location.hash.toLowerCase().includes("admin")) {
      window.location.hash = "";
      return;
    }
    window.location.href = "/";
  };

  return (
    <div
      style={{
        fontFamily: "'Lato', sans-serif",
        backgroundColor: "#fdf6f0",
        minHeight: "100vh",
      }}
    >
      <header
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: "#fdf6f0", borderColor: "#e8d5c4" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                color: "#c9a96e",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Administracion RAME
            </span>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(24px, 4vw, 36px)",
                color: "#3a2e26",
                lineHeight: 1.1,
              }}
            >
              Panel de productos y banner
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBackToSite}
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{
                backgroundColor: "#4a6741",
                color: "#fdf6f0",
                border: "none",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} />
              Volver al sitio
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{
                backgroundColor: "#f0ebe4",
                color: "#5a4a3a",
                border: "1px solid #d9c9bc",
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8">
        <section
          className="rounded-3xl p-6 h-fit"
          style={{
            backgroundColor: "#fff",
            border: "1px solid #f0e8e0",
            boxShadow: "0 10px 30px rgba(58,46,38,0.08)",
          }}
        >
          <div className="mb-8">
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "24px",
                color: "#3a2e26",
              }}
            >
              Editor del banner principal
            </h2>
            <p
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "13px",
                color: "#9e7b5a",
                marginTop: "4px",
              }}
            >
              Modifica la seccion del inicio donde aparece "Mes de la Mujer" y
              sube nuevas imagenes.
            </p>

            <form className="mt-4 flex flex-col gap-3" onSubmit={handleSaveHero}>
              <label className="flex flex-col gap-1.5">
                <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                  Etiqueta superior
                </span>
                <input
                  type="text"
                  value={heroForm.monthLabel}
                  onChange={(event) => updateHeroField("monthLabel", event.target.value)}
                  className="rounded-xl px-4 py-2.5 outline-none"
                  style={{ border: "1.5px solid #e8d5c4", backgroundColor: "#fdf9f6" }}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                    Titulo linea 1
                  </span>
                  <input
                    type="text"
                    value={heroForm.titleLineOne}
                    onChange={(event) =>
                      updateHeroField("titleLineOne", event.target.value)
                    }
                    className="rounded-xl px-4 py-2.5 outline-none"
                    style={{
                      border: "1.5px solid #e8d5c4",
                      backgroundColor: "#fdf9f6",
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                    Titulo linea 2
                  </span>
                  <input
                    type="text"
                    value={heroForm.titleLineTwo}
                    onChange={(event) =>
                      updateHeroField("titleLineTwo", event.target.value)
                    }
                    className="rounded-xl px-4 py-2.5 outline-none"
                    style={{
                      border: "1.5px solid #e8d5c4",
                      backgroundColor: "#fdf9f6",
                    }}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                  Imagen principal del banner
                </span>
                <input
                  type="url"
                  value={heroForm.mainImage}
                  onChange={(event) => updateHeroField("mainImage", event.target.value)}
                  className="rounded-xl px-4 py-2.5 outline-none"
                  style={{ border: "1.5px solid #e8d5c4", backgroundColor: "#fdf9f6" }}
                />
                <label
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl cursor-pointer w-fit"
                  style={{
                    backgroundColor: "#f0ebe4",
                    color: "#4a6741",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  <ImagePlus size={14} />
                  Subir imagen principal
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload("mainImage")}
                    className="hidden"
                  />
                </label>
              </label>

              <label className="flex flex-col gap-1.5">
                <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                  Imagen secundaria del banner
                </span>
                <input
                  type="url"
                  value={heroForm.accentImage}
                  onChange={(event) => updateHeroField("accentImage", event.target.value)}
                  className="rounded-xl px-4 py-2.5 outline-none"
                  style={{ border: "1.5px solid #e8d5c4", backgroundColor: "#fdf9f6" }}
                />
                <label
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl cursor-pointer w-fit"
                  style={{
                    backgroundColor: "#f0ebe4",
                    color: "#4a6741",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  <ImagePlus size={14} />
                  Subir imagen secundaria
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload("accentImage")}
                    className="hidden"
                  />
                </label>
              </label>

              {bannerMessage && (
                <p
                  className="px-3 py-2 rounded-xl"
                  style={{
                    backgroundColor:
                      bannerMessage.type === "success" ? "#eaf4e5" : "#fbe4dc",
                    color: bannerMessage.type === "success" ? "#2e5c22" : "#8a3d2c",
                    fontSize: "13px",
                  }}
                >
                  {bannerMessage.text}
                </p>
              )}

              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl"
                style={{
                  backgroundColor: "#4a6741",
                  color: "#fdf6f0",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Save size={15} />
                Guardar banner
              </button>
            </form>
          </div>

          <div
            className="mb-7"
            style={{
              height: "1px",
              background: "linear-gradient(to right, #e8d5c4, transparent)",
            }}
          />

          <div className="mb-5">
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "26px",
                color: "#3a2e26",
              }}
            >
              {editingId ? "Editar producto" : "Crear producto"}
            </h2>
            <p
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "13px",
                color: "#9e7b5a",
                marginTop: "4px",
              }}
            >
              Campos requeridos: titulo, descripcion, imagen, categoria y precio.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2">
              <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                Titulo
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ej: Bouquet romantico"
                className="rounded-xl px-4 py-2.5 outline-none"
                style={{
                  border: "1.5px solid #e8d5c4",
                  backgroundColor: "#fdf9f6",
                  fontSize: "14px",
                }}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                Descripcion
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Describe el producto..."
                rows={4}
                className="rounded-xl px-4 py-2.5 outline-none resize-none"
                style={{
                  border: "1.5px solid #e8d5c4",
                  backgroundColor: "#fdf9f6",
                  fontSize: "14px",
                }}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                Categoria
              </span>
              <input
                type="text"
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                placeholder="Ej: Amor y amistad"
                className="rounded-xl px-4 py-2.5 outline-none"
                style={{
                  border: "1.5px solid #e8d5c4",
                  backgroundColor: "#fdf9f6",
                  fontSize: "14px",
                }}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                Precio (COP)
              </span>
              <input
                type="number"
                min={1}
                step={1000}
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="Ej: 120000"
                className="rounded-xl px-4 py-2.5 outline-none"
                style={{
                  border: "1.5px solid #e8d5c4",
                  backgroundColor: "#fdf9f6",
                  fontSize: "14px",
                }}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                Imagen (URL o archivo)
              </span>
              <input
                type="url"
                value={form.image}
                onChange={(event) => updateField("image", event.target.value)}
                placeholder="https://..."
                className="rounded-xl px-4 py-2.5 outline-none"
                style={{
                  border: "1.5px solid #e8d5c4",
                  backgroundColor: "#fdf9f6",
                  fontSize: "14px",
                }}
              />

              <label
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl cursor-pointer w-fit"
                style={{
                  backgroundColor: "#f0ebe4",
                  color: "#4a6741",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                <Upload size={14} />
                Subir archivo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </label>

            {form.image && (
              <div
                className="rounded-2xl overflow-hidden border"
                style={{ borderColor: "#e8d5c4", backgroundColor: "#fdf9f6" }}
              >
                <img
                  src={form.image}
                  alt="Vista previa"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {errorMessage && (
              <p
                className="px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: "#fbe4dc",
                  color: "#8a3d2c",
                  fontSize: "13px",
                }}
              >
                {errorMessage}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
                style={{
                  backgroundColor: "#4a6741",
                  color: "#fdf6f0",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Save size={15} />
                {editingId ? "Guardar cambios" : "Crear producto"}
              </button>

              {(editingId || form.name || form.description || form.category || form.price) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
                  style={{
                    backgroundColor: "#f0ebe4",
                    color: "#5a4a3a",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <XCircle size={15} />
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "30px",
                color: "#3a2e26",
              }}
            >
              Productos
            </h2>
            <span
              className="px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: "#f0ebe4",
                color: "#5a4a3a",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {products.length} total
            </span>
          </div>

          {sortedProducts.length === 0 ? (
            <div
              className="rounded-3xl p-10 text-center"
              style={{
                backgroundColor: "#fff",
                border: "1px dashed #d9c3b0",
              }}
            >
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "24px",
                  color: "#7a5a4a",
                }}
              >
                No hay productos cargados
              </p>
              <p style={{ marginTop: "6px", color: "#9e7b5a", fontSize: "14px" }}>
                Crea tu primer producto usando el formulario.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
              {sortedProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-3xl overflow-hidden flex flex-col"
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #f0e8e0",
                    boxShadow: "0 8px 20px rgba(58,46,38,0.08)",
                  }}
                >
                  <div className="h-44 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4 flex flex-col gap-3 h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "20px",
                            color: "#3a2e26",
                            lineHeight: 1.2,
                          }}
                        >
                          {product.name}
                        </h3>
                        <p style={{ color: "#9e7b5a", fontSize: "12px", marginTop: "2px" }}>
                          Categoria: {getProductCategory(product)}
                        </p>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-lg"
                        style={{
                          backgroundColor: "#f5ede6",
                          color: "#5a4a3a",
                          fontSize: "12px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <p style={{ fontSize: "13px", color: "#6b5044", lineHeight: 1.6 }}>
                      {product.description}
                    </p>

                    <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <a
                        href={createProductWhatsAppLink(product.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl"
                        style={{
                          backgroundColor: "#4a6741",
                          color: "#fdf6f0",
                          fontSize: "12px",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        <MessageCircle size={13} />
                        WhatsApp
                      </a>

                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl"
                        style={{
                          backgroundColor: "#f0ebe4",
                          color: "#4a6741",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={13} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl"
                        style={{
                          backgroundColor: "#fbe4dc",
                          color: "#8a3d2c",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
