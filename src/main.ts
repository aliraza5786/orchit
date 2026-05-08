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
  window.location.hostname === "orchit.ai" ||
  window.location.hostname.endsWith(".orchit.ai")
) {
  document.domain = "orchit.ai";
} else if (window.location.hostname.endsWith(".localhost")) {
  try {
    document.domain = "localhost";
  } catch (e) {
    console.log("⚠️ Could not set document.domain to localhost:", e);
  }
}

const hostname = window.location.hostname;
const maxAge = 60 * 60 * 24 * 30;
const urlParams = new URLSearchParams(window.location.search);
const encodedToken = urlParams.get("_auth");

if (encodedToken) {
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
    } else if (hostname.endsWith(".orchit.ai")) {
      document.cookie = `auth_token=${token}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;
    }
  } catch (e) {
    console.error("❌ main.ts: Token decode failed:", e);
  }
}

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
    } else if (hostname.endsWith(".orchit.ai")) {
      document.cookie = `${COOKIE_KEY}=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;
    }
  }
} else if (session?.company_id && localStorage.getItem("company_id")) {
  localStorage.setItem("company_id", session.company_id);
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