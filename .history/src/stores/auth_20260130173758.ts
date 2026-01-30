// stores/auth.ts
import { defineStore } from 'pinia'
import api from '../libs/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    initialized: false,
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
        this.user = res.data
      } catch {
        localStorage.removeItem('token')
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    logout() {
      localStorage.removeItem('token')
      this.user = null;
      localStorage.removeItem('currentName')
      localStorage.removeItem('jobId')
      localStorage.removeItem('mannualWorkspace')
    },
  },
})
