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
      // Save theme before clearing
      const savedTheme = localStorage.getItem('theme')
      
      // Clear all localStorage
      localStorage.clear() // or remove specific keys
      
      // Restore theme
      if (savedTheme) {
        localStorage.setItem('theme', savedTheme)
      }
      
      this.user = null
    },
  },
})