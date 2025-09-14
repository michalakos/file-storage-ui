// services/userApiService.js
import { getAuthService } from '@/services/authService' // adjust path as needed
import { UserDto } from '@/models/UserDto'

class UserApiService {
  constructor() {
    this.authService = getAuthService()
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    this.debug = import.meta.env.VITE_DEBUG === 'true'
  }

  /**
   * Get the authenticated user's account information
   * @returns {Promise<Object>} User account data
   */
  async getUserAccount() {
    try {
      if (this.debug) {
        console.log('Fetching user account data...')
      }

      const response = await this.authService.authenticatedFetch(
        `${this.baseURL}/api/users/account`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        let message = `User account fetch failed: ${response.status}`

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

      const userData = await response.json()
      const mappedUser = UserDto.fromApiResponse(userData)

      if (this.debug) {
        console.log('User account data:', mappedUser)
        console.log('User ID:', mappedUser.id)
        console.log('Username:', mappedUser.username)
        console.log('Email:', mappedUser.email)
      }

      return mappedUser
    } catch (error) {
      console.error('Failed to load user account:', error)
      throw error
    }
  }

  /**
   * Get the authenticated user's used storage
   * @returns {Promise<Object>} User storage used
   */
  async getUsedStorage() {
    try {
      if (this.debug) {
        console.log('Fetching user used storage...')
      }

      const response = await this.authService.authenticatedFetch(
        `${this.baseURL}/api/users/storage/used`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        let message = `User used storage fetch failed: ${response.status}`

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

      const data = await response.json()

      if (this.debug) {
        console.log('Used storage:', data)
      }

      return data
    } catch (error) {
      console.error('Failed to load user used storage:', error)
      throw error
    }
  }

  /**
   * Get the authenticated user's maximum allowed storage
   * @returns {Promise<Object>} User maximum allowed storage
   */
  async getMaximumStorage() {
    try {
      if (this.debug) {
        console.log('Fetching user maximum storage...')
      }

      const response = await this.authService.authenticatedFetch(
        `${this.baseURL}/api/users/storage/user-max`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        let message = `User max storage fetch failed: ${response.status}`

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

      const data = await response.json()

      if (this.debug) {
        console.log('Max storage:', data)
      }

      return data
    } catch (error) {
      console.error('Failed to load user max storage:', error)
      throw error
    }
  }

  /**
   * Search for users by keyword
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} Array of matching users
   */
  async searchUsers(keyword) {
    try {
      if (this.debug) {
        console.log('Searching users with keyword:', keyword)
      }

      const url = new URL(`${this.baseURL}/api/users`)
      url.searchParams.append('keyword', keyword)

      const response = await this.authService.authenticatedFetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `User search failed: ${response.status}`

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

      const users = await response.json()

      if (this.debug) {
        console.log('User search results:', users)
      }

      return users
    } catch (error) {
      console.error('Failed to search users:', error)
      throw error
    }
  }

  /**
   * Search for users by keyword with pagination
   * @param {number} page - Page number (0-based)
   * @param {number} size - Number of items per page
   * @param {string} keyword - Search keyword for username/email
   * @returns {Promise<Object>} Paginated search results
   */
  async searchUsersPaginated(page = 0, size = 5, keyword = '') {
    try {
      if (this.debug) {
        console.log(`Searching users - page: ${page}, size: ${size}, keyword: ${keyword}`)
      }

      const url = new URL(`${this.baseURL}/api/admin/users/search-paginated`)
      url.searchParams.append('page', page.toString())
      url.searchParams.append('size', size.toString())
      url.searchParams.append('keyword', keyword)

      const response = await this.authService.authenticatedFetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `User search failed: ${response.status}`

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

      const data = await response.json()

      if (this.debug) {
        console.log('User search response:', data)
      }

      return data
    } catch (error) {
      console.error('Failed to search users:', error)
      throw error
    }
  }

  /**
   * Get the total number of users stored in the system.
   *
   * @returns {Promise<Object>} number of users
   */
  async getTotalUsers() {
    try {
      if (this.debug) {
        console.log('Fetching total number of users...')
      }

      const response = await this.authService.authenticatedFetch(
        `${this.baseURL}/api/admin/users/count`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        let message = `Total number of users fetch failed: ${response.status}`

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

      const data = await response.json()

      if (this.debug) {
        console.log('Total number of users:', data)
      }

      return data
    } catch (error) {
      console.error('Failed to load total number of users:', error)
      throw error
    }
  }

  /**
   * Delete a user by ID
   * @param {string} userId - The UUID of the user
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      if (this.debug) {
        console.log('Deleting user:', userId)
      }

      const url = `${this.baseURL}/api/admin/users/${userId}`

      const response = await this.authService.authenticatedFetch(url, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `Deletion failed: ${response.status}`

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

      if (this.debug) {
        console.log('User deleted successfully:', userId)
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  }

  /**
   * Ban a user by ID
   * @param {string} userId - The UUID of the user
   * @returns {Promise<void>}
   */
  async banUser(userId) {
    try {
      if (this.debug) {
        console.log('Banning user:', userId)
      }

      const url = `${this.baseURL}/api/admin/ban/${userId}`

      const response = await this.authService.authenticatedFetch(url, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `Ban failed: ${response.status}`

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

      if (this.debug) {
        console.log('User banned successfully:', userId)
      }
    } catch (error) {
      console.error('Failed to ban user:', error)
      throw error
    }
  }

  /**
   * Unban a user by ID
   * @param {string} userId - The UUID of the user
   * @returns {Promise<void>}
   */
  async unbanUser(userId) {
    try {
      if (this.debug) {
        console.log('Unbanning user:', userId)
      }

      const url = `${this.baseURL}/api/admin/unban/${userId}`

      const response = await this.authService.authenticatedFetch(url, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `Unban failed: ${response.status}`

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

      if (this.debug) {
        console.log('User unbanned successfully:', userId)
      }
    } catch (error) {
      console.error('Failed to unban user:', error)
      throw error
    }
  }

  /**
   * Change the role of a user by ID
   * @param {string} userId - The UUID of the user
   * @returns {Promise<void>}
   */
  async changeRole(userId) {
    try {
      if (this.debug) {
        console.log('Changing role for user:', userId)
      }

      const url = `${this.baseURL}/api/admin/role/${userId}`

      const response = await this.authService.authenticatedFetch(url, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `Role change failed: ${response.status}`

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

      if (this.debug) {
        console.log('User role changed successfully:', userId)
      }
    } catch (error) {
      console.error('Failed to change role for user:', error)
      throw error
    }
  }
}

// Create a singleton instance
let userApiServiceInstance = null

export function getUserApiService() {
  if (!userApiServiceInstance) {
    userApiServiceInstance = new UserApiService()
  }
  return userApiServiceInstance
}

export default UserApiService
