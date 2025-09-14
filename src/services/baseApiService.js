class BaseApiService {
  constructor() {
    this.authService = null // Will be injected
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    this.debug = import.meta.env.VITE_DEBUG === 'true'
  }

  setAuthService(authService) {
    this.authService = authService
  }

  buildUrl(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value.toString())
      }
    })
    return url.toString()
  }

  async handleResponse(response) {
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

    // Handle different response types
    const contentType = response.headers.get('content-type')

    if (response.status === 204) {
      return null
    }

    if (contentType?.includes('application/json')) {
      return response.json()
    }

    if (contentType?.includes('text/')) {
      return response.text()
    }

    return response.blob()
  }

  async makeRequest(endpoint, options = {}, params = {}) {
    try {
      const url = this.buildUrl(endpoint, params)

      if (this.debug) {
        console.log(`Making request to: ${url}`, options)
      }

      const response = await this.authService.authenticatedFetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const result = await this.handleResponse(response)

      if (this.debug) {
        console.log(`Response from ${endpoint}:`, result)
      }

      return result
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error)
      throw error
    }
  }
}

export default BaseApiService
