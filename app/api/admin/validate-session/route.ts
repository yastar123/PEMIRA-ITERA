import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const adminId = getSession(authToken)
    if (!adminId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    })

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
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

    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 400 }
      )
    }

    // Validate the session
    const updatedSession = await prisma.votingSession.update({
      where: { id: session.id },
      data: {
        isValidated: true,
        validatedBy: admin.id
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