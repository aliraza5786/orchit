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
  
  console.log('🔍 Bootstrap starting...')
  console.log('📍 Hostname:', window.location.hostname)
  console.log('🔑 _auth param found:', !!encodedToken)
  console.log('📦 localStorage token before:', localStorage.getItem('token') ? 'EXISTS' : 'EMPTY')

  // ✅ STEP 1: decode FIRST
  if (encodedToken) {
    try {
      const base64 = encodedToken
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .replace(/\./g, '=')

      const token = atob(base64)
      console.log('✅ Token decoded successfully')

      // ✅ Save immediately to localStorage
      localStorage.setItem('token', token)
      console.log('✅ Token saved to localStorage')
      console.log('📦 localStorage token after save:', localStorage.getItem('token') ? 'EXISTS ✓' : 'STILL EMPTY ✗')

      // ✅ Set cookie with appropriate domain
      const hostname = window.location.hostname
      const maxAge = 60 * 60 * 24 * 30 // 30 days
      
      if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
        // For localhost: no domain, no Secure flag
        document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
        console.log('🍪 Cookie set for localhost (no domain flag)')
      } else if (hostname.endsWith('.streamed.space')) {
        // For streamed.space subdomains: set cross-domain cookie
        document.cookie = `auth_token=${token}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
        console.log('🍪 Cookie set for .streamed.space')
      } else if (hostname.endsWith('.orchit.ai')) {
        // For orchit.ai subdomains: set cross-domain cookie
        document.cookie = `auth_token=${token}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
        console.log('🍪 Cookie set for .orchit.ai')
      }

    } catch (e) {
      console.log('❌ Token decode failed:', e)
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
  
  console.log('🔎 Token check - Local:', !!localToken, 'Cookie:', !!cookieToken, 'Final:', !!token)

  if (!token) {
    console.log('⚠️ No token found, setting initialized = true')
    this.initialized = true
    return
  }

  // ✅ sync
  if (cookieToken && localStorage.getItem('token') !== cookieToken) {
    localStorage.setItem('token', cookieToken)
    console.log('🔄 Synced token from cookie to localStorage')
  }

  try {
    console.log('📡 Making API call to /profile...')
    const res = await api.get('/profile')
    console.log('✅ API call successful, user loaded')
    this.user = res.data
  } catch (e) {
    console.log('⚠️ API call failed:', (e as any)?.response?.status, (e as any)?.message)
    // Don't clear token on API failure - user might be on a subdomain
    // localStorage.removeItem('token')
    // this.user = null
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