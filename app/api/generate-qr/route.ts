import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/session'
import QRCode from 'qrcode'

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
        }
      }
    })

    if (existingSession && !existingSession.isUsed) {
      // Return existing session if still valid
      const qrCodeDataURL = await QRCode.toDataURL(existingSession.qrCode, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      return NextResponse.json({
        session: {
          id: existingSession.id,
          qrCode: existingSession.qrCode,
          redeemCode: existingSession.redeemCode,
          qrCodeImage: qrCodeDataURL,
          isValidated: existingSession.isValidated,
          isUsed: existingSession.isUsed,
          expiresAt: existingSession.expiresAt
        }
      })
    }

    // Generate new voting session
    const qrCode = `QR${crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase()}`
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

    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(qrCode, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return NextResponse.json({
      session: {
        id: session.id,
        qrCode: session.qrCode,
        redeemCode: session.redeemCode,
        qrCodeImage: qrCodeDataURL,
        isValidated: session.isValidated,
        isUsed: session.isUsed,
        expiresAt: session.expiresAt
      }
    })
  } catch (error) {
    console.error('Generate QR error:', error)
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

    // Get current voting session
    const session = await prisma.votingSession.findFirst({
      where: { 
        userId: user.id,
        expiresAt: {
          gt: new Date() // Only get non-expired sessions
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'No active voting session found' },
        { status: 404 }
      )
    }

    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(session.qrCode, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return NextResponse.json({
      session: {
        id: session.id,
        qrCode: session.qrCode,
        redeemCode: session.redeemCode,
        qrCodeImage: qrCodeDataURL,
        isValidated: session.isValidated,
        isUsed: session.isUsed,
        expiresAt: session.expiresAt
      }
    })
  } catch (error) {
    console.error('Get QR session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}