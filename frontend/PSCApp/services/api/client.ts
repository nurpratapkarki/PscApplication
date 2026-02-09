import { API_BASE_URL, API_ENDPOINTS } from "../../config/api.config";
import { useAuthStore } from "../../store/authStore";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

// Token storage keys
export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * Token management functions using Zustand store with AsyncStorage persistence.
 * Tokens are automatically persisted via the authStore.
 */

// Token management functions - now using Zustand store
export function setTokens(access: string, refresh?: string) {
  useAuthStore.getState().setTokens(access, refresh);
}

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}

export function clearTokens() {
  useAuthStore.getState().clearAuth();
}

// Token refresh function
async function refreshAccessToken(): Promise<string | null> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    return null;
  }

  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.auth.tokenRefresh}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh: currentRefreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    if (data.access) {
      setTokens(data.access, data.refresh);
      return data.access;
    }
    return null;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  { method = "GET", body, token, headers, isFormData = false }: RequestOptions = {},
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(headers ?? {}),
  };

  // Use provided token or fall back to stored access token
  const authToken = token ?? getAccessToken();
  if (authToken) {
    finalHeaders.Authorization = `Bearer ${authToken}`;
  }

  let requestBody: string | FormData | undefined;
  if (body) {
    if (isFormData && body instanceof FormData) {
      requestBody = body;
    } else {
      requestBody = JSON.stringify(body);
    }
  }

  let response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: requestBody,
    credentials: "include",
  });

  // Handle token refresh on 401
  if (response.status === 401 && !token && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      finalHeaders.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: requestBody,
        credentials: "include",
      });
    }
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (data && (data as Record<string, unknown>).detail) ||
      (data && (data as Record<string, unknown>).message) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message as string, response.status, data);
  }

  return data as T;
}

// File upload helper for multipart/form-data
export async function uploadFile<T>(
  endpoint: string,
  formData: FormData,
  token?: string | null,
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const authToken = token ?? getAccessToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  // Handle token refresh on 401
  if (response.status === 401 && !token && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });
    }
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (data && (data as Record<string, unknown>).detail) ||
      (data && (data as Record<string, unknown>).message) ||
      `Upload failed with status ${response.status}`;

    throw new ApiError(message as string, response.status, data);
  }

  return data as T;
}

// Helper to build query strings for GET requests from a plain object of params
export function buildQuery<T extends object>(params: T): string {
	const searchParams = new URLSearchParams();

	Object.entries(params as Record<string, unknown>).forEach(
		([key, value]) => {
			if (value === undefined || value === null) {
				return;
			}
			searchParams.append(key, String(value));
		},
	);

	const queryString = searchParams.toString();
	return queryString ? `?${queryString}` : "";
}

// Handle API errors and extract user-friendly message
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data as Record<string, unknown> | null;
    if (data) {
      if (data.detail) return String(data.detail);
      if (data.message) return String(data.message);
      if (data.non_field_errors) {
        return (data.non_field_errors as string[]).join(", ");
      }
      if (data.errors) {
        return Object.values(data.errors as Record<string, string[]>).flat().join(", ");
      }
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
