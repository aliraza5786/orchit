// stores/auth.ts
import { defineStore } from 'pinia'
import api from '../libs/api'

function getTokenFromCookie(): string | null {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
  return match ? match.split('=')[1] : null
}

function clearAuthCookie() {
  const isProduction = import.meta.env.PROD
  const domain = isProduction ? '.orchit.ai' : 'localhost'
  document.cookie = `auth_token=; domain=${domain}; path=/; max-age=0`
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
      const token = localStorage.getItem('token') ?? getTokenFromCookie()
      if (!token) {
        this.initialized = true
        return
      }

      // If token came from cookie, sync it to localStorage
      if (!localStorage.getItem('token') && token) {
        localStorage.setItem('token', token)
      }

      try {
        const res = await api.get('/profile')
        this.user = res.data
        this.userId = res?.data?.data?._id ?? null
        if (res?.data) {
          localStorage.setItem('user_id', res?.data?.data?._id)
        }
      } catch {
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