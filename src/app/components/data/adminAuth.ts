const ADMIN_USERNAME = "ramefloristeria";
const ADMIN_PASSWORD = "rame123..";
const ADMIN_SESSION_KEY = "rame_admin_session_v1";

export const validateAdminCredentials = (username: string, password: string) =>
  username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

export const getAdminSession = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_SESSION_KEY) === "true";
};

export const setAdminSession = (isLoggedIn: boolean) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_SESSION_KEY, String(isLoggedIn));
};

