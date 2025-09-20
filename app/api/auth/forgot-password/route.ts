import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/replitmail'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        message: 'Jika email terdaftar, kode OTP akan dikirim dalam beberapa menit.'
      })
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Store OTP in Settings table (temporary storage)
    const otpKey = `forgot_password_${email.toLowerCase()}`
    await prisma.settings.upsert({
      where: { key: otpKey },
      update: {
        value: JSON.stringify({
          otp,
          expiresAt: expiresAt.toISOString(),
          email: email.toLowerCase()
        })
      },
      create: {
        key: otpKey,
        value: JSON.stringify({
          otp,
          expiresAt: expiresAt.toISOString(),
          email: email.toLowerCase()
        }),
        description: 'Temporary OTP for password reset'
      }
    })

    // Send OTP via email
    try {
      await sendEmail({
        to: email,
        subject: 'Kode OTP Reset Password - ITERA Election',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Reset Password ITERA Election</h2>
            <p>Halo ${user.name},</p>
            <p>Anda telah meminta untuk mereset password akun voting ITERA Election Anda.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0;">Kode OTP Anda:</h3>
              <h1 style="color: #059669; font-size: 36px; letter-spacing: 4px; margin: 10px 0;">${otp}</h1>
              <p style="color: #6b7280; margin: 0;">Kode ini berlaku selama 10 menit</p>
            </div>
            <p><strong>Penting:</strong></p>
            <ul>
              <li>Jangan bagikan kode ini kepada siapapun</li>
              <li>Kode akan kedaluwarsa dalam 10 menit</li>
              <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
            </ul>
            <p>Terima kasih,<br>Tim ITERA Election</p>
          </div>
        `,
        text: `
Reset Password ITERA Election

Halo ${user.name},

Anda telah meminta untuk mereset password akun voting ITERA Election Anda.

Kode OTP Anda: ${otp}

Kode ini berlaku selama 10 menit.

PENTING:
- Jangan bagikan kode ini kepada siapapun
- Kode akan kedaluwarsa dalam 10 menit
- Jika Anda tidak meminta reset password, abaikan email ini

Terima kasih,
Tim ITERA Election
        `
      })

      console.log('OTP email sent successfully to:', email)
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      // Delete the OTP since email failed
      await prisma.settings.deleteMany({
        where: { key: otpKey }
      })
      return NextResponse.json(
        { error: 'Gagal mengirim email. Silakan coba lagi.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Kode OTP telah dikirim ke email Anda. Silakan cek inbox dan spam folder.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}