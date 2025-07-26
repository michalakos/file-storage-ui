import { useAuthStore } from '@/stores/authStores'

// Authentication service for API calls
class AuthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    this.debug = import.meta.env.VITE_DEBUG === 'true'

    if (this.debug) {
      console.log('AuthService initialized with baseURL:', this.baseURL)
      console.log('Available env vars:', import.meta.env)
    }
  }

  get store() {
    return useAuthStore()
  }

  // Register new user
  async register(authRequest) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authRequest),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `Login failed: ${response.status}`
        try {
          const json = JSON.parse(errorText)
          message = json.message || message
        } catch {
          message = errorText || message
        }

        const error = new Error(message)
        error.status = response.status
        throw error
      }

      const jwtResponse = await response.json()

      // Store the JWT token
      if (jwtResponse.token) {
        this.store.setToken(jwtResponse.token)
      }

      return jwtResponse
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Login user
  async login(authRequest) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: authRequest.username,
          password: authRequest.password,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `Login failed: ${response.status}`
        try {
          const json = JSON.parse(errorText)
          message = json.message || message
        } catch {
          message = errorText || message
        }

        const error = new Error(message)
        error.status = response.status
        throw error
      }

      const jwtResponse = await response.json()

      // Store the JWT token
      if (jwtResponse.token) {
        this.store.setToken(jwtResponse.token)
      }

      return jwtResponse
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Get stored JWT token
  getToken() {
    return this.store.token
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.store.isAuthenticated
  }

  // Get authorization header for API calls
  getAuthHeader() {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Logout user
  logout() {
    this.store.removeToken()
  }

  // Make authenticated API calls
  async authenticatedFetch(url, options = {}) {
    const authHeaders = this.getAuthHeader()

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    })
  }
}

// Export singleton instance
export const getAuthService = () => new AuthService()
