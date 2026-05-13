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
  const pairs = [
    `${COOKIE_KEY}=; domain=.streamed.space; path=/; max-age=0`,
    `${COOKIE_KEY}=; path=/; max-age=0`,
    `auth_token=; domain=.streamed.space; path=/; max-age=0`,
    `auth_token=; path=/; max-age=0`,
    `space_auth=; domain=.streamed.space; path=/; max-age=0`,
    `space_auth=; path=/; max-age=0`,
  ]
  pairs.forEach(p => (document.cookie = p))
}
export function getToken(): string | null {
  const session = parseCookie()
  if (session?.token) return session.token
  return localStorage.getItem('token')
}

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

    async bootstrap() {
  if (this.initialized) return

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

  // ── 4. Clean ALL auth params from URL in one shot ───────────
  //    Previously only ran inside if(encodedToken) — so _token
  //    and company_id were NEVER removed from the URL.
  const hadAuthParams =
    urlParams.has('_auth') ||
    urlParams.has('_token') ||
    urlParams.has('company_id') ||
    urlParams.has('welcome')

  if (hadAuthParams) {
    urlParams.delete('_auth')
    urlParams.delete('_token')
    urlParams.delete('company_id')
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
        'activeSessionId', 'activeSessionTitle', 'selected_sheet_id',
      ]
      keys.forEach(k => localStorage.removeItem(k))
      clearCookies()
      this.user = null
      this.company_id = null
      this.initialized = false
    },
  },
})