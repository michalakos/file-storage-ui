import { getAuthService } from '@/services/authService'
import { FileMetadata } from '@/models/FileMetadata'

class FileApiService {
  constructor() {
    this.authService = getAuthService()
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    this.debug = import.meta.env.VITE_DEBUG === 'true'
  }

  /**
   * Get the authenticated user's most recent files
   * @returns {Promise<Object>}
   */
  async getRecentFiles(limit = 4) {
    try {
      if (this.debug) {
        console.log(`Fetching user's ${limit} most recent files...`)
      }

      const url = new URL(`${this.baseURL}/api/files/recent`)
      url.searchParams.append('limit', limit.toString())

      const response = await this.authService.authenticatedFetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `Recent files fetch failed: ${response.status}`

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

      const fileDataArray = await response.json()
      const mappedFiles = fileDataArray.map((fileData) => FileMetadata.fromApiResponse(fileData))

      if (this.debug) {
        console.log('Raw file data:', fileDataArray)
        console.log('Mapped file objects:', mappedFiles)
      }

      return mappedFiles
    } catch (error) {
      console.error('Failed to load recent files:', error)
      throw error
    }
  }

  /**
   * Upload a file to the server
   * @param {File} file - The file object to upload
   * @param {Function} onProgress - Optional progress callback function
   * @returns {Promise<FileMetadata>} The uploaded file metadata
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
              const fileMetadata = FileMetadata.fromApiResponse(responseData)

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

  /**
   * Delete a file by ID
   * @param {string} fileId - The UUID of the file to download
   * @returns {Promise<void>}
   */
  async deleteFile(fileId) {
    try {
      if (this.debug) {
        console.log('Deleting file:', fileId)
      }

      const url = `${this.baseURL}/api/files/${fileId}`

      const response = await this.authService.authenticatedFetch(url, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = `Deletion failed: ${response.status}`

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

      if (this.debug) {
        console.log('File deleted successfully:', fileId)
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }
}

// Create a singleton instance
let fileApiServiceInstance = null

export function getFileApiService() {
  if (!fileApiServiceInstance) {
    fileApiServiceInstance = new FileApiService()
  }
  return fileApiServiceInstance
}

export default FileApiService
