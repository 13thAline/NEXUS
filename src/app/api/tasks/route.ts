// src/app/api/tasks/route.ts
// GET — Returns all tasks for a given incident, or the latest active incident

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const incidentId = searchParams.get('incidentId')
    const staffId = searchParams.get('staffId')

    // If staffId provided, get their active tasks
    if (staffId) {
      const tasks = await prisma.task.findMany({
        where: {
          staffId,
          status: { not: 'DONE' },
          incident: { status: 'ACTIVE' },
        },
        include: { incident: true },
        orderBy: { priority: 'asc' },
      })

      return NextResponse.json(tasks)
    }

    // If incidentId provided, get all tasks for that incident
    if (incidentId) {
      const tasks = await prisma.task.findMany({
        where: { incidentId },
        orderBy: { priority: 'asc' },
      })

      return NextResponse.json(tasks)
    }

    // Default: get tasks for the latest active incident
    const latestIncident = await prisma.incident.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { triggeredAt: 'desc' },
    })

    if (!latestIncident) {
      return NextResponse.json([])
    }

    const tasks = await prisma.task.findMany({
      where: { incidentId: latestIncident.id },
      orderBy: { priority: 'asc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('[Tasks GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
