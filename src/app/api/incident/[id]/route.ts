// src/app/api/incident/[id]/route.ts
// GET — Returns full incident state with tasks and logs
// PATCH — Update incident status (ACTIVE → CONTAINED → RESOLVED)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { transitionIncident } from '@/lib/incident-state'
import { incidentUpdateSchema } from '@/lib/validators'
import { emitToAll } from '@/lib/socket'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { priority: 'asc' } },
        events: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json(incident)
  } catch (error) {
    console.error('[Incident GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const parsed = incidentUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid status', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await transitionIncident(id, parsed.data.status)

    // Broadcast status change to all connected clients
    emitToAll('incident:updated', {
      incidentId: id,
      status: updated.status,
    })

    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('not found') ? 404 : message.includes('Invalid transition') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
