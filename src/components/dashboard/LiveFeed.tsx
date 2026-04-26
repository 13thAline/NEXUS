// src/components/dashboard/LiveFeed.tsx — Tactical event stream
'use client'

import { useEffect, useRef } from 'react'
import type { IncidentLog } from '@/types'
import { Badge } from '@/components/ui/badge'

interface LiveFeedProps {
  logs: IncidentLog[]
  generating: boolean
}

const SOURCE_COLORS: Record<string, string> = {
  SENSOR: 'bg-red-500/20 text-red-400 border-red-500/30',
  LLM: 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]',
  STAFF: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SYSTEM: 'bg-white/10 text-white/40 border-white/20',
}

export function LiveFeed({ logs, generating }: LiveFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-xl overflow-hidden border border-white/5 shadow-inner">
      <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Tactical Event Stream</h2>
        <div className="flex gap-1.5 items-center">
           {generating && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
           <div className="w-1.5 h-1.5 rounded-full bg-green-500/20" />
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 nexus-scrollbar nexus-terminal">
        {logs.map((log, i) => (
          <div key={log.id || i} className="animate-nexus-slide-in group border-l border-white/5 pl-4 ml-1 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className={`text-[8px] font-black px-1.5 py-0 h-4 tracking-tighter uppercase ${SOURCE_COLORS[log.source] || SOURCE_COLORS.SYSTEM}`}>
                {log.source}
              </Badge>
              <span className="text-[9px] text-white/20 font-mono tracking-tighter">
                {new Date(log.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <p className={`
              text-[11px] leading-relaxed tracking-tight
              ${log.source === 'LLM' ? 'text-orange-200/90 font-medium italic' : 'text-white/70'}
              group-hover:text-white transition-colors
            `}>
              <span className="opacity-20 mr-2 font-mono">{'>'}</span>
              {log.message}
            </p>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center">
             <div className="text-center group">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center mx-auto mb-3 group-hover:border-white/20 transition-colors">
                   <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-ping" />
                </div>
                <p className="text-white/10 italic text-[10px] tracking-[0.3em] uppercase">No Signals Detected</p>
             </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
      
      {/* Footer decorator */}
      <div className="h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
    </div>
  )
}
