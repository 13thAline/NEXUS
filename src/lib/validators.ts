// src/lib/validators.ts — Zod Schemas for NEXUS
// Runtime validation for all API inputs and LLM outputs

import { z } from 'zod'

// ─── LLM Output Schemas ─────────────────────────────────────────

export const taskSchema = z.object({
  staffId: z.string(),
  staffName: z.string(),
  staffRole: z.string(),
  description: z.string().min(10, 'Task description must be at least 10 characters'),
  priority: z.number().int().min(1).max(10),
  floor: z.number().int(),
  zone: z.string(),
  reasoning: z.string().optional(),
})

export const taskPlanSchema = z.object({
  incidentSummary: z.string(),
  escalationRecommended: z.boolean(),
  estimatedClearTime: z.string(),
  tasks: z.array(taskSchema).min(1, 'Task plan must contain at least one task'),
})

export type TaskSchemaType = z.infer<typeof taskSchema>
export type TaskPlanSchemaType = z.infer<typeof taskPlanSchema>

// ─── API Input Schemas ───────────────────────────────────────────

export const incidentTriggerSchema = z.object({
  type: z.enum([
    'FIRE',
    'ACTIVE_SHOOTER',
    'MEDICAL',
    'GAS_LEAK',
    'STRUCTURAL',
    'EVACUATION',
    'SECURITY',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  floor: z.number().int(),
  zone: z.string().min(1, 'Zone is required'),
  source: z.string().optional(),       // "FIRE_PANEL" | "CCTV" | "MANUAL" | "SECURITY_SYSTEM"
  rawPayload: z.string().optional(),
})

export const taskAcknowledgeSchema = z.object({
  action: z.enum(['ACKNOWLEDGE', 'COMPLETE']),
})

export const incidentUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'CONTAINED', 'RESOLVED']),
})

export type IncidentTriggerInput = z.infer<typeof incidentTriggerSchema>
export type TaskAcknowledgeInput = z.infer<typeof taskAcknowledgeSchema>
export type IncidentUpdateInput = z.infer<typeof incidentUpdateSchema>
