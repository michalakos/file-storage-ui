import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  }),

  getters: {
    isAuthenticated: (state) => {
      if (!state.token) return false

      try {
        const payload = JSON.parse(atob(state.token.split('.')[1]))
        const currentTime = Date.now() / 1000
        return payload.exp > currentTime
      } catch {
        return false
      }
    },
    getBaseURL: (state) => state.baseURL,
  },

  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('jwt_token', token)
    },

    loadToken() {
      const savedToken = localStorage.getItem('jwt_token')
      this.token = savedToken
    },

    removeToken() {
      this.token = null
      localStorage.removeItem('jwt_token')
    },
  },
  /**
   * Update the base URL (useful for environment switching)
   */
  setBaseURL(url) {
    this.baseURL = url
  },
})
