// API client utility for making authenticated requests
export class ApiClient {
  private static baseUrl = '/api'

  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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

  static async createCandidate(candidateData: any) {
    return this.request('/candidates', {
      method: 'POST',
      body: JSON.stringify(candidateData),
    })
  }

  static async updateCandidate(candidateId: string, data: any) {
    return this.request(`/candidates/${candidateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  static async deleteCandidate(candidateId: string) {
    return this.request(`/candidates/${candidateId}`, {
      method: 'DELETE',
    })
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
}