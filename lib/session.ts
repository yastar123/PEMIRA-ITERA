import { NextRequest, NextResponse } from 'next/server'
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
      where: { id: sessionCookie },
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