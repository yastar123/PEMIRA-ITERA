// /api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    
    // Get current date for today's calculations
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Run all queries in parallel for better performance
    const [
      totalUsers,
      totalPending,
      totalValidated,
      totalVoted,
      todayValidations
    ] = await Promise.all([
      // Total registered users (voters only)
      prisma.user.count({
        where: {
          role: 'VOTER'
        }
      }),

      // Total pending sessions (not validated, not expired)
      prisma.votingSession.count({
        where: {
          isValidated: false,
          isUsed: false,
          expiresAt: {
            gte: new Date()
          }
        }
      }),

      // Total validated sessions
      prisma.votingSession.count({
        where: {
          isValidated: true
        }
      }),

      // Total users who have voted
      prisma.user.count({
        where: {
          hasVoted: true,
          role: 'VOTER'
        }
      }),

      // Today's validations
      prisma.votingSession.count({
        where: {
          isValidated: true,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })
    ])

    const stats = {
      totalUsers,
      totalPending,
      totalValidated,
      totalVoted,
      todayValidations
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}