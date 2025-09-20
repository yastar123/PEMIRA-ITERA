import jwt from 'jsonwebtoken'

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key'

export function createSession(userId: string): string {
  return jwt.sign(
    { userId },
    SECRET_KEY,
    { expiresIn: '7d' }
  )
}

export function verifySession(token: string): string | null {
  try {
    const payload = jwt.verify(token, SECRET_KEY) as { userId: string }
    return payload.userId
  } catch (error) {
    return null
  }
}