// stores/auth.ts
import { defineStore } from 'pinia'
import api from '../libs/api'
// import { setAuthCookie } from '../utilities/auth'
function clearAuthCookie() {
  // Clear for both possible domains
  document.cookie = `auth_token=; domain=.streamed.space; path=/; max-age=0`
  document.cookie = `auth_token=; domain=.orchit.ai; path=/; max-age=0`
  document.cookie = `auth_token=; path=/; max-age=0` // For localhost
}
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    initialized: false,
    userId: localStorage.getItem('user_id') as string | null,
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
  },
  actions: {
async bootstrap() {
  const urlParams = new URLSearchParams(window.location.search)
  const encodedToken = urlParams.get('_auth')
  const encodedCompanyId = urlParams.get('_cid')

  const cleanBase64 = (str: string) =>
    str.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '=')

  const hostname = window.location.hostname
  const maxAge = 60 * 60 * 24 * 30

  const setCookie = (name: string, value: string) => {
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`
    } else if (hostname.endsWith('.streamed.space')) {
      document.cookie = `${name}=${value}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
    } else if (hostname.endsWith('.orchit.ai')) {
      document.cookie = `${name}=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
    }
  }

  // ✅ STEP 1: Save from URL
  if (encodedToken || encodedCompanyId) {
    if (encodedToken) {
      const token = atob(cleanBase64(encodedToken))
      localStorage.setItem('token', token)
      setCookie('auth_token', token)
    }

    if (encodedCompanyId) {
      const companyId = atob(cleanBase64(encodedCompanyId))
      setCookie('company_id', companyId) // ✅ IMPORTANT: cookie, not localStorage
    }

    // ✅ Clean URL AFTER saving
    setTimeout(() => {
      urlParams.delete('_auth')
      urlParams.delete('_cid')

      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? '?' + urlParams.toString() : '')

      window.history.replaceState({}, '', newUrl)
    }, 0)
  }

  // ✅ STEP 2: Get token
  const localToken = localStorage.getItem('token')
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1] ?? null

  const token = cookieToken || localToken

  if (!token) {
    this.initialized = true
    return
  }

  // ✅ STEP 3: Fetch profile
  try {
    const res = await api.get('/profile')
    this.user = res.data

    const activeCompanyId = res?.data?.data?.active_company_id

    const existingCompanyId = document.cookie
      .split('; ')
      .find(row => row.startsWith('company_id='))
      ?.split('=')[1] ?? null

    // ✅ Only set if missing
    if (!existingCompanyId && activeCompanyId) {
      setCookie('company_id', activeCompanyId)
    }
  } catch (e) {
    console.error("Profile fetch failed", e)
  } finally {
    this.initialized = true
  }
},
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('company_id')
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