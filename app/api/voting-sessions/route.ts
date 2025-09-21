import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, getUserFromRequest } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (user.hasVoted) {
      return NextResponse.json(
        { error: 'User has already voted' },
        { status: 400 }
      )
    }

    // Check if user already has an active voting session
    const existingSession = await prisma.votingSession.findFirst({
      where: { 
        userId: user.id,
        expiresAt: {
          gt: new Date() // Only get non-expired sessions
        },
        isUsed: false
      }
    })

    if (existingSession) {
      return NextResponse.json({
        session: {
          id: existingSession.id,
          qrCode: existingSession.qrCode,
          redeemCode: existingSession.redeemCode,
          isValidated: existingSession.isValidated,
          isUsed: existingSession.isUsed,
          expiresAt: existingSession.expiresAt
        }
      })
    }

    // Generate secure unique codes
    const qrCode = `QR${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`
    const redeemCode = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

    const session = await prisma.votingSession.create({
      data: {
        userId: user.id,
        qrCode,
        redeemCode,
        expiresAt
      }
    })

    return NextResponse.json({
      session: {
        id: session.id,
        qrCode: session.qrCode,
        redeemCode: session.redeemCode,
        isValidated: session.isValidated,
        isUsed: session.isUsed,
        expiresAt: session.expiresAt
      }
    })
  } catch (error) {
    console.error('Create voting session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = await prisma.votingSession.findFirst({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            name: true,
            nim: true,
            email: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'No voting session found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Get voting session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}