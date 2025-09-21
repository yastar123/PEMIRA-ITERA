import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('Login attempt for email:', email)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        nim: true,
        prodi: true,
        role: true,
        hasVoted: true,
        password: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    console.log('Login successful for user:', user.email)

    // Create response with user data (exclude password)
    const { password: _, ...userWithoutPassword } = user
    
    const response = NextResponse.json({
      user: userWithoutPassword,
      message: 'Login berhasil'
    })

    // Create JWT session token
    const jwtSecret = process.env.JWT_SECRET || 'itera-election-secret-key-2025'
    const sessionToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Set secure session cookie
    response.cookies.set('user-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    )
  }
}