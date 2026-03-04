const ADMIN_API_BASE = "/api/admin";

interface LoginResponse {
  ok: boolean;
  error?: string;
}

interface SessionResponse {
  authenticated: boolean;
}

const sendJsonRequest = async <T>(
  endpoint: string,
  init: RequestInit
): Promise<T> => {
  const response = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = (await response.json()) as T;

  if (!response.ok) {
    throw payload;
  }

  return payload;
};

export const validateAdminCredentials = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  try {
    return await sendJsonRequest<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  } catch (error) {
    const payload = error as Partial<LoginResponse>;
    return {
      ok: false,
      error:
        payload?.error ??
        "No se pudo iniciar sesion. Verifica configuracion del servidor.",
    };
  }
};

export const getAdminSession = async (): Promise<boolean> => {
  try {
    const response = await sendJsonRequest<SessionResponse>("/session", {
      method: "GET",
    });
    return response.authenticated;
  } catch {
    return false;
  }
};

export const setAdminSession = async (isLoggedIn: boolean) => {
  if (isLoggedIn) return;

  try {
    await sendJsonRequest<LoginResponse>("/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
  } catch {
    // Ignore logout failures and let the UI reset local state anyway.
  }
};

