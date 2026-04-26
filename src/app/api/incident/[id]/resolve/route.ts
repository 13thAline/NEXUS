import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { transitionIncident } from '@/lib/incident-state'
import { emitToAll } from '@/lib/socket'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: incidentId } = await params
    
    // Resolve the incident
    const incident = await transitionIncident(incidentId, 'RESOLVED')

    // Mark all pending tasks as DONE (if any left)
    await prisma.task.updateMany({
      where: { incidentId, status: { not: 'DONE' } },
      data: { status: 'DONE', completedAt: new Date() }
    })

    // Broadcast to all
    emitToAll('incident:updated', { incidentId, status: 'RESOLVED' })

    return NextResponse.json({ success: true, incident })
  } catch (error: any) {
    console.error('[Resolve API] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
