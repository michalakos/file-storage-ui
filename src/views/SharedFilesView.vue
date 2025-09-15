<template>
  <div class="files-container container">
    <header class="header files-header">
      <div class="header-content">
        <h1 class="page-title-button" @click="goToDashboard">SafeStash</h1>
        <div class="search-section">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search shared files by name..."
            class="search-input"
            @input="handleSearchInput"
          />
        </div>
        <div class="header-actions">
          <button @click="goToMyFiles" class="btn btn-secondary">📁 My Files</button>
        </div>
      </div>
    </header>

    <main class="files-main">
      <div v-if="loading && files.length === 0" class="loading-state">
        <p>Loading shared files...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadFiles" class="btn btn-outline">Try Again</button>
      </div>

      <div v-else class="files-content">
        <div v-if="files.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>No shared files</h3>
          <p>Files shared with you will appear here</p>
          <button @click="goToMyFiles" class="btn btn-primary">View My Files</button>
        </div>

        <div v-else>
          <div class="files-grid">
            <div v-for="file in files" :key="file.id" class="file-item">
              <div class="file-icon">📄</div>
              <div class="file-info">
                <h4>{{ file.filename }}</h4>
                <p class="file-meta">
                  {{ file.formattedFileSize }} • {{ file.formattedUploadDate }}
                  <span class="shared-by">• Shared by {{ file.userDto.displayName }}</span>
                </p>
              </div>
              <div class="file-actions">
                <button class="action-btn" @click="downloadFile(file)" title="Download">⬇️</button>
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
              total shared files)
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
import { getFileApiService } from '@/services/fileService'
import { FileMetadataDto } from '@/models/FileMetadata'

export default {
  name: 'SharedFilesView',
  data() {
    return {
      files: [],
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

    await this.loadFiles()
  },

  methods: {
    async loadFiles(page = 0, keyword = '') {
      try {
        this.loading = true
        this.error = null

        const fileService = getFileApiService()
        const response = await fileService.searchPaginatedSharedFiles(
          page,
          this.pagination.size,
          keyword,
        )

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

        console.log('Shared files loaded successfully:', this.files)
        console.log('Pagination info:', this.pagination)
      } catch (error) {
        console.error('Failed to load shared files:', error)
        this.error = error.message || 'Failed to load shared files'
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

    async goToPage(page) {
      const actualPage = page - 1
      if (actualPage < 0 || actualPage > this.pagination.totalPages - 1) {
        return
      }
      await this.loadFiles(actualPage, this.searchQuery.trim())
    },

    goToMyFiles() {
      this.$router.push('/files')
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

    goToDashboard() {
      this.$router.push('/dashboard')
    },
  },
}
</script>

<style scoped>
.files-container {
  min-height: 100vh;
  background-color: var(--color-gray-50);
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

.files-main {
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

.files-grid {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
  overflow: hidden;
  margin-bottom: var(--space-xl);
}

.file-item {
  display: flex;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-gray-100);
  transition: background-color var(--transition-base);
}

.file-item:hover {
  background-color: var(--color-gray-50);
}

.file-item:last-child {
  border-bottom: none;
}

.file-icon {
  font-size: var(--text-xl);
  margin-right: var(--space-md);
}

.file-info {
  flex: 1;
}

.file-info h4 {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.file-meta {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.shared-by {
  color: var(--color-primary);
  font-weight: 500;
}

.file-actions {
  display: flex;
  gap: var(--space-sm);
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  transition: background-color var(--transition-base);
}

.action-btn:hover {
  background-color: var(--color-gray-100);
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

.btn-secondary {
  background-color: var(--color-sage);
  color: var(--color-white);
}

.btn-secondary:hover {
  background-color: var(--color-sage-dark);
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
