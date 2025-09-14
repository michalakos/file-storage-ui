import { getAuthService } from '@/services/authService'
import { FileMetadataDto } from '@/models/FileMetadata'
import BaseApiService from '@/services/baseApiService'

class FileApiService extends BaseApiService {
  constructor() {
    super()
    this.setAuthService(getAuthService())
  }

  async getRecentFiles(limit = 4) {
    const data = await this.makeRequest('/api/files/recent', { method: 'GET' }, { limit })
    return data.map((fileData) => FileMetadataDto.fromApiResponse(fileData))
  }

  async getPaginatedFiles(page = 0, size = 5) {
    return this.makeRequest('/api/files/paginated', { method: 'GET' }, { page, size })
  }

  async searchPaginatedFiles(page = 0, size = 5, keyword = '') {
    return this.makeRequest(
      '/api/files/paginated-search',
      { method: 'GET' },
      { page, size, keyword },
    )
  }

  async searchPaginatedSharedFiles(page = 0, size = 5, keyword = '') {
    return this.makeRequest(
      '/api/files/paginated-search-shared',
      { method: 'GET' },
      { page, size, keyword },
    )
  }

  async deleteFile(fileId) {
    return this.makeRequest(`/api/files/${fileId}`, { method: 'DELETE' })
  }

  async renameFile(fileId, newFileName) {
    return this.makeRequest(`/api/files/${fileId}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ newFileName }),
    })
  }

  async shareFile(fileId, username, readOnly = true) {
    return this.makeRequest(`/api/files/${fileId}/share`, {
      method: 'POST',
      body: JSON.stringify({ username, readOnly }),
    })
  }

  async getTotalFiles() {
    return this.makeRequest('/api/admin/files/count', { method: 'GET' })
  }

  async getTotalStorage() {
    return this.makeRequest('/api/admin/storage', { method: 'GET' })
  }

  async getLogs(lines = 10) {
    return this.makeRequest(`/api/admin/logs/${lines}`, { method: 'GET' })
  }

  /**
   * Upload a file to the server
   * @param {File} file - The file object to upload
   * @param {Function} onProgress - Optional progress callback function
   * @returns {Promise<FileMetadataDto>} The uploaded file metadata
   */
  async uploadFile(file, onProgress = null) {
    try {
      if (this.debug) {
        console.log('Uploading file:', file.name, 'Size:', file.size)
      }

      // Validate file
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file provided')
      }

      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Set up progress tracking
        if (onProgress && typeof onProgress === 'function') {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100
              onProgress(percentComplete, event.loaded, event.total)
            }
          })
        }

        // Set up response handlers
        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseData = JSON.parse(xhr.responseText)
              const fileMetadata = FileMetadataDto.fromApiResponse(responseData)

              if (this.debug) {
                console.log('File uploaded successfully:', fileMetadata)
              }

              resolve(fileMetadata)
            } catch (parseError) {
              console.error('Failed to parse upload response:', parseError)
              reject(new Error('Invalid response format'))
            }
          } else {
            let errorMessage = `Upload failed: ${xhr.status}`

            try {
              const errorData = JSON.parse(xhr.responseText)
              errorMessage = errorData.message || errorMessage
            } catch {
              errorMessage = xhr.responseText || errorMessage
            }

            const error = new Error(errorMessage)
            error.status = xhr.status
            reject(error)
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was aborted'))
        })

        // Get auth token and set up request
        const token = this.authService.getToken()
        if (!token) {
          reject(new Error('No authentication token available'))
          return
        }

        xhr.open('POST', `${this.baseURL}/api/files`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)

        // Send the request
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw error
    }
  }

  /**
   * Download a file by ID
   * @param {string} fileId - The UUID of the file to download
   * @returns {Promise<void>}
   */
  async downloadFile(fileId) {
    try {
      if (this.debug) {
        console.log('Downloading file:', fileId)
      }

      const url = `${this.baseURL}/api/files/${fileId}/download`

      const response = await this.authService.authenticatedFetch(url, {
        method: 'GET',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `Download failed: ${response.status}`

        try {
          const json = JSON.parse(errorText)
          message = json.message || message
        } catch {
          message = errorText || message
        }

        const error = new Error(message)
        error.status = response.status
        throw error
      }

      // Get filename from Content-Disposition header or use fallback
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'download'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      if (this.debug) {
        console.log('File downloaded successfully:', filename)
      }
    } catch (error) {
      console.error('Failed to download file:', error)
      throw error
    }
  }
}

let fileApiServiceInstance = null

export function getFileApiService() {
  if (!fileApiServiceInstance) {
    fileApiServiceInstance = new FileApiService()
  }
  return fileApiServiceInstance
}

export default FileApiService
