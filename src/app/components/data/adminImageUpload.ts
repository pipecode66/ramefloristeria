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

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const withCacheBuster = (url: string, attempt: number) => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}preview=${Date.now()}-${attempt}`;
};

const canLoadPublicImage = (url: string) =>
  new Promise<boolean>((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      resolve(false);
    }, 5000);

    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(true);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve(false);
    };
    image.src = url;
  });

const waitForPublicImage = async (url: string) => {
  const delays = [0, 350, 750, 1400, 2400];

  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    if (delays[attempt] > 0) {
      await delay(delays[attempt]);
    }

    if (await canLoadPublicImage(withCacheBuster(url, attempt))) {
      return true;
    }
  }

  return false;
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

    const publicImageReady = await waitForPublicImage(payload.url);
    if (!publicImageReady) {
      return {
        ok: false,
        error:
          "La imagen se subio, pero la URL publica no carga. Revisa R2_PUBLIC_BASE_URL y que el bucket R2 tenga acceso publico habilitado.",
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
