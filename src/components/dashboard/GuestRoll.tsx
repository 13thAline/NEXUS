// src/components/dashboard/GuestRoll.tsx — Guest accountability tracker
'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, Accessibility } from 'lucide-react'
import type { Incident, GuestRoom } from '@/types'

interface GuestRollProps {
  incident: Incident | null
}

export function GuestRoll({ incident }: GuestRollProps) {
  const [guests, setGuests] = useState<GuestRoom[]>([])
  const [evacuated, setEvacuated] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/pms/occupancy')
      .then(res => res.json())
      .then(data => setGuests(data.guests || []))
      .catch(() => {})
  }, [])

  const toggleEvacuated = (room: string) => {
    setEvacuated(prev => {
      const next = new Set(prev)
      next.has(room) ? next.delete(room) : next.add(room)
      return next
    })
  }

  const totalGuests = guests.reduce((sum, g) => sum + g.guestCount, 0)
  const evacuatedGuests = guests.filter(g => evacuated.has(g.room)).reduce((sum, g) => sum + g.guestCount, 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guest Roll</h2>
        {incident && (
          <Badge variant="outline" className="text-[10px]">
            {evacuatedGuests}/{totalGuests}
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      {incident && totalGuests > 0 && (
        <div className="mb-3 px-1">
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${(evacuatedGuests / totalGuests) * 100}%` }}
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-1">
          {guests.map((guest) => (
            <button
              key={guest.room}
              onClick={() => toggleEvacuated(guest.room)}
              className={`w-full flex items-center gap-2 py-2 px-2 rounded-lg text-left transition-all duration-200 ${
                evacuated.has(guest.room) ? 'bg-green-500/10' : 'hover:bg-white/[0.03]'
              }`}
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                evacuated.has(guest.room) ? 'bg-green-500 border-green-500' : 'border-white/20'
              }`}>
                {evacuated.has(guest.room) && <Check className="w-3 h-3 text-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">Room {guest.room}</span>
                  <span className="text-[10px] text-muted-foreground">F{guest.floor}</span>
                  {guest.mobilityImpaired && (
                    <Accessibility className="w-3 h-3 text-yellow-400" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {guest.guestCount} guest{guest.guestCount > 1 ? 's' : ''}
                  {guest.assistanceNote && ` • ${guest.assistanceNote}`}
                </span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
