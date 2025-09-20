import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { votes: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    const candidatesWithVoteCount = candidates.map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      nim: candidate.nim,
      prodi: candidate.prodi,
      visi: candidate.visi,
      misi: candidate.misi,
      photo: candidate.photo,
      voteCount: candidate._count.votes
    }))

    return NextResponse.json({ candidates: candidatesWithVoteCount })
  } catch (error) {
    console.error('Get candidates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userId = getSession(authToken)
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { name, nim, prodi, visi, misi, photo } = await request.json()

    if (!name || !nim || !prodi || !visi || !misi) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      )
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        nim,
        prodi,
        visi,
        misi,
        photo: photo || null
      }
    })

    return NextResponse.json({ candidate })
  } catch (error) {
    console.error('Create candidate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}