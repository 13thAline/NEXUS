// src/lib/incident-state.ts — Incident State Machine
// Manages incident lifecycle with Firestore real-time updates

import { prisma } from './prisma'
import { updateFirestoreIncident } from './firebase-admin'
import type { IncidentStatus } from '@/types'

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['TRIAGING'],
  TRIAGING: ['BUILDING_GRAPH', 'PIPELINE_FAILED'],
  BUILDING_GRAPH: ['COMPUTING_PRIORITIES', 'PIPELINE_FAILED'],
  COMPUTING_PRIORITIES: ['GENERATING_STRATEGY', 'PIPELINE_FAILED'],
  GENERATING_STRATEGY: ['ACTIVE', 'PIPELINE_FAILED'],
  ACTIVE: ['CONTAINED', 'RESOLVED'],
  CONTAINED: ['RESOLVED', 'ACTIVE'],
  RESOLVED: [],
  PIPELINE_FAILED: ['TRIAGING'], // Allow retry
}

export function canTransition(current: string, target: string): boolean {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false
}

export async function transitionIncident(incidentId: string, targetStatus: string) {
  const incident = await prisma.incident.findUnique({ where: { id: incidentId } })
  if (!incident) throw new Error(`Incident ${incidentId} not found`)

  const current = incident.status
  if (!canTransition(current, targetStatus)) {
    throw new Error(`Invalid transition: ${current} → ${targetStatus}`)
  }

  const updateData: Record<string, unknown> = { status: targetStatus }
  if (targetStatus === 'RESOLVED') updateData.resolvedAt = new Date()
  if (targetStatus === 'ACTIVE') updateData.resolvedAt = null

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: updateData,
  })

  // Real-time update via Firestore
  await updateFirestoreIncident(incidentId, {
    status: targetStatus,
    updatedAt: new Date().toISOString(),
  })

  await prisma.incidentLog.create({
    data: {
      incidentId,
      event: `Incident status changed: ${current} → ${targetStatus}`,
      data: '',
    },
  })

  return updated
}

export async function checkAutoContain(incidentId: string) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { tasks: true },
  })

  if (!incident || incident.status !== 'ACTIVE') return

  const allDone = incident.tasks.length > 0 && incident.tasks.every(t => t.status === 'COMPLETE')

  if (allDone) {
    await transitionIncident(incidentId, 'CONTAINED')
    await prisma.incidentLog.create({
      data: {
        incidentId,
        event: 'All tasks completed. Incident auto-contained.',
        data: '',
      },
    })
  }
}
