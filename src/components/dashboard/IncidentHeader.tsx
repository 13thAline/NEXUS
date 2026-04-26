// src/components/dashboard/IncidentHeader.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { Flame, Shield, Heart, Wind, Building, AlertTriangle, Siren, Activity } from 'lucide-react'
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
  CRITICAL: 'severity-critical animate-nexus-pulse shadow-[0_0_15px_rgba(255,46,46,0.3)]',
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
  const lastIncidentId = useRef<string | null>(null)

  // Sound generator
  const playAlert = (severity: Severity) => {
    if (typeof window === 'undefined' || localStorage.getItem('nexus_audio_active') !== 'true') return

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      
      const playTone = (freq: number, type: OscillatorType, duration: number, vol: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        gain.gain.setValueAtTime(vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + duration)
      }

      if (severity === 'CRITICAL') {
        // High alert klaxon
        playTone(150, 'sawtooth', 0.5, 0.1)
        setTimeout(() => playTone(150, 'sawtooth', 0.5, 0.1), 600)
      } else {
        // Submarine-style sonar ping
        playTone(800, 'sine', 1.5, 0.05)
      }
    } catch (e) {
      console.error('Audio play failed', e)
    }
  }

  useEffect(() => {
    if (!incident) {
      lastIncidentId.current = null
      return
    }

    // Play sound if new incident
    if (incident.id !== lastIncidentId.current) {
      playAlert(incident.severity as Severity)
      lastIncidentId.current = incident.id
    }

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
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-green-500/05 animate-pulse pointer-events-none"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <Activity className="w-4 h-4 text-green-500 animate-nexus-pulse" />
          </div>
          <div>
            <h1 className="text-[10px] font-black tracking-[0.2em] text-green-500 uppercase">System Status: Nominal</h1>
            <p className="text-[10px] text-white/30 font-mono">No active threats detected • Monitoring zones...</p>
          </div>
        </div>
        <div className="text-[10px] text-white/20 font-mono tracking-widest flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-green-500 animate-ping"></div>
            Local AI Instance ID: NX-8802
          </span>
          <span className="opacity-50">V1.0.4</span>
        </div>
      </header>
    )
  }

  const type = incident.type as IncidentType
  const severity = incident.severity as Severity

  return (
    <header className={`h-16 px-6 flex items-center justify-between border-b border-white/5 ${
      severity === 'CRITICAL' ? 'bg-red-950/40' : 'bg-background/80'
    } backdrop-blur-md relative overflow-hidden`}>
      {/* Visual Scan Effect for incidents */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-red-500/20 animate-nexus-scanline"></div>
      
      <div className="flex items-center gap-4 relative z-10">
        {/* Incident type icon with Radar */}
        <div className="relative">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center relative z-10 ${INCIDENT_COLORS[type]} ${
            severity === 'CRITICAL' ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/10'
          }`}>
            {INCIDENT_ICONS[type]}
          </div>
          <div className="absolute inset-0 rounded-lg border border-red-500/20 animate-nexus-radar"></div>
        </div>

        {/* Incident info */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-sm font-black tracking-widest uppercase italic">{type.replace('_', ' ')}</h1>
            <Badge className={`text-[9px] px-2 py-0 font-black tracking-tighter ${SEVERITY_STYLES[severity]}`}>
              {severity}
            </Badge>
          </div>
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-tight">
            Sector {incident.zone} • L{incident.floor} • Coordination: AI Autopilot
          </p>
        </div>
      </div>

      {/* Right side: timer + stats */}
      <div className="flex items-center gap-8 relative z-10">
        {generating && (
          <div className="flex items-center gap-3 text-orange-400">
            <div className="flex gap-0.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1 h-1 bg-orange-400 rounded-full animate-nexus-pulse" style={{ animationDelay: `${i*0.2}s` }} />
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Constructing Tactical Plan...</span>
          </div>
        )}

        {taskCount > 0 && (
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 uppercase font-mono">Response Coverage</span>
                <span className="text-xs font-bold text-white/80">{Math.round((completedCount/taskCount)*100)}%</span>
             </div>
             <div className="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-1000" 
                  style={{ width: `${(completedCount/taskCount)*100}%` }}
                />
             </div>
          </div>
        )}

        {/* Elapsed timer */}
        <div className="flex flex-col items-end border-l border-white/10 pl-6">
          <span className="text-2xl font-mono font-black tabular-nums tracking-tighter text-white/90">{elapsed}</span>
          <span className="text-[9px] text-white/30 uppercase tracking-tighter font-bold">Time Since Impact</span>
        </div>
      </div>
    </header>
  )
}
