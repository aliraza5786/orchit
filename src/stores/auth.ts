import { defineStore } from 'pinia'
import api from '../libs/api'
import { isRootDomain } from '../utilities/tenant'
import userSocket, { resetSocket } from '../libs/socket'

const COOKIE_KEY = 'auth_session'

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

function getAuthCookie(): {
  token?: string
  company_id?: string
  personal_mode?: boolean
} | null {
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

function clearAuthCookie() {
  document.cookie = `${COOKIE_KEY}=; domain=orchit.ai; path=/; max-age=0; Secure; SameSite=None`
  document.cookie = `${COOKIE_KEY}=; domain=.orchit.ai; path=/; max-age=0; Secure; SameSite=None`
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`
  document.cookie = `auth_token=; domain=orchit.ai; path=/; max-age=0; Secure; SameSite=None`
  document.cookie = `auth_token=; domain=.orchit.ai; path=/; max-age=0; Secure; SameSite=None`
  document.cookie = `auth_token=; path=/; max-age=0`
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = defineStore('auth', {
  state: () => {
    const session  = getAuthCookie()
    const onRoot   = isRootDomain()

    // Root domain → never hydrate company context
    if (onRoot) {
      return {
        user:        null as any,
        initialized: false,
        userId:      localStorage.getItem('user_id') as string | null,
        company_id:  null as string | null,
      }
    }

    // Subdomain → restore company from cookie (primary) or localStorage (fallback)
    return {
      user:        null as any,
      initialized: false,
      userId:      localStorage.getItem('user_id') as string | null,
      company_id:  session?.company_id ?? (localStorage.getItem('company_id') as string | null),
    }
  },

  getters: {
    isAuthenticated: s => !!s.user,
  },

  actions: {
    // ─── Write Cookie ───────────────────────────────────────────────────────

    writeAuthCookie(data: {
      token?: string
      company_id?: string | null
      personal_mode?: boolean | null
    }) {
      try {
        const existing = getAuthCookie() || {}
        const merged: Record<string, any> = { ...existing, ...data }

        // null means "remove this key"
        if (data.company_id    === null) delete merged.company_id
        if (data.personal_mode === null) delete merged.personal_mode

        const value  = encodeURIComponent(JSON.stringify(merged))
        const maxAge = 60 * 60 * 24 * 30
        const host   = window.location.hostname

        if (host === 'localhost') {
          document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
        } else if (host.endsWith('.localhost')) {
          document.cookie = `${COOKIE_KEY}=${value}; domain=localhost; path=/; max-age=${maxAge}; SameSite=Lax`
        } else if (host === 'orchit.ai' || host.endsWith('.orchit.ai')) {
          // domain=.orchit.ai makes the cookie readable on ALL subdomains
          document.cookie = `${COOKIE_KEY}=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=None`
        }

        console.log('🍪 Auth Cookie Updated:', merged)
      } catch (e) {
        console.error('❌ Failed to write auth cookie:', e)
      }
    },

    // ─── Switch TO Company ──────────────────────────────────────────────────
    //
    // Stores company_id everywhere and removes personal_mode flag.

    setCompany(id: string) {
      this.company_id = id
      localStorage.setItem('company_id', id)
      localStorage.removeItem('personal_mode')
      this.writeAuthCookie({ company_id: id, personal_mode: null })
    },

    // ─── Switch TO Personal ─────────────────────────────────────────────────
    //
    // Clears company context and sets personal_mode so main.ts will NOT
    // auto-redirect back to the tenant on root domain.

    clearCompany() {
      this.company_id = null
      localStorage.removeItem('company_id')
      localStorage.removeItem('last_tenant_slug')
      localStorage.setItem('personal_mode', 'true')
      this.writeAuthCookie({ company_id: null, personal_mode: true })
    },

    // ─── Bootstrap ──────────────────────────────────────────────────────────

    async bootstrap() {
      if (this.initialized) return

      this.initialized = false

      // ── Step 1: Handle _auth token from URL ────────────────────────────
      const urlParams    = new URLSearchParams(window.location.search)
      const encodedToken = urlParams.get('_auth')

      if (encodedToken) {
        try {
          let token = encodedToken
          if (!encodedToken.startsWith('eyJ')) {
            token = atob(
              encodedToken.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '=')
            )
          }
          localStorage.setItem('token', token)
          this.writeAuthCookie({ token })
        } catch {
          console.log('❌ Token decode failed')
        }
      }

      // ── Step 2: Clean transient URL params ────────────────────────────
      const transientParams = ['_auth', 'welcome', 'theme', 'jobId']
      const cleanUrl = new URL(window.location.href)
      transientParams.forEach(p => cleanUrl.searchParams.delete(p))
      window.history.replaceState({}, '', cleanUrl.toString())

      // ── Step 3: Resolve token ─────────────────────────────────────────
      const session = getAuthCookie()
      const token   = session?.token ?? localStorage.getItem('token')

      if (!token) {
        this.initialized = true
        return
      }

      // Persist token to cookie if it's only in localStorage
      if (!session?.token && token) {
        this.writeAuthCookie({ token })
      }

      // ── Step 4: Resolve company context ───────────────────────────────

      if (isRootDomain()) {
        //
        // ROOT DOMAIN
        // Always clear company context from localStorage.
        // The cookie keeps company_id for cross-subdomain reads, but
        // local state is personal on root.
        //
        localStorage.removeItem('company_id')
        localStorage.removeItem('last_tenant_slug')
        this.company_id = null
        console.log('🌐 Root domain — running in personal mode')

      } else {
        //
        // SUBDOMAIN  (e.g. tech-studio.orchit.ai)
        // Restore company_id from cookie first, then localStorage fallback.
        //
        const cookieCompanyId = session?.company_id
        const localCompanyId  = localStorage.getItem('company_id')
        const resolvedId      = cookieCompanyId ?? localCompanyId

        if (resolvedId) {
          this.company_id = resolvedId
          localStorage.setItem('company_id', resolvedId)

          // Ensure cookie is consistent
          if (!cookieCompanyId) {
            this.writeAuthCookie({ token, company_id: resolvedId, personal_mode: null })
          }

          console.log('🏢 Company context restored on subdomain:', resolvedId)
        } else {
          console.warn('⚠️ On subdomain but no company_id found — Navbar watcher will fix this')
        }
      }

      // ── Step 5: Fetch user profile ────────────────────────────────────
      try {
        const res            = await api.get('/profile')
        this.user            = res.data
        const activeCompanyId: string | undefined = res.data?.data?.active_company_id

        //
        // FIX: ONLY auto-set company_id from profile when on a subdomain
        // AND we still have no company_id resolved yet.
        // NEVER do this on root domain — it would cause queries to fire with
        // a company_id while the user is in personal mode.
        //
        if (activeCompanyId && !this.company_id && !isRootDomain()) {
          localStorage.setItem('company_id', activeCompanyId)
          this.company_id = activeCompanyId
          this.writeAuthCookie({ company_id: activeCompanyId })
          console.log('🏢 company_id auto-set from profile (subdomain fallback):', activeCompanyId)
        }

      } catch (e) {
        console.log('⚠️ Profile fetch failed:', (e as any)?.response?.status)
      } finally {
        this.initialized = true
        userSocket.initializeSocket()
      }
    },

    // ─── Logout ─────────────────────────────────────────────────────────────

    logout() {
      const keysToRemove = [
        'token', 'user_id', 'company_id', 'personal_mode', 'last_tenant_slug',
        'currentName', 'jobId', 'mannualWorkspace', 'selectedAgentModule',
        'selectedModuleId', 'sprintType', 'activeMilestoneId', 'activeSprintId',
        'showActiveSprint', 'activeSprintKey', 'selectedSprintTitle',
        'selected_sheet_title', 'activeSessionId', 'activeSessionTitle',
        'selected_sheet_id', 'personal_mode_intended',
      ]
      keysToRemove.forEach(key => localStorage.removeItem(key))
      clearAuthCookie()
      this.user        = null
      this.company_id  = null
      this.initialized = false
      resetSocket()
    },
  },
})
