import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    
    // Delete session if it exists
    if (authToken) {
      deleteSession(authToken)
    }
    
    const response = NextResponse.json({ success: true })
    
    // Clear the authentication cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}