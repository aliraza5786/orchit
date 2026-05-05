import { defineStore } from 'pinia'
import api from '../libs/api'
import { isRootDomain, getCurrentTenant } from '../utilities/tenant'

const COOKIE_KEY = 'auth_session'

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

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

function clearAuthCookie() {
  document.cookie = `${COOKIE_KEY}=; domain=orchit.ai; path=/; max-age=0; Secure; SameSite=None`
  document.cookie = `${COOKIE_KEY}=; domain=.orchit.ai; path=/; max-age=0; Secure; SameSite=None`
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`
  document.cookie = `auth_token=; domain=orchit.ai; path=/; max-age=0; Secure; SameSite=None`
  document.cookie = `auth_token=; domain=.orchit.ai; path=/; max-age=0; Secure; SameSite=None`
  document.cookie = `auth_token=; path=/; max-age=0`
  console.log('🍪 Auth cookies cleared from all domains')
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = defineStore('auth', {
  state: () => {
    const session = getAuthCookie()
    const onRoot = isRootDomain()

    // personal mode OR root domain → never load company_id
    if (session?.personal_mode || onRoot) {
      return {
        user: null as any,
        initialized: false,
        userId: localStorage.getItem('user_id') as string | null,
        company_id: null as string | null,
      }
    }

    // Subdomain → safe to load company_id
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

    // ─── Write Cookie ───────────────────────────────────────────────────────
    writeAuthCookie(data: { token?: string; company_id?: string | null; personal_mode?: boolean | null }) {
      try {
        const existing = getAuthCookie() || {}
        const merged: Record<string, any> = { ...existing, ...data }

        if (data.company_id === null) delete merged.company_id
        if (data.personal_mode === null) delete merged.personal_mode

        const value = encodeURIComponent(JSON.stringify(merged))
        const maxAge = 60 * 60 * 24 * 30
        const hostname = window.location.hostname

        if (hostname === 'localhost') {
          document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
        } else if (hostname.endsWith('.localhost')) {
          document.cookie = `${COOKIE_KEY}=${value}; domain=localhost; path=/; max-age=${maxAge}; SameSite=Lax`
        } else if (hostname === 'orchit.ai' || hostname.endsWith('.orchit.ai')) {
          document.cookie = `${COOKIE_KEY}=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=None`
        }

        console.log('🍪 Auth Cookie Updated:', { merged, hostname })
      } catch (e) {
        console.error('❌ Failed to write auth cookie:', e)
      }
    },

    // ─── Set Company ────────────────────────────────────────────────────────
    setCompany(id: string) {
      this.company_id = id
      localStorage.setItem('company_id', id)
      localStorage.removeItem('personal_mode')
      this.writeAuthCookie({ company_id: id, personal_mode: null })
    },

    // ─── Clear Company ──────────────────────────────────────────────────────
    clearCompany() {
      this.company_id = null
      localStorage.removeItem('company_id')
      localStorage.setItem('personal_mode', 'true')
      this.writeAuthCookie({ company_id: null, personal_mode: true })
    },

    // ─── Bootstrap ──────────────────────────────────────────────────────────
    async bootstrap() {
      if (this.initialized) return

      // ── Step 1: Handle _auth token from URL ────────────────────────────
      const urlParams = new URLSearchParams(window.location.search)
      const encodedToken = urlParams.get('_auth')

      if (encodedToken) {
        try {
          let token = encodedToken
          if (!encodedToken.startsWith('eyJ')) {
            token = atob(encodedToken.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
          }
          localStorage.setItem('token', token)
          this.writeAuthCookie({ token })
        } catch {
          console.log('❌ Token decode failed')
        }
      }

      // ── Step 2: Clean transient URL params ────────────────────────────
      const transientParams = ['_auth', 'welcome']
      transientParams.forEach(p => urlParams.delete(p))
      window.history.replaceState(
        {},
        '',
        window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
      )

      // ── Step 3: Resolve token ─────────────────────────────────────────
      const session = getAuthCookie()
      const token = session?.token ?? localStorage.getItem('token')

      if (!token) {
        this.initialized = true
        return
      }

      // Persist token to cookie if it was only in localStorage
      if (!session?.token && token) {
        this.writeAuthCookie({ token })
      }

      // ── Step 4: Resolve company_id based on domain ────────────────────
      if (session?.personal_mode) {
        // Personal mode — never has a company
        localStorage.removeItem('company_id')
        localStorage.removeItem('last_tenant_slug')
        this.company_id = null

      } else if (isRootDomain()) {
        // Root domain — ignore any stored company_id entirely
        localStorage.removeItem('company_id')
        this.company_id = null
        console.log('🌐 Root domain — tenant context cleared')

      } else if (session?.company_id) {
        // Subdomain — safe to load company_id
        localStorage.setItem('company_id', session.company_id)
        this.company_id = session.company_id

        // ✅ Save tenant slug so root domain can redirect back here
        const currentTenant = getCurrentTenant()
        if (currentTenant) {
          localStorage.setItem('last_tenant_slug', currentTenant)
          console.log('🏢 Tenant loaded & slug saved:', currentTenant)
        }
      }

      // ── Step 5: Fetch user profile ────────────────────────────────────
      try {
        const res = await api.get('/profile')
        this.user = res.data
        const activeCompanyId = res.data?.data?.active_company_id
         console.log("active company id in store", res.data?.data?.active_company_id);
         
        // Only auto-set active company on subdomains, never on root
        if (activeCompanyId && !this.company_id && !session?.personal_mode && !isRootDomain()) {
          localStorage.setItem('company_id', activeCompanyId)
          this.company_id = activeCompanyId || res.data?.data?.active_company_id;
          this.writeAuthCookie({ company_id: activeCompanyId })
          console.log('🏢 Active company auto-set from profile:', activeCompanyId)
        }
      } catch (e) {
        console.log('⚠️ Profile fetch failed:', (e as any)?.response?.status)
      } finally {
        this.initialized = true
      }
    },

    // ─── Logout ─────────────────────────────────────────────────────────────
    logout() {
      const keysToRemove = [
        'token', 'user_id', 'company_id', 'personal_mode',
        'last_tenant_slug',  // ← clears redirect target on logout
        'currentName', 'jobId', 'mannualWorkspace',
        'selectedAgentModule', 'selectedModuleId', 'sprintType',
        'activeMilestoneId', 'activeSprintId', 'showActiveSprint',
        'activeSprintKey', 'selectedSprintTitle', 'selected_sheet_title',
        'activeSessionId', 'activeSessionTitle', 'selected_sheet_id',
      ]
      keysToRemove.forEach(key => localStorage.removeItem(key))
      clearAuthCookie()
      this.user = null
      this.company_id = null
      this.initialized = false
    },

    // ─── Go to Root Domain (escape hatch) ───────────────────────────────────
    // Call this when user intentionally wants to visit orchit.ai
    // without being redirected back to their tenant
    goToRootDomain() {
      sessionStorage.setItem('stay_on_root', 'true')
      window.location.href = 'https://orchit.ai'
    },
  },
})