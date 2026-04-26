// src/components/dashboard/IncidentHeader.tsx
// Top bar: Incident type, severity badge, floor/zone, time elapsed

'use client'

import { useEffect, useState } from 'react'
import { Flame, Shield, Heart, Wind, Building, AlertTriangle, Siren } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Incident, IncidentType, Severity } from '@/types'

const INCIDENT_ICONS: Record<IncidentType, React.ReactNode> = {
  FIRE: <Flame className="w-5 h-5" />,
  ACTIVE_SHOOTER: <Shield className="w-5 h-5" />,
  MEDICAL: <Heart className="w-5 h-5" />,
  GAS_LEAK: <Wind className="w-5 h-5" />,
  STRUCTURAL: <Building className="w-5 h-5" />,
  EVACUATION: <AlertTriangle className="w-5 h-5" />,
  SECURITY: <Siren className="w-5 h-5" />,
}

const SEVERITY_STYLES: Record<Severity, string> = {
  CRITICAL: 'severity-critical animate-nexus-pulse',
  HIGH: 'severity-high',
  MEDIUM: 'severity-medium',
  LOW: 'severity-low',
}

const INCIDENT_COLORS: Record<IncidentType, string> = {
  FIRE: 'text-red-400',
  ACTIVE_SHOOTER: 'text-red-500',
  MEDICAL: 'text-blue-400',
  GAS_LEAK: 'text-yellow-400',
  STRUCTURAL: 'text-orange-400',
  EVACUATION: 'text-amber-400',
  SECURITY: 'text-purple-400',
}

interface IncidentHeaderProps {
  incident: Incident | null
  generating: boolean
  taskCount: number
  completedCount: number
}

export function IncidentHeader({ incident, generating, taskCount, completedCount }: IncidentHeaderProps) {
  const [elapsed, setElapsed] = useState('00:00')

  useEffect(() => {
    if (!incident) return

    const startTime = new Date(incident.triggeredAt).getTime()

    const timer = setInterval(() => {
      const diff = Date.now() - startTime
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setElapsed(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [incident])

  if (!incident) {
    return (
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-green-400">ALL CLEAR</h1>
            <p className="text-xs text-muted-foreground">No active incidents — System monitoring</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground font-mono">NEXUS v1.0</div>
      </header>
    )
  }

  const type = incident.type as IncidentType
  const severity = incident.severity as Severity

  return (
    <header className={`h-16 px-6 flex items-center justify-between border-b border-white/5 ${
      severity === 'CRITICAL' ? 'bg-red-950/30' : 'bg-background/80'
    } backdrop-blur-sm`}>
      <div className="flex items-center gap-4">
        {/* Incident type icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${INCIDENT_COLORS[type]} ${
          severity === 'CRITICAL' ? 'animate-nexus-glow bg-red-500/10' : 'bg-white/5'
        }`}>
          {INCIDENT_ICONS[type]}
        </div>

        {/* Incident info */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-wide uppercase">{type.replace('_', ' ')}</h1>
            <Badge className={`text-[10px] px-1.5 py-0 ${SEVERITY_STYLES[severity]}`}>
              {severity}
            </Badge>
            {incident.status === 'CONTAINED' && (
              <Badge className="text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-300">
                CONTAINED
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Floor {incident.floor} — {incident.zone}
          </p>
        </div>
      </div>

      {/* Right side: timer + stats */}
      <div className="flex items-center gap-6">
        {generating && (
          <div className="flex items-center gap-2 text-yellow-400 animate-nexus-pulse">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-xs font-medium">Generating tasks...</span>
          </div>
        )}

        {taskCount > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-semibold">{completedCount}</span>
            <span>/{taskCount} tasks done</span>
          </div>
        )}

        {/* Elapsed timer */}
        <div className="flex flex-col items-end">
          <span className="text-xl font-mono font-bold tabular-nums tracking-tight">{elapsed}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Elapsed</span>
        </div>
      </div>
    </header>
  )
}
