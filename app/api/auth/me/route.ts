import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('user-session')?.value
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Find user by session ID (which is the user ID)
    const user = await prisma.user.findUnique({
      where: { id: sessionCookie },
      select: {
        id: true,
        email: true,
        name: true,
        nim: true,
        role: true,
        hasVoted: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    console.log('Session auth success for user:', user.email)
    return NextResponse.json({ user })

  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}