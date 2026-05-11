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
import type { ThemeMode } from "./composables/useTheme";
import { createHead } from "@vueuse/head";
import vue3GoogleLogin from "vue3-google-login";
import vTooltip from "./directives/vTooltip";

// BUG 2 FIX: Use one consistent cookie name everywhere
const COOKIE_KEY = "auth_session";
const maxAge = 60 * 60 * 24 * 30;

const hostname = window.location.hostname;
// const protocol = window.location.protocol;

if (hostname === "streamed.space" || hostname.endsWith(".streamed.space")) {
  document.domain = "streamed.space";
} else if (hostname.endsWith(".localhost")) {
  try { document.domain = "localhost"; } catch {}
}

function readCookie(name: string): Record<string, unknown> | null {
  try {
    const raw = document.cookie
      .split("; ")
      .find(row => row.startsWith(name + "="))
      ?.split("=")[1];
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

function writeAuthCookie(data: Record<string, unknown>) {
  const existing = readCookie(COOKIE_KEY) || {};
  const merged = { ...existing, ...data };
  const value = encodeURIComponent(JSON.stringify(merged));
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else if (hostname.endsWith(".streamed.space")) {
    document.cookie = `${COOKIE_KEY}=${value}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;
  }
}

// ── Step 1: Read URL params ────────────────────────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get("_token");
const urlCompanyId = urlParams.get("company_id");
const urlTheme = urlParams.get("theme");
const encodedToken = urlParams.get("_auth");

// ── Step 2: Save token ─────────────────────────────────────────────────────
if (urlToken) {
  localStorage.setItem("token", urlToken);
  writeAuthCookie({ token: urlToken });
  sessionStorage.setItem('_relay_token', urlToken)
} else if (encodedToken) {
  try {
    const token = encodedToken.startsWith("eyJ")
      ? encodedToken
      : atob(encodedToken.replace(/-/g, "+").replace(/_/g, "/").replace(/\./g, "="));
    localStorage.setItem("token", token);
    writeAuthCookie({ token });
  } catch (e) {
    console.error("❌ Token decode failed:", e);
  }
} else {
  // BUG 2 FIX: Read from auth_session (the real cookie), not space_auth.
  // Also migrate anyone still on the old space_auth cookie.
  const session = readCookie(COOKIE_KEY);
  const legacySession = readCookie("space_auth");

  const token = session?.token as string | undefined
    ?? (legacySession?.token as string | undefined)
    ?? undefined;

  if (token) {
    localStorage.setItem("token", token);
    // Write it into auth_session if it wasn't already there
    if (!session?.token) writeAuthCookie({ token });
  }
}

// ── Step 3: Save company_id ────────────────────────────────────────────────
if (urlCompanyId) {
  localStorage.setItem("company_id", urlCompanyId);
  writeAuthCookie({ company_id: urlCompanyId });
}

// ── Step 4: Apply theme ────────────────────────────────────────────────────
if (urlTheme) {
  const validThemes: ThemeMode[] = ["light", "dark", "system"];
  const safeTheme = validThemes.includes(urlTheme as ThemeMode)
    ? (urlTheme as ThemeMode)
    : "light";
  localStorage.setItem("theme", safeTheme);
}

// ── Step 5: Clean URL ──────────────────────────────────────────────────────
if (urlToken || urlCompanyId || urlTheme || encodedToken) {
  const cleaned = new URLSearchParams(window.location.search);
  ["_token", "company_id", "theme", "_auth"].forEach(p => cleaned.delete(p));
  const newUrl =
    window.location.pathname +
    (cleaned.toString() ? "?" + cleaned.toString() : "");
  window.history.replaceState({}, "", newUrl);
}

// ── Step 6: Handle personal_mode from cookie ───────────────────────────────
const session = readCookie(COOKIE_KEY);
const isPersonalMode = session?.personal_mode === true;

if (isPersonalMode) {
  localStorage.removeItem("company_id");
  if (session?.company_id) {
    const cleaned = { ...session };
    delete cleaned.company_id;
    writeAuthCookie({ company_id: null });
  }
} else if (session?.company_id && !urlCompanyId) {
  localStorage.setItem("company_id", session.company_id as string);
}

// ── Step 7: Init theme ─────────────────────────────────────────────────────
initThemeImmediately();

// ── Step 8: Mount ─────────────────────────────────────────────────────────
const head = createHead();
const app = createApp(App);

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