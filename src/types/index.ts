// src/types/index.ts — Shared TypeScript types for NEXUS

// ─── Pipeline Status ──────────────────────────────────────

export type PipelineStatus =
  | 'PENDING'
  | 'TRIAGING'
  | 'BUILDING_GRAPH'
  | 'COMPUTING_PRIORITIES'
  | 'GENERATING_STRATEGY'
  | 'ACTIVE'
  | 'CONTAINED'
  | 'RESOLVED'
  | 'PIPELINE_FAILED'

export type IncidentStatus = PipelineStatus

export type TaskStatus = 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETE'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type StaffRole =
  | 'SECURITY'
  | 'HOUSEKEEPING'
  | 'ENGINEERING'
  | 'FRONT_DESK'
  | 'MANAGEMENT'
  | 'MEDICAL'

export type LogSource = 'SYSTEM' | 'STAFF' | 'LLM' | 'SENSOR'

// ─── Database Models ──────────────────────────────────────

export interface Incident {
  id: string
  source: string
  rawPayload: string
  timestamp: string | Date
  status: IncidentStatus
  llmReasoning: string | null
  coverageGaps: string | null
  warnings: string | null
  generatedBy: string | null
  pipelineMs: number | null
  resolvedAt: string | Date | null
  type: string | null
  severity: string | null
  zone: string | null
  floor: number | null
  analysisReport: string | null
  metrics: string | null
  tasks?: Task[]
  logs?: IncidentLog[]
}

export interface Task {
  id: string
  incidentId: string
  incident?: Incident
  staffId: string
  staffName: string
  staffRole: string
  description: string
  priority: number
  floor: number
  zone: string
  status: TaskStatus
  assignedAt: string | Date
  acknowledgedAt: string | Date | null
  completedAt: string | Date | null
  llmReasoning: string | null
}

export interface IncidentLog {
  id: string
  incidentId: string
  event: string
  data: string
  timestamp: string | Date
}

// ─── Seed Data Types ──────────────────────────────────────

export interface StaffMember {
  id: string
  name: string
  role: StaffRole | string
  subRole: string
  floor: number
  zone: string
  contact: string
  certifications: string[]
  available: boolean
}

export interface GuestRoom {
  room: string
  floor: number
  guestCount: number
  mobilityImpaired: boolean
  assistanceNote?: string
  checkoutDate: string
}

export interface OccupancyData {
  timestamp: string
  totalRooms: number
  occupiedRooms: number
  guests: GuestRoom[]
}

// ─── Hotel Layout ─────────────────────────────────────────

export interface HotelZone {
  id: string
  name: string
  floor: number
  type: 'CORRIDOR' | 'ROOM_BLOCK' | 'STAIRWELL' | 'ELEVATOR' | 'LOBBY' | 'SERVICE' | 'ASSEMBLY_POINT'
}

export interface HotelFloor {
  floor: number
  name: string
  zones: HotelZone[]
}

export interface HotelLayout {
  name: string
  totalFloors: number
  totalRooms: number
  floors: HotelFloor[]
  assemblyPoints: string[]
}

// ─── LLM Pipeline Types ──────────────────────────────────

export interface TaskPlan {
  incidentSummary: string
  escalationRecommended: boolean
  estimatedClearTime: string
  tasks: TaskPlanTask[]
}

export interface TaskPlanTask {
  staffId: string
  staffName: string
  staffRole?: string
  description: string
  priority: number
  floor?: number
  zone?: string
  reasoning?: string
}

// ─── API Input Types ──────────────────────────────────────

export interface IncidentTriggerInput {
  source: string
  rawPayload: string
  timestamp?: string
  cctvFrame?: string
}
