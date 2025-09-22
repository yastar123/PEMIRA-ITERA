// app/api/admin/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

function toCSV(rows: any[]): string {
  if (!rows || rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (val: any) => {
    if (val === null || val === undefined) return ''
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
    // escape quotes and wrap in quotes if contains comma, quote, or newline
    const needsQuoting = /[",\n]/.test(str)
    const escaped = str.replace(/"/g, '""')
    return needsQuoting ? `"${escaped}"` : escaped
  }
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(','))
  ]
  return lines.join('\n')
}

export async function GET(request: NextRequest) {
  // Ensure only admins can export
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { searchParams } = new URL(request.url)
  const type = (searchParams.get('type') || 'all').toLowerCase() as 'users' | 'votes' | 'all'

  try {
    // Preload datasets as needed
    const datasets: { users?: any[]; votes?: any[] } = {}

    if (type === 'users' || type === 'all') {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' }
      })
      datasets.users = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        nim: u.nim,
        prodi: u.prodi,
        gender: u.gender,
        phone: u.phone ?? '',
        role: u.role,
        hasVoted: u.hasVoted,
        createdAt: u.createdAt.toISOString()
      }))
    }

    if (type === 'votes' || type === 'all') {
      const votes = await prisma.vote.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          user: true,
          candidate: true
        }
      })
      datasets.votes = votes.map(v => ({
        id: v.id,
        createdAt: v.createdAt.toISOString(),
        userId: v.userId,
        userName: v.user?.name ?? '',
        userEmail: v.user?.email ?? '',
        userNim: v.user?.nim ?? '',
        candidateId: v.candidateId,
        candidateName: v.candidate?.name ?? ''
      }))
    }

    let csv = ''
    let filename = 'export.csv'

    if (type === 'users') {
      csv = toCSV(datasets.users || [])
      filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'votes') {
      csv = toCSV(datasets.votes || [])
      filename = `votes_export_${new Date().toISOString().split('T')[0]}.csv`
    } else {
      const sections: string[] = []
      if (datasets.users && datasets.users.length > 0) {
        sections.push('USERS')
        sections.push(toCSV(datasets.users))
        sections.push('')
      }
      if (datasets.votes && datasets.votes.length > 0) {
        sections.push('VOTES')
        sections.push(toCSV(datasets.votes))
      }
      csv = sections.join('\n')
      filename = `all_export_${new Date().toISOString().split('T')[0]}.csv`
    }

    const headers = new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    })

    return new NextResponse(csv, { status: 200, headers })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
