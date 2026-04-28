// src/lib/validators.ts — Zod Schemas for NEXUS
// Runtime validation for all API inputs and LLM outputs

import { z } from 'zod'

// ─── Stage 1: Triage Result Schema ───────────────────────

export const TriageResultSchema = z.object({
  incidentType: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  affectedFloors: z.array(z.coerce.number().int()),
  affectedZones: z.array(z.string()),
  adjacentZones: z.array(z.string()),
  adjacentFloors: z.array(z.coerce.number().int()),
  evacuationRequired: z.boolean(),
  lifeRisk: z.boolean(),
  confidence: z.coerce.number().min(0).max(1),
  summary: z.string(),
})

export type TriageResult = z.infer<typeof TriageResultSchema>

// ─── Stage 4: Task Plan Response Schema ──────────────────

export const TaskPlanTaskSchema = z.object({
  taskId: z.string(),
  assignedStaffId: z.string(),
  staffName: z.string(),
  description: z.string().min(5),
  priority: z.coerce.number().int().min(1),
  floor: z.coerce.number().int(),
  zone: z.string(),
  llmReasoning: z.string().optional(),
})

export const TaskPlanResponseSchema = z.object({
  reasoning: z.string(),
  taskPlan: z.array(TaskPlanTaskSchema).min(1),
  coverageGaps: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
})

export type TaskPlanResponse = z.infer<typeof TaskPlanResponseSchema>
export type TaskPlanTask = z.infer<typeof TaskPlanTaskSchema>

// ─── API Input: Incident Trigger (raw payload) ──────────

export const incidentTriggerSchema = z.object({
  source: z.string(),
  rawPayload: z.string(),
  timestamp: z.string().optional(),
  cctvFrame: z.string().optional(), // base64 JPEG
})

export type IncidentTriggerInput = z.infer<typeof incidentTriggerSchema>

// ─── API Input: Task Acknowledge ─────────────────────────

export const taskAcknowledgeSchema = z.object({
  action: z.enum(['ACKNOWLEDGE', 'COMPLETE']),
})

export type TaskAcknowledgeInput = z.infer<typeof taskAcknowledgeSchema>

// ─── API Input: Incident Update ──────────────────────────

export const incidentUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'CONTAINED', 'RESOLVED']),
})

export type IncidentUpdateInput = z.infer<typeof incidentUpdateSchema>
