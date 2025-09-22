import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireMonitoringAccess, isErrorResponse } from '@/lib/session'

export async function GET(request: NextRequest) {
  const user = await requireMonitoringAccess(request)
  if (isErrorResponse(user)) return user

  try {
    const logs = await prisma.adminLog.findMany({
      include: {
        admin: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Monitoring logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
