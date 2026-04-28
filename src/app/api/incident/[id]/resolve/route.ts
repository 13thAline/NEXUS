// src/app/api/incident/[id]/resolve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { transitionIncident } from '@/lib/incident-state'
import { updateFirestoreIncident } from '@/lib/firebase-admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: incidentId } = await params

    // Resolve the incident (writes to Firestore internally)
    const incident = await transitionIncident(incidentId, 'RESOLVED')

    // Mark all pending tasks as COMPLETE
    await prisma.task.updateMany({
      where: { incidentId, status: { not: 'COMPLETE' } },
      data: { status: 'COMPLETE', completedAt: new Date() },
    })

    // Update Firestore with final resolved state
    await updateFirestoreIncident(incidentId, {
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, incident })
  } catch (error: any) {
    console.error('[Resolve API] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
