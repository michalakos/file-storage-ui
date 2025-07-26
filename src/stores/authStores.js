// src/stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
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
})
