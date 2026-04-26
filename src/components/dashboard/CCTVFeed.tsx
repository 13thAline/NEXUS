'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Radio, Shield, Circle, Maximize2 } from 'lucide-react'

interface CCTVFeedProps {
  zone: string | undefined
  floor: number | undefined
  onExpand?: () => void
}

export function CCTVFeed({ zone, floor, onExpand }: CCTVFeedProps) {
  const [timestamp, setTimestamp] = useState(new Date().toISOString())
  const [flicker, setFlicker] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toISOString())
      if (Math.random() > 0.95) {
        setFlicker(true)
        setTimeout(() => setFlicker(false), 50)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative h-full w-full bg-black rounded-xl border border-white/10 overflow-hidden group">
      {/* Simulation Background (Simulated static/noise) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://media.giphy.com/media/oEI9uWUznW3pS/giphy.gif')] bg-cover mix-blend-screen" />
      
      {/* CCTV Overlay Filter */}
      <div className={`absolute inset-0 transition-opacity duration-75 ${flicker ? 'opacity-40 bg-white' : 'opacity-0'}`} />
      
      {/* Night Vision Tint */}
      <div className="absolute inset-0 bg-green-500/10 mix-blend-color" />
      
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      {/* Header Info */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[10px] font-mono text-white/80 tracking-widest uppercase">REC • CAM-0{floor || 1}</span>
          </div>
          {onExpand && (
            <button 
              onClick={onExpand}
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/40 hover:text-white/80 transition-colors"
            >
              <Maximize2 className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
        <div className="text-[9px] font-mono text-white/40 tracking-tighter">
          {zone || 'SECTOR STANDBY'}
        </div>
      </div>

      {/* Center UI */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <div className="w-1/2 h-1/2 border border-white/5 relative">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white/20" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white/20" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white/20" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white/20" />
         </div>
      </div>

      {/* Bottom Data */}
      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[9px] font-mono text-white/60">
             <Radio className="w-3 h-3" />
             <span>UPLINK: ACTIVE</span>
          </div>
          <div className="text-[8px] font-mono text-white/30">
            LAT: 28.6139° N | LONG: 77.2090° E
          </div>
        </div>
        <div className="text-[10px] font-mono text-white/70">
           {timestamp.split('T')[1].split('.')[0]}
        </div>
      </div>

      {/* Empty State / Static Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 opacity-20">
         <Camera className="w-12 h-12 text-white" />
         <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Feed Simulation</span>
      </div>
    </div>
  )
}
