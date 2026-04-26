'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { TaskCard } from './TaskCard'
import { Zap, ShieldAlert, Wifi, WifiOff, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface StaffMobileViewProps {
  staffId: string
  initialTask: any
}

export function StaffMobileView({ staffId, initialTask }: StaffMobileViewProps) {
  const [task, setTask] = useState(initialTask)
  const [connected, setConnected] = useState(false)
  const [newArrival, setNewArrival] = useState(false)

  useEffect(() => {
    const socket: Socket = io({ transports: ['websocket', 'polling'] })

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join:staff', staffId)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('task:new', ({ task: newTask }) => {
      setTask(newTask)
      setNewArrival(true)
      setTimeout(() => setNewArrival(false), 5000)
    })

    socket.on('task:updated', ({ taskId, status }) => {
      if (task?.id === taskId) {
        setTask((prev: any) => (prev ? { ...prev, status } : null))
      }
    })

    return () => { socket.disconnect() }
  }, [staffId, task?.id])

  return (
    <main className={`min-h-screen transition-colors duration-1000 ${newArrival ? 'bg-red-950/20' : 'bg-[#050505]'}`}>
      {/* Tactical Status Bar */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/staff" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </Link>
          <div className="flex items-center gap-2">
            <Zap className={`w-3.5 h-3.5 ${newArrival ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/70">NEXUS • TACTICAL</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
           <span className="text-[8px] font-mono opacity-30 uppercase tracking-widest">{connected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>

      <div className="p-4 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] relative overflow-hidden">
        {/* Background Scanline Decorator */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

        <AnimatePresence mode="wait">
          {task && task.status !== 'DONE' ? (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.1, y: -30, filter: 'blur(20px)' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="w-full relative z-10"
            >
              <div className="absolute -inset-4 bg-blue-500/5 blur-3xl rounded-full opacity-50" />
              <TaskCard task={task} />
            </motion.div>
          ) : task && task.status === 'DONE' ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center relative z-10"
            >
               <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
               </div>
               <h2 className="text-xl font-black tracking-tight text-white mb-2 uppercase italic">Mission Secured</h2>
               <p className="text-xs text-white/40 uppercase tracking-[0.2em] mb-8">Incident Contained</p>
               
               <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4 max-w-xs mx-auto">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Next Protocol</p>
                  <p className="text-sm font-bold text-white/80">"Return to primary station and stand by for debrief."</p>
                  <div className="pt-4">
                     <Link href="/staff" className="text-[10px] font-bold text-white/20 uppercase hover:text-white transition-colors">
                        Close Tactical Session
                     </Link>
                  </div>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center relative z-10"
            >
              <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center mx-auto mb-8 relative">
                 <div className="absolute inset-0 rounded-full border-t-2 border-white/10 animate-spin" />
                 <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-ping" />
              </div>
              <h2 className="text-sm font-black tracking-[0.4em] text-white/20 uppercase mb-2">Tactical Standby</h2>
              <p className="text-[10px] text-white/10 uppercase tracking-[0.2em] max-w-[200px] leading-relaxed mx-auto">
                Monitoring hotel systems for anomalous signals...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Task Alert Overlay */}
      <AnimatePresence>
        {newArrival && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-8 left-4 right-4 z-[100]"
          >
            <div className="bg-red-600 text-white p-5 rounded-2xl shadow-[0_20px_50px_rgba(220,38,38,0.5)] flex items-center gap-4 border border-red-400 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
               <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-7 h-7 animate-bounce" />
               </div>
               <div>
                  <p className="font-black text-[10px] uppercase tracking-[0.2em] opacity-80 mb-0.5">Urgent Mission</p>
                  <p className="text-base font-bold leading-tight">Tactical Orders Received</p>
                  <p className="text-[10px] opacity-60 mt-1 uppercase">Respond immediately to secure sector.</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
