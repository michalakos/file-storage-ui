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
  background-color: rgba(56, 29, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-md);
}

.modal-container {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  animation: modalEnter var(--transition-slow) ease-out;
  border: 1px solid var(--color-gray-200);
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
  padding: var(--space-lg) var(--space-lg) 0 var(--space-lg);
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background-color: var(--color-gray-100);
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--space-lg);
}

.current-file {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  background-color: var(--color-accent);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-lg);
  border: 1px solid var(--color-cream-dark);
}

.file-icon {
  font-size: var(--text-2xl);
  margin-right: var(--space-md);
  color: var(--color-brown);
}

.file-details {
  flex: 1;
}

.current-filename {
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-xs) 0;
  font-size: var(--text-base);
}

.file-meta {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.rename-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}

.form-input {
  width: 100%;
  padding: 0.75rem var(--space-md);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: all var(--transition-base);
  background-color: var(--color-white);
  color: var(--color-text-primary);
  font-family: var(--font-system);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 165, 82, 0.1);
}

.form-input.error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.error-message {
  color: var(--color-error);
  font-size: var(--text-sm);
  margin: var(--space-sm) 0 0 0;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: var(--space-sm);
}

.btn {
  padding: 0.75rem var(--space-lg);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid transparent;
  font-size: var(--text-sm);
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 120px;
  justify-content: center;
  font-family: var(--font-system);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--color-gray-50);
  color: var(--color-text-secondary);
  border-color: var(--color-gray-200);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-gray-100);
  border-color: var(--color-gray-300);
  color: var(--color-text-primary);
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-brown);
  border-color: var(--color-brown);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(186, 86, 36, 0.3);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .modal-container {
    margin: var(--space-md);
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
