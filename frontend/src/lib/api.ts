import { clearAuthSession, getStoredToken } from "@/services/auth";

const DEFAULT_API_URL = import.meta.env.PROD
  ? ""
  : "http://localhost:5000";
const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
const RETRY_DELAYS_MS = [900, 2500, 5000];

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

type ApiError = { message?: string; errors?: Array<{ path?: string; message?: string }> };

const getApiErrorMessage = (data: ApiError | null, fallback: string) => {
  if (data?.errors?.length) {
    return data.errors
      .map((error) => {
        const field = error.path ? `${error.path}: ` : "";
        return `${field}${error.message || "Invalid value"}`;
      })
      .join(", ");
  }

  return data?.message || fallback;
};

export const getAuthToken = () => getStoredToken();

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const isTransientNetworkError = (error: unknown) => {
  if (error instanceof TypeError) return true;

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("failed to fetch") || message.includes("networkerror") || message.includes("load failed");
};

const fetchWithRetry = async (url: string, options: RequestInit = {}) => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (!isTransientNetworkError(error) || attempt === RETRY_DELAYS_MS.length) {
        throw error;
      }

      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
};

export const warmApi = () => {
  void fetchWithRetry(`${API_URL}/api/health`, { method: "GET" }).catch(() => undefined);
};

export const apiFetch = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const { body, headers, ...rest } = options;
  const response = await fetchWithRetry(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(headers || {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let data: T | ApiError | null = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (response.status === 401) {
    clearAuthSession();
  }

  if (!response.ok) {
    const message = getApiErrorMessage(data as ApiError | null, `Request failed (${response.status})`);
    throw new Error(message);
  }

  return data as T;
};

export const apiFetchForm = async <T>(
  path: string,
  formData: FormData,
  options: Omit<RequestInit, "body"> = {}
): Promise<T> => {
  const response = await fetchWithRetry(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    },
    body: formData
  });

  let data: T | ApiError | null = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (response.status === 401) {
    clearAuthSession();
  }

  if (!response.ok) {
    const message = getApiErrorMessage(data as ApiError | null, `Request failed (${response.status})`);
    throw new Error(message);
  }

  return data as T;
};

export const apiFetchBlob = async (
  path: string,
  options: ApiOptions = {}
): Promise<Blob> => {
  const { body, headers, ...rest } = options;
  const response = await fetchWithRetry(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(headers || {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as ApiError | null;
      message = getApiErrorMessage(data, message);
    } catch (error) {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.blob();
};

export const getApiBaseUrl = () => API_URL;
