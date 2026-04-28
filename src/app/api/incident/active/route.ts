import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Find any incident that's currently in the pipeline or active
    const incident = await prisma.incident.findFirst({
      where: {
        status: {
          in: ['TRIAGING', 'BUILDING_GRAPH', 'COMPUTING_PRIORITIES', 'GENERATING_STRATEGY', 'ACTIVE', 'CONTAINED'],
        },
      },
      include: {
        tasks: { orderBy: { priority: 'asc' } },
        logs: { orderBy: { timestamp: 'asc' } },
      },
      orderBy: { timestamp: 'desc' },
    })

    if (!incident) return NextResponse.json({ active: false })

    return NextResponse.json({
      active: true,
      incident,
      tasks: incident.tasks,
      logs: incident.logs,
    })
  } catch (error) {
    console.error('[API] Active incident fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch active state' }, { status: 500 })
  }
}
