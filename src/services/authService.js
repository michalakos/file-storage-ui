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

  // Add this method to your AuthService class
  async makeUnauthenticatedRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `Request failed: ${response.status}`
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

      return response.json()
    } catch (error) {
      console.error('Unauthenticated request error:', error)
      throw error
    }
  }

  async register(authRequest) {
    try {
      const jwtResponse = await this.makeUnauthenticatedRequest(
        `${this.baseURL}/api/auth/register`,
        {
          method: 'POST',
          body: JSON.stringify(authRequest),
        },
      )

      if (jwtResponse.token) {
        this.store.setToken(jwtResponse.token)
      }

      return jwtResponse
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  async login(authRequest) {
    try {
      const jwtResponse = await this.makeUnauthenticatedRequest(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          username: authRequest.username,
          password: authRequest.password,
        }),
      })

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

  isAdmin() {
    const token = this.getToken()
    if (!token) return false

    try {
      // Decode JWT payload (middle part of token)
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.role === 'admin'
    } catch (error) {
      console.error('Error decoding token:', error)
      return false
    }
  }

  // Get authorization header for API calls
  getAuthHeader() {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Logout user
  logout() {
    // Clear admin view mode preference
    sessionStorage.removeItem('adminViewMode')
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
