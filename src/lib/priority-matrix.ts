// src/lib/priority-matrix.ts — Stage 3: Priority Matrix
// Ranks task–staff pairings by urgency, proximity, skill, and embedding similarity

import type { ContextGraph, StaffNode } from './context-graph'

export interface PrioritisedTask {
  taskId: string
  description: string
  urgencyTier: string
  urgencyScore: number
  assignedStaffId: string
  staffName: string
  staffRole: string
  staffProximityScore: number
  skillBonus: number
  embeddingMatchScore: number
  guestVulnerabilityScore: number
  totalScore: number
  floor: number
  zone: string
}

export const URGENCY_TIERS: Record<string, number> = {
  LIFE_SAFETY_ESCORT: 100,
  FIRE_RESPONSE: 80,
  FLOOR_EVACUATION: 60,
  EMERGENCY_COMMS: 40,
  GUEST_ACCOUNTABILITY: 20,
  PROPERTY_PROTECTION: 10,
}

interface GeneratedTask {
  taskId: string
  description: string
  urgencyTier: string
  urgencyScore: number
  floor: number
  zone: string
  targetRoom?: string
  guestVulnerabilityScore: number
}

function generateTaskCandidates(
  graph: ContextGraph, incidentType: string, affectedFloors: number[]
): GeneratedTask[] {
  const tasks: GeneratedTask[] = []
  let c = 1
  const tid = () => `task_${String(c++).padStart(3, '0')}`

  // MUST_ESCORT tasks
  for (const edge of graph.edges.filter(e => e.type === 'MUST_ESCORT')) {
    const guest = graph.guestNodes.find(g => g.room === edge.toRoom)
    tasks.push({
      taskId: tid(),
      description: `Escort mobility-impaired guest from room ${edge.toRoom} to ground floor assembly point. ${guest?.assistanceNote ? `Note: ${guest.assistanceNote}.` : ''} Use stairwell, do not use lifts.`,
      urgencyTier: 'LIFE_SAFETY_ESCORT', urgencyScore: URGENCY_TIERS.LIFE_SAFETY_ESCORT,
      floor: guest?.floor ?? affectedFloors[0], zone: `Room ${edge.toRoom}`,
      targetRoom: edge.toRoom, guestVulnerabilityScore: guest?.vulnerabilityScore ?? 10,
    })
  }

  // FIRE_RESPONSE
  if (['FIRE', 'GAS_LEAK'].includes(incidentType)) {
    for (const floor of affectedFloors) {
      tasks.push({
        taskId: tid(),
        description: `Respond to ${incidentType.replace('_', ' ').toLowerCase()} on Floor ${floor}. Locate source, assess, deploy extinguisher if safe.`,
        urgencyTier: 'FIRE_RESPONSE', urgencyScore: URGENCY_TIERS.FIRE_RESPONSE,
        floor, zone: `Floor ${floor}`, guestVulnerabilityScore: 0,
      })
    }
  }

  // FLOOR_EVACUATION — one per affected floor
  for (const floor of affectedFloors) {
    tasks.push({
      taskId: tid(),
      description: `Sweep all rooms on Floor ${floor}. Guide guests to stairwell and down to ground floor assembly point. Do not use lifts.`,
      urgencyTier: 'FLOOR_EVACUATION', urgencyScore: URGENCY_TIERS.FLOOR_EVACUATION,
      floor, zone: `Floor ${floor}`, guestVulnerabilityScore: 0,
    })
  }

  // EMERGENCY_COMMS
  tasks.push({
    taskId: tid(),
    description: `Contact emergency services. Provide hotel address, incident type, affected floors, and estimated guest count.`,
    urgencyTier: 'EMERGENCY_COMMS', urgencyScore: URGENCY_TIERS.EMERGENCY_COMMS,
    floor: 1, zone: 'Reception', guestVulnerabilityScore: 0,
  })

  // GUEST_ACCOUNTABILITY
  tasks.push({
    taskId: tid(),
    description: `Set up guest muster point at main entrance. Cross-reference arriving guests against PMS occupancy list.`,
    urgencyTier: 'GUEST_ACCOUNTABILITY', urgencyScore: URGENCY_TIERS.GUEST_ACCOUNTABILITY,
    floor: 1, zone: 'Assembly Point', guestVulnerabilityScore: 0,
  })

  // PROPERTY_PROTECTION (only if staff available)
  if (graph.staffNodes.length > tasks.length) {
    tasks.push({
      taskId: tid(),
      description: `Secure reception safe, server room, and key card system. Lock non-essential areas.`,
      urgencyTier: 'PROPERTY_PROTECTION', urgencyScore: URGENCY_TIERS.PROPERTY_PROTECTION,
      floor: 1, zone: 'Reception', guestVulnerabilityScore: 0,
    })
  }

  return tasks
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i]
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB)
  return mag === 0 ? 0 : dot / mag
}

export type EmbedFn = (texts: string[]) => Promise<number[][]>

export async function computePriorityMatrix(
  graph: ContextGraph, incidentType: string, affectedFloors: number[], embedFn: EmbedFn
): Promise<PrioritisedTask[]> {
  const tasks = generateTaskCandidates(graph, incidentType, affectedFloors)
  const staff = graph.staffNodes
  if (!tasks.length || !staff.length) return []

  const taskTexts = tasks.map(t => t.description)
  const staffTexts = staff.map(s => `${s.role} ${s.certifications.join(' ')} Floor ${s.floor} ${s.zone}`)

  let taskEmb: number[][] = [], staffEmb: number[][] = []
  try {
    ;[taskEmb, staffEmb] = await Promise.all([embedFn(taskTexts), embedFn(staffTexts)])
  } catch (err) {
    console.warn('[PriorityMatrix] Embedding failed, skipping:', err)
  }

  const assigned = new Set<string>()
  const result: PrioritisedTask[] = []
  const sorted = [...tasks].sort((a, b) => b.urgencyScore - a.urgencyScore)

  for (const task of sorted) {
    const ti = tasks.indexOf(task)
    let best: StaffNode | null = null, bestScore = -1, bestEmbed = 0, bestSkill = 0

    for (let si = 0; si < staff.length; si++) {
      const s = staff[si]
      if (assigned.has(s.id)) continue
      const mustEscort = graph.edges.find(e => e.type === 'MUST_ESCORT' && e.fromStaffId === s.id && e.toRoom === task.targetRoom)
      const skill = s.hasRelevantSkill ? 15 : 0
      const emb = (taskEmb[ti]?.length && staffEmb[si]?.length) ? cosineSimilarity(taskEmb[ti], staffEmb[si]) : 0
      let score = task.urgencyScore + task.guestVulnerabilityScore + s.proximityScore + skill + (emb * 10)
      if (mustEscort) score += 1000
      if (score > bestScore) { bestScore = score; best = s; bestEmbed = emb; bestSkill = skill }
    }

    if (best) {
      assigned.add(best.id)
      result.push({
        taskId: task.taskId, description: task.description, urgencyTier: task.urgencyTier,
        urgencyScore: task.urgencyScore, assignedStaffId: best.id, staffName: best.name,
        staffRole: best.role, staffProximityScore: best.proximityScore, skillBonus: bestSkill,
        embeddingMatchScore: bestEmbed, guestVulnerabilityScore: task.guestVulnerabilityScore,
        totalScore: bestScore, floor: task.floor, zone: task.zone,
      })
    }
  }

  return result.sort((a, b) => b.totalScore - a.totalScore)
}
