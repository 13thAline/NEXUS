// src/components/dashboard/TaskBoard.tsx
// Kanban board: PENDING → ACKNOWLEDGED → IN_PROGRESS → DONE

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, MapPin, ArrowRight } from 'lucide-react'
import type { Task, TaskStatus } from '@/types'

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'PENDING', label: 'Triage', color: 'text-yellow-400' },
  { key: 'ACKNOWLEDGED', label: 'Dispatched', color: 'text-blue-400' },
  { key: 'IN_PROGRESS', label: 'Active', color: 'text-purple-400' },
  { key: 'DONE', label: 'Secured', color: 'text-green-400' },
]

const ROLE_COLORS: Record<string, string> = {
  SECURITY: 'bg-red-500/10 text-red-400 border-red-500/20',
  HOUSEKEEPING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ENGINEERING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  FRONT_DESK: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  MANAGEMENT: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  MEDICAL: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

interface TaskBoardProps {
  tasks: Task[]
  generating: boolean
}

export function TaskBoard({ tasks, generating }: TaskBoardProps) {
  if (generating && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-yellow-400 font-medium">NEXUS is analyzing the incident...</p>
          <p className="text-xs text-muted-foreground mt-1">Generating task assignments via local LLM</p>
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <ArrowRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No active tasks</p>
          <p className="text-xs mt-1 opacity-60">Trigger an incident to generate task assignments</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-3 h-full">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter(t => t.status === col.key)

        return (
          <div key={col.key} className="flex flex-col min-h-0">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-')}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                {col.label}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {columnTasks.length}
              </span>
            </div>

            {/* Task cards */}
            <div className="flex-1 overflow-y-auto nexus-scrollbar space-y-3 pb-4">
              {columnTasks
                .sort((a, b) => a.priority - b.priority)
                .map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const roleStyle = ROLE_COLORS[task.staffRole] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  const isHighPriority = task.priority <= 2

  return (
    <Card className={`
      relative p-4 border-white/10 transition-all duration-300 animate-nexus-slide-in
      nexus-glass nexus-glass-hover overflow-hidden group
      ${isHighPriority ? 'shadow-[0_0_20px_rgba(239,68,68,0.1)] border-red-500/20' : ''}
    `}>
      {isHighPriority && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-2xl rounded-full -mr-8 -mt-8"></div>
      )}

      {/* Staff info */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20">
          <User className="w-3.5 h-3.5 text-white/60" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-black uppercase tracking-[0.05em] text-white/90 truncate">{task.staffName}</div>
          <div className="text-[9px] text-white/30 font-mono uppercase tracking-tighter truncate">{task.id}</div>
        </div>
        <Badge variant="outline" className={`text-[9px] font-black px-2 py-0 h-4 ${roleStyle}`}>
          {task.staffRole}
        </Badge>
      </div>

      {/* Task description */}
      <p className="text-[11px] text-white/70 leading-relaxed mb-4 line-clamp-3 font-medium">
        {task.description}
      </p>

      {/* Footer: floor, zone, priority */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-[9px] text-white/40 font-mono tracking-tighter">
          <MapPin className="w-3 h-3 text-red-500/50" />
          <span>F{task.floor} • SECTOR {task.zone}</span>
        </div>
        <div className={`px-2 py-0.5 rounded text-[9px] font-black tracking-tighter ${
          isHighPriority ? 'bg-red-500 text-white' : 'bg-white/10 text-white/60'
        }`}>
          PRIORITY {task.priority}
        </div>
      </div>
    </Card>
  )
}
