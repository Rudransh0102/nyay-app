import { getAuthStore } from '../store/useAuthStore';
import { supabase }     from '../lib/supabase';
import { Platform }     from 'react-native';

const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';
const BASE_URL =
  Platform.OS === 'android' && RAW_BASE_URL.includes('://localhost')
    ? RAW_BASE_URL.replace('://localhost', '://10.0.2.2')
    : RAW_BASE_URL;

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}
export interface ApiError {
  response?: { status: number; data: unknown };
  code?: string;
  message: string;
  url?: string;
}

interface RequestConfig {
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export function isApiAbortError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    ((error as { code?: string }).code === 'ABORTED' ||
      (error as { code?: string }).code === 'TIMEOUT' ||
      (error as { name?: string }).name === 'AbortError')
  );
}

const apiClient = {
  async request<T = unknown>(
    method: string,
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    // Always use the live Supabase access token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? getAuthStore().session?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...config?.headers,
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    let fullUrl = `${BASE_URL}${url}`;
    if (config?.params) {
      const qs = new URLSearchParams(
        Object.entries(config.params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)])
      ).toString();
      if (qs) fullUrl += `?${qs}`;
    }

    const controller = new AbortController();
    const timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        method,
        headers,
        body: config?.data ? JSON.stringify(config.data) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if (isApiAbortError(err)) {
        const error: ApiError = {
          code: controller.signal.aborted ? 'TIMEOUT' : 'ABORTED',
          message: controller.signal.aborted
            ? `Request timed out after ${timeoutMs / 1000}s`
            : 'Request was aborted',
          url: fullUrl,
        };
        throw error;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    const text = await response.text();
    let responseData: unknown;
    try { responseData = text ? JSON.parse(text) : null; }
    catch { responseData = text; }

    if (!response.ok) {
      const error: ApiError = {
        response: { status: response.status, data: responseData },
        message: `HTTP ${response.status}`,
      };
      throw error;
    }

    const headerRecord: Record<string, string> = {};
    response.headers.forEach((v: string, k: string) => {
      headerRecord[k] = v;
    });

    return { data: responseData as T, status: response.status, statusText: response.statusText, headers: headerRecord };
  },

  get<T = unknown>(url: string, config?: Pick<RequestConfig, 'params' | 'headers' | 'timeoutMs'>) {
    return this.request<T>('GET', url, config);
  },
  post<T = unknown>(url: string, data?: unknown) {
    return this.request<T>('POST', url, { data });
  },
  put<T = unknown>(url: string, data?: unknown) {
    return this.request<T>('PUT', url, { data });
  },
  patch<T = unknown>(url: string, data?: unknown) {
    return this.request<T>('PATCH', url, { data });
  },
  delete<T = unknown>(url: string) {
    return this.request<T>('DELETE', url);
  },
};

export default apiClient;
