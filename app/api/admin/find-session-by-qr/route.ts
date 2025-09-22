// app/api/admin/find-session-by-qr/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function POST(request: NextRequest) {
    try {
        const admin = await requireAdmin(request)

        if (admin instanceof NextResponse) {
            return admin
        }

        const { qrCode } = await request.json()

        if (!qrCode) {
            return NextResponse.json(
                { error: 'QR code is required' },
                { status: 400 }
            )
        }

        const session = await prisma.votingSession.findFirst({
            where: {
                qrCode: qrCode,
                isValidated: false,
                isUsed: false,
                expiresAt: {
                    gt: new Date()
                }
            },
            select: {
                id: true,
                redeemCode: true,
                userId: true,
                user: {
                    select: {
                        name: true,
                        nim: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json({ session })
    } catch (error) {
        console.error('Find session by QR error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}