// app/api/candidates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/candidates called')

    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('Loading candidates for user:', user.id)

    // Get active candidates
    const candidates = await prisma.candidate.findMany({
      where: { 
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        nim: true,
        prodi: true,
        visi: true,
        misi: true,
        photo: true,
        isActive: true
      },
      orderBy: { 
        createdAt: 'asc' 
      }
    })

    console.log('Found candidates:', candidates.length)

    return NextResponse.json({
      candidates
    })
  } catch (error) {
    console.error('Get candidates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}