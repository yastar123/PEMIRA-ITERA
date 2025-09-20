import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const redeemCode = searchParams.get('redeemCode')

    if (!redeemCode) {
      return NextResponse.json(
        { error: 'Redeem code is required' },
        { status: 400 }
      )
    }

    const where: any = {
      redeemCode: redeemCode.toUpperCase(),
      isValidated: false,
      isUsed: false
    }

    if (userId) {
      where.userId = userId
    }

    const session = await prisma.votingSession.findFirst({
      where,
      select: {
        id: true
      }
    })

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Find session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}