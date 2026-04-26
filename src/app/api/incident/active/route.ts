import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const incident = await prisma.incident.findFirst({
      where: { status: { in: ['ACTIVE', 'CONTAINED'] } },
      include: { 
        tasks: true,
        events: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { triggeredAt: 'desc' }
    })

    if (!incident) return NextResponse.json({ active: false })

    return NextResponse.json({
      active: true,
      incident,
      tasks: incident.tasks,
      logs: incident.events
    })
  } catch (error) {
    console.error('[API] Active incident fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch active state' }, { status: 500 })
  }
}
