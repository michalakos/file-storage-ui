<template>
  <div class="users-container container">
    <header class="header users-header">
      <div class="header-content">
        <h1 class="page-title-button" @click="goToDashboard">SafeStash</h1>
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
            <div v-for="user in sortedUsers" :key="user.id" class="user-item">
              <div class="user-icon">👤</div>
              <div class="user-info">
                <h4>
                  {{ user.username }}
                  <span v-if="user.banned" class="banned-badge">BANNED</span>
                  <span v-if="user.isAdmin" class="admin-badge">ADMIN</span>
                  <span v-if="isCurrentUser(user)" class="current-user-badge">YOU</span>
                </h4>
                <p class="user-data">{{ user.username }} • {{ user.email }}</p>
              </div>
              <div class="user-actions" v-if="!isCurrentUser(user)">
                <button
                  class="action-btn"
                  @click="banUser(user)"
                  :disabled="user.banned"
                  :class="{ disabled: user.banned }"
                  title="Ban"
                >
                  🚫
                </button>
                <button
                  class="action-btn"
                  @click="unbanUser(user)"
                  :disabled="!user.banned"
                  :class="{ disabled: !user.banned }"
                  title="Unban"
                >
                  ✅
                </button>
                <button class="action-btn" @click="changeRole(user)" title="Change Role">🔄</button>
                <button class="action-btn delete-btn" @click="deleteUser(user)" title="Delete">
                  🗑️
                </button>
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
import { getAdminApiService } from '@/services/adminService'
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

  computed: {
    sortedUsers() {
      const authService = getAuthService()
      const currentToken = authService.getToken()
      let currentUserId = null

      if (currentToken) {
        try {
          const payload = JSON.parse(atob(currentToken.split('.')[1]))
          currentUserId = payload.userId || payload.sub // Adjust based on your JWT structure
        } catch (error) {
          console.error('Error decoding token:', error)
        }
      }

      return [...this.users].sort((a, b) => {
        const aIsCurrent = a.id === currentUserId || a.username === currentUserId
        const bIsCurrent = b.id === currentUserId || b.username === currentUserId

        if (aIsCurrent && !bIsCurrent) return -1
        if (!aIsCurrent && bIsCurrent) return 1
        return 0
      })
    },
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

        const adminService = getAdminApiService()
        let response

        response = await adminService.searchUsersPaginated(page, this.pagination.size, keyword)

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

    isCurrentUser(user) {
      const authService = getAuthService()
      const currentToken = authService.getToken()
      if (currentToken) {
        try {
          const payload = JSON.parse(atob(currentToken.split('.')[1]))
          return payload.userId === user.id || payload.sub === user.username // Adjust based on your JWT structure
        } catch (error) {
          console.error('Error decoding token:', error)
          return false
        }
      }
      return false
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
      console.log('Ban user: ', user)
      try {
        const adminService = getAdminApiService()
        await adminService.banUser(user.id)
        await this.loadUsers()
      } catch (error) {
        console.error('Ban failed:', error)
      }
    },

    async unbanUser(user) {
      console.log('Unban user: ', user)
      try {
        const adminService = getAdminApiService()
        await adminService.unbanUser(user.id)
        await this.loadUsers()
      } catch (error) {
        console.error('Unban failed:', error)
      }
    },

    async changeRole(user) {
      console.log('Changing role of user: ', user)
      try {
        const adminService = getAdminApiService()
        await adminService.changeRole(user.id)
        await this.loadUsers()
      } catch (error) {
        console.error('Role change failed:', error)
      }
    },

    async deleteUser(user) {
      console.log('Delete user: ', user)
      try {
        const adminService = getAdminApiService()
        await adminService.deleteUser(user.id)
        await this.loadUsers()
      } catch (error) {
        console.error('Delete failed:', error)
      }
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
.users-container {
  min-height: 100vh;
  background-color: var(--color-cream-light);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-section {
  flex: 1;
  max-width: 400px;
  margin: 0 var(--space-xl);
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition:
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 165, 82, 0.1);
}

.header-actions {
  display: flex;
  gap: var(--space-md);
}

.users-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg);
}

.loading-state,
.error-state {
  text-align: center;
  padding: var(--space-3xl);
  color: var(--color-text-secondary);
}

.empty-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
}

.empty-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-md);
}

.empty-state h3 {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-xl) 0;
}

.users-grid {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
  overflow: hidden;
  margin-bottom: var(--space-xl);
}

.user-item {
  display: flex;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-gray-100);
  transition: background-color var(--transition-base);
}

.user-item:hover {
  background-color: var(--color-gray-50);
}

.user-item:last-child {
  border-bottom: none;
}

.user-icon {
  font-size: var(--text-xl);
  margin-right: var(--space-md);
}

.user-info {
  flex: 1;
}

.user-info h4 {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.user-data {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.user-actions {
  display: flex;
  gap: var(--space-sm);
}

.action-btn:disabled,
.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.action-btn:disabled:hover,
.action-btn.disabled:hover {
  transform: none;
  background: inherit;
}

.admin-badge {
  background: var(--color-brown);
  color: var(--color-white);
  font-size: 0.6em;
  padding: 0.2em 0.5em;
  border-radius: var(--radius-lg);
  font-weight: bold;
  margin-left: 0.5em;
}

.banned-badge {
  background: var(--color-error);
  color: var(--color-white);
  font-size: 0.6em;
  padding: 0.2em 0.5em;
  border-radius: var(--radius-lg);
  font-weight: bold;
}

.current-user-badge {
  background: var(--color-success);
  color: var(--color-white);
  font-size: 0.6em;
  padding: 0.2em 0.5em;
  border-radius: var(--radius-lg);
  font-weight: bold;
  margin-left: 0.5em;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: var(--color-white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
}

.pagination-btn {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-gray-200);
  background: var(--color-white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-base);
  font-size: var(--text-sm);
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--color-gray-50);
  border-color: var(--color-gray-300);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.btn {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-base);
  border: none;
  font-size: var(--text-sm);
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover {
  background-color: var(--color-brown);
}

.btn-outline {
  background-color: var(--color-white);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-outline:hover {
  background-color: var(--color-cream-light);
}
</style>
