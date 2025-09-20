import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json()

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, dan password baru diperlukan' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Get OTP from Settings
    const otpKey = `forgot_password_${email.toLowerCase()}`
    const otpRecord = await prisma.settings.findUnique({
      where: { key: otpKey }
    })

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Kode OTP tidak valid atau sudah kedaluwarsa' },
        { status: 400 }
      )
    }

    let otpData
    try {
      otpData = JSON.parse(otpRecord.value)
    } catch {
      return NextResponse.json(
        { error: 'Kode OTP tidak valid' },
        { status: 400 }
      )
    }

    // Check if OTP is expired
    const now = new Date()
    const expiresAt = new Date(otpData.expiresAt)
    if (now > expiresAt) {
      // Delete expired OTP
      await prisma.settings.delete({
        where: { key: otpKey }
      })
      return NextResponse.json(
        { error: 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.' },
        { status: 400 }
      )
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return NextResponse.json(
        { error: 'Kode OTP salah' },
        { status: 400 }
      )
    }

    // Verify email matches
    if (otpData.email !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email tidak sesuai' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    // Delete used OTP
    await prisma.settings.delete({
      where: { key: otpKey }
    })

    console.log('Password reset successful for user:', user.email)

    return NextResponse.json({
      message: 'Password berhasil direset. Anda sekarang dapat login dengan password baru.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}