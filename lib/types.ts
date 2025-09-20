export type Role = "VOTER" | "ADMIN" | "SUPER_ADMIN"

export interface User {
  id: string
  email: string
  nim: string
  name: string
  prodi: string
  gender: string
  phone?: string
  role: Role
  hasVoted: boolean
  createdAt: string
  updatedAt: string
}

export interface Candidate {
  id: string
  name: string
  nim: string
  prodi: string
  visi: string
  misi: string
  photo?: string
  isActive: boolean
  createdAt: string
}

export interface VotingSession {
  id: string
  userId: string
  qrCode: string
  redeemCode: string
  isValidated: boolean
  isUsed: boolean
  validatedBy?: string
  expiresAt: string
  createdAt: string
  user?: User
  validator?: User
}

export interface Vote {
  id: string
  userId: string
  candidateId: string
  createdAt: string
  user?: User
  candidate?: Candidate
}

export interface AdminLog {
  id: string
  adminId: string
  action: string
  target?: string
  details?: any
  ipAddress?: string
  createdAt: string
  admin?: User
}

export interface Settings {
  id: string
  key: string
  value: string
  description?: string
  updatedAt: string
}
