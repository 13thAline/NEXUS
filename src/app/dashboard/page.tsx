// src/app/dashboard/page.tsx — Command Dashboard
'use client'

import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { IncidentHeader } from '@/components/dashboard/IncidentHeader'
import { TaskBoard } from '@/components/dashboard/TaskBoard'
import { LiveFeed } from '@/components/dashboard/LiveFeed'
import { GuestRoll } from '@/components/dashboard/GuestRoll'
import type { Incident, Task, IncidentLog } from '@/types'

export default function DashboardPage() {
  const [incident, setIncident] = useState<Incident | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [logs, setLogs] = useState<IncidentLog[]>([])
  const [generating, setGenerating] = useState(false)
  const [connected, setConnected] = useState(false)

  const addLog = useCallback((message: string, source: string) => {
    setLogs(prev => [...prev, {
      id: `log-${Date.now()}-${Math.random()}`,
      incidentId: '',
      message,
      source,
      createdAt: new Date().toISOString(),
    }])
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
      addLog(`🚨 Incident detected: ${inc.type} (${inc.severity}) — ${inc.zone}, Floor ${inc.floor}`, 'SENSOR')
    })

    socket.on('tasks:assigned', ({ tasks: newTasks, summary, estimatedClearTime, escalationRecommended }) => {
      setTasks(newTasks)
      setGenerating(false)
      addLog(`🧠 NEXUS: ${summary}`, 'LLM')
      addLog(`⏱️ Estimated clear time: ${estimatedClearTime}${escalationRecommended ? ' • ⚠️ Escalation recommended' : ''}`, 'LLM')
    })

    socket.on('task:updated', ({ taskId, status, staffName, action }) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
      const actionText = action === 'ACKNOWLEDGE' ? 'acknowledged' : 'completed'
      addLog(`✅ ${staffName}: Task ${actionText}`, 'STAFF')
    })

    socket.on('tasks:error', ({ error }) => {
      setGenerating(false)
      addLog(`❌ Task generation failed: ${error}`, 'SYSTEM')
    })

    socket.on('incident:updated', ({ incidentId, status }) => {
      setIncident(prev => prev && prev.id === incidentId ? { ...prev, status } : prev)
      addLog(`📋 Incident status: ${status}`, 'SYSTEM')
    })

    return () => { socket.disconnect() }
  }, [addLog])

  const completedCount = tasks.filter(t => t.status === 'DONE').length

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <IncidentHeader
        incident={incident}
        generating={generating}
        taskCount={tasks.length}
        completedCount={completedCount}
      />
      <div className="flex flex-1 gap-3 p-3 overflow-hidden">
        {/* Left: Live Feed */}
        <div className="w-72 shrink-0 nexus-glass rounded-xl p-3">
          <LiveFeed logs={logs} generating={generating} />
        </div>
        {/* Center: Task Board */}
        <div className="flex-1 nexus-glass rounded-xl p-3 overflow-hidden">
          <TaskBoard tasks={tasks} generating={generating} />
        </div>
        {/* Right: Guest Roll */}
        <div className="w-64 shrink-0 nexus-glass rounded-xl p-3">
          <GuestRoll incident={incident} />
        </div>
      </div>
      {/* Bottom status bar */}
      <div className="h-8 px-4 flex items-center justify-between border-t border-white/5 text-[10px] text-muted-foreground/50">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <span>Socket.io</span>
        </div>
        <span>NEXUS v1.0 • Local-first Crisis Intelligence</span>
      </div>
    </div>
  )
}
