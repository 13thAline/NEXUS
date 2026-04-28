// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSessionCookie } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    const { sessionCookie, expiresIn } = await createSessionCookie(idToken)

    const response = NextResponse.json({ success: true })
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Session creation failed:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
