'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Shield, Radio, Activity, ChevronRight, Zap } from 'lucide-react'

export default function HomePage() {
  const [staffId, setStaffId] = useState('')

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Logo and title */}
      <div className="relative z-10 text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            NEX<span className="text-red-500">US</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Crisis Command Intelligence
        </p>
        <p className="text-muted-foreground/60 text-sm mt-2">
          Local-first AI crisis coordination for hospitality
        </p>
      </div>

      {/* Role cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        {/* Duty Manager Dashboard */}
        <Link
          href="/dashboard"
          className="group nexus-glass rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                Command Dashboard
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
              <p className="text-sm text-muted-foreground">
                Duty manager view — full-screen incident monitoring, task assignment, and guest accountability
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">Real-time</span>
            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400">AI-powered</span>
          </div>
        </Link>

        {/* Staff Portal */}
        <div className="nexus-glass rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Radio className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">Staff Portal</h2>
              <p className="text-sm text-muted-foreground">
                View and acknowledge your assigned emergency task
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="Enter Staff ID (e.g. staff_001)"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <Link
              href={staffId ? `/staff/${staffId}` : '#'}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                staffId
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-white/5 text-muted-foreground cursor-not-allowed'
              }`}
              onClick={(e) => !staffId && e.preventDefault()}
            >
              Go
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {['staff_001', 'staff_002', 'staff_003', 'staff_004', 'staff_005', 'staff_006'].map(id => (
              <Link
                key={id}
                href={`/staff/${id}`}
                className="text-xs px-2 py-0.5 rounded bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
              >
                {id}
              </Link>
            ))}
          </div>
        </div>

        {/* Incident Simulator */}
        <Link
          href="/simulate"
          className="group nexus-glass rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-purple-500/30 md:col-span-2"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                Incident Simulator
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">Demo Tool</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
              <p className="text-sm text-muted-foreground">
                Trigger simulated fire, medical, and security incidents — replaces curl for live demos
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-12 text-center">
        <p className="text-xs text-muted-foreground/40">
          100% local • Zero cloud dependency • Ollama + Llama 3 powered
        </p>
      </div>
    </div>
  )
}
