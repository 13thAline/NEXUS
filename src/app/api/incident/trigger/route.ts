// src/app/api/incident/trigger/route.ts — §4
// POST — Receives raw sensor payload, creates incident, triggers 4-stage pipeline

import { NextRequest, NextResponse } from 'next/server'
import { incidentTriggerSchema } from '@/lib/validators'
import { runPipeline } from '@/lib/task-engine'
import { prisma } from '@/lib/prisma'
import { updateFirestoreIncident } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate incoming raw payload
    const parsed = incidentTriggerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid incident data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const input = parsed.data

    // Create incident record with TRIAGING status
    const incident = await prisma.incident.create({
      data: {
        source: input.source,
        rawPayload: input.rawPayload,
        timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
        status: 'TRIAGING',
      },
    })

    // Write to Firestore for real-time dashboard
    await updateFirestoreIncident(incident.id, {
      id: incident.id,
      source: input.source,
      rawPayload: input.rawPayload,
      status: 'TRIAGING',
      createdAt: new Date().toISOString(),
    })

    // Log: incident received
    await prisma.incidentLog.create({
      data: {
        incidentId: incident.id,
        event: `🚨 Incident triggered from ${input.source}`,
        data: input.rawPayload,
      },
    })

    // Run the 4-stage pipeline in the background — do NOT await
    runPipeline(incident.id, input).catch(err => {
      console.error('[NEXUS] Pipeline failed:', err)
    })

    // Return immediately with incident ID
    return NextResponse.json(
      { incidentId: incident.id, status: 'TRIAGING' },
      { status: 202 }
    )
  } catch (error) {
    console.error('[Trigger] Unexpected error:', error)
    const err = error as Error
    return NextResponse.json({ error: 'Internal server error', details: err.message, stack: err.stack }, { status: 500 })
  }
}
