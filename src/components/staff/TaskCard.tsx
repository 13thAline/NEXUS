// src/components/staff/TaskCard.tsx — Staff task display card
'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { MapPin, AlertTriangle, Clock } from 'lucide-react'
import { AckButton } from './AckButton'
import type { Task, TaskStatus, Severity } from '@/types'

const SEVERITY_BG: Record<string, string> = {
  CRITICAL: 'bg-red-950/50 border-red-500/30',
  HIGH: 'bg-orange-950/30 border-orange-500/20',
  MEDIUM: 'bg-yellow-950/20 border-yellow-500/15',
  LOW: 'bg-green-950/20 border-green-500/15',
}

interface TaskCardProps {
  task: Task & { incident?: { type: string; severity: string; zone: string } }
}

export function TaskCard({ task }: TaskCardProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status as TaskStatus)
  const severity = (task.incident?.severity || 'HIGH') as string
  const bgClass = SEVERITY_BG[severity] || SEVERITY_BG.HIGH

  return (
    <div className={`w-full max-w-md mx-auto rounded-2xl border p-6 ${bgClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-bold">{task.staffName}</p>
          <p className="text-sm text-muted-foreground">{task.staffRole}</p>
        </div>
        <Badge className={`severity-${severity.toLowerCase()}`}>
          {task.incident?.type?.replace('_', ' ')} • {severity}
        </Badge>
      </div>

      {/* Priority */}
      {task.priority <= 2 && (
        <div className="flex items-center gap-2 mb-4 text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-semibold">HIGH PRIORITY — Respond immediately</span>
        </div>
      )}

      {/* Task description — the most important part */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <p className="text-lg leading-relaxed font-medium">{task.description}</p>
      </div>

      {/* Location info */}
      <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          <span>Floor {task.floor} — {task.zone}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>Priority {task.priority}</span>
        </div>
      </div>

      {/* Action button */}
      <AckButton taskId={task.id} currentStatus={status} onStatusChange={setStatus} />
    </div>
  )
}
