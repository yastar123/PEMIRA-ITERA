// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/auth/logout called')

    // Create response
    const response = NextResponse.json({
      message: 'Logged out successfully'
    })

    // Clear the session cookie securely
    response.cookies.set('user-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // This will delete the cookie
      path: '/' // Make sure to clear from root path
    })

    console.log('Session cookie cleared')

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Something went wrong during logout' },
      { status: 500 }
    )
  }
}