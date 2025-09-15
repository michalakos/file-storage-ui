<template>
  <div class="upload-container container">
    <header class="header dashboard-header">
      <div class="header-content">
        <h1 class="page-title-button" @click="goToDashboard">SafeStash</h1>
        <h1>Upload Files</h1>
      </div>
    </header>

    <main class="upload-main">
      <!-- Drop Zone -->
      <div
        class="drop-zone"
        :class="{
          'drag-over': isDragOver,
          'has-files': selectedFiles.length > 0,
        }"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          multiple
          @change="handleFileSelect"
          style="display: none"
          accept="*/*"
        />

        <div class="drop-zone-content">
          <div class="upload-icon">📁</div>
          <h3>
            {{
              selectedFiles.length > 0
                ? `${selectedFiles.length} file(s) selected`
                : 'Click or drag files here to upload'
            }}
          </h3>
          <p>
            {{
              selectedFiles.length > 0
                ? 'Click to add more files or start upload'
                : 'Supports all file types'
            }}
          </p>
        </div>
      </div>

      <!-- Selected Files List -->
      <div v-if="selectedFiles.length > 0" class="selected-files">
        <div class="section-header">
          <h2>Selected Files ({{ selectedFiles.length }})</h2>
          <div class="header-actions">
            <button @click="clearFiles" class="btn btn-outline">Clear All</button>
            <button @click="startUpload" :disabled="isUploading" class="btn btn-primary">
              {{ isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)` }}
            </button>
          </div>
        </div>

        <div class="files-list">
          <div
            v-for="(file, index) in selectedFiles"
            :key="file.id"
            class="file-preview"
            :class="{
              uploading: file.status === 'uploading',
              completed: file.status === 'completed',
              error: file.status === 'error',
            }"
          >
            <div class="file-info">
              <div class="file-icon">📄</div>
              <div class="file-details">
                <h4>{{ file.name }}</h4>
                <p class="file-meta">
                  {{ formatFileSize(file.size) }} • {{ file.type || 'Unknown type' }}
                </p>
              </div>
            </div>

            <div class="file-progress">
              <div v-if="file.status === 'uploading'" class="progress-info">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: file.progress + '%' }"></div>
                </div>
                <span class="progress-text">{{ Math.round(file.progress) }}%</span>
              </div>

              <div v-else-if="file.status === 'completed'" class="status-success">✅ Uploaded</div>

              <div v-else-if="file.status === 'error'" class="status-error">
                ❌ {{ file.error }}
              </div>

              <div v-else class="status-pending">Pending</div>
            </div>

            <button
              @click="removeFile(index)"
              class="remove-btn"
              :disabled="file.status === 'uploading'"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- Upload Progress Summary -->
      <div v-if="isUploading" class="upload-summary">
        <h3>Upload Progress</h3>
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-label">Completed:</span>
            <span class="stat-value">{{ completedUploads }}/{{ totalFiles }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Overall Progress:</span>
            <span class="stat-value">{{ Math.round(overallProgress) }}%</span>
          </div>
        </div>
        <div class="overall-progress-bar">
          <div class="overall-progress-fill" :style="{ width: overallProgress + '%' }"></div>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="showSuccessMessage" class="success-message">
        <div class="success-content">
          <div class="success-icon">🎉</div>
          <h3>Upload Complete!</h3>
          <p>{{ completedUploads }} file(s) uploaded successfully</p>
          <button @click="goToDashboard" class="btn btn-primary">Return to Dashboard</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { getFileApiService } from '@/services/fileService'

export default {
  name: 'FileUpload',
  data() {
    return {
      selectedFiles: [],
      isDragOver: false,
      isUploading: false,
      completedUploads: 0,
      totalFiles: 0,
      overallProgress: 0,
      showSuccessMessage: false,
      nextFileId: 1,
    }
  },

  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      this.addFiles(files)
      // Clear the input so the same file can be selected again
      event.target.value = ''
    },

    handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false

      const files = Array.from(event.dataTransfer.files)
      this.addFiles(files)
    },

    handleDragOver(event) {
      event.preventDefault()
    },

    handleDragEnter(event) {
      event.preventDefault()
      this.isDragOver = true
    },

    handleDragLeave(event) {
      event.preventDefault()
      // Only set to false if we're leaving the drop zone entirely
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.isDragOver = false
      }
    },

    addFiles(files) {
      const newFiles = files.map((file) => ({
        id: this.nextFileId++,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        status: 'pending', // pending, uploading, completed, error
        progress: 0,
        error: null,
      }))

      this.selectedFiles.push(...newFiles)
    },

    removeFile(index) {
      this.selectedFiles.splice(index, 1)
    },

    clearFiles() {
      this.selectedFiles = []
      this.showSuccessMessage = false
    },

    async startUpload() {
      if (this.selectedFiles.length === 0 || this.isUploading) return

      this.isUploading = true
      this.completedUploads = 0
      this.totalFiles = this.selectedFiles.length
      this.overallProgress = 0
      this.showSuccessMessage = false

      const fileApiService = getFileApiService()

      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const fileItem = this.selectedFiles[i]

        if (fileItem.status === 'completed') {
          this.completedUploads++
          continue
        }

        fileItem.status = 'uploading'
        fileItem.progress = 0

        try {
          await fileApiService.uploadFile(fileItem.file, (progress) => {
            fileItem.progress = progress
            this.updateOverallProgress()
          })

          fileItem.status = 'completed'
          fileItem.progress = 100
          this.completedUploads++
        } catch (error) {
          console.error(`Failed to upload ${fileItem.name}:`, error)
          fileItem.status = 'error'
          fileItem.error = error.message
        }

        this.updateOverallProgress()
      }

      this.isUploading = false

      if (this.completedUploads > 0) {
        this.showSuccessMessage = true
      }
    },

    updateOverallProgress() {
      if (this.totalFiles === 0) {
        this.overallProgress = 0
        return
      }

      const totalProgress = this.selectedFiles.reduce((sum, file) => {
        if (file.status === 'completed') return sum + 100
        if (file.status === 'uploading') return sum + file.progress
        if (file.status === 'error') return sum + 100 // Count errors as "complete" for progress
        return sum
      }, 0)

      this.overallProgress = totalProgress / this.totalFiles
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'

      const k = 1000
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    goToDashboard() {
      this.$router.push('/dashboard')
    },
  },
}
</script>

<style scoped>
.upload-container {
  min-height: 100dvh;
  background-color: var(--color-gray-50);
}

.upload-header {
  background: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
  padding: var(--space-md) 0;
  margin-bottom: var(--space-xl);
  box-shadow: var(--shadow-sm);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.upload-header h1 {
  font-size: var(--text-xl);
  font-weight: 600;
  margin: 0;
}

.upload-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-xl) var(--space-xl) var(--space-xl);
}

.drop-zone {
  background: var(--color-white);
  border: 3px dashed var(--color-gray-300);
  border-radius: var(--radius-lg);
  padding: var(--space-3xl);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-slow);
  margin-bottom: var(--space-xl);
  box-shadow: var(--shadow-md);
}

.drop-zone:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 165, 82, 0.3);
}

.drop-zone.drag-over {
  background: var(--color-cream-light);
  border-color: var(--color-primary);
  transform: scale(1.02);
}

.drop-zone.has-files {
  border-color: var(--color-success);
  background: var(--color-success-bg);
}

.drop-zone-content .upload-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-md);
}

.drop-zone-content h3 {
  font-size: var(--text-xl);
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}

.drop-zone-content p {
  color: var(--color-text-secondary);
  margin: 0;
}

.selected-files {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-gray-100);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.section-header h2 {
  color: var(--color-text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.file-preview {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-sm);
  transition: all var(--transition-slow);
}

.file-preview.uploading {
  background: var(--color-warning-bg);
  border-color: var(--color-warning);
}

.file-preview.completed {
  background: var(--color-success-bg);
  border-color: var(--color-success);
}

.file-preview.error {
  background: var(--color-error-bg);
  border-color: var(--color-error);
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.file-icon {
  font-size: var(--text-xl);
  margin-right: var(--space-md);
}

.file-details h4 {
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

.file-progress {
  margin: 0 var(--space-md);
  min-width: 120px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: var(--color-gray-100);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width var(--transition-slow);
}

.progress-text {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  min-width: 35px;
}

.status-success {
  color: var(--color-success);
  font-size: var(--text-sm);
  font-weight: 500;
}

.status-error {
  color: var(--color-error);
  font-size: var(--text-sm);
  font-weight: 500;
}

.status-pending {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.remove-btn {
  background: none;
  border: none;
  font-size: var(--text-xl);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-full);
  transition: all var(--transition-base);
}

.remove-btn:hover:not(:disabled) {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-summary {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-gray-100);
}

.upload-summary h3 {
  color: var(--color-text-primary);
  margin-bottom: var(--space-md);
}

.summary-stats {
  display: flex;
  gap: var(--space-xl);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.overall-progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-gray-100);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.overall-progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width var(--transition-slow);
}

.success-message {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-3xl);
  text-align: center;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-gray-100);
}

.success-content .success-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-md);
}

.success-content h3 {
  color: var(--color-text-primary);
  font-size: var(--text-2xl);
  margin-bottom: var(--space-sm);
}

.success-content p {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xl);
}

@media (max-width: 768px) {
  .upload-header .header-content {
    padding: 0 var(--space-md);
  }

  .upload-main {
    padding: 0 var(--space-md) var(--space-xl) var(--space-md);
  }

  .drop-zone {
    padding: var(--space-xl) var(--space-md);
  }

  .file-preview {
    flex-wrap: wrap;
    gap: var(--space-md);
  }

  .file-progress {
    margin: 0;
    width: 100%;
  }

  .summary-stats {
    flex-direction: column;
    gap: var(--space-md);
  }

  .header-actions {
    width: 100%;
    justify-content: stretch;
  }

  .header-actions .btn {
    flex: 1;
  }
}
</style>
