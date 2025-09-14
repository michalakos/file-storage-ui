import { getAuthService } from '@/services/authService'
import { UserDto } from '@/models/UserDto'
import BaseApiService from '@/services/baseApiService'

class UserApiService extends BaseApiService {
  constructor() {
    super()
    this.setAuthService(getAuthService())
  }

  async getUserAccount() {
    const userData = await this.makeRequest('/api/users/account', { method: 'GET' })
    return UserDto.fromApiResponse(userData)
  }

  async getUsedStorage() {
    return this.makeRequest('/api/users/storage/used', { method: 'GET' })
  }

  async getMaximumStorage() {
    return this.makeRequest('/api/users/storage/user-max', { method: 'GET' })
  }

  async searchUsers(keyword) {
    return this.makeRequest('/api/users', { method: 'GET' }, { keyword })
  }

  async searchUsersPaginated(page = 0, size = 5, keyword = '') {
    return this.makeRequest(
      '/api/admin/users/search-paginated',
      { method: 'GET' },
      { page, size, keyword },
    )
  }

  async getTotalUsers() {
    return this.makeRequest('/api/admin/users/count', { method: 'GET' })
  }

  async deleteUser(userId) {
    return this.makeRequest(`/api/admin/users/${userId}`, { method: 'DELETE' })
  }

  async banUser(userId) {
    return this.makeRequest(`/api/admin/ban/${userId}`, { method: 'POST' })
  }

  async unbanUser(userId) {
    return this.makeRequest(`/api/admin/unban/${userId}`, { method: 'POST' })
  }

  async changeRole(userId) {
    return this.makeRequest(`/api/admin/role/${userId}`, { method: 'POST' })
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
