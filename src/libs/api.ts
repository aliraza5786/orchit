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
  withCredentials: true, // ✅ CRITICAL: Allow cookies to be sent/received with requests
});
api.interceptors.request.use((config) => {
  const localToken = localStorage.getItem('token')
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1] ?? null

  const token = localToken || cookieToken

  if (token) {
if (cookieToken && localStorage.getItem('token') !== cookieToken) {
  localStorage.setItem('token', cookieToken)
}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/** Auth endpoints where errors must be shown on the form (no session redirect/reload). */
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/signup',
  '/auth/social-login',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/verify-email-pre-login',
  '/auth/forget-password',
  '/auth/reset-password',
  '/auth/verify-reset-token',
] as const

export function isPublicAuthRequest(config?: AxiosRequestConfig): boolean {
  const url = String(config?.url ?? '')
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path))
}

/** Response / error interceptor */
api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (axios.isCancel(err) || err.name === 'CanceledError') {
      return Promise.reject(err);
    }

    const isUnauthorized = err.response?.status === 401;
    const isNetworkOrCorsError = !err.response || err.message === 'Network Error' || err.code === 'ERR_NETWORK';
    const skipSessionRedirect = isPublicAuthRequest(err.config);
    const isOrgOnboardingRoute =
      typeof window !== 'undefined' &&
      window.location.pathname.includes('/onboarding-organization');

    if ((isUnauthorized || isNetworkOrCorsError) && !skipSessionRedirect && !isOrgOnboardingRoute) {
      console.warn(isUnauthorized ? "User not authorized." : "Backend down or CORS error.", "Clearing session and redirecting.");
      
      const logoutKeys = [
        'token', 'user_id', 'company_id', 'personal_mode', 'currentName',
        'jobId', 'mannualWorkspace', 'selectedAgentModule', 'selectedModuleId',
        'sprintType', 'activeMilestoneId', 'activeSprintId', 'showActiveSprint',
        'activeSprintKey', 'selectedSprintTitle', 'selected_sheet_title',
        'activeSessionId', 'activeSessionTitle', 'selected_sheet_id', 'sidebar_mode', 'company_name'
      ];
      logoutKeys.forEach(k => localStorage.removeItem(k));
      
      const COOKIE_KEY = 'auth_session';
      const keys = [COOKIE_KEY, 'auth_token', 'space_auth', 'auth_session', 'token', '_cid', '_uid', 'user_id', 'company_id'];
      try {
        document.cookie.split(';').forEach(cookie => {
          const name = cookie.split('=')[0].trim();
          if (name && !keys.includes(name)) {
            keys.push(name);
          }
        });
      } catch (e) {}

      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      const domains: string[] = ['', hostname, `.${hostname}`];
      if (parts.length >= 2) {
        for (let i = 0; i < parts.length - 1; i++) {
          const parentDomain = '.' + parts.slice(i).join('.');
          if (!domains.includes(parentDomain)) domains.push(parentDomain);
        }
      }
      const extraDomains = ['.streamed.space', '.orchit.ai', '.localhost'];
      extraDomains.forEach(d => {
        if (!domains.includes(d)) domains.push(d);
      });

      keys.forEach(key => {
        domains.forEach(domain => {
          const domainString = domain ? `; domain=${domain}` : '';
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainString}`;
          document.cookie = `${key}=; path=/; max-age=0${domainString}`;
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainString}`;
          document.cookie = `${key}=; max-age=0${domainString}`;
        });
      });

      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/login') {
        window.location.href = '/';
      }
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
