// src/app/api/tasks/[taskId]/acknowledge/route.ts
// POST — Staff acknowledge or complete their assigned task

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { taskAcknowledgeSchema } from '@/lib/validators'
import { updateFirestoreIncident, writeFirestoreTask } from '@/lib/firebase-admin'
import { checkAutoContain } from '@/lib/incident-state'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const body = await req.json()

    const parsed = taskAcknowledgeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid action', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { action } = parsed.data

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } })
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updateData =
      action === 'ACKNOWLEDGE'
        ? { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() }
        : { status: 'COMPLETE', completedAt: new Date() }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    })

    // Update Firestore for real-time dashboard
    await writeFirestoreTask(task.incidentId, task.staffId, {
      status: task.status,
      ...(action === 'ACKNOWLEDGE' ? { acknowledgedAt: new Date().toISOString() } : { completedAt: new Date().toISOString() }),
    })

    // Log the update
    const actionText = action === 'ACKNOWLEDGE' ? 'acknowledged' : 'completed'
    await prisma.incidentLog.create({
      data: {
        incidentId: task.incidentId,
        event: `✅ ${task.staffName} (${task.staffRole}) ${actionText} task: "${task.description.substring(0, 80)}"`,
        data: JSON.stringify({ taskId, action, staffId: task.staffId }),
      },
    })

    // Check if all tasks done → auto-contain
    if (action === 'COMPLETE') {
      await checkAutoContain(task.incidentId)
    }

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error('[Acknowledge] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
