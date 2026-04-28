// src/lib/context-graph.ts — Stage 2: Context Graph Builder
// Pure TypeScript — NO AI. Deterministic spatial reasoning.

import type { StaffMember, GuestRoom } from '@/types'

// ─── Types ───────────────────────────────────────────────

export interface StaffNode {
  id: string
  name: string
  role: string
  floor: number
  zone: string
  certifications: string[]
  proximityScore: number       // 0–10: max(0, 10 - floorsAway × 2)
  hasRelevantSkill: boolean
  floorsFromIncident: number
}

export interface GuestNode {
  room: string
  floor: number
  guestCount: number
  mobilityImpaired: boolean
  assistanceNote?: string
  vulnerabilityScore: number   // 0–15 composite
  inIncidentZone: boolean
  inAdjacentZone: boolean
}

export interface GraphEdge {
  type: 'CAN_REACH' | 'MUST_ESCORT'
  fromStaffId: string
  toZone?: string
  toRoom?: string
  weight: number
}

export interface ContextGraph {
  staffNodes: StaffNode[]
  guestNodes: GuestNode[]
  edges: GraphEdge[]
  meta: GraphMeta
}

export interface GraphMeta {
  totalStaffAvailable: number
  highVulnerabilityGuests: number      // score >= 7
  staffOnIncidentFloor: number
  closestStaff: string[]               // top 5 staff IDs by proximity
  unescortedVulnerableGuests: string[] // rooms with score >= 7 but no MUST_ESCORT edge
}

// ─── Skill Map ───────────────────────────────────────────
// Maps incident types to relevant certifications

export const SKILL_MAP: Record<string, string[]> = {
  FIRE:             ['FIRE_WARDEN', 'CPR', 'FIRST_AID'],
  GAS_LEAK:         ['HVAC', 'ELECTRICAL', 'FIRE_WARDEN'],
  MEDICAL:          ['CPR', 'FIRST_AID'],
  ACTIVE_SHOOTER:   ['CROWD_CONTROL', 'CPR'],
  STRUCTURAL:       ['ELECTRICAL', 'HVAC'],
  EVACUATION:       ['FIRE_WARDEN', 'CROWD_CONTROL'],
  SECURITY:         ['CROWD_CONTROL'],
}

// ─── Builder ─────────────────────────────────────────────

export interface TriageInput {
  incidentType: string
  affectedFloors: number[]
  adjacentZones: string[]
  adjacentFloors: number[]
}

export function buildContextGraph(
  triage: TriageInput,
  staff: StaffMember[],
  guests: GuestRoom[]
): ContextGraph {
  const relevantSkills = SKILL_MAP[triage.incidentType] || []

  // ─── Build Staff Nodes ──────────────────────────────
  const staffNodes: StaffNode[] = staff
    .filter(s => s.available)
    .map(s => {
      const minFloorDist = Math.min(
        ...triage.affectedFloors.map(af => Math.abs(s.floor - af))
      )
      const proximityScore = Math.max(0, 10 - minFloorDist * 2)
      const hasRelevantSkill = s.certifications.some(c => relevantSkills.includes(c))

      return {
        id: s.id,
        name: s.name,
        role: s.role,
        floor: s.floor,
        zone: s.zone,
        certifications: s.certifications,
        proximityScore,
        hasRelevantSkill,
        floorsFromIncident: minFloorDist,
      }
    })

  // ─── Build Guest Nodes ──────────────────────────────
  const affectedFloorSet = new Set(triage.affectedFloors)
  const adjacentFloorSet = new Set(triage.adjacentFloors)

  const guestNodes: GuestNode[] = guests.map(g => {
    const inIncidentZone = affectedFloorSet.has(g.floor)
    const inAdjacentZone = adjacentFloorSet.has(g.floor)

    let vulnerabilityScore = 0
    if (g.mobilityImpaired) vulnerabilityScore += 5
    if (inIncidentZone) vulnerabilityScore += 4
    // Elderly detection from assistanceNote
    if (g.assistanceNote?.toLowerCase().includes('elderly')) vulnerabilityScore += 3
    // Children detection from assistanceNote
    if (g.assistanceNote?.toLowerCase().includes('child')) vulnerabilityScore += 2
    if (inAdjacentZone && !inIncidentZone) vulnerabilityScore += 1

    return {
      room: g.room,
      floor: g.floor,
      guestCount: g.guestCount,
      mobilityImpaired: g.mobilityImpaired,
      assistanceNote: g.assistanceNote,
      vulnerabilityScore,
      inIncidentZone,
      inAdjacentZone,
    }
  })

  // ─── Build Edges ────────────────────────────────────
  const edges: GraphEdge[] = []

  // CAN_REACH edges: every staff node to every affected/adjacent zone
  const affectedZones = [
    ...triage.affectedFloors.map(f => `Floor${f}`),
    ...triage.adjacentZones,
  ]

  for (const sn of staffNodes) {
    for (const zone of affectedZones) {
      edges.push({
        type: 'CAN_REACH',
        fromStaffId: sn.id,
        toZone: zone,
        weight: sn.proximityScore,
      })
    }
  }

  // MUST_ESCORT edges: mobility-impaired guests in incident zone
  // Weight 15 — sacred, cannot be deprioritised
  const vulnerableGuestsInDanger = guestNodes.filter(
    g => g.mobilityImpaired && g.inIncidentZone
  )

  const escortedRooms = new Set<string>()

  for (const guest of vulnerableGuestsInDanger) {
    // Find the best available staff member (closest with relevant skill)
    const bestStaff = staffNodes
      .filter(s => !escortedRooms.has(s.id)) // not already assigned an escort
      .sort((a, b) => {
        // Prefer skilled staff, then by proximity
        if (a.hasRelevantSkill && !b.hasRelevantSkill) return -1
        if (!a.hasRelevantSkill && b.hasRelevantSkill) return 1
        return b.proximityScore - a.proximityScore
      })[0]

    if (bestStaff) {
      edges.push({
        type: 'MUST_ESCORT',
        fromStaffId: bestStaff.id,
        toRoom: guest.room,
        weight: 15, // SACRED — maximum weight
      })
      escortedRooms.add(bestStaff.id)
    }
  }

  // ─── Meta Summary ───────────────────────────────────
  const highVulnGuests = guestNodes.filter(g => g.vulnerabilityScore >= 7)
  const mustEscortRooms = new Set(
    edges.filter(e => e.type === 'MUST_ESCORT').map(e => e.toRoom)
  )

  const meta: GraphMeta = {
    totalStaffAvailable: staffNodes.length,
    highVulnerabilityGuests: highVulnGuests.length,
    staffOnIncidentFloor: staffNodes.filter(s =>
      triage.affectedFloors.includes(s.floor)
    ).length,
    closestStaff: staffNodes
      .sort((a, b) => b.proximityScore - a.proximityScore)
      .slice(0, 5)
      .map(s => s.id),
    unescortedVulnerableGuests: highVulnGuests
      .filter(g => !mustEscortRooms.has(g.room))
      .map(g => g.room),
  }

  return { staffNodes, guestNodes, edges, meta }
}
