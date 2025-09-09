<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Share File</h3>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div class="file-info">
          <div class="file-icon">📄</div>
          <div>
            <h4>{{ file?.filename || 'Unknown File' }}</h4>
            <p class="file-meta">{{ file?.formattedFileSize || '0 Bytes' }}</p>
          </div>
        </div>

        <div class="form-group">
          <label for="userSearch">Search for user to share with:</label>
          <input
            id="userSearch"
            v-model="searchQuery"
            type="text"
            placeholder="Start typing username..."
            class="search-input"
            @input="handleSearchInput"
          />
        </div>

        <div v-if="searchResults.length > 0" class="user-results">
          <div
            v-for="user in searchResults"
            :key="user.id"
            class="user-item"
            @click="selectUser(user)"
            :class="{ selected: selectedUser?.id === user.id }"
          >
            <div class="user-info">
              <strong>{{ user.username }}</strong>
              <span class="user-email">{{ user.email }}</span>
            </div>
          </div>
        </div>

        <div v-if="selectedUser" class="selected-user">
          <h5>Sharing with:</h5>
          <div class="user-item selected">
            <div class="user-info">
              <strong>{{ selectedUser.username }}</strong>
              <span class="user-email">{{ selectedUser.email }}</span>
            </div>
            <button @click="clearSelection" class="clear-btn">✕</button>
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="readOnly" type="checkbox" class="checkbox" />
            Read-only access
          </label>
          <p class="help-text">
            {{
              readOnly
                ? 'User can only view and download the file'
                : 'User can edit and modify the file'
            }}
          </p>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary" :disabled="loading">Cancel</button>
        <button @click="shareFile" class="btn btn-primary" :disabled="!selectedUser || loading">
          {{ loading ? 'Sharing...' : 'Share File' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getUserApiService } from '@/services/userService'
import { getFileApiService } from '@/services/fileService'

export default {
  name: 'ShareFileModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    file: {
      type: Object,
      default: null,
    },
  },
  emits: ['close', 'shared'],
  data() {
    return {
      searchQuery: '',
      searchResults: [],
      selectedUser: null,
      readOnly: true,
      loading: false,
      error: null,
      searchTimeout: null,
    }
  },
  watch: {
    isOpen(newVal) {
      if (!newVal) {
        this.resetModal()
      }
    },
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },

    handleOverlayClick() {
      this.closeModal()
    },

    resetModal() {
      this.searchQuery = ''
      this.searchResults = []
      this.selectedUser = null
      this.readOnly = true
      this.loading = false
      this.error = null
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
    },

    handleSearchInput() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }

      if (this.searchQuery.trim().length < 2) {
        this.searchResults = []
        return
      }

      this.searchTimeout = setTimeout(() => {
        this.searchUsers()
      }, 300)
    },

    async searchUsers() {
      if (!this.searchQuery.trim()) {
        this.searchResults = []
        return
      }

      try {
        // this.loading = true
        this.error = null

        const userService = getUserApiService()
        this.searchResults = await userService.searchUsers(this.searchQuery.trim())
      } catch (error) {
        console.error('User search failed:', error)
        this.error = 'Failed to search users. Please try again.'
        this.searchResults = []
      } //finally {
      // this.loading = false
      // }
    },

    selectUser(user) {
      this.selectedUser = user
      this.searchQuery = user.username
      this.searchResults = []
    },

    clearSelection() {
      this.selectedUser = null
      this.searchQuery = ''
      this.searchResults = []
    },

    async shareFile() {
      if (!this.selectedUser || !this.file) {
        return
      }

      try {
        this.loading = true
        this.error = null

        const fileService = getFileApiService()
        await fileService.shareFile(this.file.id, this.selectedUser.username, this.readOnly)

        this.$emit('shared', {
          file: this.file,
          user: this.selectedUser,
          readOnly: this.readOnly,
        })

        this.closeModal()
      } catch (error) {
        console.error('File sharing failed:', error)
        this.error = error.message || 'Failed to share file. Please try again.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #1e293b;
}

.modal-body {
  padding: 1.5rem;
  max-height: 50vh;
  overflow-y: auto;
}

.file-info {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.file-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.file-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
}

.file-meta {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
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

.search-input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
}

.user-results {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.user-item {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-item:hover {
  background-color: #f9fafb;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item.selected {
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.user-info strong {
  display: block;
  color: #1f2937;
  margin-bottom: 0.125rem;
}

.user-email {
  font-size: 0.875rem;
  color: #6b7280;
}

.selected-user {
  margin-bottom: 1.5rem;
}

.selected-user h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.clear-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.clear-btn:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  cursor: pointer;
}

.checkbox {
  margin-right: 0.5rem;
  margin-bottom: 0 !important;
}

.help-text {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.error-message {
  padding: 0.75rem;
  background-color: #fef2f2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 0.875rem;
  border: 1px solid #fecaca;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f1f5f9;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}
</style>
