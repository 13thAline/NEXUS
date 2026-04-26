// src/lib/incident-state.ts — Incident State Machine
// Manages incident lifecycle: ACTIVE → CONTAINED → RESOLVED

import { prisma } from './prisma'
import type { IncidentStatus } from '@/types'
import { generateAAR } from './report-engine'

// Valid state transitions
const VALID_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  ACTIVE: ['CONTAINED', 'RESOLVED'],
  CONTAINED: ['RESOLVED', 'ACTIVE'], // Can re-activate if situation worsens
  RESOLVED: [],                        // Terminal state
}

/**
 * Check if a state transition is valid.
 */
export function canTransition(
  currentStatus: IncidentStatus,
  targetStatus: IncidentStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false
}

/**
 * Transition an incident to a new status.
 * Returns the updated incident or throws if the transition is invalid.
 */
export async function transitionIncident(
  incidentId: string,
  targetStatus: IncidentStatus
) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
  })

  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`)
  }

  const currentStatus = incident.status as IncidentStatus

  if (!canTransition(currentStatus, targetStatus)) {
    throw new Error(
      `Invalid transition: ${currentStatus} → ${targetStatus}. ` +
      `Valid transitions from ${currentStatus}: ${VALID_TRANSITIONS[currentStatus].join(', ') || 'none'}`
    )
  }

  const updateData: Record<string, unknown> = { status: targetStatus }

  // Set resolvedAt timestamp when resolving
  if (targetStatus === 'RESOLVED') {
    updateData.resolvedAt = new Date()
  }

  // Clear resolvedAt if re-activating
  if (targetStatus === 'ACTIVE') {
    updateData.resolvedAt = null
  }

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: updateData,
  })

  // Log the transition
  await prisma.incidentLog.create({
    data: {
      incidentId,
      message: `Incident status changed: ${currentStatus} → ${targetStatus}`,
      source: 'SYSTEM',
    },
  })

  return updated
}

/**
 * Check if all tasks for an incident are done, and auto-contain if so.
 */
export async function checkAutoContain(incidentId: string) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { tasks: true },
  })

  if (!incident || incident.status !== 'ACTIVE') return

  const allDone = incident.tasks.length > 0 && incident.tasks.every(t => t.status === 'DONE')

  if (allDone) {
    await transitionIncident(incidentId, 'CONTAINED')
    await prisma.incidentLog.create({
      data: {
        incidentId,
        message: 'All tasks completed. Incident auto-contained. Duty manager review required for resolution.',
        source: 'SYSTEM',
      },
    })

    // Trigger AI After-Action Report generation
    generateAAR(incidentId)
  }
}
