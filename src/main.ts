import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import './styles/theme.css'
import App from './App.vue'
import router from "./router"
import { VueQueryPlugin } from "@tanstack/vue-query"
import { Toaster } from 'vue-sonner'
import '@/assets/fontawesome/css/fontawesome.min.css'
import '@/assets/fontawesome/css/regular.min.css'
import { queryClient } from './libs/queryClient'
import { initThemeImmediately } from './composables/useTheme'
import { createHead } from '@vueuse/head'
import vue3GoogleLogin from 'vue3-google-login'

// ✅ ONLY handle VERY EARLY token persistence (optional but safe)
const urlParams = new URLSearchParams(window.location.search)
const encodedToken = urlParams.get('_auth')

if (encodedToken) {
  try {
    const token = atob(
      encodedToken
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .replace(/\./g, '=')
    )

    // Save in BOTH (cookie + localStorage)
    localStorage.setItem('token', token)

    const maxAge = 60 * 60 * 24 * 30
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}`
    } else if (hostname.endsWith('.streamed.space')) {
      document.cookie = `auth_token=${token}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
    } else if (hostname.endsWith('.orchit.ai')) {
      document.cookie = `auth_token=${token}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
    }

    console.log('✅ main.ts: Token stored early')
  } catch (e) {
    console.error('❌ Token decode failed:', e)
  }
}

// ❌ DO NOT handle company_id here anymore
// ❌ DO NOT use document.domain

const head = createHead()
const app = createApp(App)

initThemeImmediately()

import vTooltip from './directives/vTooltip'
app.directive('tooltip', vTooltip)

app.component('Toaster', Toaster)

app.use(createPinia())
app.use(VueQueryPlugin, { queryClient })
app.use(router)
app.use(head)

app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})

app.mount("#app")