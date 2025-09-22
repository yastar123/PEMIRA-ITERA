import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireMonitoringAccess, isErrorResponse } from '@/lib/session'

export async function GET(request: NextRequest) {
  const user = await requireMonitoringAccess(request)
  if (isErrorResponse(user)) return user

  const started = Date.now()
  let dbOk = false
  let dbLatency = 0

  try {
    const t0 = Date.now()
    await prisma.$queryRaw`SELECT 1` // PostgreSQL ping
    dbLatency = Date.now() - t0
    dbOk = true
  } catch (e) {
    dbOk = false
  }

  try {
    const [totalUsers, totalVotes, totalCandidates, pendingValidations] = await Promise.all([
      prisma.user.count(),
      prisma.vote.count(),
      prisma.candidate.count(),
      prisma.votingSession.count({
        where: { isValidated: false, isUsed: false, expiresAt: { gte: new Date() } }
      })
    ])

    const mem = typeof process !== 'undefined' && (process as any).memoryUsage ? (process as any).memoryUsage() : null

    const payload = {
      serverTime: new Date().toISOString(),
      nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown',
      environment: process.env.NODE_ENV || 'development',
      requestDurationMs: Date.now() - started,
      database: {
        ok: dbOk,
        latencyMs: dbLatency
      },
      stats: {
        totalUsers,
        totalVotes,
        totalCandidates,
        pendingValidations
      },
      runtime: {
        uptimeSec: typeof process !== 'undefined' ? Math.round(process.uptime()) : 0,
        memory: mem ? {
          rss: mem.rss,
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal
        } : null
      }
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('System status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
