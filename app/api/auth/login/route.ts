import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('Login attempt for email:', email)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Method 1: Coba dengan Prisma dulu (seperti kode original Anda)
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      console.log('Prisma user found:', user ? 'Yes' : 'No')

      if (!user || user.password !== password) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Jika Prisma berhasil, coba sign in ke Supabase
      const supabase = await createClient()

      // Check if user exists in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      })

      console.log('Supabase auth result:', { 
        success: !authError, 
        error: authError?.message 
      })

      // Jika Supabase auth gagal, tetap return success dengan Prisma data
      if (authError) {
        console.log('Supabase auth failed, using Prisma data only')
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            nim: user.nim,
            role: user.role,
            hasVoted: user.hasVoted
          },
          authMethod: 'prisma-only'
        })
      }

      // Jika Supabase auth berhasil
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          nim: user.nim,
          role: user.role,
          hasVoted: user.hasVoted
        },
        session: authData.session,
        authMethod: 'supabase+prisma'
      })

    } catch (prismaError) {
      console.error('Prisma error:', prismaError)
      
      // Fallback ke Supabase only
      const supabase = await createClient()
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      })

      if (authError) {
        console.error('Supabase auth error:', authError)
        return NextResponse.json(
          { error: 'Invalid email or password', details: authError.message },
          { status: 401 }
        )
      }

      // Get user data from Supabase
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('id, email, name, nim, role, hasVoted')
        .eq('email', authData.user.email)
        .single()

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'User data not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        user: userData,
        session: authData.session,
        authMethod: 'supabase-only'
      })
    }

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Something went wrong', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}