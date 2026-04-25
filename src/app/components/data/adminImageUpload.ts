interface AdminImageUploadResponse {
  ok: boolean;
  url?: string;
  path?: string;
  bytes?: number;
  error?: string;
}

export type AdminImageFolder = "banners" | "products";

export const uploadAdminImage = async (
  dataUrl: string,
  folder: AdminImageFolder
): Promise<{ ok: boolean; url?: string; error?: string }> => {
  try {
    const response = await fetch("/api/admin/images", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dataUrl, folder }),
    });
    const payload = (await response.json()) as AdminImageUploadResponse;

    if (!response.ok || !payload.ok || !payload.url) {
      return {
        ok: false,
        error: payload.error ?? "No se pudo subir la imagen.",
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
