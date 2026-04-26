import { prisma } from '@/lib/prisma'
import { StaffMobileView } from '@/components/staff/StaffMobileView'

export default async function StaffPage({ params }: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await params

  // Find latest active task for this staff member
  const task = await prisma.task.findFirst({
    where: {
      staffId,
      status: { not: 'DONE' },
      incident: { status: { in: ['ACTIVE', 'CONTAINED'] } },
    },
    include: { 
      incident: {
        select: {
          type: true,
          severity: true,
          zone: true
        }
      } 
    },
    orderBy: { assignedAt: 'desc' },
  })

  return (
    <StaffMobileView 
      staffId={staffId} 
      initialTask={task} 
    />
  )
}
