interface AdminImageUploadResponse {
  ok: boolean;
  url?: string;
  error?: string;
}

export type AdminImageFolder = "banners" | "products";

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

const parseJsonResponse = async (
  response: Response
): Promise<AdminImageUploadResponse | null> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as AdminImageUploadResponse;
  } catch {
    return null;
  }
};

const getServiceError = (
  response: Response,
  payload: AdminImageUploadResponse | null,
  fallback: string
) => {
  if (payload?.error) return payload.error;
  if (response.status === 401) {
    return "La sesion administrativa vencio. Inicia sesion nuevamente.";
  }
  if (response.status === 403) {
    return "El servicio rechazo temporalmente la subida (403). Recarga la pagina e intenta de nuevo.";
  }
  if (response.status === 404) {
    return "El servicio de imagenes no esta disponible en este despliegue. Realiza un nuevo despliegue en Vercel.";
  }
  if (response.status === 413) {
    return "La imagen supera el limite aceptado por el servidor.";
  }

  return `${fallback} (codigo ${response.status}).`;
};

export const uploadAdminImage = async (
  dataUrl: string,
  folder: AdminImageFolder
): Promise<{ ok: boolean; url?: string; error?: string }> => {
  let response: Response;
  try {
    response = await fetch("/api/admin/images", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folder, dataUrl }),
    });
  } catch {
    return {
      ok: false,
      error: "No se pudo conectar con el servicio de imagenes.",
    };
  }

  const payload = await parseJsonResponse(response);
  if (!response.ok || !payload?.ok || !payload.url) {
    return {
      ok: false,
      error: getServiceError(response, payload, "No se pudo subir la imagen"),
    };
  }

  const publicImageReady = await waitForPublicImage(payload.url);
  if (!publicImageReady) {
    return {
      ok: false,
      error:
        "La imagen se subio, pero la URL publica no carga. Revisa R2_PUBLIC_BASE_URL y el acceso publico del bucket.",
    };
  }

  return { ok: true, url: payload.url };
};
