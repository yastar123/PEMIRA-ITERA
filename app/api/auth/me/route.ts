import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    // Method 1: Coba JWT dari Authorization header
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
        
        // Get user dari Prisma
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            nim: true,
            role: true,
            hasVoted: true
          }
        })

        if (user) {
          console.log('JWT auth success for user:', user.email)
          return NextResponse.json({ user })
        }
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError)
      }
    }

    // Method 2: Fallback ke Supabase session
    try {
      const supabase = await createClient()

      const {
        data: { user: supabaseUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (!authError && supabaseUser) {
        // Get user data dari Supabase
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('id, email, name, nim, role, hasVoted')
          .eq('email', supabaseUser.email)
          .single()

        if (!userError && userData) {
          console.log('Supabase auth success for user:', userData.email)
          return NextResponse.json({ user: userData })
        }
      }
    } catch (supabaseError) {
      console.log('Supabase auth failed:', supabaseError)
    }

    // Method 3: Fallback ke Prisma dengan session ID jika ada
    const sessionId = request.headers.get('X-Session-ID')
    if (sessionId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: sessionId },
          select: {
            id: true,
            email: true,
            name: true,
            nim: true,
            role: true,
            hasVoted: true
          }
        })

        if (user) {
          console.log('Session ID auth success for user:', user.email)
          return NextResponse.json({ user })
        }
      } catch (sessionError) {
        console.log('Session auth failed:', sessionError)
      }
    }

    // Tidak ada method auth yang berhasil
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}