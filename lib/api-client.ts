// lib/api-client.ts
class ApiClient {
  private static baseUrl = '/api'

  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  // Auth methods
  static async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  static async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  static async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    })
  }

  static async getUser() {
    return this.request('/auth/me')
  }

  static async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  static async verifyOtpAndResetPassword(email: string, otp: string, newPassword: string) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    })
  }

  // User methods
  static async getUserByEmail(email: string) {
    return this.request(`/User?email=${encodeURIComponent(email)}`)
  }

  static async updateUser(userId: string, data: any) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Candidate methods
  static async getCandidates() {
    return this.request('/candidates')
  }

  static async createCandidate(data: any) {
    console.log('📤 Creating candidate:', data)

    const response = await fetch('/api/candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: data.name?.trim(),
        nim: data.nim?.trim(),
        prodi: data.prodi?.trim(),
        visi: data.visi?.trim(),
        misi: data.misi?.trim(),
        photo: data.photo?.trim() || null
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  static async updateCandidate(id: string, data: any) {
    console.log('📤 Updating candidate:', id, data)

    const cleanData: any = {}
    if (data.name !== undefined) cleanData.name = data.name?.trim()
    if (data.nim !== undefined) cleanData.nim = data.nim?.trim()
    if (data.prodi !== undefined) cleanData.prodi = data.prodi?.trim()
    if (data.visi !== undefined) cleanData.visi = data.visi?.trim()
    if (data.misi !== undefined) cleanData.misi = data.misi?.trim()
    if (data.photo !== undefined) cleanData.photo = data.photo?.trim() || null
    if (data.isActive !== undefined) cleanData.isActive = data.isActive

    const response = await fetch(`/api/candidates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(cleanData)
    })

    const result = await response.json()
    console.log('📥 Server response:', result)

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update candidate')
    }

    return result
  }

  static async deleteCandidate(id: string) {
    const response = await fetch(`/api/candidates/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Failed to delete candidate')
    }

    return response.json()
  }

  // Voting session methods
  static async createVotingSession() {
    return this.request('/voting-sessions', {
      method: 'POST',
    })
  }

  static async getVotingSession(userId: string) {
    return this.request(`/voting-sessions?userId=${userId}`)
  }

  static async validateSession(sessionId: string, redeemCode?: string) {
    return this.request('/admin/validate-session', {
      method: 'POST',
      body: JSON.stringify({ sessionId, redeemCode }),
    })
  }

  // Vote methods
  static async castVote(candidateId: string) {
    return this.request('/votes', {
      method: 'POST',
      body: JSON.stringify({ candidateId }),
    })
  }

  static async getVotes() {
    return this.request('/votes')
  }

  // Admin methods for the admin page
  static async getPendingSessions() {
    return this.request('/admin/pending-sessions')
  }

  static async getRecentValidations() {
    return this.request('/admin/recent-validations')
  }

  static async getAdminStats() {
    return this.request('/admin/stats')
  }

  static async findSession(params: { userId?: string; redeemCode?: string }) {
    const query = new URLSearchParams()
    if (params.userId) query.append('userId', params.userId)
    if (params.redeemCode) query.append('redeemCode', params.redeemCode)
    
    return this.request(`/admin/find-session?${query.toString()}`)
  }

  // QR Code generation
  static async generateQRCode() {
    return this.request('/generate-qr', {
      method: 'POST',
    })
  }

  static async getQRSession() {
    return this.request('/generate-qr')
  }

  // Monitoring endpoints (read-only dashboards)
  static async getMonitoringStats() {
    return this.request('/monitoring/stats')
  }

  static async getMonitoringRecentValidations() {
    return this.request('/monitoring/recent-validations')
  }

  static async getMonitoringLogs() {
    return this.request('/monitoring/logs')
  }

  static async getMonitoringSystemStatus() {
    return this.request('/monitoring/system-status')
  }
}

export { ApiClient }