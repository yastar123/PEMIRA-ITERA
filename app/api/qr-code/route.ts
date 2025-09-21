// app/api/qr-code/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/session'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/qr-code called')
    
    const user = await getUserFromRequest(request)
    console.log('User from request:', user ? { id: user.id, email: user.email } : null)
    
    if (!user) {
      console.log('User not authenticated')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (user.hasVoted) {
      console.log('User has already voted')
      return NextResponse.json(
        { error: 'User has already voted' },
        { status: 400 }
      )
    }

    console.log('Checking for existing session...')

    // Check if user already has an active voting session
    const existingSession = await prisma.votingSession.findFirst({
      where: { 
        userId: user.id,
        expiresAt: {
          gt: new Date() // Only get non-expired sessions
        },
        isUsed: false
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('Existing session:', existingSession ? { id: existingSession.id, isValidated: existingSession.isValidated } : null)

    if (existingSession) {
      console.log('Returning existing session')
      
      // Return existing session if still valid
      const qrCodeDataURL = await QRCode.toDataURL(existingSession.qrCode, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 200,
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
          expiresAt: existingSession.expiresAt.toISOString()
        }
      })
    }

    console.log('Creating new session...')

    // Generate new voting session
    const timestamp = Date.now().toString()
    const randomString = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()
    const qrCode = `ITERA${timestamp}${randomString}`
    const redeemCode = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

    console.log('Generated codes:', { qrCode, redeemCode })

    // Delete any old expired sessions for this user
    await prisma.votingSession.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lte: new Date()
        }
      }
    })

    console.log('Creating session in database...')

    const session = await prisma.votingSession.create({
      data: {
        userId: user.id,
        qrCode,
        redeemCode,
        expiresAt
      }
    })

    console.log('Session created:', { id: session.id })

    // Generate QR code image
    console.log('Generating QR code image...')
    const qrCodeDataURL = await QRCode.toDataURL(qrCode, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    console.log('QR code image generated successfully')

    const response = {
      session: {
        id: session.id,
        qrCode: session.qrCode,
        redeemCode: session.redeemCode,
        qrCodeImage: qrCodeDataURL,
        isValidated: session.isValidated,
        isUsed: session.isUsed,
        expiresAt: session.expiresAt.toISOString()
      }
    }

    console.log('Returning response:', { sessionId: response.session.id })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Generate QR error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/qr-code called')
    
    const user = await getUserFromRequest(request)
    console.log('User from request:', user ? { id: user.id, email: user.email } : null)
    
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
        },
        isUsed: false
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
      width: 200,
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
        expiresAt: session.expiresAt.toISOString()
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