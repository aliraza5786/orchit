// stores/auth.ts
import { defineStore } from 'pinia'
import api from '../libs/api'

const COOKIE_KEY = 'auth_session'

function getAuthCookie(): { token?: string, company_id?: string } | null {
  try {
    const raw = document.cookie
      .split('; ')
      .find(row => row.startsWith(COOKIE_KEY + '='))
      ?.split('=')[1]
    if (!raw) return null
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    return null
  }
}

function setAuthCookie(data: { token?: string, company_id?: string }) {
  try {
    const existing = getAuthCookie() || {}
    const merged = { ...existing, ...data }
    const value = encodeURIComponent(JSON.stringify(merged))
    const maxAge = 60 * 60 * 24 * 30
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
    } else if (hostname.endsWith('.streamed.space')) {
      document.cookie = `${COOKIE_KEY}=${value}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
    }

    console.log('🍪 auth_session cookie updated:', merged)
  } catch (e) {
    console.error('❌ Failed to set auth cookie:', e)
  }
}

function clearAuthCookie() {
  document.cookie = `${COOKIE_KEY}=; domain=.streamed.space; path=/; max-age=0`
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`
  // Keep clearing old cookie too for backwards compat
  document.cookie = `auth_token=; domain=.streamed.space; path=/; max-age=0`
  document.cookie = `auth_token=; path=/; max-age=0`
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const session = getAuthCookie()
    return {
      user: null as any,
      initialized: false,
      userId: localStorage.getItem('user_id') as string | null,
      // ✅ Cookie first, localStorage as fallback
      company_id: session?.company_id ?? localStorage.getItem('company_id') as string | null,
    }
  },

  getters: {
    isAuthenticated: (s) => !!s.user,
  },

  actions: {
    async bootstrap() {
      console.log('🔍 Bootstrap starting... initialized:', this.initialized)

      if (this.initialized) {
        console.log('⏭️ Already initialized, skipping')
        return
      }

      const urlParams = new URLSearchParams(window.location.search)
      const encodedToken = urlParams.get('_auth')

      const cleanBase64 = (str: string) =>
        str.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '=')

      // ✅ STEP 1: Save token from URL
      if (encodedToken) {
        try {
          let token = encodedToken
          if (!encodedToken.startsWith('eyJ')) {
            token = atob(cleanBase64(encodedToken))
          }
          localStorage.setItem('token', token)
          setAuthCookie({ token })
          console.log('✅ Token saved from URL')
        } catch (e) {
          console.log('❌ Token decode failed, using existing token')
        }
        urlParams.delete('_auth')
      }

      // ✅ STEP 2: Clean URL
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? '?' + urlParams.toString() : '')
      window.history.replaceState({}, '', newUrl)

      // ✅ STEP 3: Read token — cookie object first, then localStorage
      const session = getAuthCookie()
      const token = session?.token ?? localStorage.getItem('token')

      console.log('🔎 Token found:', !!token)
      console.log('🍪 auth_session cookie:', session)

      if (!token) {
        this.initialized = true
        return
      }

      // ✅ STEP 4: Sync company_id from cookie → localStorage + state
      if (session?.company_id) {
        localStorage.setItem('company_id', session.company_id)
        this.company_id = session.company_id
        console.log('✅ company_id synced from cookie:', session.company_id)
      }

      // ✅ STEP 5: Fetch profile
      try {
        console.log('📡 Fetching profile...')
        const res = await api.get('/profile')
        this.user = res.data
        console.log('✅ Profile loaded')

        const activeCompanyId = res.data?.data?.active_company_id
        console.log('🏢 active_company_id from profile:', activeCompanyId)
        console.log('📦 existing company_id:', this.company_id)

        if (activeCompanyId && !this.company_id) {
          // ✅ No company_id anywhere — use profile as fallback
          localStorage.setItem('company_id', activeCompanyId)
          this.company_id = activeCompanyId
          setAuthCookie({ company_id: activeCompanyId })
          console.log('✅ company_id saved from profile (fallback):', activeCompanyId)
        } else if (this.company_id) {
          console.log('⏭️ Keeping existing company_id:', this.company_id)
        } else {
          console.log('❌ No company_id found anywhere')
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
      this.company_id = null
      this.initialized = false
    },
  },
})