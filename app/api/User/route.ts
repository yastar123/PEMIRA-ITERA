import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const single = searchParams.get('single')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id, email, name, nim, role, hasVoted, prodi')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return format berdasarkan parameter single
    if (single === 'true') {
      return NextResponse.json(userData)
    } else {
      return NextResponse.json({ user: userData })
    }

  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}