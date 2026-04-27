// src/app/staff/page.tsx — Staff Login / Selection
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Radio, ChevronRight, Zap } from 'lucide-react'
import staffData from '../../../data/staff.json'

export default function StaffPortalPage() {
  const [search, setSearch] = useState('')

  const staff = staffData.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Radio className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">Staff Portal</h1>
            <p className="text-xs text-muted-foreground">Select your ID to view assignments</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Staff List */}
        <div className="space-y-2">
          {staff.map((s) => (
            <Link
              key={s.id}
              href={`/staff/${s.id}`}
              className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-blue-500/20 transition-all"
            >
              <div>
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.role} • {s.id}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
            </Link>
          ))}
          {staff.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">No staff members found.</p>
          )}
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
             <Zap className="w-3 h-3" /> Back to NEXUS Home
          </Link>
        </div>
      </div>
    </div>
  )
}
