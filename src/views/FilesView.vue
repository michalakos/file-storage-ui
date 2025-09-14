<template>
  <div class="files-container">
    <header class="files-header">
      <div class="header-content">
        <h1 class="page-title-button" @click="goToDashboard">My Files</h1>
        <div class="search-section">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search files by name..."
            class="search-input"
            @input="handleSearchInput"
          />
        </div>
        <div class="header-actions">
          <button @click="uploadFile" class="btn btn-primary">📁 Upload Files</button>
        </div>
      </div>
    </header>

    <main class="files-main">
      <div v-if="loading && files.length === 0" class="loading-state">
        <p>Loading files...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadFiles" class="btn btn-outline">Try Again</button>
      </div>

      <div v-else class="files-content">
        <div v-if="files.length === 0" class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>No files yet</h3>
          <p>Upload your first file to get started</p>
          <button @click="uploadFile" class="btn btn-primary">Upload Files</button>
        </div>

        <div v-else>
          <div class="files-grid">
            <div v-for="file in files" :key="file.id" class="file-item">
              <div class="file-icon">📄</div>
              <div class="file-info">
                <h4>{{ file.filename }}</h4>
                <p class="file-meta">
                  {{ file.formattedFileSize }} • {{ file.formattedUploadDate }}
                </p>
              </div>
              <div class="file-actions">
                <button class="action-btn" @click="downloadFile(file)" title="Download">⬇️</button>
                <button class="action-btn" @click="renameFile(file)" title="Rename">✏️</button>
                <button class="action-btn" @click="shareFile(file)" title="Share">🔗</button>
                <button class="action-btn" @click="deleteFile(file)" title="Delete">🗑️</button>
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
              total files)
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

    <!-- Share Modal -->
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
import { getFileApiService } from '@/services/fileService'
import { FileMetadataDto } from '@/models/FileMetadata'
import ShareFileModal from '@/components/ShareFileModal.vue'
import RenameFileModal from '@/components/RenameFileModal.vue'

export default {
  name: 'FilesView',
  components: {
    ShareFileModal,
    RenameFileModal,
  },
  data() {
    return {
      files: [],
      searchQuery: '',
      searchTimeout: null,
      loading: false,
      error: null,
      shareModalOpen: false,
      selectedFileToShare: null,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalElements: 0,
        size: 8,
      },
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

    await this.loadFiles()
  },

  methods: {
    async loadFiles(page = 0, keyword = '') {
      try {
        this.loading = true
        this.error = null

        const fileService = getFileApiService()
        let response

        response = await fileService.searchPaginatedFiles(page, this.pagination.size, keyword)

        // Map the raw API response to FileMetadata objects
        this.files = response.content.map((fileData) => FileMetadataDto.fromApiResponse(fileData))
        if (this.files.length == 0 && page != 0) {
          this.loadFiles(page - 1, keyword)
          return
        }

        this.pagination = {
          currentPage: response.number + 1,
          totalPages: response.totalPages,
          totalElements: response.totalElements,
          size: response.size,
        }

        console.log('Files loaded successfully:', this.files)
        console.log('Pagination info:', this.pagination)
      } catch (error) {
        console.error('Failed to load files:', error)
        this.error = error.message || 'Failed to load files'
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
      await this.loadFiles(0, this.searchQuery.trim())
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

        // Update the file in the local array
        const fileIndex = this.files.findIndex((f) => f.id === fileId)
        if (fileIndex !== -1) {
          this.files[fileIndex] = FileMetadataDto.fromApiResponse(updatedFile)
        }

        console.log('File renamed successfully:', updatedFile)
        this.closeRenameModal() // Close modal on success
      } catch (error) {
        console.error('Rename failed:', error)
        this.error = 'Failed to rename file'
        throw error // Re-throw so modal can show error
      }
    },

    async goToPage(page) {
      const actualPage = page - 1
      if (actualPage < 0 || actualPage > this.pagination.totalPages - 1) {
        return
      }
      await this.loadFiles(actualPage, this.searchQuery.trim())
    },

    uploadFile() {
      this.$router.push('/upload')
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

    shareFile(file) {
      this.selectedFileToShare = file
      this.shareModalOpen = true
    },

    closeShareModal() {
      this.shareModalOpen = false
      this.selectedFileToShare = null
    },

    handleFileShared(shareData) {
      console.log('File shared successfully:', shareData)
      // You could show a success message here
      // For now, just close the modal (already handled by closeShareModal)
    },

    async deleteFile(file) {
      try {
        const fileService = getFileApiService()
        await fileService.deleteFile(file.id)

        // Reload current page
        await this.loadFiles(this.pagination.currentPage - 1)
      } catch (error) {
        console.error('Delete failed:', error)
        this.error = 'Failed to delete file'
      }
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

.files-container {
  min-height: 100vh;
  background-color: #f8fafc;
}

.files-header {
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

.files-main {
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

.files-grid {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  margin-bottom: 2rem;
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
