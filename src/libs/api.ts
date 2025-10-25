// src/lib/api.ts
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

/** Your configured Axios instance */
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/** Auth token injector */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Response / error interceptor */
api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      console.warn("User not authorized. Redirecting to login.");
      localStorage.removeItem("token");
      // Important: still reject so callers don't get an undefined "success"
      return Promise.reject(err);
    }
    return Promise.reject(err);
  }
);

/** Types & helpers */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type DataExtractor = <T>(res: AxiosResponse<any>) => T;

/** Default extractor: API returns { data: ... } or raw payload */
export const defaultExtractor: DataExtractor = (res) =>
  (res.data?.data ?? res.data) as any;

/** Ensure an object is postMessage/structured-clone safe */
function serializeClone<T>(value: T): T {
  // Prefer structuredClone when available; fallback to JSON for older targets
  try {
    // @ts-ignore
    if (typeof structuredClone === "function") return structuredClone(value);
  } catch {
    /* ignore */
  }
  return JSON.parse(JSON.stringify(value));
}

/** Normalize AxiosError into a plain, cloneable object */
export type ApiError = {
  name: string;
  message: string;
  status: number | null;
  data: unknown;
  // optionally add code, requestId, etc.
};

export function normalizeAxiosError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const resp = err.response;
    const plain = {
      name: err.name || "AxiosError",
      message:
        (resp?.data as any)?.message ||
        (resp?.data as any)?.error ||
        err.message ||
        "Network error",
      status: resp?.status ?? null,
      data: serializeClone(resp?.data ?? null), // make it cloneable
    };
    return plain;
  }
  const e = err as Error;
  return {
    name: e?.name ?? "Error",
    message: e?.message ?? "Unknown error",
    status: null,
    data: null,
  };
}
// ✅ Fast path: return JSON as-is
export async function request<T = any>(args: {
  url: string;
  method?: HttpMethod;
  params?: any;
  data?: any;
  signal?: AbortSignal;
  config?: AxiosRequestConfig;
  extract?: DataExtractor;
}): Promise<T> {
  try {
    console.log(args.data, ">>>");

    const res = await api.request({
      url: args.url,
      method: args.method ?? "GET",
      params: args.params,
      data: args.data,
      signal: args.signal,
      ...args.config,
    });

    const picked = (args.extract ?? defaultExtractor)<T>(res);
    // IMPORTANT: no deep clone here
    return picked;
  } catch (err) {
    // Keep errors plain/cloneable for devtools/extension messaging
    throw normalizeAxiosError(err);
  }
}

/** Optional: light error message for toasts */
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

export default api;
