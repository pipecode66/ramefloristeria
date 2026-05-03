import type { AdminImageFolder } from "./adminImageUpload";

interface RemoteImageImportResponse {
  ok: boolean;
  url?: string;
  error?: string;
}

export const importRemoteAdminImage = async (
  url: string,
  folder: AdminImageFolder
): Promise<{ ok: boolean; url?: string; error?: string }> => {
  try {
    const response = await fetch("/api/admin/image-import", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, folder }),
    });
    const payload = (await response.json()) as RemoteImageImportResponse;

    if (!response.ok || !payload.ok || !payload.url) {
      return {
        ok: false,
        error: payload.error ?? "No se pudo migrar la imagen.",
      };
    }

    return { ok: true, url: payload.url };
  } catch {
    return {
      ok: false,
      error: "No se pudo conectar con el migrador de imagenes.",
    };
  }
};
