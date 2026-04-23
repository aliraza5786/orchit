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
    company_id: localStorage.getItem('company_id') as string | null,
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

  // ✅ STEP 1: Handle URL params
  if (encodedToken || encodedCompanyId) {
    if (encodedToken) {
      const token = atob(cleanBase64(encodedToken))
      localStorage.setItem('token', token)
      // cookie already handled in your code
    }

    if (encodedCompanyId) {
      const companyId = atob(cleanBase64(encodedCompanyId))
      document.cookie = `company_id=${companyId}; domain=.streamed.space; path=/; max-age=${60 * 60 * 24 * 30}; Secure; SameSite=Lax`
    }

    // clean URL
    setTimeout(() => {
      urlParams.delete('_auth')
      urlParams.delete('_cid')

      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? '?' + urlParams.toString() : '')

      window.history.replaceState({}, '', newUrl)
    }, 0)
  }

  // 🟢 ✅ ADD YOUR SYNC CODE RIGHT HERE

  const getCookie = (name: string) => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(name + '=')) // 👈 this line you asked about
      ?.split('=')[1] ?? null
  }

  const cookieCompanyId = getCookie('company_id')
  const localCompanyId = localStorage.getItem('company_id')

  if (cookieCompanyId && !localCompanyId) {
    localStorage.setItem('company_id', cookieCompanyId)
    console.log('🔄 Synced company_id from cookie → localStorage')
  }

  // 🔵 Continue normal flow

  const token = localStorage.getItem('token')
  if (!token) {
    this.initialized = true
    return
  }

  try {
    const res = await api.get('/profile')
    this.user = res.data

    const existingCid = getCookie('company_id')
    const c_id = res.data?.data?.active_company_id;
    this.company_id = c_id;
    if (!existingCid && res.data?.data?.active_company_id) {
      document.cookie = `company_id=${res.data.data.active_company_id}; domain=.streamed.space; path=/; max-age=${60 * 60 * 24 * 30}; Secure; SameSite=Lax`
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