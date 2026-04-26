// src/app/staff/[staffId]/page.tsx — Staff mobile task view
import { prisma } from '@/lib/prisma'
import { TaskCard } from '@/components/staff/TaskCard'
import { Zap } from 'lucide-react'

export default async function StaffPage({ params }: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await params

  // Find latest active task for this staff member
  const task = await prisma.task.findFirst({
    where: {
      staffId,
      status: { not: 'DONE' },
      incident: { status: 'ACTIVE' },
    },
    include: { incident: true },
    orderBy: { assignedAt: 'desc' },
  })

  return (
    <main className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      {/* NEXUS branding */}
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-red-500" />
        <span className="text-sm font-bold tracking-wide">NEXUS</span>
      </div>

      {task ? (
        <TaskCard task={task as any} />
      ) : (
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✓</span>
          </div>
          <p className="text-xl font-semibold text-green-400">All Clear</p>
          <p className="text-muted-foreground mt-2">No active incident. Stand by.</p>
          <p className="text-xs text-muted-foreground/40 mt-4">Staff ID: {staffId}</p>
        </div>
      )}
    </main>
  )
}
