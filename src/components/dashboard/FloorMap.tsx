// src/components/dashboard/FloorMap.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, User, Maximize2, Circle } from 'lucide-react'
import type { Incident, Task, GuestRoom } from '@/types'

interface FloorMapProps {
  incident: Incident | null
  tasks: Task[]
  guests?: GuestRoom[]
  evacuated?: Set<string>
  onExpand?: () => void
}

const FLOORS = [6, 5, 4, 3, 2, 1]
const ZONES = ['NORTH', 'SOUTH', 'EAST', 'WEST']

export function FloorMap({ incident, tasks, guests = [], evacuated = new Set(), onExpand }: FloorMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Floor visualizer</h3>
          {onExpand && (
            <button 
              onClick={onExpand}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/20 hover:text-white/60 transition-colors"
            >
              <Maximize2 className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
        {incident && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-tighter">Active Threat</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto nexus-scrollbar pr-2 -mr-2 space-y-2">
        {FLOORS.map((floor) => (
          <div key={floor} className="flex gap-3 items-center group">
            <div className="w-10 text-[11px] font-black font-mono text-white/20 group-hover:text-white/50 transition-colors text-center shrink-0">
              L0{floor}
            </div>
            <div className="flex-1 grid grid-cols-4 gap-2">
              {ZONES.map((zone) => {
                const isZoneMatch = incident?.zone?.toUpperCase().includes(zone)
                const isSpecialMatch = incident && incident.zone && (
                  (zone === 'NORTH' && incident.zone.includes('Kitchen')) ||
                  (zone === 'SOUTH' && incident.zone.includes('Engineering')) ||
                  (zone === 'EAST' && incident.zone.includes('Room 407'))
                )

                const isActive = incident && incident.floor === floor && (isZoneMatch || isSpecialMatch)
                
                // Find staff assigned to this specific cell
                const staffInCell = tasks.filter(t => 
                  t.floor === floor && 
                  t.zone.toUpperCase().includes(zone) &&
                  t.status !== 'COMPLETE'
                )

                // Find non-evacuated guests in this cell
                const guestsInCell = guests.filter(g => 
                   g.floor === floor && 
                   (incident && g.floor === floor ? g.room : true) && // Simplified zone check for demo
                   !evacuated.has(g.room)
                ).filter(g => {
                   // Map guest rooms to zones (Demo logic: odd=North/East, even=South/West)
                   const roomNum = parseInt(g.room)
                   if (zone === 'NORTH' || zone === 'EAST') return roomNum % 2 !== 0
                   return roomNum % 2 === 0
                })

                const cellSeed = (floor * 7 + zone.length) % 10
                
                return (
                  <div
                    key={`${floor}-${zone}`}
                    className={`
                      relative h-10 rounded-lg border transition-all duration-500
                      ${isActive 
                        ? 'bg-red-500/30 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' 
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-red-500 animate-bounce drop-shadow-[0_0_8px_rgba(239,68,68,1)]" />
                      </div>
                    )}

                    {/* Guest Indicators (Orange Dots) */}
                    {guestsInCell.length > 0 && !isActive && (
                       <div className="absolute top-1 left-1 flex flex-wrap gap-0.5 max-w-[80%]">
                          {guestsInCell.slice(0, 3).map(g => (
                             <div 
                                key={g.room} 
                                className={`w-1.5 h-1.5 rounded-full ${g.mobilityImpaired ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse' : 'bg-orange-400/60'}`}
                                title={`Room ${g.room}${g.mobilityImpaired ? ' (PRIORITY)' : ''}`}
                             />
                          ))}
                          {guestsInCell.length > 3 && <div className="text-[6px] text-orange-400/50">+</div>}
                       </div>
                    )}

                    {/* Staff Markers */}
                    {staffInCell.length > 0 && !isActive && (
                      <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                        {staffInCell.map((t, i) => (
                          <div 
                            key={t.id} 
                            className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-pulse border border-white/20"
                            title={`${t.staffName} (${t.staffRole})`}
                          />
                        ))}
                      </div>
                    )}
                    
                    {isMounted && !isActive && staffInCell.length === 0 && guestsInCell.length === 0 && cellSeed > 7 && (
                      <div className="absolute bottom-1 right-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 opacity-60 animate-nexus-pulse-dot" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1 mt-2">
        {ZONES.map(z => (
          <div key={z} className="text-[8px] text-center text-white/20 font-mono tracking-tighter">{z}</div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] text-white/30 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
            <span>Staff</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]" />
            <span>Guests</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
            <span>Threat</span>
          </div>
        </div>
      </div>
    </div>
  )
}
