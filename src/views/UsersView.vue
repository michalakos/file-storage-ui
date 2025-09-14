<template>
  <div class="users-container">
    <header class="users-header">
      <div class="header-content">
        <h1 class="page-title-button" @click="goToDashboard">My Users</h1>
        <div class="search-section">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users by username or email..."
            class="search-input"
            @input="handleSearchInput"
          />
        </div>
      </div>
    </header>

    <main class="users-main">
      <div v-if="loading && users.length === 0" class="loading-state">
        <p>Loading users...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadUsers" class="btn btn-outline">Try Again</button>
      </div>

      <div v-else class="users-content">
        <div v-if="users.length === 0" class="empty-state">
          <div class="empty-icon">🫥</div>
          <h3>No users yet</h3>
        </div>

        <div v-else>
          <div class="users-grid">
            <div v-for="user in users" :key="user.id" class="user-item">
              <div class="user-icon">👤</div>
              <div class="user-info">
                <h4>{{ user.username }}</h4>
                <p class="user-data">{{ user.username }} • {{ user.email }}</p>
              </div>
              <div class="user-actions">
                <button class="action-btn" @click="banUser(user)" title="Ban">🚫</button>
                <button class="action-btn" @click="unbanUser(user)" title="Unban">✅</button>
                <button class="action-btn" @click="changeRole(user)" title="Change Role">🔄</button>
                <button class="action-btn" @click="deleteUser(user)" title="Delete">🗑️</button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              @click="goToPage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage <= 1"
              class="pagination-btn"
            >
              ← Previous
            </button>

            <div class="pagination-info">
              Page {{ pagination.currentPage }} of {{ pagination.totalPages }} ({{
                pagination.totalElements
              }}
              total users)
            </div>

            <button
              @click="goToPage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage >= pagination.totalPages"
              class="pagination-btn"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { getAuthService } from '@/services/authService'
import { getUserApiService } from '@/services/userService'
import { UserDto } from '@/models/UserDto'

export default {
  name: 'UsersView',
  data() {
    return {
      users: [],
      searchQuery: '',
      searchTimeout: null,
      loading: false,
      error: null,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalElements: 0,
        size: 8,
      },
    }
  },
  async mounted() {
    const authService = getAuthService()

    if (!authService.isAuthenticated()) {
      this.$router.push('/')
      return
    }

    await this.loadUsers()
  },

  methods: {
    async loadUsers(page = 0, keyword = '') {
      try {
        this.loading = true
        this.error = null

        const userService = getUserApiService()
        let response

        response = await userService.searchUsersPaginated(page, this.pagination.size, keyword)

        // Map the raw API response to FileMetadata objects
        this.users = response.content.map((userData) => UserDto.fromApiResponse(userData))
        if (this.users.length == 0 && page != 0) {
          this.loadUsers(page - 1, keyword)
          return
        }

        this.pagination = {
          currentPage: response.number + 1,
          totalPages: response.totalPages,
          totalElements: response.totalElements,
          size: response.size,
        }

        console.log('Users loaded successfully:', this.users)
        console.log('Pagination info:', this.pagination)
      } catch (error) {
        console.error('Failed to load users:', error)
        this.error = error.message || 'Failed to load users'
      } finally {
        this.loading = false
      }
    },

    handleSearchInput() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }

      this.searchTimeout = setTimeout(() => {
        this.performSearch()
      }, 300)
    },

    async performSearch() {
      await this.loadUsers(0, this.searchQuery.trim())
    },

    async banUser(user) {
      console.log('banning user', user)
    },

    async unbanUser(user) {
      console.log('unbanning user', user)
    },

    async changeRole(user) {
      console.log('changing role for user', user)
    },

    async deleteUser(user) {
      console.log('deleting user', user)
    },

    async goToPage(page) {
      const actualPage = page - 1
      if (actualPage < 0 || actualPage > this.pagination.totalPages - 1) {
        return
      }
      await this.loadUsers(actualPage, this.searchQuery.trim())
    },

    goToDashboard() {
      this.$router.push('/dashboard')
    },
  },
}
</script>

<style scoped>
.clickable {
  cursor: pointer;
}

.clickable:hover {
  opacity: 0.8;
}

.users-container {
  min-height: 100vh;
  background-color: #f8fafc;
}

.users-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title-button {
  font-size: 1.875rem;
  font-weight: 700;
  color: white;
  margin: 0;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.page-title-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, #2563eb, #1e40af);
}

.search-section {
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.users-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #64748b;
  margin: 0 0 2rem 0;
}

.users-grid {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  margin-bottom: 2rem;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.user-item:hover {
  background-color: #f8fafc;
}

.user-item:last-child {
  border-bottom: none;
}

.user-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.user-info {
  flex: 1;
}

.user-info h4 {
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.user-data {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 1rem;
  transition: background-color 0.2s ease;
}

.action-btn:hover {
  background-color: #f1f5f9;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: #64748b;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-outline {
  background-color: white;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.btn-outline:hover {
  background-color: #eff6ff;
}
</style>
