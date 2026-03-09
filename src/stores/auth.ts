// stores/auth.ts
import { defineStore } from 'pinia'
import api from '../libs/api'

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
      const token = localStorage.getItem('token')
      if (!token) {
        this.initialized = true
        return
      }

      try {
        const res = await api.get('/profile')
        this.user = res.data;
        this.userId = res?.data?.data?._id ?? null
        if (res?.data) {
          localStorage.setItem('user_id', res?.data?.data?._id)
        }
      } catch {
        localStorage.removeItem('token')
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      this.user = null;
      localStorage.removeItem('currentName')
      localStorage.removeItem('jobId')
      localStorage.removeItem('mannualWorkspace')
      localStorage.removeItem('selectedAgentModule')
      localStorage.removeItem('selectedModuleId')
      localStorage.removeItem('sprintType')
      localStorage.removeItem('activeMilestoneId')
      localStorage.removeItem('activeSprintId')
      localStorage.removeItem('showActiveSprint')
    },
  },
})
