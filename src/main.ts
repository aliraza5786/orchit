import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import './styles/theme.css'
import App from './App.vue'
import router from "./router";
import { VueQueryPlugin } from "@tanstack/vue-query"
import { Toaster } from 'vue-sonner'
import '@/assets/fontawesome/css/fontawesome.min.css';
import '@/assets/fontawesome/css/regular.min.css';
import { queryClient } from './libs/queryClient'
import { initThemeImmediately } from './composables/useTheme'
import { createHead } from '@vueuse/head';

// ✅ Decode and save _auth, _cid from URL params BEFORE app initialization
const urlParams = new URLSearchParams(window.location.search)
const encodedToken = urlParams.get('_auth')
const encodedCompanyId = urlParams.get('_cid')
if (encodedToken) {
  try {
    const token = atob(encodedToken.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
    localStorage.setItem('token', token)
    console.log('✅ Token saved before app init')
  } catch (e) {
    console.error('❌ Token decode failed:', e)
  }
}
if (encodedCompanyId) {
  try {
    const companyId = atob(encodedCompanyId.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
    localStorage.setItem('company_id', companyId)
    console.log('✅ Company ID saved before app init:', companyId)
  } catch (e) {
    console.error('❌ Company ID decode failed:', e)
  }
}
// Set document.domain for cross-subdomain localStorage sharing
if (window.location.hostname === 'streamed.space' || window.location.hostname.endsWith('.streamed.space')) {
  document.domain = 'streamed.space'
  console.log('🌍 document.domain set to streamed.space')
} else if (window.location.hostname === 'orchit.ai' || window.location.hostname.endsWith('.orchit.ai')) {
  document.domain = 'orchit.ai'
  console.log('🌍 document.domain set to orchit.ai')
} else if (window.location.hostname.endsWith('.localhost')) {
  try {
    document.domain = 'localhost'
    console.log('🌍 document.domain set to localhost')
  } catch (e) {
    console.log('⚠️ Could not set document.domain to localhost:', e)
  }
}

const head = createHead();
const app = createApp(App)
initThemeImmediately();
import vTooltip from './directives/vTooltip'
app.directive('tooltip', vTooltip)
app.component('Toaster', Toaster)
app.use(createPinia())
.use(VueQueryPlugin, { queryClient })
app.use(router)
app.use(head)
import vue3GoogleLogin from 'vue3-google-login'
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})

app.mount("#app")