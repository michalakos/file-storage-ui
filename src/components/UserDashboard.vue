<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="app-title">File Storage</h1>
        <div class="user-info">
          <span class="welcome-text">Welcome back, {{ username }}!</span>
          <button @click="handleLogout" class="btn btn-secondary">Logout</button>
        </div>
      </div>
    </header>

    <main class="dashboard-main">
      <section class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-grid">
          <div class="action-card" @click="uploadFile">
            <div class="action-icon">📁</div>
            <h3>Upload Files</h3>
            <p>Upload documents, images, and other files</p>
          </div>

          <div class="action-card" @click="createFolder">
            <div class="action-icon">📂</div>
            <h3>Create Folder</h3>
            <p>Organize your files with folders</p>
          </div>

          <div class="action-card" @click="viewShared">
            <div class="action-icon">👥</div>
            <h3>Shared Files</h3>
            <p>Access files shared with you</p>
          </div>
        </div>
      </section>

      <section class="recent-files">
        <div class="section-header">
          <h2>Recent Files</h2>
          <button class="btn btn-outline">View All</button>
        </div>

        <div class="files-grid">
          <div v-for="file in recentFiles" :key="file.id" class="file-item">
            <div class="file-icon">📄</div>
            <div class="file-info">
              <h4>{{ file.name }}</h4>
              <p class="file-meta">{{ file.size }} • {{ file.modified }}</p>
            </div>
            <div class="file-actions">
              <button class="action-btn" @click="downloadFile(file)" title="Download">⬇️</button>
              <button class="action-btn" @click="shareFile(file)" title="Share">🔗</button>
            </div>
          </div>
        </div>
      </section>

      <section class="storage-usage">
        <h2>Storage Usage</h2>
        <div class="usage-card">
          <div class="usage-bar">
            <div class="usage-fill" :style="{ width: storagePercentage + '%' }"></div>
          </div>
          <p class="usage-text">{{ usedStorage }} of {{ totalStorage }} used</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { getAuthService } from '@/services/authService'

export default {
  name: 'UserDashboard',
  data() {
    return {
      username: 'User',
      recentFiles: [
        { id: 1, name: 'Document.pdf', size: '2.4 MB', modified: '2 hours ago' },
        { id: 2, name: 'Image.jpg', size: '1.8 MB', modified: '1 day ago' },
        { id: 3, name: 'Spreadsheet.xlsx', size: '856 KB', modified: '3 days ago' },
      ],
      usedStorage: '2.1 GB',
      totalStorage: '10 GB',
      storagePercentage: 21,
    }
  },

  async mounted() {
    const authService = getAuthService()

    if (!authService.isAuthenticated()) {
      this.$router.push('/')
      return
    }

    await this.loadUserData()
  },

  methods: {
    async loadUserData() {
      try {
        console.log('load user data')
        // const authService = getAuthService()
        // Make authenticated API calls to get user data
        // const response = await authService.authenticatedFetch(`${authService.baseURL}/api/user/dashboard`)
        // Update component data with real data from API
      } catch (error) {
        console.error('Failed to load user data:', error)
      }
    },

    uploadFile() {
      this.$router.push('/upload')
    },

    createFolder() {
      console.log('Create folder clicked')
    },

    viewShared() {
      this.$router.push('/shared')
    },

    downloadFile(file) {
      console.log('Download file:', file.name)
    },

    shareFile(file) {
      console.log('Share file:', file.name)
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
.files-grid {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background-color: #f8fafc;
}

.file-item:last-child {
  border-bottom: none;
}

.file-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.file-info {
  flex: 1;
}

.file-info h4 {
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.file-meta {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

.usage-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.usage-bar {
  width: 100%;
  height: 8px;
  background-color: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.usage-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.usage-text {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}
</style>
