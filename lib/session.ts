import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export function getSession(token: string): any | null {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'itera-election-secret-key-2025'
    const decoded = jwt.verify(token, jwtSecret)
    return decoded
  } catch {
    return null
  }
}

export async function getUserFromRequest(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('user-session')?.value

    if (!sessionToken) {
      return null
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'itera-election-secret-key-2025'
    const decoded = jwt.verify(sessionToken, jwtSecret) as any
    
    if (!decoded || !decoded.userId) {
      return null
    }

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        nim: true,
        prodi: true,
        role: true,
        hasVoted: true,
        createdAt: true
      }
    })

    // Verify user still exists and email matches token
    if (!user || user.email !== decoded.email) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getUserFromRequest(request)

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  return user
}

export async function requireMonitoringAccess(request: NextRequest) {
  const user = await getUserFromRequest(request)

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const role = String((user as any).role)
  if (role !== 'SUPER_ADMIN' && role !== 'MONITORING') {
    return NextResponse.json(
      { error: 'Monitoring access required' },
      { status: 403 }
    )
  }

  return user
}

export async function requireAdmin(request: NextRequest) {
  const user = await getUserFromRequest(request)

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  return user
}

export async function requireSuperAdmin(request: NextRequest) {
  const user = await getUserFromRequest(request)

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Super admin access required' },
      { status: 403 }
    )
  }

  return user
}

// Additional helper functions for better compatibility
export async function getUser(request: NextRequest) {
  return getUserFromRequest(request)
}

// Helper function untuk cek apakah response adalah error
export function isErrorResponse(response: any): response is NextResponse {
  return response instanceof NextResponse && response.status >= 400
}