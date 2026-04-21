// stores/auth.ts
import { defineStore } from 'pinia'
import api from '../libs/api'

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
    console.log("Called")
  const localToken = localStorage.getItem('token')
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1] ?? null

  console.log('bootstrap auth token:', { localToken, cookieToken })

  const token = localToken ?? cookieToken

  if (!token) {
    console.log('no token found, skipping bootstrap')
    this.initialized = true
    return
  }

  if (!localToken && cookieToken) {
    console.log('syncing cookie token to localStorage')
    localStorage.setItem('token', cookieToken)
  }

  try {
    const res = await api.get('/profile')
    console.log('profile success:', res.data)
    this.user = res.data
    this.userId = res?.data?.data?._id ?? null
    if (res?.data) {
      localStorage.setItem('user_id', res?.data?.data?._id)
    }
  } catch (e) {
    console.log('profile failed:', e)
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