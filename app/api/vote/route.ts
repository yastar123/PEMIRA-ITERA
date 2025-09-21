// app/api/vote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/vote called')

    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (user.hasVoted) {
      return NextResponse.json(
        { error: 'You have already voted' },
        { status: 400 }
      )
    }

    const { candidateId } = await request.json()

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      )
    }

    console.log('Voting for candidate:', candidateId)

    // Verify candidate exists and is active
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    })

    if (!candidate || !candidate.isActive) {
      return NextResponse.json(
        { error: 'Candidate not found or not active' },
        { status: 404 }
      )
    }

    // Check if user has a validated voting session
    const votingSession = await prisma.votingSession.findFirst({
      where: {
        userId: user.id,
        isValidated: true,
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    })

    if (!votingSession) {
      return NextResponse.json(
        { error: 'No valid voting session found. Please get your QR code validated first.' },
        { status: 400 }
      )
    }

    console.log('Valid voting session found:', votingSession.id)

    // Create vote in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the vote (unique constraint prevents double voting)
      const vote = await tx.vote.create({
        data: {
          userId: user.id,
          candidateId: candidateId
        }
      })

      // Update user hasVoted status
      await tx.user.update({
        where: { id: user.id },
        data: { hasVoted: true }
      })

      // Mark voting session as used
      await tx.votingSession.update({
        where: { id: votingSession.id },
        data: { isUsed: true }
      })

      return vote
    })

    console.log('Vote recorded successfully:', result.id)

    return NextResponse.json({ 
      success: true,
      message: 'Vote recorded successfully',
      vote: {
        id: result.id,
        candidateId: result.candidateId
      }
    })
  } catch (error) {
    console.error('Vote error:', error)
    
    // Handle Prisma unique constraint violation (double voting attempt)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already voted' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const voteStats = await prisma.candidate.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { votes: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    const totalVotes = await prisma.vote.count()

    const stats = voteStats.map(candidate => ({
      candidateId: candidate.id,
      candidateName: candidate.name,
      voteCount: candidate._count.votes,
      percentage: totalVotes > 0 ? ((candidate._count.votes / totalVotes) * 100).toFixed(2) : 0
    }))

    return NextResponse.json({ 
      stats,
      totalVotes 
    })
  } catch (error) {
    console.error('Get vote stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}