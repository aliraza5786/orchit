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

const COOKIE_KEY = "auth_session";

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

if (
  window.location.hostname === "streamed.space" ||
  window.location.hostname.endsWith(".streamed.space")
) {
  document.domain = "streamed.space";
} else if (window.location.hostname.endsWith(".localhost")) {
  try {
    document.domain = "localhost";
  } catch (e) {
    console.log("⚠️ Could not set document.domain to localhost:", e);
  }
}

const hostname = window.location.hostname;
const maxAge = 60 * 60 * 24 * 30;

// ── Step 1: Read URL params FIRST before anything else ────────────────────
const urlParamsMain = new URLSearchParams(window.location.search);
const urlToken = urlParamsMain.get("_token");
const urlCompanyId = urlParamsMain.get("company_id");
const urlTheme = urlParamsMain.get("theme");
const encodedToken = urlParamsMain.get("_auth");

// ── Step 2: Save token to localStorage ────────────────────────────────────
if (urlToken) {
  // Token passed explicitly from handleClick
  localStorage.setItem("token", urlToken);
} else if (encodedToken) {
  // Legacy _auth encoded token
  try {
    let token = encodedToken;
    if (!encodedToken.startsWith("eyJ")) {
      token = atob(
        encodedToken.replace(/-/g, "+").replace(/_/g, "/").replace(/\./g, "="),
      );
    }
    localStorage.setItem("token", token);
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } else if (hostname.endsWith(".streamed.space")) {
      document.cookie = `auth_token=${token}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;
    }
  } catch (e) {
    console.error("❌ main.ts: Token decode failed:", e);
  }
} else {
  // ✅ Fallback — pull token from shared space_auth cookie into localStorage
  try {
    const raw = document.cookie
      .split("; ")
      .find((row) => row.startsWith("space_auth="))
      ?.split("=")[1];
    if (raw) {
      const session = JSON.parse(decodeURIComponent(raw));
      if (session?.token) {
        localStorage.setItem("token", session.token);
      }
    }
  } catch (e) {
    console.error("❌ Failed to parse space_auth cookie:", e);
  }
}

// ── Step 3: Save company_id to localStorage ───────────────────────────────
if (urlCompanyId) {
  localStorage.setItem("company_id", urlCompanyId);
}

// ── Step 4: Apply theme from URL param ────────────────────────────────────
if (urlTheme) {
  const validThemes: ThemeMode[] = ["light", "dark", "system"];
  const safeTheme: ThemeMode = validThemes.includes(urlTheme as ThemeMode)
    ? (urlTheme as ThemeMode)
    : "light";
  localStorage.setItem("theme", safeTheme);
}

// ── Step 5: Clean URL if any injected params were present ─────────────────
if (urlToken || urlCompanyId || urlTheme || encodedToken) {
  const cleaned = new URLSearchParams(window.location.search);
  ["_token", "company_id", "theme", "_auth"].forEach((p) => cleaned.delete(p));
  const newUrl =
    window.location.pathname +
    (cleaned.toString() ? "?" + cleaned.toString() : "");
  window.history.replaceState({}, "", newUrl);
}

// ── Step 6: Handle auth_session cookie (company_id / personal_mode) ───────
const session = getAuthCookie();
const isPersonalMode = session?.personal_mode === true;

if (isPersonalMode) {
  localStorage.removeItem("company_id");
  if (session?.company_id) {
    const cleaned = { ...session };
    delete cleaned.company_id;
    const value = encodeURIComponent(JSON.stringify(cleaned));
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } else if (hostname.endsWith(".streamed.space")) {
      document.cookie = `${COOKIE_KEY}=${value}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;
    }
  }
} else if (session?.company_id && !urlCompanyId) {
  // Only restore from cookie if URL didn't supply a fresh company_id
  localStorage.setItem("company_id", session.company_id);
}

// ── Step 7: Init theme immediately (reads localStorage we just set) ───────
initThemeImmediately();

// ── Step 8: Mount app ─────────────────────────────────────────────────────
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