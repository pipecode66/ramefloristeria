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
  Star,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import type { Arrangement } from "./data/arrangements";
import type { HeroContent } from "./data/heroStore";
import {
  arrangementFromAdminInput,
  getProductCategory,
  PRODUCT_PRICE_MAX,
  PRODUCT_PRICE_MIN,
} from "./data/productsStore";
import { createProductWhatsAppLink } from "./data/whatsapp";
import { compressImageFile } from "./data/imageCompression";
import {
  DEFAULT_BADGE_BACKGROUND_COLOR,
  DEFAULT_BADGE_TEXT_COLOR,
  formatBadgeLabel,
} from "./data/productBadges";

interface AdminPanelProps {
  products: Arrangement[];
  onProductsChange: (
    products: Arrangement[]
  ) => Promise<{ ok: boolean; error?: string }>;
  heroContent: HeroContent;
  onHeroContentChange: (
    content: HeroContent
  ) => Promise<{ ok: boolean; error?: string }>;
  onLogout: () => void;
}

interface ProductFormState {
  name: string;
  description: string;
  category: string;
  price: string;
  image: string;
  featured: boolean;
  badgeEnabled: boolean;
  badgeText: string;
  badgeEmoji: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
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
  featured: false,
  badgeEnabled: false,
  badgeText: "",
  badgeEmoji: "",
  badgeBackgroundColor: DEFAULT_BADGE_BACKGROUND_COLOR,
  badgeTextColor: DEFAULT_BADGE_TEXT_COLOR,
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);

