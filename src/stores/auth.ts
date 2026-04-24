// stores/auth.ts
import { defineStore } from 'pinia'
import api from '../libs/api'

function clearAuthCookie() {
  document.cookie = `auth_token=; domain=.streamed.space; path=/; max-age=0`
  document.cookie = `auth_token=; path=/; max-age=0`
}

const COMPANY_ID_KEY = 'company_id'
const FORCED_COMPANY_ID_KEY = 'forced_company_id'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    initialized: false,
    userId: localStorage.getItem('user_id') as string | null,
    company_id: (
      document.cookie.split('; ').find(r => r.startsWith('company_id='))?.split('=')[1]
    ) ?? localStorage.getItem(COMPANY_ID_KEY) as string | null,
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
if (encodedCompanyId) {
  sessionStorage.setItem(FORCED_COMPANY_ID_KEY, 'true')
}
      // ✅ STEP 2: Save token from URL
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

      // ✅ STEP 3: Save company_id from URL — HIGHEST PRIORITY
      if (encodedCompanyId) {
        let companyId = encodedCompanyId
        try {
          companyId = atob(cleanBase64(encodedCompanyId))
          console.log('✅ Company ID decoded from _cid:', companyId)
        } catch (e) {
          console.warn('⚠️ Company ID decode failed, using raw value:', encodedCompanyId)
        }

        localStorage.setItem(COMPANY_ID_KEY, companyId)
        this.company_id = companyId
        setCompanyIdCookie(companyId)
        console.log('✅ Company ID saved from _cid:', companyId)
      }

      // ✅ STEP 4: Clean URL
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? '?' + urlParams.toString() : '')
      window.history.replaceState({}, '', newUrl)

      // ✅ STEP 5: Only sync cookie → localStorage if _cid was NOT in URL
      if (!encodedCompanyId) {
        const cookieCompanyId = getCookie(COMPANY_ID_KEY)
        const localCompanyId = localStorage.getItem(COMPANY_ID_KEY)

        console.log('🍪 cookie company_id:', cookieCompanyId)
        console.log('📦 localStorage company_id:', localCompanyId)

        if (cookieCompanyId && cookieCompanyId !== localCompanyId) {
          localStorage.setItem(COMPANY_ID_KEY, cookieCompanyId)
          this.company_id = cookieCompanyId
          console.log('🔄 Synced company_id from cookie → localStorage:', cookieCompanyId)
        } else if (localCompanyId) {
          this.company_id = localCompanyId
          console.log('✅ Using existing localStorage company_id:', localCompanyId)
        }
      }

      // ✅ STEP 6: Read token
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

      // ✅ STEP 7: Fetch profile
      try {
        console.log('📡 Fetching profile...')
        const res = await api.get('/profile')
        this.user = res.data
        console.log('✅ Profile loaded')

        const activeCompanyId = res.data?.data?.active_company_id
        const existingCompanyId = localStorage.getItem(COMPANY_ID_KEY)
        const wasForced = sessionStorage.getItem(FORCED_COMPANY_ID_KEY) === 'true'

        console.log('🏢 active_company_id from profile:', activeCompanyId)
        console.log('📦 existing company_id in localStorage:', existingCompanyId)
        console.log('🔒 forced_company_id from URL:', wasForced)

        const currentHostname = window.location.hostname
        const isOnSubdomain = currentHostname.endsWith('.streamed.space') &&
          !['stagging', 'www'].includes(currentHostname.replace('.streamed.space', ''))

        if (isOnSubdomain) {
          // ✅ On subdomain: NEVER overwrite company_id if it was forced from URL
          if (wasForced && existingCompanyId) {
            console.log('🔒 Subdomain: Keeping forced company_id from URL:', existingCompanyId)
            // Ensure it's set in state
            this.company_id = existingCompanyId
          } else if (!existingCompanyId && activeCompanyId) {
            localStorage.setItem(COMPANY_ID_KEY, activeCompanyId)
            this.company_id = activeCompanyId
            setCompanyIdCookie(activeCompanyId)
            console.log('✅ Subdomain: Company ID set from profile (last resort):', activeCompanyId)
          }
        } else {
          // On main domain: respect profile's active_company_id but don't overwrite if forced
          if (wasForced && existingCompanyId) {
            console.log('⏭️ Main domain: Keeping forced company_id:', existingCompanyId)
          } else if (activeCompanyId) {
            if (existingCompanyId && existingCompanyId !== activeCompanyId) {
              console.log('🔄 Main domain: Updating company_id from profile:', activeCompanyId)
            }
            localStorage.setItem(COMPANY_ID_KEY, activeCompanyId)
            this.company_id = activeCompanyId
            setCompanyIdCookie(activeCompanyId)
          }
        }

        // ✅ Clear the forced flag after profile load to allow future updates
        sessionStorage.removeItem(FORCED_COMPANY_ID_KEY)

      } catch (e) {
        console.log('⚠️ Profile fetch failed:', (e as any)?.response?.status)
      } finally {
        this.initialized = true
      }
    },

    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      // ✅ IMPORTANT: Do NOT remove company_id on logout
      // The user may still need it for subdomain context
      console.log('🚨 LOGOUT CALLED — stack trace:')
      console.trace()
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