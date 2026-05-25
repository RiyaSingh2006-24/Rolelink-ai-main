const AUTH_TOKEN_KEY = "rolelink_token";
const AUTH_USER_KEY = "rolelink_user";
const AUTH_EVENT = "rolelink-auth-change";

export type StoredUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: "jobseeker" | "employer";
  companyName?: string;
  companyLogoUrl?: string;
};

export const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getStoredUser = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch (error) {
    return null;
  }
};

export const setAuthSession = (token: string, user: StoredUser) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const updateStoredUser = (user: StoredUser) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const onAuthChange = (handler: () => void) => {
  window.addEventListener(AUTH_EVENT, handler);
  return () => window.removeEventListener(AUTH_EVENT, handler);
};

export const getUserId = (user?: StoredUser | null) => user?._id || user?.id || "";
