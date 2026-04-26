// src/components/dashboard/GuestRoll.tsx — Guest accountability tracker
'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Check, Accessibility, Search, Users } from 'lucide-react'
import type { Incident, GuestRoom } from '@/types'

interface GuestRollProps {
  incident: Incident | null
  guests: GuestRoom[]
  evacuated: Set<string>
  onToggleEvacuated: (room: string) => void
  search: string
  onSearchChange: (val: string) => void
  onExpand?: () => void
}

export function GuestRoll({ 
  incident, 
  guests, 
  evacuated, 
  onToggleEvacuated, 
  search, 
  onSearchChange,
  onExpand 
}: GuestRollProps) {

  const filteredGuests = useMemo(() => {
    return guests.filter(g => g.room.includes(search))
  }, [guests, search])

  const totalGuests = guests.reduce((sum, g) => sum + g.guestCount, 0)
  const evacuatedGuests = guests.filter(g => evacuated.has(g.room)).reduce((sum, g) => sum + g.guestCount, 0)

  return (
    <div className="flex flex-col h-full bg-black/20 rounded-xl overflow-hidden border border-white/5">
      {/* Header section */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white/30" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Guest Accountability</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {onExpand && (
              <button 
                onClick={onExpand}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white/60 transition-colors"
                title="Focus View"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}
            {incident && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-[10px]">
                {evacuatedGuests}/{totalGuests} SECURED
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {incident && totalGuests > 0 && (
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${evacuatedGuests === totalGuests ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}
              style={{ width: `${(evacuatedGuests / totalGuests) * 100}%` }}
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 focus-within:border-white/20 transition-colors">
          <Search className="w-3 h-3 text-white/20" />
          <input 
            type="text" 
            placeholder="Search room..." 
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-[10px] font-mono focus:outline-none placeholder:text-white/10"
          />
        </div>
      </div>

      {/* Guest List (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto nexus-scrollbar p-1 px-2">
        <div className="space-y-1 py-2">
          {filteredGuests.map((guest) => (
            <button
              key={guest.room}
              onClick={() => onToggleEvacuated(guest.room)}
              className={`w-full flex items-center gap-3 py-3 px-3 rounded-xl text-left border transition-all duration-300 ${
                evacuated.has(guest.room) 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                evacuated.has(guest.room) 
                  ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                  : 'bg-black/40 border-white/10'
              }`}>
                {evacuated.has(guest.room) && <Check className="w-3.5 h-3.5 text-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight">Room {guest.room}</span>
                  <span className="text-[10px] font-mono text-white/20">L{guest.floor}</span>
                  {guest.mobilityImpaired && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <Accessibility className="w-3 h-3 text-yellow-500" />
                      <span className="text-[8px] font-black text-yellow-500 uppercase">Priority</span>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-white/30 font-medium mt-0.5 truncate uppercase tracking-tighter">
                  {guest.guestCount} {guest.guestCount > 1 ? 'TOTAL GUESTS' : 'SINGLE OCCUPANCY'}
                  {guest.assistanceNote && ` • ${guest.assistanceNote}`}
                </div>
              </div>
            </button>
          ))}
          {filteredGuests.length === 0 && (
            <div className="h-32 flex flex-col items-center justify-center text-white/10 italic text-[10px] tracking-widest uppercase">
              No matching records
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
