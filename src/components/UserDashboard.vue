<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="app-title">File Storage</h1>
        <div class="user-info">
          <span class="welcome-text">Welcome back, {{ this.userData?.username ?? 'user' }}!</span>
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
              <h4>{{ file.filename }}</h4>
              <p class="file-meta">{{ file.formattedFileSize }} • {{ file.formattedUploadDate }}</p>
            </div>
            <div class="file-actions">
              <button class="action-btn" @click="downloadFile(file)" title="Download">⬇️</button>
              <button class="action-btn" @click="viewShared()" title="Share">🔗</button>
              <button class="action-btn" @click="deleteFile(file)" title="Delete">🗑️</button>
            </div>
          </div>
        </div>
      </section>

      <section class="storage-usage">
        <h2>Storage Usage</h2>
        <div class="usage-card">
          <div class="usage-bar" :title="`${storagePercentage.toFixed(1)}% used`">
            <div class="usage-fill" :style="{ width: storagePercentage + '%' }"></div>
          </div>
          <p class="usage-text">{{ usedStorageFormatted }} of {{ totalStorageFormatted }} used</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { getAuthService } from '@/services/authService'
import { getUserApiService } from '@/services/userService'
import { getFileApiService } from '@/services/fileService'

export default {
  name: 'UserDashboard',
  data() {
    return {
      userData: null,
      loading: false,
      error: null,
      recentFiles: [],
      usedStorage: '0',
      totalStorage: '0',
    }
  },

  async mounted() {
    const authService = getAuthService()

    if (!authService.isAuthenticated()) {
      this.$router.push('/')
      return
    }

    await this.loadUserData()
    await this.refreshData()
  },

  computed: {
    usedStorageFormatted() {
      return this.formatFileSize(this.usedStorage)
    },
    totalStorageFormatted() {
      return this.formatFileSize(this.totalStorage)
    },
    storagePercentage() {
      if (this.totalStorage == null || this.totalStorage == 0) {
        return 0
      } else {
        return (this.usedStorage / this.totalStorage) * 100
      }
    },
  },

  methods: {
    async refreshData() {
      await Promise.all([this.getRecentFiles(), this.getUsedStorage(), this.getTotalStorage()])
    },

    async loadUserData() {
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

    async getRecentFiles() {
      try {
        this.loading = true
        this.error = null

        const fileApiService = getFileApiService()

        this.recentFiles = await fileApiService.getRecentFiles(3)

        console.log('Recent files loaded:', this.recentFiles)

        // Now you can access computed properties directly
        this.recentFiles.forEach((file) => {
          console.log(`File: ${file.filename}`)
          console.log(`Size: ${file.formattedFileSize}`)
          console.log(`Uploaded: ${file.formattedUploadDate}`)
          console.log(`Type: ${file.fileExtension}`)
          console.log(`Owner: ${file.userDto.displayName}`)
          console.log('---')
        })

        console.log('User files loaded successfully:', this.recentFiles)
      } catch (error) {
        console.error('Failed to load user data:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async updateProfile(updatedData) {
      console.log('Update profile', updatedData)
      // try {
      //   this.loading = true
      //   const userApiService = getUserApiService()

      //   this.userData = await userApiService.updateUserProfile(updatedData)
      //   console.log('Profile updated successfully')
      // } catch (error) {
      //   console.error('Failed to update profile:', error)
      //   this.error = error.message
      // } finally {
      //   this.loading = false
      // }
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

    async downloadFile(file) {
      try {
        this.loading = true
        this.error = null

        const fileService = getFileApiService()
        await fileService.downloadFile(file.id)
      } catch (error) {
        console.error('Download failed:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async deleteFile(file) {
      console.log('Delete file: ', file)
      try {
        const fileService = getFileApiService()
        await fileService.deleteFile(file.id)
        await this.refreshData()
      } catch (error) {
        console.error('Delete failed:', error)
      }
    },

    async getUsedStorage() {
      console.log('Fetching used storage')
      try {
        this.loading = true
        this.error = null

        const userApiService = getUserApiService()
        this.usedStorage = await userApiService.getUsedStorage()
        // this.usedStorage = this.formatFileSize(rawStorage)

        console.log('User used storage loaded successfully:', this.usedStorage)
        console.log()
      } catch (error) {
        console.error('Failed to load user used storage:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async getTotalStorage() {
      console.log('Fetching total storage')
      try {
        this.loading = true
        this.error = null

        const userApiService = getUserApiService()
        this.totalStorage = await userApiService.getMaximumStorage()
        // this.totalStorage = this.formatFileSize(rawStorage)

        console.log('User maximum storage loaded successfully:', this.totalStorage)
      } catch (error) {
        console.error('Failed to load user maximum storage:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'

      const k = 1000
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
