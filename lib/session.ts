// Simple session management for demo - in production use Redis or database
const sessions = new Map<string, string>()

export function createSession(userId: string): string {
  const sessionToken = crypto.randomUUID()
  sessions.set(sessionToken, userId)
  return sessionToken
}

export function getSession(token: string): string | null {
  return sessions.get(token) || null
}

export function deleteSession(token: string): void {
  sessions.delete(token)
}