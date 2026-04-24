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
      const companyId = urlParams.get('company_id') // ✅ plain, no decoding needed

      const cleanBase64 = (str: string) =>
        str.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '=')

      const setCompanyIdCookie = (id: string) => {
        const hostname = window.location.hostname
        const maxAge = 60 * 60 * 24 * 30
        if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
          document.cookie = `company_id=${id}; path=/; max-age=${maxAge}; SameSite=Lax`
        } else if (hostname.endsWith('.streamed.space')) {
          document.cookie = `company_id=${id}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
        }
      }

      // ✅ STEP 1: Save token from URL
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

      // ✅ STEP 2: Save plain company_id from URL — highest priority
      if (companyId) {
        localStorage.setItem('company_id', companyId)
        this.company_id = companyId
        setCompanyIdCookie(companyId)
      }
const newUrl =
  window.location.pathname +
  (urlParams.toString() ? '?' + urlParams.toString() : '')

window.history.replaceState({}, '', newUrl)

      // ✅ STEP 4: Read token
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1] ?? null

      const localToken = localStorage.getItem('token')
      const token = cookieToken || localToken

      console.log('🔎 Token - Local:', !!localToken, 'Cookie:', !!cookieToken)

      if (!token) {
        this.initialized = true
        return
      }

      if (cookieToken && localStorage.getItem('token') !== cookieToken) {
        localStorage.setItem('token', cookieToken)
      }

      // ✅ STEP 5: Fetch profile
      try {
        console.log('📡 Fetching profile...')
        const res = await api.get('/profile')
        this.user = res.data
        console.log('✅ Profile loaded')

        const activeCompanyId = res.data?.data?.active_company_id
        const existingCompanyId = localStorage.getItem('company_id')

        console.log('🏢 active_company_id from profile:', activeCompanyId)
        console.log('📦 existing company_id:', existingCompanyId)

        if (activeCompanyId && !existingCompanyId) {
          // ✅ No company_id at all — use profile's
          localStorage.setItem('company_id', activeCompanyId)
          this.company_id = activeCompanyId
          setCompanyIdCookie(activeCompanyId)
          console.log('✅ company_id set from profile:', activeCompanyId)
        } else if (existingCompanyId) {
          // ✅ Already have one — keep it, just sync state
          this.company_id = existingCompanyId
          console.log('⏭️ Keeping existing company_id:', existingCompanyId)
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