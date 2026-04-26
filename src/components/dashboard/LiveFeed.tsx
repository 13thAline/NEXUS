// src/components/dashboard/LiveFeed.tsx — Live event stream
'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { IncidentLog } from '@/types'

const SOURCE_STYLES: Record<string, { icon: string; color: string }> = {
  SENSOR: { icon: '🚨', color: 'text-red-400' },
  LLM: { icon: '🧠', color: 'text-purple-400' },
  STAFF: { icon: '👤', color: 'text-blue-400' },
  SYSTEM: { icon: '⚙️', color: 'text-muted-foreground' },
}

interface LiveFeedProps {
  logs: IncidentLog[]
  generating: boolean
}

export function LiveFeed({ logs, generating }: LiveFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Feed</h2>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${generating ? 'bg-yellow-400 animate-nexus-pulse' : 'bg-green-500'}`} />
          <span className="text-[10px] text-muted-foreground">{generating ? 'Processing' : 'Live'}</span>
        </div>
      </div>
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-1">
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 text-center py-8">Waiting for events...</p>
          ) : (
            logs.map((log, i) => {
              const style = SOURCE_STYLES[log.source] || SOURCE_STYLES.SYSTEM
              const time = new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
              return (
                <div key={log.id || i} className="flex gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] animate-nexus-slide-in">
                  <span className="text-sm shrink-0">{style.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed break-words">{log.message}</p>
                    <span className="text-[10px] text-muted-foreground/40 font-mono">{time}</span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
