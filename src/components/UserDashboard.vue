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

          <div class="action-card" @click="shareFile()">
            <div class="action-icon">👥</div>
            <h3>Shared Files</h3>
            <p>View files shared with you</p>
          </div>
        </div>
      </section>

      <section class="recent-files">
        <div class="section-header">
          <h2>Recent Files</h2>
          <button class="btn btn-outline" @click="this.$router.push('/files')">View All</button>
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
              <button class="action-btn" @click="renameFile(file)" title="Rename">✏️</button>
              <button class="action-btn" @click="shareFile(file)" title="Share">🔗</button>
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
    <ShareFileModal
      :is-open="shareModalOpen"
      :file="selectedFileToShare"
      @close="closeShareModal"
      @shared="handleFileShared"
    />
    <RenameFileModal
      :is-open="renameModalOpen"
      :file="selectedFileToRename"
      @close="closeRenameModal"
      @rename="handleFileRenamed"
    />
  </div>
</template>

<script>
import { getAuthService } from '@/services/authService'
import { getUserApiService } from '@/services/userService'
import { getFileApiService } from '@/services/fileService'
import { FileMetadataDto } from '@/models/FileMetadata'
import ShareFileModal from '@/components/ShareFileModal.vue'
import RenameFileModal from '@/components/RenameFileModal.vue'

export default {
  name: 'UserDashboard',

  components: {
    ShareFileModal,
    RenameFileModal,
  },

  data() {
    return {
      userData: null,
      loading: false,
      error: null,
      recentFiles: [],
      usedStorage: '0',
      totalStorage: '0',
      shareModalOpen: false,
      selectedFileToShare: null,
      renameModalOpen: false,
      selectedFileToRename: null,
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

    uploadFile() {
      this.$router.push('/upload')
    },

    shareFile(file = null) {
      if (file) {
        // Sharing a specific file
        this.selectedFileToShare = file
        this.shareModalOpen = true
      } else {
        // Navigate to shared files view
        this.$router.push('/shared')
      }
    },

    closeShareModal() {
      this.shareModalOpen = false
      this.selectedFileToShare = null
    },

    handleFileShared(shareData) {
      console.log('File shared successfully:', shareData)
    },

    async downloadFile(file) {
      try {
        const fileService = getFileApiService()
        await fileService.downloadFile(file.id)
      } catch (error) {
        console.error('Download failed:', error)
        this.error = 'Failed to download file'
      }
    },

    renameFile(file) {
      this.selectedFileToRename = file
      this.renameModalOpen = true
    },

    closeRenameModal() {
      this.renameModalOpen = false
      this.selectedFileToRename = null
    },

    async handleFileRenamed({ fileId, newFilename }) {
      try {
        const fileService = getFileApiService()
        const updatedFile = await fileService.renameFile(fileId, newFilename)

        // Update the file in the recentFiles array
        const fileIndex = this.recentFiles.findIndex((f) => f.id === fileId)
        if (fileIndex !== -1) {
          this.recentFiles[fileIndex] = FileMetadataDto.fromApiResponse(updatedFile)
        }

        console.log('File renamed successfully:', updatedFile)
        this.closeRenameModal() // Close modal on success
      } catch (error) {
        console.error('Rename failed:', error)
        this.error = 'Failed to rename file'
        throw error // Re-throw so modal can show error
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

        console.log('User used storage loaded successfully:', this.usedStorage)
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
