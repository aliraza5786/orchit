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
  // Keys to preserve during logout
  const keysToPreserve = ['theme']
  
  // Save values
  const preserved: Record<string, string> = {}
  keysToPreserve.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) preserved[key] = value
  })
  
  // Clear everything
  localStorage.clear()
  
  // Restore preserved values
  Object.entries(preserved).forEach(([key, value]) => {
    localStorage.setItem(key, value)
  })
  
  this.user = null
}
  },
})
