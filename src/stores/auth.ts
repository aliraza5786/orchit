import { defineStore } from 'pinia'
import api from '../libs/api'
const COOKIE_KEY = 'auth_session'
function parseCookie(): { token?: string; company_id?: string; personal_mode?: boolean; company_switched?: boolean } | null {
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

function writeCookie(data: {
  token?: string
  company_id?: string | null
  personal_mode?: boolean | null
  company_switched?: boolean | null
}) {
  try {
    const existing = parseCookie() || {}
    const merged: Record<string, unknown> = { ...existing, ...data }

    if (data.company_id === null) delete merged.company_id
    if (data.personal_mode === null) delete merged.personal_mode
    if (data.company_switched === null) delete merged.company_switched
    const value = encodeURIComponent(JSON.stringify(merged))
    const maxAge = 60 * 60 * 24 * 30
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
    } else if (hostname.endsWith('.streamed.space')) {
      document.cookie = `${COOKIE_KEY}=${value}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
    }
  } catch (e) {
    console.error('❌ Failed to set auth cookie:', e)
  }
}

function clearCookies() {
  const keys = [COOKIE_KEY, 'auth_token', 'space_auth', 'auth_session', 'token', '_cid', '_uid', 'user_id', 'company_id'];
  
  try {
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name && !keys.includes(name)) {
        keys.push(name);
      }
    });
  } catch (e) {
    console.error('Failed to parse cookies for clearing:', e);
  }

  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const domains: string[] = ['', hostname, `.${hostname}`];

  if (parts.length >= 2) {
    for (let i = 0; i < parts.length - 1; i++) {
      const parentDomain = '.' + parts.slice(i).join('.');
      if (!domains.includes(parentDomain)) {
        domains.push(parentDomain);
      }
    }
  }

  const extraDomains = ['.streamed.space', '.orchit.ai', '.localhost'];
  extraDomains.forEach(d => {
    if (!domains.includes(d)) {
      domains.push(d);
    }
  });

  keys.forEach(key => {
    domains.forEach(domain => {
      const domainString = domain ? `; domain=${domain}` : '';
      
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainString}`;
      document.cookie = `${key}=; path=/; max-age=0${domainString}`;
      
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainString}`;
      document.cookie = `${key}=; max-age=0${domainString}`;
    });
  });
}
export function getToken(): string | null {
  const session = parseCookie()
  if (session?.token) return session.token
  return localStorage.getItem('token')
}

let bootstrapPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', {
  state: () => {
    const session = parseCookie()
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
      company_id: session?.company_id ?? localStorage.getItem('company_id') ?? null,
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
  writeCookie({ company_id: id, personal_mode: null, company_switched: true }) // ← add this
},

   clearCompany() {
  this.company_id = null
  localStorage.removeItem('company_id')
  localStorage.setItem('personal_mode', 'true')
  writeCookie({ company_id: null, personal_mode: true, company_switched: null }) // ← clear it
},

    async bootstrap(force = false) {
      if (force) {
        this.initialized = false
        bootstrapPromise = null
      }

      if (this.initialized) return
      if (bootstrapPromise) return bootstrapPromise

      bootstrapPromise = (async () => {
        const relayToken = sessionStorage.getItem('_relay_token')
        if (relayToken) {
          localStorage.setItem('token', relayToken)
          writeCookie({ token: relayToken })
          sessionStorage.removeItem('_relay_token')
        }

        const urlParams = new URLSearchParams(window.location.search)

        // ── 1. Handle _auth (existing) ──────────────────────────────
        const encodedToken = urlParams.get('_auth')
        if (encodedToken) {
          try {
            const token = encodedToken.startsWith('eyJ')
              ? encodedToken
              : atob(encodedToken.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
            localStorage.setItem('token', token)
            writeCookie({ token })
          } catch {
            // keep existing token
          }
        }

        // ── 2. Handle _token (sent by confirmSwitch) ────────────────
        const rawToken = urlParams.get('_token')
        if (rawToken) {
          localStorage.setItem('token', rawToken)
          writeCookie({ token: rawToken })
        }

        // ── 3. Handle company_id from URL ───────────────────────────
        const urlCompanyId = urlParams.get('company_id')
        if (urlCompanyId) {
          localStorage.setItem('company_id', urlCompanyId)
          this.company_id = urlCompanyId
          writeCookie({ company_id: urlCompanyId, company_switched: true })
        }

        // ── 3.5. Handle _cid from URL (Base64 encoded company_id) ────
        const encodedCompanyId = urlParams.get('_cid')
        if (encodedCompanyId) {
          try {
            const companyId = atob(encodedCompanyId.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
            if (companyId === 'personal') {
              this.clearCompany()
            } else if (companyId) {
              this.setCompany(companyId)
            }
          } catch (e) {
            console.error('❌ Failed to decode _cid from URL:', e)
          }
        }

        // ── 4. Clean ALL auth params from URL in one shot ───────────
        //    Previously only ran inside if(encodedToken) — so _token
        //    and company_id were NEVER removed from the URL.
        const hadAuthParams =
          urlParams.has('_auth') ||
          urlParams.has('_token') ||
          urlParams.has('company_id') ||
          urlParams.has('_cid') ||
          urlParams.has('welcome')

        if (hadAuthParams) {
          urlParams.delete('_auth')
          urlParams.delete('_token')
          urlParams.delete('company_id')
          urlParams.delete('_cid')
          urlParams.delete('welcome')
          const newUrl =
            window.location.pathname +
            (urlParams.toString() ? '?' + urlParams.toString() : '')
          window.history.replaceState({}, '', newUrl)
        }

        // ── rest is unchanged ────────────────────────────────────────
        const token = getToken()
        if (!token) {
          this.initialized = true
          return
        }
        const session = parseCookie()
        if (!session?.token) {
          writeCookie({ token })
        }

        if (session?.personal_mode) {
          localStorage.removeItem('company_id')
          this.company_id = null
        } else if (session?.company_id) {
          localStorage.setItem('company_id', session.company_id)
          this.company_id = session.company_id
        }

        try {
          const res = await api.get('/profile')
          this.user = res.data
          const activeCompanyId = res.data?.data?.active_company_id
          const hasExplicitlySwitched = session?.company_switched === true
          if (activeCompanyId && !this.company_id && !session?.personal_mode && hasExplicitlySwitched) {
            localStorage.setItem('company_id', activeCompanyId)
            this.company_id = activeCompanyId
            writeCookie({ company_id: activeCompanyId })
          }
        } catch (e) {
          console.warn('⚠️ Profile fetch failed:', (e as any)?.response?.status)
        } finally {
          this.initialized = true
        }
      })()

      return bootstrapPromise
    },

    seedFromStorage() {
      const session = parseCookie()
      if (session?.personal_mode || localStorage.getItem('personal_mode') === 'true') {
        this.company_id = null
        localStorage.removeItem('company_id')
        return
      }
      // Cookie wins over localStorage for cross-subdomain consistency
      const id = session?.company_id ?? localStorage.getItem('company_id')
      if (id) this.company_id = id
    },

    logout() {
      const keys = [
        'token', 'user_id', 'company_id', 'personal_mode', 'currentName',
        'jobId', 'mannualWorkspace', 'selectedAgentModule', 'selectedModuleId',
        'sprintType', 'activeMilestoneId', 'activeSprintId', 'showActiveSprint',
        'activeSprintKey', 'selectedSprintTitle', 'selected_sheet_title',
        'activeSessionId', 'activeSessionTitle', 'selected_sheet_id','sidebar_mode', 'company_name',
        'onboarding_active_step', 'onboarding_dns_input', 'onboarding_has_custom_domain',
        'onboarding_company_id', 'onboarding_site_name', 'onboarding_site_slug',
        'onboarding_super_admin_otp_sent', 'onboarding_super_admin_user_id',
        'onboarding_super_admin_email_prefix', 'onboarding_super_admin_name',
        'onboarding_domain_phase', 'onboarding_current_domain', 'onboarding_current_instructions',
        'onboarding_selected_verification_method'
      ]
      keys.forEach(k => localStorage.removeItem(k))
      clearCookies()
      this.user = null
      this.company_id = null
      this.initialized = false
      bootstrapPromise = null
    },
  },
})