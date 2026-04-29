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
// main.ts — replace the writeAuthCookie function
function writeAuthCookie(data: Record<string, any>) {
  const existing = getAuthCookie() || {};
  const merged = { ...existing, ...data };
  if (data.company_id === null) delete merged.company_id;
  if (data.personal_mode === null) delete merged.personal_mode;
  const value = encodeURIComponent(JSON.stringify(merged));

  if (hostname === 'localhost') {
    // Local development: no domain or secure flags needed
    document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else if (hostname.endsWith('.localhost')) {
    document.cookie = `${COOKIE_KEY}=${value}; domain=localhost; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else if (hostname === 'orchit.ai') {
    // Production root domain: use leading dot to include all subdomains
    document.cookie = `${COOKIE_KEY}=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=None`;
  } else if (hostname.endsWith('.orchit.ai')) {
    // Production subdomain: use leading dot for consistency
    document.cookie = `${COOKIE_KEY}=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=None`;
  }

  console.log('🍪 auth_session cookie:', document.cookie.includes('auth_session') ? '✅ SET' : '❌ NOT SET');
  console.log('🍪 Hostname:', hostname, '| Cookie domain set appropriately');
}
const urlParams = new URLSearchParams(window.location.search);
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
    // ✅ Write to auth_session (not auth_token)
    writeAuthCookie({ token });
  } catch (e) {
    console.error("❌ main.ts: Token decode failed:", e);
  }
}

// ✅ Handle personal_mode / company_id sync on load
const session = getAuthCookie();

if (session?.personal_mode) {
  localStorage.removeItem("company_id");
  // Clean company_id from cookie but keep token
  writeAuthCookie({ company_id: null });
} else if (session?.company_id) {
  localStorage.setItem("company_id", session.company_id);
}

// ✅ If token is in localStorage but NOT in cookie, fix it
const localToken = localStorage.getItem("token");
if (localToken && !session?.token) {
  writeAuthCookie({ token: localToken });
}

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