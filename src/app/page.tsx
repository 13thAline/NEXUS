import Link from 'next/link'
import { Shield, Activity, Bell, Map, Users, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans">
      {/* Background Decorators */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      <div className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-[60%] -right-[10%] w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 w-full px-8 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative">
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest uppercase italic leading-none">NEXUS</h1>
            <p className="text-[9px] text-white/40 uppercase tracking-[0.3em] font-mono mt-1">Hospitality Intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/staff" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
            Staff Portal
          </Link>
          <Link 
            href="/login" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest transition-all duration-300"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8 animate-nexus-slide-in">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          System Online & Monitoring
        </div>
        
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-br from-white via-white/90 to-white/30 bg-clip-text text-transparent max-w-4xl animate-nexus-slide-in" style={{ animationDelay: '100ms' }}>
          Intelligent Crisis Coordination for Modern Hospitality.
        </h2>
        
        <p className="text-lg md:text-xl text-white/50 max-w-2xl mb-12 font-medium leading-relaxed animate-nexus-slide-in" style={{ animationDelay: '200ms' }}>
          NEXUS is an autonomous safety engine that instantly detects anomalies, orchestrates response teams, and secures your property using deterministic AI.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-nexus-slide-in" style={{ animationDelay: '300ms' }}>
          <Link 
            href="/simulate"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition-all hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
          >
            Run Simulation <ChevronRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/staff"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm tracking-wide transition-all"
          >
            Access Staff Portal
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-32 animate-nexus-slide-in" style={{ animationDelay: '400ms' }}>
          <FeatureCard 
            icon={<Bell className="w-6 h-6 text-red-400" />}
            title="Real-time Detection"
            description="Ingests raw sensor data and IoT triggers instantly, bypassing human delays in critical moments."
          />
          <FeatureCard 
            icon={<Map className="w-6 h-6 text-purple-400" />}
            title="Spatial Awareness"
            description="Maps incidents to specific zones and dynamically tracks safe vs. compromised sectors."
          />
          <FeatureCard 
            icon={<Users className="w-6 h-6 text-green-400" />}
            title="Automated Dispatch"
            description="Generates precision task lists and routes them directly to the appropriate staff mobile devices."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs font-mono text-white/30 tracking-widest uppercase">
        NEXUS Security Systems © 2026 // Authorized Personnel Only
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="nexus-glass p-8 rounded-3xl border border-white/5 text-left hover:bg-white/[0.03] transition-colors">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed font-medium">{description}</p>
    </div>
  )
}
