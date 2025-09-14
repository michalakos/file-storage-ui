import { getAuthService } from '@/services/authService'
import BaseApiService from '@/services/baseApiService'

class AdminApiService extends BaseApiService {
  constructor() {
    super()
    this.setAuthService(getAuthService())
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

  async getTotalFiles() {
    return this.makeRequest('/api/admin/files/count', { method: 'GET' })
  }

  async getTotalStorage() {
    return this.makeRequest('/api/admin/storage', { method: 'GET' })
  }

  async getLogs(lines = 10) {
    return this.makeRequest(`/api/admin/logs/${lines}`, { method: 'GET' })
  }
}

// Create a singleton instance
let adminApiServiceInstance = null

export function getAdminApiService() {
  if (!adminApiServiceInstance) {
    adminApiServiceInstance = new AdminApiService()
  }
  return adminApiServiceInstance
}

export default AdminApiService
