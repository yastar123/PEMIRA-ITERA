import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireMonitoringAccess, isErrorResponse } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const user = await requireMonitoringAccess(request)
    if (isErrorResponse(user)) return user

    const sessions = await prisma.votingSession.findMany({
      where: { isValidated: true },
      include: {
        user: { select: { name: true, nim: true, prodi: true, email: true } },
        validator: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Monitoring recent validations error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server internal' }, { status: 500 })
  }
}
