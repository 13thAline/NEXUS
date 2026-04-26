import { ChevronRight, Zap } from 'lucide-react'
import Link from 'next/link'
import staffData from '../../../data/staff.json'

export default function StaffIndexPage() {
  return (
    <main className="min-h-screen bg-background p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Zap className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">NEXUS Staff Portal</h1>
          <p className="text-muted-foreground text-sm">Select your identity to view active assignments</p>
        </div>
      </div>

      <div className="grid gap-3">
        {staffData.map((staff) => (
          <Link 
            key={staff.id} 
            href={`/staff/${staff.id}`}
            className="group flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                {staff.role === 'SECURITY' ? '🛡️' : 
                 staff.role === 'ENGINEERING' ? '🔧' : 
                 staff.role === 'HOUSEKEEPING' ? '🧹' : '👔'}
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-red-400 transition-colors">{staff.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase font-bold tracking-wider">
                    {staff.role}
                  </span>
                  <span className="text-xs text-muted-foreground">ID: {staff.id}</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-red-500 transition-all" />
          </Link>
        ))}
      </div>

      <footer className="mt-12 text-center">
        <p className="text-xs text-muted-foreground/40 italic">
          Authorized personnel only. All interactions are logged via NEXUS Protocol.
        </p>
      </footer>
    </main>
  )
}
