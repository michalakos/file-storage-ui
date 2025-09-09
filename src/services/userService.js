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
}

//   /**
//    * Update user profile information
//    * @param {Object} userData - Updated user data
//    * @returns {Promise<Object>} Updated user data
//    */
//   async updateUserProfile(userData) {
//     try {
//       if (this.debug) {
//         console.log('Updating user profile:', userData)
//       }

//       const response = await this.authService.authenticatedFetch(
//         `${this.baseURL}/api/users/profile`,
//         {
//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(userData),
//         },
//       )

//       if (!response.ok) {
//         const errorText = await response.text()
//         let message = `Profile update failed: ${response.status}`

//         try {
//           const json = JSON.parse(errorText)
//           message = json.message || message
//         } catch {
//           message = errorText || message
//         }

//         const error = new Error(message)
//         error.status = response.status
//         throw error
//       }

//       const updatedData = await response.json()

//       if (this.debug) {
//         console.log('Profile updated successfully:', updatedData)
//       }

//       return updatedData
//     } catch (error) {
//       console.error('Failed to update user profile:', error)
//       throw error
//     }
//   }

// Create a singleton instance
let userApiServiceInstance = null

export function getUserApiService() {
  if (!userApiServiceInstance) {
    userApiServiceInstance = new UserApiService()
  }
  return userApiServiceInstance
}

export default UserApiService
