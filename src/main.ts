import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import "./styles/theme.css";
import App from "./App.vue";
import router from "./router";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { Toaster } from "vue-sonner";
import "@/assets/fontawesome/css/fontawesome.min.css";
import "@/assets/fontawesome/css/regular.min.css";
import { queryClient } from "./libs/queryClient";
import { initThemeImmediately } from "./composables/useTheme";
import { createHead } from "@vueuse/head";
import vue3GoogleLogin from "vue3-google-login";
import vTooltip from "./directives/vTooltip";
import { isRootDomain } from "./utilities/tenant";

const COOKIE_KEY = "auth_session";
const maxAge = 60 * 60 * 24 * 30;
const hostname = window.location.hostname;

function getAuthCookie(): { token?: string; company_id?: string; personal_mode?: boolean } | null {
  try {
    const raw = document.cookie
      .split("; ")
      .find((row) => row.startsWith(COOKIE_KEY + "="))
      ?.split("=")[1];
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

function writeAuthCookie(data: Record<string, any>) {
  const existing = getAuthCookie() || {};
  const merged = { ...existing, ...data };
  if (data.company_id === null) delete merged.company_id;
  if (data.personal_mode === null) delete merged.personal_mode;
  const value = encodeURIComponent(JSON.stringify(merged));

  if (hostname === "localhost") {
    document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else if (hostname.endsWith(".localhost")) {
    document.cookie = `${COOKIE_KEY}=${value}; domain=localhost; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else if (hostname === "orchit.ai" || hostname.endsWith(".orchit.ai")) {
    document.cookie = `${COOKIE_KEY}=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=None`;
  }
}

// ─── Smart Tenant Redirect ────────────────────────────────────────────────────
// If user visits orchit.ai but has an active tenant session,
// redirect them back to their tenant automatically
function redirectToTenantIfNeeded(): boolean {
  if (!isRootDomain()) return false;

  // User explicitly chose to stay on root (e.g. clicked "Switch Workspace")
  const stayOnRoot = sessionStorage.getItem("stay_on_root");
  if (stayOnRoot) {
    sessionStorage.removeItem("stay_on_root"); // one-time flag, consume it
    console.log("🌐 stay_on_root flag found — skipping tenant redirect");
    return false;
  }

  const session = getAuthCookie();

  // No token → not logged in → stay on root
  if (!session?.token) return false;

  // Personal mode → no tenant → stay on root
  if (session?.personal_mode) return false;

  // Get last visited tenant slug
  const tenantSlug = localStorage.getItem("last_tenant_slug");
  if (!tenantSlug) return false;

  // Build redirect URL — preserve current path and query
  const isLocalhost = hostname === "localhost";
  const baseDomain = isLocalhost ? "localhost" : "orchit.ai";
  const port = window.location.port ? `:${window.location.port}` : "";
  const protocol = isLocalhost ? "http" : "https";
  const targetUrl = `${protocol}://${tenantSlug}.${baseDomain}${port}${window.location.pathname}${window.location.search}`;

  console.log(`🔀 Active tenant session found — redirecting to: ${targetUrl}`);
  window.location.href = targetUrl;
  return true;
}

// Run redirect check FIRST before anything else mounts
const redirecting = redirectToTenantIfNeeded();
if (redirecting) {
  // Stop execution — page is being redirected, no need to boot Vue
  throw new Error("⏩ Redirecting to tenant subdomain...");
}

// ─── Theme sync from URL ──────────────────────────────────────────────────────
const urlParams = new URLSearchParams(window.location.search);

const themeFromUrl = urlParams.get("theme");
if (themeFromUrl && ["light", "dark", "system"].includes(themeFromUrl)) {
  localStorage.setItem("theme", themeFromUrl);
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete("theme");
  window.history.replaceState({}, "", cleanUrl.toString());
}

// ─── Token sync from URL ──────────────────────────────────────────────────────
const encodedToken = urlParams.get("_auth");

if (encodedToken) {
  try {
    let token = encodedToken;
    if (!encodedToken.startsWith("eyJ")) {
      token = atob(
        encodedToken.replace(/-/g, "+").replace(/_/g, "/").replace(/\./g, "=")
      );
    }
    localStorage.setItem("token", token);
    writeAuthCookie({ token });
  } catch (e) {
    console.error("❌ main.ts: Token decode failed:", e);
  }
}

// ─── Session sync ─────────────────────────────────────────────────────────────
const session = getAuthCookie();

if (session?.personal_mode || isRootDomain()) {
  // Root domain or personal mode — never load stale company_id
  localStorage.removeItem("company_id");
  if (session?.personal_mode) {
    writeAuthCookie({ company_id: null });
  }
} else if (session?.company_id) {
  localStorage.setItem("company_id", session.company_id);
}

const localToken = localStorage.getItem("token");
if (localToken && !session?.token) {
  writeAuthCookie({ token: localToken });
}

// ─── App bootstrap ────────────────────────────────────────────────────────────
const head = createHead();
const app = createApp(App);

initThemeImmediately();

app.directive("tooltip", vTooltip);
app.component("Toaster", Toaster);
app.use(createPinia());
app.use(VueQueryPlugin, { queryClient });
app.use(router);
app.use(head);
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});

app.mount("#app");