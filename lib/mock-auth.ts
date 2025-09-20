// Mock authentication utilities for testing

export interface MockUser {
  email: string
  password: string
  role: "SUPER_ADMIN" | "ADMIN" | "VOTER"
  name: string
  nim?: string
  prodi?: string
  hasVoted: boolean
  id?: string
}

// Get current mock user from localStorage
export function getMockUser(): MockUser | null {
  if (typeof window === "undefined") return null

  try {
    const userData = localStorage.getItem("mockUser")
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

// Set mock user in localStorage
export function setMockUser(user: MockUser): void {
  if (typeof window === "undefined") return

  localStorage.setItem("mockUser", JSON.stringify(user))
}

// Clear mock user session
export function clearMockUser(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem("mockUser")
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getMockUser() !== null
}

// Check if user has specific role
export function hasRole(role: MockUser["role"]): boolean {
  const user = getMockUser()
  return user?.role === role
}

// Mock database operations for testing
export const mockDatabase = {
  // Mock candidates data
  candidates: [
    {
      id: "1",
      name: "Ahmad Rizki Pratama",
      nim: "121450001",
      prodi: "Teknik Informatika",
      visi: "Mewujudkan ITERA yang lebih maju, inovatif, dan berprestasi dengan mengedepankan kolaborasi antar mahasiswa dari berbagai fakultas.",
      misi: "Meningkatkan fasilitas kampus, mengoptimalkan program kemahasiswaan, dan memperkuat hubungan dengan industri untuk mempersiapkan mahasiswa menghadapi dunia kerja.",
      photo: "/placeholder.svg?height=400&width=400",
      isActive: true,
    },
    {
      id: "2",
      name: "Sari Indah Permata",
      nim: "121450002",
      prodi: "Teknik Sipil",
      visi: "Membangun ITERA yang inklusif, berkelanjutan, dan berdaya saing tinggi melalui pemberdayaan potensi mahasiswa di segala bidang.",
      misi: "Mengembangkan program kewirausahaan mahasiswa, meningkatkan kualitas organisasi kemahasiswaan, dan memperkuat jaringan alumni untuk mendukung karir mahasiswa.",
      photo: "/placeholder.svg?height=400&width=400",
      isActive: true,
    },
    {
      id: "3",
      name: "Muhammad Fajar Sidiq",
      nim: "121450003",
      prodi: "Teknik Elektro",
      visi: "Menciptakan ekosistem kampus yang mendukung inovasi, kreativitas, dan pengembangan soft skills mahasiswa untuk menghadapi era digital.",
      misi: "Digitalisasi layanan kemahasiswaan, pengembangan program magang dan pertukaran mahasiswa, serta peningkatan kualitas kegiatan ekstrakurikuler.",
      photo: "/placeholder.svg?height=400&width=400",
      isActive: true,
    },
  ],

  // Mock voting session
  votingSession: null as any,

  // Mock vote storage
  votes: [] as any[],

  // Generate mock QR code
  generateQRCode: () => {
    const user = getMockUser()
    if (!user) return null

    const redeemCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    const qrData = JSON.stringify({
      userId: user.email,
      redeemCode,
      timestamp: Date.now(),
    })

    const session = {
      id: Date.now().toString(),
      userId: user.email,
      qrCode: qrData,
      redeemCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      isValidated: false,
      isUsed: false,
      createdAt: new Date().toISOString(),
    }

    mockDatabase.votingSession = session
    return session
  },

  // Validate QR code (mock admin function)
  validateQRCode: (redeemCode: string) => {
    if (mockDatabase.votingSession?.redeemCode === redeemCode) {
      mockDatabase.votingSession.isValidated = true
      return true
    }
    return false
  },

  // Submit vote
  submitVote: (candidateId: string) => {
    const user = getMockUser()
    if (!user || user.hasVoted) return false

    // Add vote
    mockDatabase.votes.push({
      id: Date.now().toString(),
      userId: user.email,
      candidateId,
      createdAt: new Date().toISOString(),
    })

    // Update user
    user.hasVoted = true
    setMockUser(user)

    // Mark session as used
    if (mockDatabase.votingSession) {
      mockDatabase.votingSession.isUsed = true
    }

    return true
  },

  // Get voting results
  getResults: () => {
    const results = mockDatabase.candidates.map((candidate) => ({
      ...candidate,
      voteCount: mockDatabase.votes.filter((vote) => vote.candidateId === candidate.id).length,
    }))

    return results.sort((a, b) => b.voteCount - a.voteCount)
  },
}
