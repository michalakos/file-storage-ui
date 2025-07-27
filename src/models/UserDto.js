export class UserDto {
  constructor(data = {}) {
    this.id = data.id || null
    this.username = data.username || ''
    this.email = data.email || ''
  }

  get displayName() {
    return this.username || this.email || 'Unknown User'
  }

  static fromApiResponse(apiData) {
    return new UserDto(apiData)
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
    }
  }
}
