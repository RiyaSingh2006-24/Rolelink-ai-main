import { clearAuthSession, getStoredToken } from "@/services/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

export const apiFetch = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const { body, headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
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
  const response = await fetch(`${API_URL}${path}`, {
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
  const response = await fetch(`${API_URL}${path}`, {
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
