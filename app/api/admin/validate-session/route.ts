import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    
    // Check if requireAdmin returned an error response
    if (admin instanceof NextResponse) {
      return admin
    }

    const { qrCode, redeemCode } = await request.json()

    if (!qrCode && !redeemCode) {
      return NextResponse.json(
        { error: 'QR code or redeem code is required' },
        { status: 400 }
      )
    }

    // Find voting session by QR code or redeem code
    const session = await prisma.votingSession.findFirst({
      where: {
        OR: [
          { qrCode: qrCode || '' },
          { redeemCode: redeemCode || '' }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            nim: true,
            email: true,
            hasVoted: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid QR code or redeem code' },
        { status: 404 }
      )
    }

    if (session.isValidated) {
      return NextResponse.json(
        { error: 'Session already validated' },
        { status: 400 }
      )
    }

    // Enforce strict 5-minute window from creation time
    const maxExpiry = new Date(session.createdAt.getTime() + 5 * 60 * 1000)
    const now = new Date()
    if (now > maxExpiry) {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 400 }
      )
    }

    if (session.expiresAt < now) {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 400 }
      )
    }

    // Check if session is already used (additional security)
    if (session.isUsed) {
      return NextResponse.json(
        { error: 'Session already used' },
        { status: 400 }
      )
    }

    // Validate the session with proper timestamp
    const validatedAt = new Date()
    const updatedSession = await prisma.votingSession.update({
      where: { id: session.id },
      data: {
        isValidated: true,
        validatedBy: admin.id,
        validatedAt: validatedAt,
        // Clamp stored expiresAt to not exceed the 5-minute window
        expiresAt: session.expiresAt > maxExpiry ? maxExpiry : session.expiresAt
      },
      include: {
        user: {
          select: {
            name: true,
            nim: true,
            email: true,
            hasVoted: true
          }
        }
      }
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: 'VALIDATE_SESSION',
        target: session.userId,
        details: {
          sessionId: session.id,
          qrCode: session.qrCode,
          redeemCode: session.redeemCode
        }
      }
    })

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: 'Session validated successfully'
    })
  } catch (error) {
    console.error('Validate session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}