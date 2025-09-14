<template>
  <div class="admin-dashboard dashboard-container">
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="app-title">File Storage - Admin Panel</h1>
        <div class="user-info">
          <span class="admin-badge">Admin</span>
          <span class="welcome-text">Welcome, {{ this.userData?.username ?? 'admin' }}!</span>
          <button @click="goToUserDashboard" class="btn btn-primary">User View</button>
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
        </div>
      </section>

      <section class="recent-activity">
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
    </main>
  </div>
</template>

<script>
import { getAuthService } from '@/services/authService'
import { getAdminApiService } from '@/services/adminService'
import { getUserApiService } from '@/services/userService'

export default {
  name: 'AdminDashboard',
  data() {
    return {
      userData: null,
      totalUsers: 0,
      totalFiles: 0,
      totalStorage: '0 GB',
      recentActivity: [],
      refreshInterval: null,
    }
  },

  async mounted() {
    const authService = getAuthService()

    if (!authService.isAuthenticated()) {
      this.$router.push('/')
      return
    }

    // Load admin data
    this.startAutoRefresh()
    await this.loadAdminData()
    await this.getTotalFiles()
    await this.getTotalUsers()
    await this.getTotalStorage()
    await this.getLogs()
  },

  beforeUnmount() {
    this.stopAutoRefresh()
  },

  methods: {
    async loadAdminData() {
      try {
        this.loading = true
        this.error = null

        const userApiService = getUserApiService()
        this.userData = await userApiService.getUserAccount()

        console.log('User data loaded successfully:', this.userData)
      } catch (error) {
        console.error('Failed to load user data:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async getTotalFiles() {
      console.log('Fetching total number of files')
      try {
        this.loading = true
        this.error = null

        const adminService = getAdminApiService()
        this.totalFiles = await adminService.getTotalFiles()

        console.log('Total number of files loaded successfully:', this.totalFiles)
      } catch (error) {
        console.error('Failed to load total number of files:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async getTotalUsers() {
      console.log('Fetching total number of users')
      try {
        this.loading = true
        this.error = null

        const adminApiService = getAdminApiService()
        this.totalUsers = await adminApiService.getTotalUsers()

        console.log('Total number of users loaded successfully:', this.totalUsers)
      } catch (error) {
        console.error('Failed to load total number of users:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async getTotalStorage() {
      console.log('Fetching total used storage')
      try {
        this.loading = true
        this.error = null

        const adminService = getAdminApiService()
        const usedStorage = await adminService.getTotalStorage()
        this.totalStorage = this.formatFileSize(usedStorage)

        console.log('Total used storage loaded successfully:', this.totalStorage)
      } catch (error) {
        console.error('Failed to load total used storage:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async getLogs(lines = 3) {
      console.log('Fetching system logs')
      try {
        this.loading = true
        this.error = null
        const adminService = getAdminApiService()
        const logs = await adminService.getLogs(lines)
        this.recentActivity = this.parseLogsToActivity(logs)
        console.log('System logs loaded successfully:', this.recentActivity)
      } catch (error) {
        console.error('Failed to load system logs:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    parseLogsToActivity(logString) {
      const lines = logString.split('\n').filter((line) => line.trim())
      const logEntries = []
      let currentLog = null

      for (let i = 0; i < lines.length && logEntries.length < 3; i++) {
        const line = lines[i]
        const logMatch = line.match(
          /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[([^\]]+)\] (\w+)\s+(.+?) - (.+)$/,
        )

        if (logMatch) {
          // Start of new log entry
          if (currentLog) {
            logEntries.push(this.createActivityFromLog(currentLog))
          }

          const [, timestamp, , level, className, message] = logMatch
          currentLog = {
            timestamp,
            level,
            className,
            message: message.trim(),
          }
        } else if (currentLog && line.trim()) {
          // Continuation of previous log entry
          currentLog.message += ' ' + line.trim()
        }
      }

      // Don't forget the last log entry
      if (currentLog && logEntries.length < 3) {
        logEntries.push(this.createActivityFromLog(currentLog))
      }

      return logEntries
    },

    createActivityFromLog(log) {
      const logLevel = log.level.toLowerCase()
      return {
        id: Date.now() + Math.random(),
        type: this.mapLogLevelToType(logLevel),
        title: `${log.level} - ${this.getShortClassName(log.className)}`,
        description: this.truncateMessage(log.message),
        timestamp: this.formatTimestamp(log.timestamp),
        status: this.mapLogLevelToStatus(logLevel),
      }
    },

    getShortClassName(className) {
      if (className.includes('.')) {
        return className.split('.').pop()
      }
      return className
    },

    truncateMessage(message) {
      if (message.length > 100) {
        return message.substring(0, 100) + '...'
      }
      return message
    },

    mapLogLevelToType(level) {
      const mapping = {
        error: 'error',
        warn: 'warning',
        info: 'info',
        debug: 'debug',
        trace: 'debug',
      }
      return mapping[level] || 'info'
    },

    mapLogLevelToStatus(level) {
      const mapping = {
        error: 'error',
        warn: 'warning',
        info: 'success',
        debug: 'info',
        trace: 'info',
      }
      return mapping[level] || 'info'
    },

    formatTimestamp(timestamp) {
      const logTime = new Date(timestamp)
      const now = new Date()
      const diffMs = now - logTime
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMins / 60)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} minutes ago`
      if (diffHours < 24) return `${diffHours} hours ago`
      return logTime.toLocaleDateString()
    },

    getActivityIcon(type) {
      const icons = {
        error: '🚨',
        warning: '⚠️',
        info: 'ℹ️',
        debug: '🔍',
      }
      return icons[type] || '📋'
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'

      const k = 1000
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    startAutoRefresh() {
      this.refreshInterval = setInterval(() => {
        this.getLogs(3)
      }, 5000)
    },

    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
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

    goToUserDashboard() {
      this.$emit('switchToUser')
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
