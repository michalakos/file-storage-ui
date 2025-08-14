<template>
  <div class="upload-container">
    <header class="upload-header">
      <div class="header-content">
        <button @click="goBack" class="btn btn-outline">← Back to Dashboard</button>
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
          <button @click="goBack" class="btn btn-primary">Return to Dashboard</button>
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

      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    goBack() {
      this.$router.push('/dashboard')
    },
  },
}
</script>

<style scoped>
.upload-container {
  min-height: 100vh;
  background-color: #f8fafc;
}

.upload-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0;
  margin-bottom: 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.upload-header h1 {
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.upload-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem 2rem;
}

.drop-zone {
  background: white;
  border: 3px dashed #cbd5e1;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.drop-zone:hover {
  border-color: #e6ac0f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 172, 15, 0.3);
}

.drop-zone.drag-over {
  background: rgba(230, 172, 15, 0.05);
  border-color: #e6ac0f;
  transform: scale(1.02);
}

.drop-zone.has-files {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.drop-zone-content .upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.drop-zone-content h3 {
  font-size: 1.5rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.drop-zone-content p {
  color: #64748b;
  margin: 0;
}

.selected-files {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  color: #1e293b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.file-preview {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
}

.file-preview.uploading {
  background: rgba(230, 172, 15, 0.05);
  border-color: #e6ac0f;
}

.file-preview.completed {
  background: rgba(16, 185, 129, 0.05);
  border-color: #10b981;
}

.file-preview.error {
  background: rgba(239, 68, 68, 0.05);
  border-color: #ef4444;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.file-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.file-details h4 {
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

.file-progress {
  margin: 0 1rem;
  min-width: 120px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #e6ac0f;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #64748b;
  min-width: 35px;
}

.status-success {
  color: #10b981;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-error {
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-pending {
  color: #64748b;
  font-size: 0.875rem;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.remove-btn:hover:not(:disabled) {
  background: #fef2f2;
  color: #ef4444;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-summary {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
}

.upload-summary h3 {
  color: #1e293b;
  margin-bottom: 1rem;
}

.summary-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.overall-progress-bar {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}

.overall-progress-fill {
  height: 100%;
  background: #e6ac0f;
  transition: width 0.3s ease;
}

.success-message {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
}

.success-content .success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-content h3 {
  color: #1e293b;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.success-content p {
  color: #64748b;
  margin-bottom: 2rem;
}

/* Button Styles - Using global styles where possible */
.btn {
  /* Most styles inherited from global.css */
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: #e6ac0f;
  color: white;
  border: 2px solid #e6ac0f;
}

.btn-primary:hover:not(:disabled) {
  background: #ba5624;
  border-color: #ba5624;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(186, 86, 36, 0.3);
}

.btn-outline {
  background: transparent;
  border: 2px solid #e2e8f0;
  color: #64748b;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
}

@media (max-width: 768px) {
  .upload-header .header-content {
    padding: 0 1rem;
  }

  .upload-main {
    padding: 0 1rem 2rem 1rem;
  }

  .drop-zone {
    padding: 2rem 1rem;
  }

  .file-preview {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .file-progress {
    margin: 0;
    width: 100%;
  }

  .summary-stats {
    flex-direction: column;
    gap: 1rem;
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
