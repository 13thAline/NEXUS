'use client'

import { motion } from 'framer-motion'
import { FileText, ShieldCheck, Zap, Activity, CheckCircle2, AlertTriangle } from 'lucide-react'

interface AnalysisReportProps {
  report: string | null
  metrics: any
  onResolve: () => void
  isResolving: boolean
}

export function AnalysisReport({ report, metrics, onResolve, isResolving }: AnalysisReportProps) {
  if (!metrics && !report) return null

  const stats = typeof metrics === 'string' ? JSON.parse(metrics) : metrics

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col bg-[#050505] rounded-xl border border-blue-500/20 overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.1)]"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-blue-500/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Post-Incident Intelligence</h2>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">AAR-NODE-LOCAL</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 nexus-scrollbar">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-3 gap-4">
           <MetricCard label="Response Score" value={`${stats?.efficiencyScore || '85'}%`} icon={<Zap className="w-3 h-3 text-yellow-400" />} color="text-yellow-400" />
           <MetricCard label="Safety Rating" value={stats?.safetyRating || 'A'} icon={<ShieldCheck className="w-3 h-3 text-green-400" />} color="text-green-400" />
           <MetricCard label="Total Duration" value={`${stats?.durationMins || '0'}m`} icon={<Activity className="w-3 h-3 text-blue-400" />} color="text-blue-400" />
        </div>

        {/* AI Summary */}
        <div className="space-y-4">
           <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-3 bg-blue-500" />
              Tactical Analysis
           </h3>
           <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative group">
              <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-30 transition-opacity">
                 <Zap className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-sm leading-relaxed text-white/80 italic font-medium relative z-10">
                 "{report || 'Analyzing incident response dynamics...'}"
              </p>
           </div>
        </div>

        {/* Resolution Block */}
        <div className="pt-4 border-t border-white/5">
           <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex items-center gap-4">
                 <CheckCircle2 className="w-8 h-8 text-green-500/40" />
                 <div>
                    <p className="text-sm font-bold text-green-400/90 tracking-tight">Mission Objective Secured</p>
                    <p className="text-xs text-green-500/50 mt-0.5">All tasks verified. System ready for final resolution.</p>
                 </div>
              </div>
              
              <button
                onClick={onResolve}
                disabled={isResolving}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(37,99,235,0.3)]"
              >
                {isResolving ? 'Archiving Session...' : 'Resolve & Archive Incident'}
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  )
}

function MetricCard({ label, value, icon, color }: any) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center flex flex-col items-center justify-center">
       <div className="flex items-center gap-1.5 mb-1">
          {icon}
          <span className="text-[8px] font-black uppercase text-white/30 tracking-tighter">{label}</span>
       </div>
       <span className={`text-xl font-black tracking-tighter ${color}`}>{value}</span>
    </div>
  )
}
