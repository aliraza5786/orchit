// stores/auth.ts
import { defineStore } from 'pinia'
import api from '../libs/api'

function clearAuthCookie() {
  document.cookie = `auth_token=; domain=.streamed.space; path=/; max-age=0`
  document.cookie = `auth_token=; path=/; max-age=0`
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    initialized: false,
    userId: localStorage.getItem('user_id') as string | null,
    company_id: localStorage.getItem('company_id') as string | null,
  }),

  getters: {
    isAuthenticated: (s) => !!s.user,
  },

  actions: {
  async bootstrap() {
  const urlParams = new URLSearchParams(window.location.search)
  const encodedToken = urlParams.get('_auth')

  const cleanBase64 = (str: string) =>
    str.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '=')

  // ✅ Save token from URL
  if (encodedToken) {
    try {
      const token = atob(cleanBase64(encodedToken))
      localStorage.setItem('token', token)

      const hostname = window.location.hostname
      const maxAge = 60 * 60 * 24 * 30

      if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
        document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
      } else if (hostname.endsWith('.streamed.space')) {
        document.cookie = `auth_token=${token}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
      }

      console.log('✅ Token saved from URL')
    } catch (e) {
      console.log('❌ Token decode failed:', e)
    }

    urlParams.delete('_auth')
  }

  // ✅ Clean URL
  const newUrl =
    window.location.pathname +
    (urlParams.toString() ? '?' + urlParams.toString() : '')

  window.history.replaceState({}, '', newUrl)

  // ✅ Get token
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1] ?? null

  const localToken = localStorage.getItem('token')
  const token = cookieToken || localToken

  if (!token) {
    this.initialized = true
    return
  }

  // ✅ Fetch profile (ONLY source of company_id)
  try {
    const res = await api.get('/profile')
this.user = res.data
console.log('✅ API call successful, user loaded')

// ADD THESE:
console.log('📦 Full profile data:', res.data)
console.log('🏢 active_company_id:', res.data?.data?.active_company_id)
console.log('📦 localStorage company_id before save:', localStorage.getItem('company_id'))

const activeCompanyId = res.data?.data?.active_company_id
if (activeCompanyId) {
  localStorage.setItem('company_id', activeCompanyId)
  this.company_id = activeCompanyId
  console.log('✅ company_id saved:', activeCompanyId)
} else {
  console.log('❌ active_company_id is null/undefined in profile response')
}
} catch (e) {
    console.log('⚠️ Profile fetch failed:', (e as any)?.response?.status)
  } finally {
    this.initialized = true
  }
},

    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      // localStorage.removeItem('company_id')
      localStorage.removeItem('currentName')
      localStorage.removeItem('jobId')
      localStorage.removeItem('mannualWorkspace')
      localStorage.removeItem('selectedAgentModule')
      localStorage.removeItem('selectedModuleId')
      localStorage.removeItem('sprintType')
      localStorage.removeItem('activeMilestoneId')
      localStorage.removeItem('activeSprintId')
      localStorage.removeItem('showActiveSprint')
      localStorage.removeItem('activeSprintKey')
      localStorage.removeItem('selectedSprintTitle')
      localStorage.removeItem('selected_sheet_title')
      localStorage.removeItem('activeSessionId')
      localStorage.removeItem('activeSessionTitle')
      localStorage.removeItem('selected_sheet_id')
      clearAuthCookie()
      this.user = null
    },
  },
})