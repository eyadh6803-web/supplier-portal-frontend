const resolveApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.__PROCURA_API_URL__) {
    return window.__PROCURA_API_URL__;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return 'http://localhost:4000/api/v1';
};

export const API_CONFIG = {
  USE_LIVE_API: import.meta.env.VITE_USE_LIVE_API === 'true',
  BASE_URL: resolveApiBaseUrl()
};

export const JWT_STORAGE_KEY = 'procura_jwt_token';

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(JWT_STORAGE_KEY);
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem(JWT_STORAGE_KEY);
  }

  if (!response.ok) {
    const errPayload = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
      code?: string;
    };
    throw new ApiClientError(
      errPayload.message || errPayload.error || `API Error (${response.status})`,
      response.status,
      errPayload.code
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
