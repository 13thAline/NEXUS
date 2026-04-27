// src/app/api/incident/trigger/route.ts
// POST — Receives anomaly events from hotel systems, creates incident, triggers LLM task generation

import { NextRequest, NextResponse } from 'next/server'
import { incidentTriggerSchema } from '@/lib/validators'
import { generateTaskPlan } from '@/lib/task-engine'
import { prisma } from '@/lib/prisma'
import { emitToAll, emitToStaff } from '@/lib/socket'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Validate incoming event
    const parsed = incidentTriggerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid incident data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const input = parsed.data

    // 2. Create incident record in database
    const incident = await prisma.incident.create({
      data: {
        type: input.type,
        severity: input.severity,
        floor: input.floor,
        zone: input.zone,
        rawPayload: input.rawPayload || JSON.stringify({ source: input.source }),
        status: 'ACTIVE',
      },
    })

    // 3. Log: incident received
    await prisma.incidentLog.create({
      data: {
        incidentId: incident.id,
        message: `🚨 Incident triggered: ${input.type} (${input.severity}) on Floor ${input.floor} — ${input.zone}`,
        source: 'SENSOR',
      },
    })

    // 4. Broadcast to dashboard immediately (shows "Generating tasks...")
    emitToAll('incident:created', { incident })

    // 5. Trigger AI Task Generation with Fallback
    const generateTasks = async () => {
      try {
        // AI Path with 15s timeout
        const plan = await Promise.race([
          generateTaskPlan(incident),
          new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), 15000))
        ]) as any

        await processTaskPlan(incident, plan)
      } catch (error: any) {
        if (error.message === 'AI_TIMEOUT') {
          console.warn('[Trigger] AI timed out. Deploying Heuristic Fallback.')
          const fallbackPlan = generateHeuristicPlan(incident)
          await processTaskPlan(incident, fallbackPlan)
        } else {
          console.error('[Trigger Task Gen] AI Error:', error)
          const fallbackPlan = generateHeuristicPlan(incident)
          await processTaskPlan(incident, fallbackPlan)
        }
      }
    }

    // Start generation in background
    generateTasks().catch(err => {
      console.error('[Trigger] All generation paths failed:', err)
      emitToAll('tasks:error', { incidentId: incident.id, error: 'Tactical engine failure.' })
    })

    // Return immediately with 202
    return NextResponse.json(
      {
        incidentId: incident.id,
        status: 'PROCESSING',
        message: 'Incident created. Task plan generation in progress.',
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('[Trigger] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── Resilience Utilities ──────────────────────────────────────────

async function processTaskPlan(incident: any, plan: any) {
  // Check if tasks already exist for this incident (to prevent double-assignment if AI finishes after fallback)
  const existingCount = await prisma.task.count({ where: { incidentId: incident.id } })
  if (existingCount > 0) return

  const tasks = await prisma.$transaction(
    plan.tasks.map((task: any) =>
      prisma.task.create({
        data: {
          incidentId: incident.id,
          staffId: task.staffId,
          staffName: task.staffName,
          staffRole: task.staffRole || 'STAFF',
          description: task.description,
          priority: task.priority,
          floor: task.floor,
          zone: task.zone,
          complexity: task.complexity,
          llmReasoning: task.reasoning ?? null,
        },
      })
    )
  )

  // Log task plan generation
  await prisma.incidentLog.create({
    data: {
      incidentId: incident.id,
      message: `🧠 Task plan deployed: ${tasks.length} tasks assigned. ${plan.escalationRecommended ? '⚠️ Escalation recommended.' : ''}`,
      source: 'LLM',
    },
  })

  // Broadcast tasks to dashboard + all staff devices
  emitToAll('tasks:assigned', {
    incidentId: incident.id,
    tasks,
    summary: plan.incidentSummary,
    estimatedClearTime: plan.estimatedClearTime,
    escalationRecommended: plan.escalationRecommended,
  })

  // Notify each staff member individually
  tasks.forEach((task) => {
    emitToStaff(task.staffId, 'task:new', { task })
  })
}

function generateHeuristicPlan(incident: any) {
  return {
    incidentSummary: "AUTOMATED PROTOCOL: AI engine latency detected. Deploying standard emergency response.",
    escalationRecommended: incident.severity === 'CRITICAL' || incident.severity === 'HIGH',
    estimatedClearTime: "30-45 minutes (Pending AI review)",
    tasks: [
      {
        staffId: "staff_001",
        staffName: "Ravi Sharma",
        staffRole: "SECURITY",
        description: `Secure perimeter of Zone ${incident.zone} on Floor ${incident.floor}. Prevent unauthorized entry.`,
        priority: 1,
        floor: incident.floor,
        zone: incident.zone,
        complexity: 40
      },
      {
        staffId: "staff_004",
        staffName: "Sunita Rao",
        staffRole: "FRONT_DESK",
        description: `Initialize guest accountability for Floor ${incident.floor}. Prepare for potential evacuation.`,
        priority: 2,
        floor: incident.floor,
        zone: incident.zone,
        complexity: 30
      }
    ]
  }
}
