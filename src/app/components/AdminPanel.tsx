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
  Plus,
  Pencil,
  Save,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import type { Arrangement } from "./data/arrangements";
import type {
  HeroButtonVariant,
  HeroContent,
  HeroExtraButton,
} from "./data/heroStore";
import {
  arrangementFromAdminInput,
  getProductCategory,
  PRODUCT_PRICE_MAX,
  PRODUCT_PRICE_MIN,
} from "./data/productsStore";
import { createProductWhatsAppLink } from "./data/whatsapp";
import { compressImageFile } from "./data/imageCompression";

interface AdminPanelProps {
  products: Arrangement[];
  onProductsChange: (
    products: Arrangement[]
  ) => { ok: boolean; error?: string };
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

const HERO_BUTTON_VARIANTS: Array<{ value: HeroButtonVariant; label: string }> = [
  { value: "filled", label: "Solido" },
  { value: "outline", label: "Borde" },
  { value: "light", label: "Claro" },
];

const generateHeroButtonId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `hero-btn-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

const createEmptyHeroButton = (): HeroExtraButton => ({
  id: generateHeroButtonId(),
  label: "",
  url: "",
  variant: "outline",
  enabled: true,
  openInNewTab: true,
});

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
  const [compressingHeroImage, setCompressingHeroImage] = useState(false);
  const [compressingProductImage, setCompressingProductImage] = useState(false);

  useEffect(() => {
    setHeroForm(heroContent);
  }, [heroContent]);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => b.id - a.id),
    [products]
  );

  const updateHeroField = <K extends keyof HeroContent>(
    key: K,
    value: HeroContent[K]
  ) => {
    setHeroForm((prev) => ({ ...prev, [key]: value }));
    if (bannerMessage) setBannerMessage(null);
  };

  const handleHeroImageUpload =
    (key: "bannerImage") =>
    async (event: ChangeEvent<HTMLInputElement>) => {
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
        updateHeroField(key, compressed.dataUrl);
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

  const updateHeroButton = <K extends keyof HeroExtraButton>(
    buttonId: string,
    key: K,
    value: HeroExtraButton[K]
  ) => {
    setHeroForm((prev) => ({
      ...prev,
      extraButtons: prev.extraButtons.map((button) =>
        button.id === buttonId ? { ...button, [key]: value } : button
      ),
    }));
    if (bannerMessage) setBannerMessage(null);
  };

  const addHeroButton = () => {
    setHeroForm((prev) => ({
      ...prev,
      extraButtons: [...prev.extraButtons, createEmptyHeroButton()],
    }));
    if (bannerMessage) setBannerMessage(null);
  };

  const removeHeroButton = (buttonId: string) => {
    setHeroForm((prev) => ({
      ...prev,
      extraButtons: prev.extraButtons.filter((button) => button.id !== buttonId),
    }));
    if (bannerMessage) setBannerMessage(null);
  };

  const handleSaveHero = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedButtons = heroForm.extraButtons
      .map((button) => ({
        id: button.id.trim() || generateHeroButtonId(),
        label: button.label.trim(),
        url: button.url.trim(),
        variant: button.variant,
        enabled: button.enabled,
        openInNewTab: button.openInNewTab,
      }))
      .filter((button) => button.label && button.url);

    const normalized: HeroContent = {
      monthLabel: heroForm.monthLabel.trim(),
      titleLineOne: heroForm.titleLineOne.trim(),
      titleLineTwo: heroForm.titleLineTwo.trim(),
      subtitle: heroForm.subtitle.trim(),
      subtitleHighlight: heroForm.subtitleHighlight.trim(),
      bannerImage: heroForm.bannerImage.trim(),
      showGalleryButton: heroForm.showGalleryButton,
      galleryButtonLabel: heroForm.galleryButtonLabel.trim() || "Ver arreglos",
      showWhatsAppButton: heroForm.showWhatsAppButton,
      whatsAppButtonLabel:
        heroForm.whatsAppButtonLabel.trim() || "Pedir por WhatsApp",
      extraButtons: normalizedButtons,
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

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    setCompressingProductImage(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1400,
        maxHeight: 1400,
        targetBytes: 240 * 1024,
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

    const result = onProductsChange(nextProducts);
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
    const result = onProductsChange(nextProducts);
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
              Configura la imagen del banner principal y decide que botones
              mostrar en la portada.
            </p>

            <form className="mt-4 flex flex-col gap-4" onSubmit={handleSaveHero}>
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
                  Descripcion principal
                </span>
                <textarea
                  value={heroForm.subtitle}
                  onChange={(event) => updateHeroField("subtitle", event.target.value)}
                  rows={3}
                  className="rounded-xl px-4 py-2.5 outline-none resize-none"
                  style={{ border: "1.5px solid #e8d5c4", backgroundColor: "#fdf9f6" }}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                  Texto secundario
                </span>
                <input
                  type="text"
                  value={heroForm.subtitleHighlight}
                  onChange={(event) =>
                    updateHeroField("subtitleHighlight", event.target.value)
                  }
                  className="rounded-xl px-4 py-2.5 outline-none"
                  style={{ border: "1.5px solid #e8d5c4", backgroundColor: "#fdf9f6" }}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                  Imagen del banner (seccion completa)
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
                    onChange={handleHeroImageUpload("bannerImage")}
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

              <div
                className="rounded-2xl p-4 flex flex-col gap-4"
                style={{ backgroundColor: "#fbf6f1", border: "1px solid #eedfd2" }}
              >
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "20px",
                    color: "#3a2e26",
                  }}
                >
                  Botones del banner
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  <label
                    className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-4"
                    style={{ backgroundColor: "#fff", border: "1px solid #ecdccd" }}
                  >
                    <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                      Mostrar boton "Ver arreglos"
                    </span>
                    <input
                      type="checkbox"
                      checked={heroForm.showGalleryButton}
                      onChange={(event) =>
                        updateHeroField("showGalleryButton", event.target.checked)
                      }
                    />
                  </label>

                  {heroForm.showGalleryButton && (
                    <label className="flex flex-col gap-1.5">
                      <span
                        style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}
                      >
                        Texto del boton de arreglos
                      </span>
                      <input
                        type="text"
                        value={heroForm.galleryButtonLabel}
                        onChange={(event) =>
                          updateHeroField("galleryButtonLabel", event.target.value)
                        }
                        className="rounded-xl px-4 py-2.5 outline-none"
                        style={{
                          border: "1.5px solid #e8d5c4",
                          backgroundColor: "#fdf9f6",
                        }}
                      />
                    </label>
                  )}

                  <label
                    className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-4"
                    style={{ backgroundColor: "#fff", border: "1px solid #ecdccd" }}
                  >
                    <span style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}>
                      Mostrar boton de pedidos por WhatsApp
                    </span>
                    <input
                      type="checkbox"
                      checked={heroForm.showWhatsAppButton}
                      onChange={(event) =>
                        updateHeroField("showWhatsAppButton", event.target.checked)
                      }
                    />
                  </label>

                  {heroForm.showWhatsAppButton && (
                    <label className="flex flex-col gap-1.5">
                      <span
                        style={{ fontSize: "13px", color: "#5a4a3a", fontWeight: 700 }}
                      >
                        Texto del boton WhatsApp
                      </span>
                      <input
                        type="text"
                        value={heroForm.whatsAppButtonLabel}
                        onChange={(event) =>
                          updateHeroField("whatsAppButtonLabel", event.target.value)
                        }
                        className="rounded-xl px-4 py-2.5 outline-none"
                        style={{
                          border: "1.5px solid #e8d5c4",
                          backgroundColor: "#fdf9f6",
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p style={{ fontSize: "13px", color: "#7a5a4a", fontWeight: 700 }}>
                    Botones adicionales
                  </p>
                  <button
                    type="button"
                    onClick={addHeroButton}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{
                      backgroundColor: "#f0ebe4",
                      color: "#4a6741",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} />
                    Agregar boton
                  </button>
                </div>

                {heroForm.extraButtons.length === 0 && (
                  <p style={{ fontSize: "12px", color: "#9e7b5a" }}>
                    No hay botones extra creados.
                  </p>
                )}

                {heroForm.extraButtons.map((button) => (
                  <div
                    key={button.id}
                    className="rounded-2xl p-3 flex flex-col gap-3"
                    style={{ backgroundColor: "#fff", border: "1px solid #ecdccd" }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span
                          style={{ fontSize: "12px", color: "#5a4a3a", fontWeight: 700 }}
                        >
                          Texto del boton
                        </span>
                        <input
                          type="text"
                          value={button.label}
                          onChange={(event) =>
                            updateHeroButton(button.id, "label", event.target.value)
                          }
                          className="rounded-xl px-4 py-2.5 outline-none"
                          style={{
                            border: "1.5px solid #e8d5c4",
                            backgroundColor: "#fdf9f6",
                          }}
                        />
                      </label>

                      <label className="flex flex-col gap-1.5">
                        <span
                          style={{ fontSize: "12px", color: "#5a4a3a", fontWeight: 700 }}
                        >
                          URL destino
                        </span>
                        <input
                          type="url"
                          value={button.url}
                          onChange={(event) =>
                            updateHeroButton(button.id, "url", event.target.value)
                          }
                          placeholder="https://... o /contacto"
                          className="rounded-xl px-4 py-2.5 outline-none"
                          style={{
                            border: "1.5px solid #e8d5c4",
                            backgroundColor: "#fdf9f6",
                          }}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span
                          style={{ fontSize: "12px", color: "#5a4a3a", fontWeight: 700 }}
                        >
                          Estilo
                        </span>
                        <select
                          value={button.variant}
                          onChange={(event) =>
                            updateHeroButton(
                              button.id,
                              "variant",
                              event.target.value as HeroButtonVariant
                            )
                          }
                          className="rounded-xl px-4 py-2.5 outline-none"
                          style={{
                            border: "1.5px solid #e8d5c4",
                            backgroundColor: "#fdf9f6",
                          }}
                        >
                          {HERO_BUTTON_VARIANTS.map((variant) => (
                            <option key={variant.value} value={variant.value}>
                              {variant.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label
                        className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-4"
                        style={{ backgroundColor: "#fdf9f6", border: "1px solid #e8d5c4" }}
                      >
                        <span style={{ fontSize: "12px", color: "#5a4a3a", fontWeight: 700 }}>
                          Visible
                        </span>
                        <input
                          type="checkbox"
                          checked={button.enabled}
                          onChange={(event) =>
                            updateHeroButton(button.id, "enabled", event.target.checked)
                          }
                        />
                      </label>

                      <label
                        className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-4"
                        style={{ backgroundColor: "#fdf9f6", border: "1px solid #e8d5c4" }}
                      >
                        <span style={{ fontSize: "12px", color: "#5a4a3a", fontWeight: 700 }}>
                          Nueva pestana
                        </span>
                        <input
                          type="checkbox"
                          checked={button.openInNewTab}
                          onChange={(event) =>
                            updateHeroButton(
                              button.id,
                              "openInNewTab",
                              event.target.checked
                            )
                          }
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeHeroButton(button.id)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl w-fit"
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
                      Eliminar boton
                    </button>
                  </div>
                ))}
              </div>

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
