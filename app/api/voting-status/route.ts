// app/api/voting-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user's voting session
    const votingSession = await prisma.votingSession.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get user's vote if exists
    const vote = await prisma.vote.findUnique({
      where: { userId: user.id },
      include: {
        candidate: {
          select: {
            name: true,
            nim: true
          }
        }
      }
    })

    const canVote = votingSession?.isValidated && 
                   !votingSession.isUsed && 
                   !user.hasVoted &&
                   new Date() < votingSession.expiresAt

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        nim: user.nim,
        hasVoted: user.hasVoted
      },
      votingSession: votingSession ? {
        id: votingSession.id,
        isValidated: votingSession.isValidated,
        isUsed: votingSession.isUsed,
        expiresAt: votingSession.expiresAt
      } : null,
      vote: vote ? {
        id: vote.id,
        candidateName: vote.candidate.name,
        candidateNim: vote.candidate.nim,
        createdAt: vote.createdAt
      } : null,
      canVote
    })
  } catch (error) {
    console.error('Get voting status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}