const pillButtonStyle = (active: boolean) => ({
  backgroundColor: active ? "#4a6741" : "#f0ebe4",
  color: active ? "#fdf6f0" : "#5a4a3a",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 700,
});

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
  const [compressingHeroImage, setCompressingHeroImage] = useState(false);
  const [compressingProductImage, setCompressingProductImage] = useState(false);

  useEffect(() => {
    setHeroForm(heroContent);
  }, [heroContent]);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => b.id - a.id),
    [products]
  );

  const badgePreviewLabel =
    form.badgeEnabled && form.badgeText.trim()
      ? formatBadgeLabel({
          text: form.badgeText.trim(),
          emoji: form.badgeEmoji.trim() || undefined,
          backgroundColor: form.badgeBackgroundColor,
          textColor: form.badgeTextColor,
        })
      : "";

  const updateHeroField = <K extends keyof HeroContent>(
    key: K,
    value: HeroContent[K]
  ) => {
    setHeroForm((prev) => ({ ...prev, [key]: value }));
    if (bannerMessage) setBannerMessage(null);
  };

  const handleHeroImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    setCompressingHeroImage(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        targetBytes: 320 * 1024,
      });
      updateHeroField("bannerImage", compressed.dataUrl);
      setBannerMessage({
        type: "success",
        text: `Imagen comprimida automaticamente a ${Math.round(
          compressed.bytes / 1024
        )} KB.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo comprimir la imagen.";
      setBannerMessage({ type: "error", text: message });
    } finally {
      setCompressingHeroImage(false);
    }
  };

  const handleSaveHero = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized: HeroContent = {
      ...heroForm,
      bannerImage: heroForm.bannerImage.trim(),
    };

    if (!normalized.bannerImage) {
      setBannerMessage({
        type: "error",
        text: "La imagen principal del banner es obligatoria.",
      });
      return;
    }

    const result = await onHeroContentChange(normalized);

    if (!result.ok) {
      setBannerMessage({
        type: "error",
        text: result.error ?? "No se pudo guardar el banner.",
      });
      return;
    }

    setBannerMessage({ type: "success", text: "Banner principal actualizado." });
  };

  const updateField = (key: keyof ProductFormState, value: string | boolean) => {
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

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    setCompressingProductImage(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1400,
        maxHeight: 1400,
        targetBytes: 220 * 1024,
      });
      updateField("image", compressed.dataUrl);
      setErrorMessage("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo comprimir la imagen.";
      setErrorMessage(message);
    } finally {
      setCompressingProductImage(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    if (
      !Number.isFinite(price) ||
      !Number.isInteger(price) ||
      price < PRODUCT_PRICE_MIN ||
      price > PRODUCT_PRICE_MAX
    ) {
      setErrorMessage(
        `El precio debe ser un numero entero entre ${PRODUCT_PRICE_MIN} y ${PRODUCT_PRICE_MAX}.`
      );
      return;
    }

    if (form.badgeEnabled && !form.badgeText.trim()) {
      setErrorMessage("Si activas la burbuja visual, debes escribir al menos el texto.");
      return;
    }

    const existing = editingId
      ? products.find((product) => product.id === editingId) ?? null
      : null;

    const nextProduct = arrangementFromAdminInput(
      {
        name,
        description,
        category,
        image,
        price,
        featured: form.featured,
        badgeEnabled: form.badgeEnabled,
        badgeText: form.badgeText,
        badgeEmoji: form.badgeEmoji,
        badgeBackgroundColor: form.badgeBackgroundColor,
        badgeTextColor: form.badgeTextColor,
      },
      existing,
      getNextProductId()
    );

    const nextProducts = existing
      ? products.map((product) =>
          product.id === nextProduct.id ? nextProduct : product
        )
      : [nextProduct, ...products];

    const result = await onProductsChange(nextProducts);
    if (!result.ok) {
      setErrorMessage(result.error ?? "No se pudo guardar el producto.");
      return;
    }

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
      featured: product.featured,
      badgeEnabled: Boolean(product.badge?.text),
      badgeText: product.badge?.text ?? "",
      badgeEmoji: product.badge?.emoji ?? "",
      badgeBackgroundColor:
        product.badge?.backgroundColor ?? DEFAULT_BADGE_BACKGROUND_COLOR,
      badgeTextColor: product.badge?.textColor ?? DEFAULT_BADGE_TEXT_COLOR,
    });
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (product: Arrangement) => {
    const confirmed = window.confirm(
      `Quieres eliminar el producto "${product.name}"? Esta accion no se puede deshacer.`
    );
    if (!confirmed) return;

    const nextProducts = products.filter((item) => item.id !== product.id);
    const result = await onProductsChange(nextProducts);
    if (!result.ok) {
      setErrorMessage(result.error ?? "No se pudo eliminar el producto.");
      return;
    }

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

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-[430px_1fr] gap-8">
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
              Aqui solo puedes actualizar la imagen principal del banner.
            </p>

            <form className="mt-4 flex flex-col gap-4" onSubmit={handleSaveHero}>
              <label className="flex flex-col gap-1.5">
                <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                  Imagen del banner
                </span>
                <input
                  type="url"
                  value={heroForm.bannerImage}
                  onChange={(event) => updateHeroField("bannerImage", event.target.value)}
                  placeholder="https://..."
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
                    opacity: compressingHeroImage ? 0.7 : 1,
                  }}
                >
                  <ImagePlus size={14} />
                  {compressingHeroImage ? "Comprimiendo..." : "Subir imagen del banner"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    className="hidden"
                  />
                </label>
              </label>

              {heroForm.bannerImage && (
                <div
                  className="rounded-2xl overflow-hidden border"
                  style={{ borderColor: "#e8d5c4", backgroundColor: "#fdf9f6" }}
                >
                  <img
                    src={heroForm.bannerImage}
                    alt="Vista previa del banner"
                    className="w-full h-44 object-cover"
                  />
                </div>
              )}

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
              Ahora puedes destacar productos en Arreglos del mes y crear una burbuja visual personalizada.
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
                onChange={(event) => updateField("description", event.target.value)}
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
                min={PRODUCT_PRICE_MIN}
                max={PRODUCT_PRICE_MAX}
                step={1}
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
                  opacity: compressingProductImage ? 0.7 : 1,
                }}
              >
                <Upload size={14} />
                {compressingProductImage ? "Comprimiendo..." : "Subir archivo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField("featured", !form.featured)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl"
                style={pillButtonStyle(form.featured)}
              >
                <Star size={15} />
                {form.featured ? "Incluido en Arreglos del mes" : "Destacar en Arreglos del mes"}
              </button>

              <button
                type="button"
                onClick={() => updateField("badgeEnabled", !form.badgeEnabled)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl"
                style={pillButtonStyle(form.badgeEnabled)}
              >
                {form.badgeEnabled ? "Burbuja visual activa" : "Activar burbuja visual"}
              </button>
            </div>

            {form.badgeEnabled && (
              <div
                className="rounded-2xl p-4 flex flex-col gap-4"
                style={{ backgroundColor: "#f8f1ea", border: "1px solid #eadbce" }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                  <label className="flex flex-col gap-2">
                    <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                      Texto de la burbuja
                    </span>
                    <input
                      type="text"
                      value={form.badgeText}
                      onChange={(event) => updateField("badgeText", event.target.value)}
                      placeholder="Ej: Mas vendido"
                      className="rounded-xl px-4 py-2.5 outline-none"
                      style={{ border: "1.5px solid #e8d5c4", backgroundColor: "#fff" }}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                      Emoji / icono
                    </span>
                    <input
                      type="text"
                      value={form.badgeEmoji}
                      onChange={(event) => updateField("badgeEmoji", event.target.value)}
                      placeholder="Ej: ⭐"
                      maxLength={6}
                      className="rounded-xl px-4 py-2.5 outline-none"
                      style={{ border: "1.5px solid #e8d5c4", backgroundColor: "#fff" }}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-2">
                    <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                      Color de fondo
                    </span>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.badgeBackgroundColor}
                        onChange={(event) =>
                          updateField("badgeBackgroundColor", event.target.value)
                        }
                        className="w-14 h-11 rounded-xl border-0 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.badgeBackgroundColor}
                        onChange={(event) =>
                          updateField("badgeBackgroundColor", event.target.value)
                        }
                        className="flex-1 rounded-xl px-4 py-2.5 outline-none"
                        style={{ border: "1.5px solid #e8d5c4", backgroundColor: "#fff" }}
                      />
                    </div>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                      Color del texto
                    </span>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.badgeTextColor}
                        onChange={(event) => updateField("badgeTextColor", event.target.value)}
                        className="w-14 h-11 rounded-xl border-0 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.badgeTextColor}
                        onChange={(event) => updateField("badgeTextColor", event.target.value)}
                        className="flex-1 rounded-xl px-4 py-2.5 outline-none"
                        style={{ border: "1.5px solid #e8d5c4", backgroundColor: "#fff" }}
                      />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span style={{ fontSize: "13px", color: "#7a5a4a", fontWeight: 700 }}>
                    Vista previa de la burbuja
                  </span>
                  {badgePreviewLabel ? (
                    <span
                      className="px-3 py-1.5 rounded-full"
                      style={{
                        backgroundColor: form.badgeBackgroundColor,
                        color: form.badgeTextColor,
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {badgePreviewLabel}
                    </span>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#9e7b5a" }}>
                      Escribe el texto para ver la preview.
                    </span>
                  )}
                </div>
              </div>
            )}

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
              {sortedProducts.map((product) => {
                const productBadgeLabel = formatBadgeLabel(product.badge);

                return (
                  <article
                    key={product.id}
                    className="rounded-3xl overflow-hidden flex flex-col"
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid #f0e8e0",
                      boxShadow: "0 8px 20px rgba(58,46,38,0.08)",
                    }}
                  >
                    <div className="h-44 overflow-hidden relative">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.badge && productBadgeLabel && (
                        <div
                          className="absolute top-3 left-3 px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: product.badge.backgroundColor,
                            color: product.badge.textColor,
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {productBadgeLabel}
                        </div>
                      )}
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

                      <div className="flex flex-wrap gap-2">
                        {product.featured ? (
                          <span
                            className="px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: "#e8f2e2",
                              color: "#2f5a24",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            Arreglos del mes
                          </span>
                        ) : (
                          <span
                            className="px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: "#f5ede6",
                              color: "#7a5a4a",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            Catalogo general
                          </span>
                        )}
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
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
