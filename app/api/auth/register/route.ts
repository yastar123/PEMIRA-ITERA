import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, name, nim, prodi, gender, phone, password } = await request.json()

    if (!email || !name || !nim || !prodi || !gender || !password) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate ITERA email format
    if (!email.endsWith('@itera.ac.id')) {
      return NextResponse.json(
        { error: 'Must use ITERA email address' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { nim }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or NIM already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        nim,
        prodi,
        gender,
        phone: phone || null,
        passwordHash
      }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nim: user.nim,
        role: user.role,
        hasVoted: user.hasVoted
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}