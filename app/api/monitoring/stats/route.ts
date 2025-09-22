import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireMonitoringAccess } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireMonitoringAccess(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const [
      totalUsers,
      totalVotes,
      totalCandidates,
      pendingValidations,
      candidateWithCounts
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'VOTER' } }),
      prisma.vote.count(),
      prisma.candidate.count({ where: { isActive: true } }),
      prisma.votingSession.count({
        where: {
          isValidated: false,
          isUsed: false,
          expiresAt: { gte: new Date() }
        }
      }),
      prisma.candidate.findMany({
        where: { isActive: true },
        include: { _count: { select: { votes: true } } },
        orderBy: { createdAt: 'asc' }
      })
    ])

    const votingPercentage = totalUsers > 0 ? Math.round((totalVotes / totalUsers) * 100) : 0

    const voteStats = candidateWithCounts.map((c) => ({
      candidateId: c.id,
      candidateName: c.name,
      voteCount: c._count.votes,
      percentage: totalVotes > 0 ? parseFloat(((c._count.votes / totalVotes) * 100).toFixed(2)) : 0
    }))

    const stats = {
      totalUsers,
      totalVotes,
      totalCandidates,
      pendingValidations,
      votingPercentage
    }

    return NextResponse.json({ stats, voteStats })
  } catch (error) {
    console.error('Monitoring stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
