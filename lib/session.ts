import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export function getSession(token: string): string | null {
  try {
    // In a real app, you'd decode a JWT token here
    // For simplicity, we're using the user ID directly as the token
    return token
  } catch {
    return null
  }
}

export async function getUserFromRequest(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('user-session')?.value
    
    if (!sessionCookie) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionCookie }
    })

    return user
  } catch {
    return null
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getUserFromRequest(request)
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request)
  
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Admin access required')
  }
  
  return user
}

export async function requireSuperAdmin(request: NextRequest) {
  const user = await requireAuth(request)
  
  if (user.role !== 'SUPER_ADMIN') {
    throw new Error('Super admin access required')
  }
  
  return user
}