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
        `${this.baseURL}/api/user/account`,
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
//         `${this.baseURL}/api/user/profile`,
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
