interface AdminImageUploadResponse {
  ok: boolean;
  uploadUrl?: string;
  url?: string;
  path?: string;
  headers?: Record<string, string>;
  error?: string;
}

export type AdminImageFolder = "banners" | "products";

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

export const uploadAdminImage = async (
  dataUrl: string,
  folder: AdminImageFolder
): Promise<{ ok: boolean; url?: string; error?: string }> => {
  try {
    const blob = await dataUrlToBlob(dataUrl);
    const response = await fetch("/api/admin/images", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        folder,
        contentType: blob.type,
        bytes: blob.size,
      }),
    });
    const payload = (await response.json()) as AdminImageUploadResponse;

    if (!response.ok || !payload.ok || !payload.uploadUrl || !payload.url) {
      return {
        ok: false,
        error: payload.error ?? "No se pudo preparar la subida de imagen.",
      };
    }

    const uploadResponse = await fetch(payload.uploadUrl, {
      method: "PUT",
      headers: payload.headers ?? { "Content-Type": blob.type },
      body: blob,
    });

    if (!uploadResponse.ok) {
      return {
        ok: false,
        error: "No se pudo subir la imagen a Cloudflare R2.",
      };
    }

    return { ok: true, url: payload.url };
  } catch {
    return {
      ok: false,
      error: "No se pudo conectar con el servicio de imagenes.",
    };
  }
};
