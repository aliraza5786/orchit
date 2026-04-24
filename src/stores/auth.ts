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
    // ✅ Cookie first, localStorage as fallback
    company_id: (
      document.cookie.split('; ').find(r => r.startsWith('company_id='))?.split('=')[1]
    ) ?? localStorage.getItem('company_id') as string | null,
  }),

  getters: {
    isAuthenticated: (s) => !!s.user,
  },

  actions: {
    async bootstrap() {
      const urlParams = new URLSearchParams(window.location.search)
      const encodedToken = urlParams.get('_auth')
      const encodedCompanyId = urlParams.get('_cid')

      const cleanBase64 = (str: string) =>
        str.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '=')

      const getCookie = (name: string) =>
        document.cookie
          .split('; ')
          .find(row => row.startsWith(name + '='))
          ?.split('=')[1] ?? null

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
          console.log('✅ Token saved')
        } catch (e) {
          console.log('❌ Token decode failed:', e)
        }
        urlParams.delete('_auth')
      }

      // ✅ STEP 2: Save company_id from URL — highest priority
      if (encodedCompanyId) {
        let companyId = encodedCompanyId
        try {
          companyId = atob(cleanBase64(encodedCompanyId))
          console.log('✅ Company ID decoded from _cid:', companyId)
        } catch (e) {
          console.warn('⚠️ Company ID decode failed, using raw value:', encodedCompanyId)
        }
        
        localStorage.setItem('company_id', companyId)
        this.company_id = companyId
        setCompanyIdCookie(companyId)
        console.log('✅ Company ID saved from _cid:', companyId)

        // Mark that we explicitly forced a company_id from the URL in this session
        // This prevents the profile's active_company_id from overwriting it
        sessionStorage.setItem('forced_company_id', 'true')
      }

      // ✅ STEP 3: Clean URL
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? '?' + urlParams.toString() : '')
      window.history.replaceState({}, '', newUrl)

      // ✅ STEP 4: Only sync cookie → localStorage if _cid was NOT in URL
      if (!encodedCompanyId) {
        const cookieCompanyId = getCookie('company_id')
        console.log('🍪 cookie company_id:', cookieCompanyId)
        console.log('📦 localStorage company_id:', localStorage.getItem('company_id'))

        if (cookieCompanyId) {
          localStorage.setItem('company_id', cookieCompanyId)
          this.company_id = cookieCompanyId
          console.log('🔄 Synced company_id from cookie → localStorage:', cookieCompanyId)
        } else {
          console.log('❌ No company_id cookie found on this domain')
        }
      }

      // ✅ STEP 5: Read token
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
// ✅ STEP 6: Fetch profile
try {
  console.log('📡 Fetching profile...')
  const res = await api.get('/profile')
  this.user = res.data
  console.log('✅ Profile loaded')

  const activeCompanyId = res.data?.data?.active_company_id
  const existingCompanyId = localStorage.getItem('company_id')

  console.log('🏢 active_company_id from profile:', activeCompanyId)
  console.log('📦 existing company_id in localStorage:', existingCompanyId)

  // ✅ On a company subdomain, NEVER let the profile overwrite company_id.
  // The correct company_id for this subdomain always comes from _cid in URL or the cookie.
  const currentHostname = window.location.hostname
  const isOnSubdomain = currentHostname.endsWith('.streamed.space') &&
    !['stagging', 'www'].includes(currentHostname.replace('.streamed.space', ''))

  if (isOnSubdomain) {
    // On subdomain: if we have a company_id (from URL or cookie), keep it. Never overwrite.
    if (!existingCompanyId && activeCompanyId) {
      // Only use profile's value as absolute last resort (nothing else set it)
      localStorage.setItem('company_id', activeCompanyId)
      this.company_id = activeCompanyId
      setCompanyIdCookie(activeCompanyId)
      console.log('✅ Subdomain: Company ID set from profile (last resort):', activeCompanyId)
    } else {
      console.log('⏭️ Subdomain: Keeping existing company_id:', existingCompanyId)
    }
  } else {
    // On main domain: profile's active_company_id is source of truth
    if (activeCompanyId && !existingCompanyId) {
      localStorage.setItem('company_id', activeCompanyId)
      this.company_id = activeCompanyId
      setCompanyIdCookie(activeCompanyId)
      console.log('✅ Main domain: Company ID saved from profile:', activeCompanyId)
    } else if (activeCompanyId && existingCompanyId && existingCompanyId !== activeCompanyId) {
      if (sessionStorage.getItem('forced_company_id') === 'true') {
        console.log('⏭️ Main domain: Keeping forced company_id from URL:', existingCompanyId)
      } else {
        localStorage.setItem('company_id', activeCompanyId)
        this.company_id = activeCompanyId
        setCompanyIdCookie(activeCompanyId)
        console.log('🔄 Main domain: Company ID updated from profile:', activeCompanyId)
      }
    } else {
      console.log('⏭️ Main domain: Keeping existing company_id:', existingCompanyId)
    }
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
      console.log('🚨 LOGOUT CALLED — stack trace:')
      console.trace()
      // localStorage.removeItem('company_id')
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