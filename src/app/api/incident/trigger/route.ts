// src/app/api/incident/trigger/route.ts
// POST — Receives anomaly events from hotel systems, creates incident, triggers LLM task generation

import { NextRequest, NextResponse } from 'next/server'
import { incidentTriggerSchema } from '@/lib/validators'
import { generateTaskPlan } from '@/lib/task-engine'
import { prisma } from '@/lib/prisma'
import { emitToAll } from '@/lib/socket'

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

    // 5. Generate task plan via local LLM (async — don't block the response)
    generateTaskPlan({
      type: input.type,
      severity: input.severity,
      floor: input.floor,
      zone: input.zone,
      rawPayload: input.rawPayload || '',
    })
      .then(async (plan) => {
        // 6. Persist all tasks to DB
        const tasks = await prisma.$transaction(
          plan.tasks.map((task) =>
            prisma.task.create({
              data: {
                incidentId: incident.id,
                staffId: task.staffId,
                staffName: task.staffName,
                staffRole: task.staffRole,
                description: task.description,
                priority: task.priority,
                floor: task.floor,
                zone: task.zone,
                llmReasoning: task.reasoning ?? null,
              },
            })
          )
        )

        // 7. Log task plan generation
        await prisma.incidentLog.create({
          data: {
            incidentId: incident.id,
            message: `🧠 Task plan generated: ${tasks.length} tasks assigned. Est. clear time: ${plan.estimatedClearTime}. ${plan.escalationRecommended ? '⚠️ Escalation recommended.' : ''}`,
            source: 'LLM',
          },
        })

        // 8. Broadcast tasks to dashboard + all staff devices
        emitToAll('tasks:assigned', {
          incidentId: incident.id,
          tasks,
          summary: plan.incidentSummary,
          estimatedClearTime: plan.estimatedClearTime,
          escalationRecommended: plan.escalationRecommended,
        })

        // Also notify each staff member individually
        plan.tasks.forEach((task) => {
          emitToAll(`staff:${task.staffId}:task`, {
            incidentId: incident.id,
            task,
          })
        })
      })
      .catch(async (err) => {
        console.error('[Trigger] Task generation failed:', err)

        await prisma.incidentLog.create({
          data: {
            incidentId: incident.id,
            message: `❌ Task generation failed: ${err.message}. Manual assignment required.`,
            source: 'SYSTEM',
          },
        })

        emitToAll('tasks:error', {
          incidentId: incident.id,
          error: err.message,
        })
      })

    // Return immediately with 202 — task generation happens in background
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
