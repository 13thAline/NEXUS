// src/lib/task-engine.ts — The NEXUS Brain
// Four-stage AI pipeline orchestrator (§4, §5)
// Stage 1: Triage (Gemini 2.5 Flash)
// Stage 2: Context Graph (Pure TypeScript)
// Stage 3: Priority Matrix (Vertex Embeddings)
// Stage 4: Strategy (Gemini 2.5 Pro → gemma:7b fallback)

import { flashModel, proModel, embedTexts, gemmaFallback } from './gemini'
import { buildContextGraph, type ContextGraph, type TriageInput } from './context-graph'
import { computePriorityMatrix, type PrioritisedTask } from './priority-matrix'
import { serializeGraphForLLM, serializeGraphForFallback } from './serialize-graph'
import { TriageResultSchema, TaskPlanResponseSchema, type TriageResult, type TaskPlanResponse } from './validators'
import { prisma } from './prisma'
import { updateFirestoreIncident, writeFirestoreTask } from './firebase-admin'
import staffData from '../../data/staff.json'
import occupancyData from '../../data/occupancy.json'
import type { StaffMember, GuestRoom } from '@/types'

// ─── Pipeline Status Updates ─────────────────────────────

async function updateStatus(incidentId: string, status: string) {
  // Write to both Prisma (audit trail) and Firestore (real-time)
  await Promise.all([
    prisma.incident.update({ where: { id: incidentId }, data: { status } }),
    updateFirestoreIncident(incidentId, { status, updatedAt: new Date().toISOString() }),
    prisma.incidentLog.create({
      data: {
        incidentId,
        event: `Pipeline stage: ${status}`,
        data: JSON.stringify({ status, timestamp: new Date().toISOString() }),
      },
    }),
  ])
  console.log(`[NEXUS] ${incidentId} → ${status}`)
}

// ─── Main Pipeline ───────────────────────────────────────

export interface RawPayload {
  source: string
  rawPayload: string
  timestamp?: string
  cctvFrame?: string // base64 JPEG
}

/**
 * Run the full four-stage pipeline. Called from the trigger API route.
 * This function is NOT awaited — it runs in the background.
 */
