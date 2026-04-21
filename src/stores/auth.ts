// stores/auth.ts
import { defineStore } from 'pinia'
import api from '../libs/api'
// import { setAuthCookie } from '../utilities/auth'
function clearAuthCookie() {
  document.cookie = `auth_token=; domain=.streamed.space; path=/; max-age=0`
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

  // ✅ STEP 1: decode FIRST
  if (encodedToken) {
    try {
      const base64 = encodedToken
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .replace(/\./g, '=')

      const token = atob(base64)

      // ✅ Save immediately
      localStorage.setItem('token', token)

      document.cookie = `auth_token=${token}; domain=.streamed.space; path=/; max-age=${60 * 60 * 24 * 30}; Secure`

    } catch (e) {
      console.log('decode failed:', e)
    }

    // ✅ REMOVE PARAM AFTER SAVING
    urlParams.delete('_auth')
    const newUrl =
      window.location.pathname +
      (urlParams.toString() ? '?' + urlParams.toString() : '')

    window.history.replaceState({}, '', newUrl)
  }

  // ✅ STEP 2: now read tokens
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

  // ✅ sync
  if (cookieToken && localStorage.getItem('token') !== cookieToken) {
    localStorage.setItem('token', cookieToken)
  }

  try {
    const res = await api.get('/profile')
    this.user = res.data
  } catch (e) {
    localStorage.removeItem('token')
    document.cookie = `auth_token=; domain=.streamed.space; path=/; max-age=0`
    this.user = null
  } finally {
    this.initialized = true
  }
},
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
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