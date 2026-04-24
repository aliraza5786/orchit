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

// ✅ STEP 1: Set document.domain FIRST before anything else
if (window.location.hostname === 'streamed.space' || window.location.hostname.endsWith('.streamed.space')) {
  document.domain = 'streamed.space'
  console.log('🌍 document.domain set to streamed.space')
} else if (window.location.hostname.endsWith('.localhost')) {
  try {
    document.domain = 'localhost'
    console.log('🌍 document.domain set to localhost')
  } catch (e) {
    console.log('⚠️ Could not set document.domain to localhost:', e)
  }
}

// ✅ STEP 2: Read URL params
const urlParams = new URLSearchParams(window.location.search)
const encodedToken = urlParams.get('_auth')
const encodedCompanyId = urlParams.get('_cid')

const hostname = window.location.hostname
const maxAge = 60 * 60 * 24 * 30

// ✅ STEP 3: Decode and save token from URL
if (encodedToken) {
  try {
    const token = atob(
      encodedToken
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .replace(/\./g, '=')
    )

    localStorage.setItem('token', token)

    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
    } else if (hostname.endsWith('.streamed.space')) {
      document.cookie = `auth_token=${token}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
    }

    console.log('✅ main.ts: Token stored early')
  } catch (e) {
    console.error('❌ Token decode failed:', e)
  }
}

// ✅ STEP 3.5: Decode and save company_id from URL early
if (encodedCompanyId) {
  let companyId = encodedCompanyId
  try {
    companyId = atob(
      encodedCompanyId
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .replace(/\./g, '=')
    )
    console.log('✅ main.ts: Decoded company_id:', companyId)
  } catch (e) {
    console.warn('⚠️ main.ts: company_id decode failed, using raw value:', encodedCompanyId)
  }

  localStorage.setItem('company_id', companyId)

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    document.cookie = `company_id=${companyId}; path=/; max-age=${maxAge}; SameSite=Lax`
  } else if (hostname.endsWith('.streamed.space')) {
    document.cookie = `company_id=${companyId}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
  }

  console.log('✅ main.ts: Company ID stored early')
}

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