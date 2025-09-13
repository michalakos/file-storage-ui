<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">Rename File</h3>
        <button @click="closeModal" class="close-button" type="button">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="current-file">
          <div class="file-icon">📄</div>
          <div class="file-details">
            <p class="current-filename">{{ file?.filename }}</p>
            <p class="file-meta">{{ file?.formattedFileSize }} • {{ file?.formattedUploadDate }}</p>
          </div>
        </div>

        <form @submit.prevent="handleRename" class="rename-form">
          <div class="form-group">
            <label for="newFilename" class="form-label">New filename</label>
            <input
              id="newFilename"
              ref="filenameInput"
              v-model="newFilename"
              type="text"
              class="form-input"
              :class="{ error: hasError }"
              placeholder="Enter new filename"
              @input="clearError"
            />
            <p v-if="hasError" class="error-message">{{ errorMessage }}</p>
          </div>

          <div class="form-actions">
            <button @click="closeModal" type="button" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="!canRename || isRenaming">
              <span v-if="isRenaming" class="loading-spinner"></span>
              {{ isRenaming ? 'Renaming...' : 'Rename File' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RenameFileModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    file: {
      type: Object,
      default: null,
    },
  },
  emits: ['close', 'rename'],

  data() {
    return {
      newFilename: '',
      hasError: false,
      errorMessage: '',
      isRenaming: false,
    }
  },

  computed: {
    canRename() {
      return (
        this.newFilename.trim() !== '' &&
        this.newFilename.trim() !== this.file?.filename &&
        !this.hasError
      )
    },
  },

  watch: {
    isOpen(newVal) {
      if (newVal && this.file) {
        this.newFilename = this.file.filename
        this.hasError = false
        this.errorMessage = ''
        this.isRenaming = false
        this.$nextTick(() => {
          if (this.$refs.filenameInput) {
            this.$refs.filenameInput.focus()
            this.$refs.filenameInput.select()
          }
        })
      }
    },
  },

  methods: {
    closeModal() {
      if (!this.isRenaming) {
        this.$emit('close')
      }
    },

    handleOverlayClick() {
      this.closeModal()
    },

    clearError() {
      this.hasError = false
      this.errorMessage = ''
    },

    validateFilename(filename) {
      const trimmed = filename.trim()

      if (!trimmed) {
        return 'Filename cannot be empty'
      }

      if (trimmed === this.file?.filename) {
        return 'Please enter a different filename'
      }

      // Check for invalid characters
      const invalidChars = /[<>:"/\\|?*]/
      if (invalidChars.test(trimmed)) {
        return 'Filename contains invalid characters'
      }

      if (trimmed.length > 255) {
        return 'Filename is too long (maximum 255 characters)'
      }

      return null
    },

    async handleRename() {
      const error = this.validateFilename(this.newFilename)

      if (error) {
        this.hasError = true
        this.errorMessage = error
        return
      }

      this.isRenaming = true

      try {
        await this.$emit('rename', {
          fileId: this.file.id,
          newFilename: this.newFilename.trim(),
        })
        this.closeModal()
      } catch (error) {
        this.hasError = true
        this.errorMessage = error.message || 'Failed to rename file'
      } finally {
        this.isRenaming = false
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
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  animation: modalEnter 0.2s ease-out;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  color: #64748b;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background-color: #f1f5f9;
  color: #334155;
}

.modal-body {
  padding: 1.5rem;
}

.current-file {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.file-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.file-details {
  flex: 1;
}

.current-filename {
  font-weight: 500;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
}

.file-meta {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.rename-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: white;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .modal-container {
    margin: 1rem;
    max-width: none;
    width: calc(100% - 2rem);
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
