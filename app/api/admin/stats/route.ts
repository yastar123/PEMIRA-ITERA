import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    // Get total users (voters only)
    const totalUsers = await prisma.user.count({
      where: { role: 'VOTER' }
    })

    // Get total votes
    const totalVotes = await prisma.vote.count()

    // Get total active candidates
    const totalCandidates = await prisma.candidate.count({
      where: { isActive: true }
    })

    // Get pending validations
    const pendingValidations = await prisma.votingSession.count({
      where: {
        isValidated: false,
        isUsed: false,
        expiresAt: {
          gte: new Date()
        }
      }
    })

    // Calculate voting percentage
    const votingPercentage = totalUsers ? Math.round((totalVotes / totalUsers) * 100) : 0

    const stats = {
      totalUsers,
      totalVotes,
      totalCandidates,
      pendingValidations,
      votingPercentage
    }

    // Get vote statistics by candidate
    const voteData = await prisma.vote.findMany({
      include: {
        candidate: {
          select: {
            name: true
          }
        }
      }
    })

    const voteCounts = voteData.reduce((acc: any, vote: any) => {
      const candidateId = vote.candidateId
      const candidateName = vote.candidate?.name || 'Unknown'
      acc[candidateId] = {
        candidateId,
        candidateName,
        voteCount: (acc[candidateId]?.voteCount || 0) + 1,
      }
      return acc
    }, {})

    const voteStats = Object.values(voteCounts).map((item: any) => ({
      ...item,
      percentage: totalVotes ? Math.round((item.voteCount / totalVotes) * 100) : 0,
    }))

    return NextResponse.json({ stats, voteStats })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}