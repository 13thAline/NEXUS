// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// These paths require authentication
const PROTECTED_PATHS = ['/dashboard', '/staff', '/simulate']

// Some API routes might be protected. For a hackathon, we'll protect dashboard and staff UI mainly.
// For API routes, if we want to secure them, we could add them here, but for now we secure the UI.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))

  if (isProtectedPath) {
    const sessionCookie = req.cookies.get('session')?.value

    if (!sessionCookie) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', req.url)
      // Optional: append original url to redirect back after login
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Allow root path to render landing page.

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)'],
}
