<template>
  <div class="admin-dashboard dashboard-container">
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="app-title">File Storage - Admin Panel</h1>
        <div class="user-info">
          <span class="admin-badge">Admin</span>
          <span class="welcome-text">Welcome, {{ username }}!</span>
          <button @click="handleLogout" class="btn btn-secondary">Logout</button>
        </div>
      </div>
    </header>

    <main class="dashboard-main">
      <section class="stats-overview">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <h3>{{ totalUsers }}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📁</div>
            <div class="stat-content">
              <h3>{{ totalFiles }}</h3>
              <p>Total Files</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">💾</div>
            <div class="stat-content">
              <h3>{{ totalStorage }}</h3>
              <p>Storage Used</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-content">
              <h3>{{ activeUsers }}</h3>
              <p>Active Today</p>
            </div>
          </div>
        </div>
      </section>

      <section class="admin-actions">
        <h2>Admin Actions</h2>
        <div class="action-grid">
          <div class="action-card" @click="manageUsers">
            <div class="action-icon">👤</div>
            <h3>Manage Users</h3>
            <p>View, edit, and manage user accounts</p>
          </div>

          <div class="action-card" @click="viewSystemLogs">
            <div class="action-icon">📊</div>
            <h3>System Logs</h3>
            <p>Monitor system activity and logs</p>
          </div>

          <div class="action-card" @click="manageStorage">
            <div class="action-icon">🗄️</div>
            <h3>Storage Management</h3>
            <p>Monitor and manage storage usage</p>
          </div>

          <div class="action-card" @click="systemSettings">
            <div class="action-icon">⚙️</div>
            <h3>System Settings</h3>
            <p>Configure system preferences</p>
          </div>
        </div>
      </section>

      <section class="recent-activity">
        <div class="section-header">
          <h2>Recent Activity</h2>
          <button class="btn btn-outline">View All Logs</button>
        </div>

        <div class="activity-list">
          <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
            <div class="activity-icon" :class="activity.type">
              {{ getActivityIcon(activity.type) }}
            </div>
            <div class="activity-content">
              <h4>{{ activity.title }}</h4>
              <p class="activity-desc">{{ activity.description }}</p>
              <p class="activity-time">{{ activity.timestamp }}</p>
            </div>
            <div class="activity-status">
              <span class="status-badge" :class="activity.status">
                {{ activity.status }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="user-management">
        <div class="section-header">
          <h2>User Management</h2>
          <button class="btn btn-primary" @click="addNewUser">Add New User</button>
        </div>

        <div class="users-table">
          <div class="table-header">
            <div class="header-cell">User</div>
            <div class="header-cell">Role</div>
            <div class="header-cell">Storage Used</div>
            <div class="header-cell">Last Active</div>
            <div class="header-cell">Actions</div>
          </div>

          <div v-for="user in recentUsers" :key="user.id" class="table-row">
            <div class="table-cell">
              <div class="user-info">
                <div class="user-avatar">{{ user.name.charAt(0) }}</div>
                <div>
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </div>
              </div>
            </div>
            <div class="table-cell">
              <span class="role-badge" :class="user.role">{{ user.role }}</span>
            </div>
            <div class="table-cell">{{ user.storageUsed }}</div>
            <div class="table-cell">{{ user.lastActive }}</div>
            <div class="table-cell">
              <button class="action-btn" @click="editUser(user)" title="Edit">✏️</button>
              <button class="action-btn" @click="suspendUser(user)" title="Suspend">⏸️</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { getAuthService } from '@/services/authService'

export default {
  name: 'AdminDashboard',
  data() {
    return {
      username: 'Admin',
      totalUsers: '1,248',
      totalFiles: '15,692',
      totalStorage: '245 GB',
      activeUsers: '89',
      recentActivity: [
        {
          id: 1,
          type: 'user',
          title: 'New user registered',
          description: 'john.doe@example.com created an account',
          timestamp: '5 minutes ago',
          status: 'success',
        },
        {
          id: 2,
          type: 'system',
          title: 'Storage threshold reached',
          description: 'Server storage is at 85% capacity',
          timestamp: '1 hour ago',
          status: 'warning',
        },
        {
          id: 3,
          type: 'security',
          title: 'Failed login attempts',
          description: 'Multiple failed login attempts detected',
          timestamp: '2 hours ago',
          status: 'error',
        },
      ],
      recentUsers: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'user',
          storageUsed: '2.1 GB',
          lastActive: '2 hours ago',
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          role: 'admin',
          storageUsed: '5.8 GB',
          lastActive: '1 day ago',
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike.j@example.com',
          role: 'user',
          storageUsed: '1.2 GB',
          lastActive: '3 days ago',
        },
      ],
    }
  },

  async mounted() {
    const authService = getAuthService()

    if (!authService.isAuthenticated()) {
      this.$router.push('/')
      return
    }

    // Load admin data
    await this.loadAdminData()
  },

  methods: {
    async loadAdminData() {
      try {
        console.log('load admin data')
        // const authService = getAuthService()
        // Make authenticated API calls to get admin data
        // const response = await authService.authenticatedFetch(`${authService.baseURL}/api/admin/dashboard`)
        // Update component data with real data from API
      } catch (error) {
        console.error('Failed to load admin data:', error)
      }
    },

    getActivityIcon(type) {
      const icons = {
        user: '👤',
        system: '⚙️',
        security: '🔒',
        file: '📁',
      }
      return icons[type] || '📋'
    },

    manageUsers() {
      this.$router.push('/admin/users')
    },

    viewSystemLogs() {
      this.$router.push('/admin/logs')
    },

    manageStorage() {
      this.$router.push('/admin/storage')
    },

    systemSettings() {
      this.$router.push('/admin/settings')
    },

    addNewUser() {
      console.log('Add new user clicked')
    },

    editUser(user) {
      console.log('Edit user:', user.name)
    },

    suspendUser(user) {
      console.log('Suspend user:', user.name)
    },

    handleLogout() {
      const authService = getAuthService()
      authService.logout()
      this.$router.push('/')
    },
  },
}
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
}

.stat-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.stat-content p {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0.25rem 0 0 0;
}

.activity-list {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.25rem;
}

.activity-icon.user {
  background-color: #e0f2fe;
}

.activity-icon.system {
  background-color: #f3e8ff;
}

.activity-icon.security {
  background-color: #fee2e2;
}

.activity-content {
  flex: 1;
}

.activity-content h4 {
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.activity-desc {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0 0 0.25rem 0;
}

.activity-time {
  color: #94a3b8;
  font-size: 0.75rem;
  margin: 0;
}

.activity-status {
  margin-left: 1rem;
}

.users-table {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    text-align: center;
    flex-direction: column;
  }

  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .activity-icon {
    margin-right: 0;
  }

  .activity-status {
    margin-left: 0;
  }
}
</style>
