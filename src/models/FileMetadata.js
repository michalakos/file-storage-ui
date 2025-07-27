import { UserDto } from './UserDto'

export class FileMetadata {
  constructor(data = {}) {
    this.id = data.id || null
    this.filename = data.filename || ''
    this.contentType = data.contentType || ''
    this.originalFileSize = data.originalFileSize || 0
    this.size = data.size || 0
    this.storagePath = data.storagePath || ''
    this.uploadDate = data.uploadDate ? new Date(data.uploadDate) : null
    this.userDto = data.userDto ? new UserDto(data.userDto) : null
  }

  // Computed properties/getters
  get formattedFileSize() {
    return this.formatBytes(this.originalFileSize)
  }

  get formattedUploadDate() {
    if (!this.uploadDate) return 'Unknown'
    return this.uploadDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  get fileExtension() {
    return this.filename.split('.').pop()?.toLowerCase() || ''
  }

  get isImage() {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']
    return imageTypes.includes(this.fileExtension)
  }

  get isPdf() {
    return this.contentType === 'application/pdf'
  }

  get isJson() {
    return this.contentType === 'application/json'
  }

  get isText() {
    return this.contentType.startsWith('text/')
  }

  // Utility methods
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // Static factory method
  static fromApiResponse(apiData) {
    return new FileMetadata(apiData)
  }

  // Convert back to plain object (for API calls)
  toJSON() {
    return {
      id: this.id,
      filename: this.filename,
      contentType: this.contentType,
      originalFileSize: this.originalFileSize,
      size: this.size,
      storagePath: this.storagePath,
      uploadDate: this.uploadDate?.toISOString(),
      userDto: this.userDto?.toJSON(),
    }
  }
}
