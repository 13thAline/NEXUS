// src/app/dashboard/page.tsx — Command Dashboard
'use client'

import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { IncidentHeader } from '@/components/dashboard/IncidentHeader'
import { TaskBoard } from '@/components/dashboard/TaskBoard'
import { LiveFeed } from '@/components/dashboard/LiveFeed'
import { AnalysisReport } from '@/components/dashboard/AnalysisReport'
import { FloorMap } from '@/components/dashboard/FloorMap'
import { GuestRoll } from '@/components/dashboard/GuestRoll'
import { CCTVFeed } from '@/components/dashboard/CCTVFeed'
import { TacticalModal } from '@/components/dashboard/TacticalModal'
import { useTacticalAudio } from '@/hooks/useTacticalAudio'
import { motion, AnimatePresence } from 'framer-motion'
import type { Incident, Task, IncidentLog, LogSource, GuestRoom } from '@/types'

export default function DashboardPage() {
  const [incident, setIncident] = useState<Incident | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [logs, setLogs] = useState<IncidentLog[]>([])
  const [guests, setGuests] = useState<GuestRoom[]>([])
  const [evacuated, setEvacuated] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [connected, setConnected] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [focusedComponent, setFocusedComponent] = useState<'MAP' | 'CCTV' | 'GUESTS' | null>(null)
  const [search, setSearch] = useState('')
  const { playAlert, playChirp, playPing } = useTacticalAudio()

  const addLog = useCallback((message: string, source: LogSource, id?: string, createdAt?: string) => {
    setLogs(prev => [...prev, {
      id: id || `log-${Date.now()}-${Math.random()}`,
      incidentId: '',
      message,
      source,
      createdAt: createdAt || new Date().toISOString(),
    }])
  }, [])

  // Initial data fetch
  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await fetch('/api/incident/active')
        const data = await res.json()
        if (data.active) {
          setIncident(data.incident)
          setTasks(data.tasks)
          if (data.logs) {
            setLogs(data.logs.map((l: any) => ({
              id: l.id,
              incidentId: l.incidentId,
              message: l.message,
              source: l.source as LogSource,
              createdAt: l.createdAt
            })))
          }
        }

        // Fetch Guests
        const guestRes = await fetch('/api/pms/occupancy')
        const guestData = await guestRes.json()
        setGuests(guestData.guests || [])
      } catch (err) {
        console.error('Failed to load initial dashboard state:', err)
      }
    }
    fetchActive()
  }, [])

  const toggleEvacuated = useCallback((room: string) => {
    setEvacuated(prev => {
      const next = new Set(prev)
      next.has(room) ? next.delete(room) : next.add(room)
      return next
    })
  }, [])

  useEffect(() => {
    const socket: Socket = io({ transports: ['websocket', 'polling'] })

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join:dashboard')
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('incident:created', ({ incident: inc }) => {
      setIncident(inc)
      setGenerating(true)
      setTasks([])
      playAlert()
      addLog(`🚨 Incident detected: ${inc.type} (${inc.severity}) — Zone ${inc.zone}, L${inc.floor}`, 'SENSOR')
    })

    socket.on('tasks:assigned', ({ tasks: newTasks, summary, estimatedClearTime, escalationRecommended }) => {
      setTasks(newTasks)
      setGenerating(false)
      addLog(`🧠 NEXUS: ${summary}`, 'LLM')
      addLog(`⏱️ Projected resolution window: ${estimatedClearTime}${escalationRecommended ? ' • ⚠️ External escalation required' : ''}`, 'LLM')
    })

    socket.on('task:updated', ({ taskId, status, staffName, action }) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
      const actionText = action === 'ACKNOWLEDGE' ? 'DISPATCHED' : 'SECURED'
      if (action === 'COMPLETE') playChirp()
      addLog(`✅ ${staffName}: Task ${actionText}`, 'STAFF')
    })

    socket.on('incident:report_ready', ({ report, metrics }) => {
      setIncident(prev => prev ? { ...prev, analysisReport: report.summary + "\n\nSuccesses: " + report.successes.join(", ") + "\nImprovements: " + report.improvements.join(", "), metrics: JSON.stringify(metrics) } : null)
      playChirp()
      addLog(`📈 AI Analysis complete. Report and metrics available for review.`, 'SYSTEM')
    })

    socket.on('tasks:error', ({ error }) => {
      setGenerating(false)
      addLog(`❌ System fault: ${error}`, 'SYSTEM')
    })

    socket.on('incident:updated', ({ incidentId, status }) => {
      if (status === 'RESOLVED') {
        setIncident(null)
        setTasks([])
        setLogs([])
      } else {
        setIncident(prev => prev && prev.id === incidentId ? { ...prev, status } : prev)
      }
      addLog(`📋 Operation status update: ${status}`, 'SYSTEM')
    })

    return () => { socket.disconnect() }
  }, [addLog])

  const handleResolve = async () => {
    if (!incident) return
    setIsResolving(true)
    try {
      const res = await fetch(`/api/incident/${incident.id}/resolve`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to resolve incident')
      // Socket will handle the state update
    } catch (err) {
      console.error('Resolve error:', err)
      alert('Resolution failed. Check terminal.')
    } finally {
      setIsResolving(false)
    }
  }

  const completedCount = tasks.filter(t => t.status === 'DONE').length
  const showReport = incident?.status === 'CONTAINED' || incident?.analysisReport

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <IncidentHeader
        incident={incident}
        generating={generating}
        taskCount={tasks.length}
        completedCount={completedCount}
      />
      
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* Left: Tactical Feed */}
        <motion.div 
          layout
          className="w-[340px] shrink-0 flex flex-col gap-4"
        >
          <div className="flex-1 nexus-glass rounded-2xl p-4 overflow-hidden">
             <LiveFeed logs={logs} generating={generating} />
          </div>
        </motion.div>

        {/* Center: Command Board */}
        <motion.div 
          layout
          className="flex-1 nexus-glass rounded-2xl p-5 overflow-hidden border-white/5 bg-transparent"
        >
          <TaskBoard tasks={tasks} generating={generating} />
        </motion.div>

        {/* Right: Spatial Intel & Dynamic Panel */}
        <motion.div 
          layout
          className="w-[420px] shrink-0 flex flex-col gap-4 overflow-hidden"
        >
          {/* Spatial Awareness & CCTV */}
          <motion.div 
            layout
            className={(showReport ? "h-[45%]" : "h-[60%]") + " flex flex-col gap-4 transition-all duration-500"}
          >
            <div className="h-[45%] nexus-glass rounded-2xl overflow-hidden border-white/5 shadow-2xl">
              <CCTVFeed 
                zone={incident?.zone} 
                floor={incident?.floor} 
                onExpand={() => { playPing(); setFocusedComponent('CCTV') }} 
              />
            </div>
            <div className="flex-1 nexus-glass rounded-2xl p-4 border-white/5 overflow-hidden shadow-2xl">
              <FloorMap 
                incident={incident} 
                tasks={tasks} 
                guests={guests}
                evacuated={evacuated}
                onExpand={() => { playPing(); setFocusedComponent('MAP') }}
              />
            </div>
          </motion.div>
          
          {/* Analysis Report or Guest Accountability */}
          <motion.div 
            layout
            className="flex-1 nexus-glass rounded-2xl p-4 border-white/5 overflow-hidden transition-all duration-500"
          >
            {showReport ? (
              <AnalysisReport 
                report={incident?.analysisReport || null} 
                metrics={incident?.metrics ? JSON.parse(incident.metrics) : null}
                onResolve={handleResolve}
                isResolving={isResolving}
              />
            ) : (
              <GuestRoll 
                incident={incident} 
                guests={guests}
                evacuated={evacuated}
                onToggleEvacuated={toggleEvacuated}
                search={search}
                onSearchChange={setSearch}
                onExpand={() => { playPing(); setFocusedComponent('GUESTS') }}
              />
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Footer status bar */}
      <div className="h-10 px-6 flex items-center justify-between border-t border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
              {connected ? 'Signal Established' : 'Link Offline'}
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/20">Frequency: Uplink 8.2GHz</span>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] font-mono text-white/20">
          <span>AI CORE: Llama 3 (8B)</span>
          <div className="w-[1px] h-3 bg-white/10"></div>
          <span>NODE: Nexus-Local-01</span>
        </div>
      </div>

      {/* Tactical Modals */}
      <TacticalModal 
        isOpen={focusedComponent === 'CCTV'} 
        onClose={() => setFocusedComponent(null)}
        title="Visual Intelligence"
      >
        <CCTVFeed zone={incident?.zone} floor={incident?.floor} />
      </TacticalModal>

      <TacticalModal 
        isOpen={focusedComponent === 'MAP'} 
        onClose={() => setFocusedComponent(null)}
        title="Spatial Analysis"
      >
        <FloorMap 
          incident={incident} 
          tasks={tasks} 
          guests={guests}
          evacuated={evacuated}
        />
      </TacticalModal>

      <TacticalModal 
        isOpen={focusedComponent === 'GUESTS'} 
        onClose={() => setFocusedComponent(null)}
        title="Guest Accountability"
      >
        <GuestRoll 
          incident={incident} 
          guests={guests}
          evacuated={evacuated}
          onToggleEvacuated={toggleEvacuated}
          search={search}
          onSearchChange={setSearch}
        />
      </TacticalModal>
    </div>
  )
}
