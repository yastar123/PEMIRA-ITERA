import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, isErrorResponse } from '@/lib/session'

export async function GET(request: NextRequest) {
    try {
        // Check admin authentication
        const adminUser = await requireAdmin(request)

        // If requireAdmin returns an error response, return it
        if (isErrorResponse(adminUser)) {
            return adminUser
        }

        console.log('Admin accessing recent validations:', adminUser.email)

        const sessions = await prisma.votingSession.findMany({
            where: {
                isValidated: true
            },
            include: {
                user: {
                    select: {
                        name: true,
                        nim: true,
                        prodi: true,
                        email: true
                    }
                },
                validator: {
                    select: {
                        name: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50 // Last 50 validations
        })

        return NextResponse.json({
            sessions,
            message: 'Recent validations retrieved successfully'
        })

    } catch (error) {
        console.error('Recent validations error:', error)

        // Handle Prisma specific errors
        if (error instanceof Error) {
            if (error.message.includes('Record to update not found')) {
                return NextResponse.json(
                    { error: 'Data tidak ditemukan' },
                    { status: 404 }
                )
            }

            if (error.message.includes('Unique constraint')) {
                return NextResponse.json(
                    { error: 'Data sudah ada' },
                    { status: 409 }
                )
            }
        }

        return NextResponse.json(
            { error: 'Terjadi kesalahan server internal' },
            { status: 500 }
        )
    }
}