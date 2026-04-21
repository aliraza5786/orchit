// stores/auth.ts
import { defineStore } from 'pinia'
import api from '../libs/api'
// import { setAuthCookie } from '../utilities/auth'
function clearAuthCookie() {
  document.cookie = `auth_token=; domain=.streamed.space; path=/; max-age=0`
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
  
  console.log('=== BOOTSTRAP ===')
  console.log('encodedToken from URL:', encodedToken ? 'EXISTS' : 'NULL')
  console.log('raw search:', window.location.search)

  if (encodedToken) {
    try {
      const token = atob(encodedToken)
      console.log('decoded token:', token?.slice(0, 20))
      localStorage.setItem('token', token)
      console.log('saved to localStorage, verify:', localStorage.getItem('token')?.slice(0, 20))
    } catch(e) {
      console.log('decode failed:', e)
    } finally {
      // Clean URL AFTER saving
      urlParams.delete('_auth')
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
      window.history.replaceState({}, '', newUrl)
      console.log('URL cleaned')
    }
  }

  const localToken = localStorage.getItem('token')
  console.log('localToken after sync:', localToken ? 'EXISTS' : 'NULL')

  // ... rest of bootstrap
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1] ?? null

  const token = localToken ?? cookieToken

  if (!token) {
    this.initialized = true
    return
  }

  if (!localToken && cookieToken) {
    localStorage.setItem('token', cookieToken)
  }

  try {
    const res = await api.get('/profile')
    this.user = res.data
    this.userId = res?.data?.data?._id ?? null
    if (res?.data) {
      localStorage.setItem('user_id', res?.data?.data?._id)
    }
  } catch (e: any) {
    console.log('profile failed:', e?.response?.status)
    localStorage.removeItem('token')
    clearAuthCookie()
    this.user = null
  } finally {
    this.initialized = true
  }
},
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
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