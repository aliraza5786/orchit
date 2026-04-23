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
  const encodedCompanyId = urlParams.get('_cid') // ← capture before deleting

  if (encodedToken) {
    try {
      const base64 = encodedToken
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .replace(/\./g, '=')

      const token = atob(base64)
      localStorage.setItem('token', token)
      const hostname = window.location.hostname
      const maxAge = 60 * 60 * 24 * 30

      if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
        document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
        console.log('🍪 Cookie set for localhost (no domain flag)')
      } else if (hostname.endsWith('.streamed.space')) {
        document.cookie = `auth_token=${token}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
        console.log('🍪 Cookie set for .streamed.space')
      } else if (hostname.endsWith('.orchit.ai')) {
        document.cookie = `auth_token=${token}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
        console.log('🍪 Cookie set for .orchit.ai')
      }
    } catch (e) {
      console.log('❌ Token decode failed:', e)
    }
    urlParams.delete('_auth')
  }

  const cidWasInUrl = !!encodedCompanyId // ← flag before deletion

  if (encodedCompanyId) {
    console.log('🏢 encoded company id found:', encodedCompanyId)
    try {
      const companyId = atob(
        encodedCompanyId
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .replace(/\./g, '=')
      )
      localStorage.setItem('company_id', companyId)
      console.log('✅ Company ID saved from _cid param:', companyId)
    } catch (e) {
      console.log('❌ Company ID decode failed:', e)
    }
    urlParams.delete('_cid')
  }

  // Clean up URL
  const newUrl =
    window.location.pathname +
    (urlParams.toString() ? '?' + urlParams.toString() : '')
  window.history.replaceState({}, '', newUrl)

  // Read tokens
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

  if (cookieToken && localStorage.getItem('token') !== cookieToken) {
    localStorage.setItem('token', cookieToken)
    console.log('🔄 Synced token from cookie to localStorage')
  }

  try {
    console.log('📡 Making API call to /profile...')
    const res = await api.get('/profile')
    console.log('✅ API call successful, user loaded')
    this.user = res.data

    const activeCompanyId = res?.data?.data?.active_company_id
    console.log('🏢 active_company_id from profile:', activeCompanyId)
    console.log('🔗 _cid was in URL:', cidWasInUrl)
    console.log('📦 current company_id in localStorage:', localStorage.getItem('company_id'))

    // ✅ Only save from profile if _cid was NOT in URL — don't overwrite _cid
    if (!cidWasInUrl && activeCompanyId) {
      localStorage.setItem('company_id', activeCompanyId)
      console.log('✅ Company ID saved from profile:', activeCompanyId)
    } else if (cidWasInUrl) {
      console.log('⏭️ Skipping profile company_id — _cid param takes priority')
    } else {
      console.log('❌ No company_id anywhere')
    }
  } catch (e) {
    console.log('⚠️ API call failed:', (e as any)?.response?.status, (e as any)?.message)
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