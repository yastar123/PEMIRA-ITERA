import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const sessions = await prisma.votingSession.findMany({
      where: {
        isValidated: true
      },
      include: {
        user: {
          select: {
            name: true,
            nim: true,
            prodi: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Get recent validations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}