export async function runPipeline(incidentId: string, payload: RawPayload): Promise<void> {
  const startMs = Date.now()

  try {
    // ═══════════════════════════════════════════════════
    // STAGE 1 — Triage (Gemini 2.5 Flash, ~1s)
    // ═══════════════════════════════════════════════════
    await updateStatus(incidentId, 'TRIAGING')
    const triage = await stage1Triage(payload)
    console.log(`[NEXUS] Stage 1 complete: ${triage.incidentType} (${triage.severity}), confidence=${triage.confidence}`)

    // Update incident with triage results
    await prisma.incident.update({
      where: { id: incidentId },
      data: {
        type: triage.incidentType,
        severity: triage.severity,
        zone: triage.affectedZones[0] || 'Unknown',
        floor: triage.affectedFloors[0] || 1,
      },
    })

    // ═══════════════════════════════════════════════════
    // STAGE 2 — Context Graph (Pure TypeScript, ~50ms)
    // ═══════════════════════════════════════════════════
    await updateStatus(incidentId, 'BUILDING_GRAPH')
    const graph = stage2ContextGraph(triage)
    console.log(`[NEXUS] Stage 2 complete: ${graph.meta.totalStaffAvailable} staff, ${graph.meta.highVulnerabilityGuests} high-vuln guests`)

    // ═══════════════════════════════════════════════════
    // STAGE 3 — Priority Matrix (Vertex Embeddings, ~200ms)
    // ═══════════════════════════════════════════════════
    await updateStatus(incidentId, 'COMPUTING_PRIORITIES')
    const prioritised = await stage3PriorityMatrix(graph, triage)
    console.log(`[NEXUS] Stage 3 complete: ${prioritised.length} tasks scored`)

    // ═══════════════════════════════════════════════════
    // STAGE 4 — Strategy (Gemini 2.5 Pro, 30-60s)
    // ═══════════════════════════════════════════════════
    await updateStatus(incidentId, 'GENERATING_STRATEGY')
    const { plan, generatedBy } = await stage4Strategy(graph, prioritised, triage)
    console.log(`[NEXUS] Stage 4 complete: ${plan.taskPlan.length} tasks assigned (${generatedBy})`)

    // ═══════════════════════════════════════════════════
    // PERSIST RESULTS
    // ═══════════════════════════════════════════════════
    const pipelineMs = Date.now() - startMs

    // Create task records
    await prisma.$transaction(
      plan.taskPlan.map((task, idx) =>
        prisma.task.create({
          data: {
            incidentId,
            staffId: task.assignedStaffId,
            staffName: task.staffName,
            staffRole: prioritised.find(p => p.assignedStaffId === task.assignedStaffId)?.staffRole || 'STAFF',
            description: task.description,
            priority: task.priority || idx + 1,
            floor: task.floor,
            zone: task.zone,
            llmReasoning: task.llmReasoning || null,
          },
        })
      )
    )

    // Write tasks to Firestore for real-time staff notifications
    await Promise.all(
      plan.taskPlan.map((task) =>
        writeFirestoreTask(incidentId, task.assignedStaffId, {
          staffId: task.assignedStaffId,
          staffName: task.staffName,
          description: task.description,
          priority: task.priority,
          floor: task.floor,
          zone: task.zone,
          status: 'PENDING',
          assignedAt: new Date().toISOString(),
        })
      )
    )

    // Update incident with pipeline results (both stores)
    const incidentUpdate = {
      status: 'ACTIVE',
      llmReasoning: plan.reasoning,
      coverageGaps: JSON.stringify(plan.coverageGaps),
      warnings: JSON.stringify(plan.warnings),
      generatedBy,
      pipelineMs,
    }
    await Promise.all([
      prisma.incident.update({ where: { id: incidentId }, data: incidentUpdate }),
      updateFirestoreIncident(incidentId, {
        ...incidentUpdate,
        taskCount: plan.taskPlan.length,
        updatedAt: new Date().toISOString(),
      }),
    ])

    await prisma.incidentLog.create({
      data: {
        incidentId,
        event: `Pipeline complete in ${pipelineMs}ms. ${plan.taskPlan.length} tasks assigned via ${generatedBy}.`,
        data: JSON.stringify({ pipelineMs, taskCount: plan.taskPlan.length, generatedBy }),
      },
    })

    console.log(`[NEXUS] ✅ Pipeline complete: ${plan.taskPlan.length} tasks in ${pipelineMs}ms (${generatedBy})`)

  } catch (err) {
    console.error('[NEXUS] ❌ Pipeline failed:', err)
    await updateStatus(incidentId, 'PIPELINE_FAILED')
    await prisma.incidentLog.create({
      data: {
        incidentId,
        event: `Pipeline failed: ${err instanceof Error ? err.message : String(err)}`,
        data: JSON.stringify({ error: String(err) }),
      },
    })
  }
}

// ─── Stage 1: Triage ─────────────────────────────────────

async function stage1Triage(payload: RawPayload): Promise<TriageResult> {
  const prompt = `You are a hotel crisis triage system. Classify this sensor payload into a structured incident report.

SENSOR PAYLOAD:
Source: ${payload.source}
Data: ${payload.rawPayload}
Timestamp: ${payload.timestamp || new Date().toISOString()}

Respond with JSON containing:
- incidentType: one of FIRE, GAS_LEAK, MEDICAL, ACTIVE_SHOOTER, STRUCTURAL, EVACUATION, SECURITY
- severity: LOW, MEDIUM, HIGH, or CRITICAL
- affectedFloors: array of floor numbers directly affected
- affectedZones: array of zone descriptions
- adjacentZones: array of adjacent zone descriptions that may be affected
- adjacentFloors: array of floor numbers adjacent to affected area
- evacuationRequired: boolean
- lifeRisk: boolean — is there immediate danger to life
- confidence: 0-1 float — how confident you are in this classification
- summary: one-sentence summary of the incident`

  // Build content parts (text + optional image)
  const parts: any[] = [{ text: prompt }]
  if (payload.cctvFrame) {
    parts.unshift({
      inlineData: { mimeType: 'image/jpeg', data: payload.cctvFrame },
    })
  }

  try {
    const result = await flashModel.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    })

    const text = result.response.text()
    const parsed = JSON.parse(text)
    return TriageResultSchema.parse(parsed)
  } catch (flashError) {
    console.warn('[NEXUS] Gemini Flash failed, falling back to gemma:7b:', flashError)
    const fallbackPrompt = prompt + `\n\nEnsure you return ONLY valid JSON matching the exact schema requested.`
    const raw = await gemmaFallback(fallbackPrompt)
    const parsed = JSON.parse(raw)
    return TriageResultSchema.parse(parsed)
  }
}

