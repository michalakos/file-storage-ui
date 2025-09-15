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
            <span></span>
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
/* Wrap stays the same */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

/* Hide native checkbox but keep it accessible */
.checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

/* Custom box */
.checkbox + span {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-gray-300);
  border-radius: 4px;
  background: var(--color-white);
  margin-right: var(--space-sm);
  transition:
    border-color var(--transition-base),
    background-color var(--transition-base);
}

/* Tick mark (hidden by default) */
.checkbox + span::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 5px;
  height: 10px;
  border: solid var(--color-primary);
  border-width: 0 2px 2px 0;
  opacity: 0;
  transform: rotate(45deg) scale(0.8);
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

/* Checked state */
.checkbox:checked + span {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
}

.checkbox:checked + span::after {
  opacity: 1;
  transform: rotate(45deg) scale(1);
}

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
  background: var(--color-white);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--text-xl);
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-base);
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--space-lg);
  max-height: 50vh;
  overflow-y: auto;
}

.file-info {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
}

.file-icon {
  font-size: var(--text-xl);
  margin-right: var(--space-md);
}

.file-info h4 {
  margin: 0 0 var(--space-xs) 0;
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-primary);
}

.file-meta {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.search-input {
  width: 100%;
  padding: var(--space-sm);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition:
    border-color var(--transition-base),
    box-shadow var(--transition-base);
  font-family: var(--font-system);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 165, 82, 0.1);
}

.search-input:disabled {
  background-color: var(--color-gray-50);
  color: var(--color-text-muted);
}

.user-results {
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
  max-height: 200px;
  overflow-y: auto;
}

.user-item {
  padding: var(--space-sm);
  border-bottom: 1px solid var(--color-gray-100);
  cursor: pointer;
  transition: background-color var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-item:hover {
  background-color: var(--color-gray-50);
}

.user-item:last-child {
  border-bottom: none;
}

.user-item.selected {
  background-color: var(--color-cream-light);
  border-color: var(--color-cream);
}

.user-info strong {
  display: block;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}

.user-email {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.selected-user {
  margin-bottom: var(--space-lg);
}

.selected-user h5 {
  margin: 0 0 var(--space-sm) 0;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  transition:
    color var(--transition-base),
    background-color var(--transition-base);
}

.clear-btn:hover {
  color: var(--color-text-primary);
  background-color: var(--color-gray-100);
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  cursor: pointer;
}

.checkbox {
  margin-right: var(--space-sm);
  margin-bottom: 0 !important;
}

.help-text {
  margin: var(--space-sm) 0 0 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.modal-footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}
</style>
