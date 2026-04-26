// src/types/index.ts — Shared TypeScript types for NEXUS

// ─── Enums ────────────────────────────────────────────────────────

export type IncidentType =
  | 'FIRE'
  | 'ACTIVE_SHOOTER'
  | 'MEDICAL'
  | 'GAS_LEAK'
  | 'STRUCTURAL'
  | 'EVACUATION'
  | 'SECURITY'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type IncidentStatus = 'ACTIVE' | 'CONTAINED' | 'RESOLVED'

export type TaskStatus = 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'DONE'

export type StaffRole =
  | 'SECURITY'
  | 'HOUSEKEEPING'
  | 'ENGINEERING'
  | 'FRONT_DESK'
  | 'MANAGEMENT'
  | 'MEDICAL'

export type LogSource = 'SYSTEM' | 'STAFF' | 'LLM' | 'SENSOR'

// ─── Database Models (mirrors Prisma schema) ─────────────────────

export interface Incident {
  id: string
  type: IncidentType
  severity: Severity
  zone: string
  floor: number
  status: IncidentStatus
  triggeredAt: string | Date
  resolvedAt: string | Date | null
  rawPayload: string
  tasks?: Task[]
  events?: IncidentLog[]
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
  message: string
  source: LogSource
  createdAt: string | Date
}

// ─── Mock Data Types ─────────────────────────────────────────────

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
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

// ─── LLM Task Plan Output ────────────────────────────────────────

export interface TaskPlanTask {
  staffId: string
  staffName: string
  staffRole: string
  description: string
  priority: number
  floor: number
  zone: string
  reasoning?: string
}

export interface TaskPlan {
  incidentSummary: string
  escalationRecommended: boolean
  estimatedClearTime: string
  tasks: TaskPlanTask[]
}

// ─── API Input Types ─────────────────────────────────────────────

export interface IncidentTriggerInput {
  type: IncidentType
  severity: Severity
  floor: number
  zone: string
  source?: string
  rawPayload?: string
}

// ─── Hotel Layout ────────────────────────────────────────────────

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

// ─── Socket.io Event Types ───────────────────────────────────────

export interface IncidentCreatedEvent {
  incident: Incident
}

export interface TasksAssignedEvent {
  incidentId: string
  tasks: Task[]
  summary: string
}

export interface TaskUpdatedEvent {
  taskId: string
  status: TaskStatus
  staffName: string
}

export interface TasksErrorEvent {
  incidentId: string
  error: string
}
