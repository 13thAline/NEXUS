// src/app/simulate/page.tsx — Incident Simulator (Demo Tool)
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Flame, Shield, Heart, Wind, Building, AlertTriangle, Zap, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ScenarioPreset {
  name: string
  icon: React.ReactNode
  type: string
  severity: string
  floor: number
  zone: string
  source: string
  rawPayload: string
  color: string
}

const SCENARIOS: ScenarioPreset[] = [
  {
    name: 'Fire — Floor 3 East',
    icon: <Flame className="w-5 h-5" />,
    type: 'FIRE', severity: 'HIGH', floor: 3,
    zone: 'Floor 3 East Corridor',
    source: 'FIRE_PANEL',
    rawPayload: 'Zone 3E: Smoke detector activated at corridor junction. Sprinkler system armed. Temperature rising in rooms 304-306.',
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
  },
  {
    name: 'Fire — Critical (Kitchen)',
    icon: <Flame className="w-5 h-5" />,
    type: 'FIRE', severity: 'CRITICAL', floor: 1,
    zone: 'Ground Floor Kitchen',
    source: 'FIRE_PANEL',
    rawPayload: 'Kitchen fire detected. Multiple smoke detectors triggered. Gas supply auto-shutoff activated. Sprinkler system deployed.',
    color: 'text-red-500 bg-red-500/10 border-red-500/30',
  },
  {
    name: 'Medical Emergency',
    icon: <Heart className="w-5 h-5" />,
    type: 'MEDICAL', severity: 'HIGH', floor: 4,
    zone: 'Room 407',
    source: 'MANUAL',
    rawPayload: 'Guest in Room 407 (elderly, mobility-impaired) reported chest pains via front desk call. Guest is conscious but in distress.',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    name: 'Gas Leak',
    icon: <Wind className="w-5 h-5" />,
    type: 'GAS_LEAK', severity: 'HIGH', floor: 0,
    zone: 'Basement Engineering Room',
    source: 'SECURITY_SYSTEM',
    rawPayload: 'Gas detector alarm in basement utility area. Concentration levels above threshold. Ventilation system activated.',
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  },
  {
    name: 'Security Breach',
    icon: <Shield className="w-5 h-5" />,
    type: 'SECURITY', severity: 'MEDIUM', floor: 2,
    zone: 'Floor 2 West Corridor',
    source: 'CCTV',
    rawPayload: 'CCTV motion detected in restricted area. Unauthorized individual near Room 211. No guest registered for that room.',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    name: 'Structural Issue',
    icon: <Building className="w-5 h-5" />,
    type: 'STRUCTURAL', severity: 'MEDIUM', floor: 3,
    zone: 'Floor 3 West Corridor',
    source: 'MANUAL',
    rawPayload: 'Water leak reported from ceiling in corridor near Room 315. Possible pipe burst. Wet floor hazard.',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
]

export default function SimulatePage() {
  const [triggering, setTriggering] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{ incidentId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const triggerIncident = async (scenario: ScenarioPreset) => {
    setTriggering(scenario.name)
    setError(null)
    setLastResult(null)

    try {
      const res = await fetch('/api/incident/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: scenario.type,
          severity: scenario.severity,
          floor: scenario.floor,
          zone: scenario.zone,
          source: scenario.source,
          rawPayload: scenario.rawPayload,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setLastResult(data)
      } else {
        setError(data.error || 'Failed to trigger incident')
      }
    } catch (err) {
      setError('Network error — is the server running?')
    } finally {
      setTriggering(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Incident Simulator</h1>
              <p className="text-xs text-muted-foreground">Demo tool — trigger simulated incidents</p>
            </div>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Open Dashboard <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Result banner */}
        {lastResult && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 animate-nexus-slide-in">
            <p className="text-sm text-green-400 font-medium">
              ✓ Incident created — ID: <code className="font-mono">{lastResult.incidentId}</code>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Task plan is being generated. Watch the{' '}
              <Link href="/dashboard" className="text-green-400 underline">dashboard</Link>
              {' '}for real-time updates.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">❌ {error}</p>
          </div>
        )}

        {/* Scenario grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCENARIOS.map((scenario) => (
            <Card key={scenario.name} className={`p-4 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] transition-all`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${scenario.color}`}>
                  {scenario.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">{scenario.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{scenario.severity}</Badge>
                    <Badge variant="outline" className="text-[10px]">Floor {scenario.floor}</Badge>
                    <Badge variant="outline" className="text-[10px]">{scenario.source}</Badge>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{scenario.rawPayload}</p>
              <button
                onClick={() => triggerIncident(scenario)}
                disabled={!!triggering}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                  triggering === scenario.name
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.98]'
                } disabled:opacity-50`}
              >
                {triggering === scenario.name ? '⏳ Triggering...' : '🚨 TRIGGER INCIDENT'}
              </button>
            </Card>
          ))}
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to NEXUS Home</Link>
        </div>
      </div>
    </div>
  )
}
