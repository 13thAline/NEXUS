// src/lib/firebase-admin.ts — Server-side Firebase Admin SDK
// Used for Firestore real-time state, Auth verification, and admin operations

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

let app: App

if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount)
      app = initializeApp({ credential: cert(parsed) })
    } catch (e) {
      console.error("[Firebase Admin] Init error:", e)
      // Fallback: try ADC (Application Default Credentials) on GCP
      app = initializeApp()
    }
  } else {
    app = initializeApp()
  }
} else {
  app = getApps()[0]
}

export const db = getFirestore(app)
export const auth = getAuth(app)

// ─── Firestore Helpers ───────────────────────────────────

/**
 * Update incident status in Firestore for real-time listeners.
 */
export async function updateFirestoreIncident(incidentId: string, data: Record<string, any>) {
  try {
    await db.doc(`incidents/${incidentId}`).set(data, { merge: true })
  } catch (error: any) {
    if (error.message && error.message.includes('NOT_FOUND')) {
      console.error('\n🚨 [Firebase Error] Firestore Database not found! 🚨')
      console.error('You need to initialize Firestore in your Firebase Console.')
      console.error('1. Go to https://console.firebase.google.com/project/nexus-494616/firestore')
      console.error('2. Click "Create Database"\n')
    }
    throw error
  }
}

/**
 * Write a task assignment to Firestore for a specific staff member.
 */
export async function writeFirestoreTask(incidentId: string, staffId: string, taskData: Record<string, any>) {
  await db.doc(`incidents/${incidentId}/tasks/${staffId}`).set(taskData, { merge: true })
}