// ─── Stage 2: Context Graph ─────────────────────────────

function stage2ContextGraph(triage: TriageResult): ContextGraph {
  const staff = (staffData as StaffMember[]).filter(s => s.available)
  const guests = occupancyData.guests as GuestRoom[]

  const triageInput: TriageInput = {
    incidentType: triage.incidentType,
    affectedFloors: triage.affectedFloors,
    adjacentZones: triage.adjacentZones,
    adjacentFloors: triage.adjacentFloors,
  }

  return buildContextGraph(triageInput, staff, guests)
}

// ─── Stage 3: Priority Matrix ────────────────────────────

async function stage3PriorityMatrix(
  graph: ContextGraph, triage: TriageResult
): Promise<PrioritisedTask[]> {
  return computePriorityMatrix(
    graph,
    triage.incidentType,
    triage.affectedFloors,
    embedTexts
  )
}

// ─── Stage 4: Strategy Generation ────────────────────────

const CHAIN_OF_THOUGHT = `Think step-by-step before assigning anything:
1. Read all MANDATORY ESCORTS first — lock them in, they cannot change.
2. Identify all tasks with score >= 100 (life-safety tier). Assign closest skilled staff.
3. Verify every vulnerable guest in the danger zone has an escort assigned.
4. Move to score 60-99 (evacuation). Assign remaining staff by proximity.
5. Move to score 40-59 (comms). Typically front desk or management.
6. Identify coverage gaps — tasks with no available staff. Flag them.
7. Assign score < 40 tasks only if staff remain unassigned.
Rules: One task per staff member. Plain English descriptions. Include specific room/stair/zone.`

async function stage4Strategy(
  graph: ContextGraph,
  prioritised: PrioritisedTask[],
  triage: TriageResult
): Promise<{ plan: TaskPlanResponse; generatedBy: string }> {
  const graphSummary = serializeGraphForLLM(graph, prioritised, 800)

  const prompt = `You are NEXUS, a hotel crisis coordination AI. Generate a fully coordinated response plan.

INCIDENT: ${triage.incidentType} (${triage.severity})
Evacuation required: ${triage.evacuationRequired}
Life risk: ${triage.lifeRisk}

${graphSummary}

${CHAIN_OF_THOUGHT}

Respond with JSON:
{
  "reasoning": "Full chain-of-thought — why each decision was made",
  "taskPlan": [
    {
      "taskId": "task_001",
      "assignedStaffId": "staff_001",
      "staffName": "Name",
      "description": "Specific actionable instruction with room/zone/stair details",
      "priority": 1,
      "floor": 3,
      "zone": "Floor3-East",
      "llmReasoning": "Why this person was assigned this task"
    }
  ],
  "coverageGaps": ["Tasks with no available staff"],
  "warnings": ["Specific risks or unresolved issues"]
}`

  // Try Gemini 2.5 Pro with 55-second timeout
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55000)

    const result = await proModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    })

    clearTimeout(timeout)

    const text = result.response.text()
    const parsed = JSON.parse(text)
    const plan = TaskPlanResponseSchema.parse(parsed)

    return { plan, generatedBy: 'gemini-pro' }

  } catch (proError) {
    console.warn('[NEXUS] Gemini Pro failed/timed out, falling back to gemma:7b:', proError)

    // Fallback to local Ollama gemma:7b
    const fallbackSummary = serializeGraphForFallback(graph, prioritised)
    const fallbackPrompt = `You are NEXUS crisis AI. Generate a response plan as JSON.

INCIDENT: ${triage.incidentType} (${triage.severity})

${fallbackSummary}

Assign one task per staff member. Respond with JSON:
{"reasoning":"...","taskPlan":[{"taskId":"task_001","assignedStaffId":"staff_001","staffName":"Name","description":"Action","priority":1,"floor":1,"zone":"Zone"}],"coverageGaps":[],"warnings":[]}`

    const raw = await gemmaFallback(fallbackPrompt)
    const parsed = JSON.parse(raw)
    const plan = TaskPlanResponseSchema.parse(parsed)

    return { plan, generatedBy: 'gemma-fallback' }
  }
}
