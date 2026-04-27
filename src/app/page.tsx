'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Shield, Radio, Activity, ChevronRight, Zap, Target } from 'lucide-react'

export default function HomePage() {
  const [staffId, setStaffId] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const initializeSystem = () => {
    // Unlocks audio context for modern browsers
    setIsInitialized(true)
    if (typeof window !== 'undefined') {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtx.resume()
      // Store in local storage to signal other tabs/components
      localStorage.setItem('nexus_audio_active', 'true')
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(239, 68, 68, 0.15), transparent 25%), 
                       linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                       linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none mix-blend-overlay"></div>
      
      {/* Scanline Effect */}
      <div className="nexus-scanline opacity-20"></div>

      {/* Hero Section */}
      <div className="relative z-10 text-center mb-16 animate-nexus-fade-in">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)] animate-nexus-float">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-1 bg-red-600/20 blur-xl rounded-full -z-10 animate-nexus-pulse"></div>
          </div>
          
          <h1 className="text-7xl font-black tracking-tighter italic">
            NEX<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 [text-shadow:0_0_40px_rgba(239,68,68,0.4)]">US</span>
          </h1>
        </div>
        
        <div className="space-y-2">
          <p className="text-xl font-medium tracking-[0.2em] text-white/50 uppercase">
            Crisis Command Intelligence
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-8 bg-red-600/50"></div>
            <p className="text-xs text-red-500/60 font-mono tracking-widest uppercase">
              Ollama + Llama 3 • Local Deployment
            </p>
            <div className="h-[1px] w-8 bg-red-600/50"></div>
          </div>
        </div>
      </div>

      {!isInitialized ? (
        <button
          onClick={initializeSystem}
          className="relative group z-10 nexus-glass px-12 py-5 rounded-2xl border-white/10 hover:border-red-500/50 transition-all duration-500 overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <span className="relative flex items-center gap-3 text-lg font-bold tracking-widest uppercase text-white/80 group-hover:text-white transition-colors">
            <Target className="w-5 h-5 animate-spin" />
            Initialize Interface
          </span>
        </button>
      ) : (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full animate-nexus-slide-in">
          {/* Duty Manager Card */}
          <Link
            href="/dashboard"
            className="group nexus-glass nexus-glass-hover rounded-3xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-24 h-24 text-red-500" />
            </div>
            
            <div className="flex flex-col h-full gap-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
                <Shield className="w-7 h-7 text-red-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                  Command Dashboard
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </h2>
                <p className="text-sm text-white/40 leading-relaxed">
                  Real-time full-screen monitoring, tactical AI task generation, and guest evacuation coordination.
                </p>
              </div>
              
              <div className="mt-auto flex gap-3">
                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-tighter">Live Status</span>
                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-tighter">AI Ops</span>
              </div>
            </div>
          </Link>

          {/* Staff Portal Card */}
          <div className="nexus-glass rounded-3xl p-8 flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Radio className="w-7 h-7 text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Staff Portal</h2>
                <p className="text-sm text-white/40">
                  Ground operations interface for acknowledging and reporting task completion.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 p-1.5 bg-white/5 rounded-xl border border-white/10 focus-within:border-blue-500/50 transition-colors">
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="Staff ID (e.g. staff_001)"
                  className="flex-1 bg-transparent px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none"
                />
                <Link
                  href={staffId ? `/staff/${staffId}` : '#'}
                  className={`px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${
                    staffId
                      ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-[1.02]'
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                  onClick={(e) => !staffId && e.preventDefault()}
                >
                  Enter
                </Link>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['staff_001', 'staff_002', 'staff_003'].map(id => (
                  <Link
                    key={id}
                    href={`/staff/${id}`}
                    className="text-[10px] font-mono px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-blue-400 transition-all border border-white/5"
                  >
                    {id}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Simulator Tool */}
          <Link
            href="/simulate"
            className="group nexus-glass nexus-glass-hover p-8 rounded-3xl md:col-span-2 border-purple-500/10 hover:border-purple-500/30"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Incident Simulation Tool</h3>
                <p className="text-sm text-white/40">Inject fire, medical, or security triggers to validate NEXUS response pathways.</p>
              </div>
              <ChevronRight className="w-6 h-6 text-purple-500/40 group-hover:text-purple-400" />
            </div>
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 mt-16 text-center animate-nexus-fade-in [animation-delay:1s]">
        <div className="flex items-center gap-6 justify-center opacity-30">
          <span className="text-[10px] uppercase tracking-widest font-mono">System v1.0.4</span>
          <div className="w-1 h-1 rounded-full bg-white/20"></div>
          <span className="text-[10px] uppercase tracking-widest font-mono">100% Local Intelligence</span>
          <div className="w-1 h-1 rounded-full bg-white/20"></div>
          <span className="text-[10px] uppercase tracking-widest font-mono">Encrypted Operations</span>
        </div>
      </div>
    </div>
  )
}
