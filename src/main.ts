import { createApp } from "vue"
import { createPinia } from "pinia"
import "./style.css"
import "./styles/theme.css"
import App from "./App.vue"
import router from "./router"
import { VueQueryPlugin } from "@tanstack/vue-query"
import { Toaster } from "vue-sonner"
import "@/assets/fontawesome/css/fontawesome.min.css"
import "@/assets/fontawesome/css/regular.min.css"
import { queryClient } from "./libs/queryClient"
import { initThemeImmediately } from "./composables/useTheme"
import { createHead } from "@vueuse/head"
import vue3GoogleLogin from "vue3-google-login"
import vTooltip from "./directives/vTooltip" 
import { isRootDomain, buildTenantUrl } from "./utilities/tenantRedirect"
import { isLocalhost } from "./utilities/tenantRedirect"
// ─────────────────────────────────────────────────────────────────────────────
// COOKIE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const COOKIE_KEY = "auth_session"
const maxAge = 60 * 60 * 24 * 30
const hostname = window.location.hostname

// ─────────────────────────────────────────────────────────────────────────────
// COOKIE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getAuthCookie(): {
  token?: string
  company_id?: string
  personal_mode?: boolean
} | null {
  try {
    const raw = document.cookie
      .split("; ")
      .find((row) => row.startsWith(COOKIE_KEY + "="))
      ?.split("=")[1]

    if (!raw) return null
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    return null
  }
}

function writeAuthCookie(data: Record<string, any>) {
  const existing = getAuthCookie() || {}
  const merged = { ...existing, ...data }

  if (data.company_id === null) delete merged.company_id
  if (data.personal_mode === null) delete merged.personal_mode

  const value = encodeURIComponent(JSON.stringify(merged))

  if (hostname === "localhost") {
    document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
  } 
  else if (hostname.endsWith(".orchit.ai") || hostname === "orchit.ai") {
    document.cookie = `${COOKIE_KEY}=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=None`
  }
}
function redirectToTenantIfNeeded(): boolean {
  if (!isRootDomain()) return false
  if (isLocalhost()) return false

  const session = getAuthCookie()
  if (!session?.token) return false

  // ✅ Only respect personal_mode if there's no company_id in cookie
  // If cookie has company_id, user explicitly navigated to a tenant — redirect them
  if (session?.personal_mode && !session?.company_id) return false

  const tenantSlug = localStorage.getItem("last_tenant_slug")
  if (!tenantSlug) return false

  // ✅ Validate slug format
  if (!/^[a-z0-9-]+$/.test(tenantSlug)) return false

  window.location.href = buildTenantUrl(
    tenantSlug,
    window.location.pathname + window.location.search
  )
  return true
}
if (redirectToTenantIfNeeded()) {
  throw new Error("Redirecting to tenant...")
}
const urlParams = new URLSearchParams(window.location.search)

// Theme
const themeFromUrl = urlParams.get('theme')
if (themeFromUrl && ['light', 'dark', 'system'].includes(themeFromUrl)) {
  localStorage.setItem('theme', themeFromUrl)
}

// ✅ JobId
const jobIdFromUrl = urlParams.get('jobId')
if (jobIdFromUrl) {
  localStorage.setItem('jobId', decodeURIComponent(jobIdFromUrl))
}

// ✅ Clean ALL transient params at once
const cleanUrl = new URL(window.location.href)
cleanUrl.searchParams.delete('theme')
cleanUrl.searchParams.delete('jobId')
window.history.replaceState({}, '', cleanUrl.toString())
const encodedToken = urlParams.get("_auth")

if (encodedToken) {
  try {
    let token = encodedToken

    if (!encodedToken.startsWith("eyJ")) {
      token = atob(
        encodedToken.replace(/-/g, "+").replace(/_/g, "/").replace(/\./g, "=")
      )
    }

    localStorage.setItem("token", token)
    writeAuthCookie({ token })
  } catch (e) {
    console.error("Token decode failed:", e)
  }
}
// REPLACE the entire session sync block
const session = getAuthCookie()

if (isRootDomain()) {
  localStorage.removeItem("company_id")

  // ✅ Only set personal_mode if there's NO last_tenant_slug
  // If user has a tenant, they may be returning from subdomain — don't overwrite
  const hasTenant = !!localStorage.getItem("last_tenant_slug")
  if (session?.token && !hasTenant && !session?.company_id) {
    writeAuthCookie({
      token: session.token,
      company_id: null,
      personal_mode: true,
    })
  }
} else {
  // SUBDOMAIN — restore company context
  if (session?.company_id) {
    localStorage.setItem("company_id", session.company_id)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN SYNC FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

const localToken = localStorage.getItem("token")

if (localToken && !session?.token) {
  writeAuthCookie({ token: localToken })
}

// ─────────────────────────────────────────────────────────────────────────────
// APP BOOTSTRAP
// ─────────────────────────────────────────────────────────────────────────────

const app = createApp(App)
const head = createHead()

initThemeImmediately()

app.directive("tooltip", vTooltip)
app.component("Toaster", Toaster)

app.use(createPinia())
app.use(VueQueryPlugin, { queryClient })
app.use(router)
app.use(head)
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})

app.mount("#app")