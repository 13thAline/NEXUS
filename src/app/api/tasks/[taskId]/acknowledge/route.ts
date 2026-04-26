// src/app/api/tasks/[taskId]/acknowledge/route.ts
// POST — Staff acknowledge or complete their assigned task

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { taskAcknowledgeSchema } from '@/lib/validators'
import { emitToAll } from '@/lib/socket'
import { checkAutoContain } from '@/lib/incident-state'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const body = await req.json()

    // Validate action
    const parsed = taskAcknowledgeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "ACKNOWLEDGE" or "COMPLETE"', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { action } = parsed.data

    // Check task exists
    const existingTask = await prisma.task.findUnique({ where: { id: taskId } })
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Determine update data based on action
    const updateData =
      action === 'ACKNOWLEDGE'
        ? { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() }
        : { status: 'DONE', completedAt: new Date() }

    // Update task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    })

    // Log the update
    const actionText = action === 'ACKNOWLEDGE' ? 'acknowledged' : 'completed'
    await prisma.incidentLog.create({
      data: {
        incidentId: task.incidentId,
        message: `✅ ${task.staffName} (${task.staffRole}) ${actionText} task: "${task.description.substring(0, 80)}${task.description.length > 80 ? '...' : ''}"`,
        source: 'STAFF',
      },
    })

    // Broadcast to command dashboard
    emitToAll('task:updated', {
      taskId: task.id,
      incidentId: task.incidentId,
      status: task.status,
      staffId: task.staffId,
      staffName: task.staffName,
      action,
    })

    // Check if all tasks are done and auto-contain the incident
    if (action === 'COMPLETE') {
      await checkAutoContain(task.incidentId)
    }

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error('[Acknowledge] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
