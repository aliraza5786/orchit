import { defineStore } from 'pinia'
import api from '../libs/api'

const COOKIE_KEY = 'auth_session'
function getAuthCookie(): { token?: string; company_id?: string; personal_mode?: boolean } | null {
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

function setAuthCookie(data: { token?: string; company_id?: string | null; personal_mode?: boolean | null }) {
  try {
    const existing = getAuthCookie() || {}
    const merged = { ...existing, ...data }

    if (data.company_id === null) {
      delete merged.company_id
    }

    if (data.personal_mode === null) {
      delete merged.personal_mode
    }

    const value = encodeURIComponent(JSON.stringify(merged))
    const maxAge = 60 * 60 * 24 * 30
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
    } else if (hostname.endsWith('.orchit.ai')) {
      document.cookie = `${COOKIE_KEY}=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
    }
  } catch (e) {
    console.error('❌ Failed to set auth cookie:', e)
  }
}

function clearAuthCookie() {
  document.cookie = `${COOKIE_KEY}=; domain=.orchit.ai; path=/; max-age=0`
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`
  document.cookie = `auth_token=; domain=.orchit.ai; path=/; max-age=0`
  document.cookie = `auth_token=; path=/; max-age=0`
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const session = getAuthCookie()
    // If personal_mode is in cookie, ignore company_id entirely
    if (session?.personal_mode) {
      return {
        user: null as any,
        initialized: false,
        userId: localStorage.getItem('user_id') as string | null,
        company_id: null as string | null,
      }
    }
    return {
      user: null as any,
      initialized: false,
      userId: localStorage.getItem('user_id') as string | null,
      company_id: session?.company_id ?? localStorage.getItem('company_id') as string | null,
    }
  },

  getters: {
    isAuthenticated: (s) => !!s.user,
  },

  actions: {
    setCompany(id: string) {
      this.company_id = id
      localStorage.setItem('company_id', id)
      localStorage.removeItem('personal_mode')
      setAuthCookie({ company_id: id, personal_mode: null })
    },

    clearCompany() {
      this.company_id = null
      localStorage.removeItem('company_id')
      localStorage.setItem('personal_mode', 'true')
      // Store personal_mode in cookie so ALL subdomains see it on next load
      setAuthCookie({ company_id: null, personal_mode: true })
    },

    async bootstrap() {
      if (this.initialized) return

      const urlParams = new URLSearchParams(window.location.search)
      const encodedToken = urlParams.get('_auth')

      const cleanBase64 = (str: string) =>
        str.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '=')

      if (encodedToken) {
        try {
          let token = encodedToken
          if (!encodedToken.startsWith('eyJ')) {
            token = atob(cleanBase64(encodedToken))
          }
          localStorage.setItem('token', token)
          setAuthCookie({ token })
        } catch (e) {
          console.log('❌ Token decode failed, using existing token')
        }
      }

      const transientParams = ['_auth', 'welcome']
      transientParams.forEach(p => urlParams.delete(p))
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? '?' + urlParams.toString() : '')
      window.history.replaceState({}, '', newUrl)

      const session = getAuthCookie()
      const token = session?.token ?? localStorage.getItem('token')
      if (!token) {
        this.initialized = true
        return
      }

      // If personal_mode is in cookie, clear company from this subdomain's localStorage too
      if (session?.personal_mode) {
        localStorage.removeItem('company_id')
        this.company_id = null
      } else if (session?.company_id && localStorage.getItem('company_id')) {
        localStorage.setItem('company_id', session.company_id)
        this.company_id = session.company_id
      }

      try {
        const res = await api.get('/profile')
        this.user = res.data
        const activeCompanyId = res.data?.data?.active_company_id

        // Never restore from server if personal_mode is active in cookie
        if (activeCompanyId && !this.company_id && !session?.personal_mode) {
          localStorage.setItem('company_id', activeCompanyId)
          this.company_id = activeCompanyId
          setAuthCookie({ company_id: activeCompanyId })
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
      localStorage.removeItem('personal_mode')
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