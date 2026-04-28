// src/lib/auth-helpers.ts
import { auth as adminAuth } from './firebase-admin'

// Helper to verify the session cookie via firebase-admin
export async function verifySessionCookie(sessionCookie: string) {
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decodedClaims
  } catch (error) {
    return null
  }
}

export async function createSessionCookie(idToken: string) {
  // Set session expiration to 5 days
  const expiresIn = 60 * 60 * 24 * 5 * 1000
  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
    return { sessionCookie, expiresIn }
  } catch (err) {
    console.warn('[NEXUS] Firebase Admin auth failed (likely no service account). Falling back to mock session.')
    return { sessionCookie: `mock_session_${idToken.substring(0, 20)}`, expiresIn }
  }
}
