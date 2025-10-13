// src/lib/api.ts
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

/** Your configured Axios instance */
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // ← from your env
  // withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/** Auth token injector (kept from your version) */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** (Optional) Response/logging/interceptor */
api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      // Optional: show toast or alert
      console.warn("User not authorized. Redirecting to login.");

      // Remove token
      localStorage.removeItem("token");

      // Redirect to login page
      // window.open('/login', '_self'); // not recommended; better use location/router
      return; // stop    
    }

    return Promise.reject(err); // Reject to allow individual API calls to handle errors if needed
  }
);

/** Types & helpers */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type DataExtractor = <T>(res: AxiosResponse<any>) => T;

/** Default extractor: API returns { data: ... } or raw payload */
export const defaultExtractor: DataExtractor = (res) =>
  (res.data?.data ?? res.data) as any;

/** A small, typed request helper you can use everywhere */
export async function request<T = any>({
  url,
  method = "GET",
  params,
  data,
  signal,
  config,
  extract = defaultExtractor,
}: {
  url: string;
  method?: HttpMethod;
  params?: any;
  data?: any;
  signal?: AbortSignal;
  config?: AxiosRequestConfig;
  extract?: DataExtractor;
}): Promise<T> {
  const res = await api.request({
    url,
    method,
    params,
    data,
    signal,
    ...config,
  });
  return extract<T>(res);
}

/** Optional: light error normalization for UI toasts */
export function toApiMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg =
      (err.response?.data as any)?.message ||
      (err.response?.data as any)?.error ||
      err.message;
    return msg ?? "Network error";
  }
  return (err as Error)?.message ?? "Unknown error";
}

// Keep default export to avoid breaking existing imports
export default api;
