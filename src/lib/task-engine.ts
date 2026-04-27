// src/lib/task-engine.ts — The NEXUS Brain
// Core task assignment orchestrator that uses a local LLM to generate
// crisis-specific task plans for hotel staff

import { ollama } from './ollama'
import { taskPlanSchema } from './validators'
import type { TaskPlan, StaffMember, GuestRoom } from '@/types'
import staffData from '../../data/staff.json'
import occupancyData from '../../data/occupancy.json'

export interface IncidentInput {
  type: string
  severity: string
  floor: number
  zone: string
  rawPayload: string
}

/**
 * Generate a task plan for a given incident using the local LLM.
 * This is the most critical function in the entire system.
 */
export async function generateTaskPlan(incident: IncidentInput): Promise<TaskPlan> {
  // 1. Get current staff snapshot — only available staff
  const availableStaff = (staffData as StaffMember[]).filter(s => s.available)

  // 2. Get mobility-impaired guests on affected and nearby floors (±2 floors)
  const priorityGuests = (occupancyData.guests as GuestRoom[]).filter(
    g => g.mobilityImpaired && Math.abs(g.floor - incident.floor) <= 2
  )

  // 3. Get all guests on the affected floor for awareness
  const affectedFloorGuests = (occupancyData.guests as GuestRoom[]).filter(
    g => Math.abs(g.floor - incident.floor) <= 1
  )

  // 4. Build prompt for local LLM
  const prompt = buildSystemPrompt(incident, availableStaff, priorityGuests, affectedFloorGuests)

  console.log(`[TaskEngine] Generating task plan for ${incident.type} on Floor ${incident.floor}...`)
  console.log(`[TaskEngine] Available staff: ${availableStaff.length}, Priority guests: ${priorityGuests.length}`)

  // 5. Stream response from Ollama
  const raw = await ollama.chat(prompt)

  // 6. Debug: Log the raw output for visibility
  console.log('--- RAW AI RESPONSE ---')
  console.log(raw)
  console.log('-----------------------')

  // 7. Parse and validate LLM output (JSON only)
  const jsonStr = extractJSON(raw)
  let parsed: any

  try {
    parsed = JSON.parse(jsonStr)
  } catch (parseError) {
    console.error('[TaskEngine] Failed to parse LLM JSON output:', jsonStr)
    throw new Error(`AI returned invalid JSON formatting. Check terminal for raw block.`)
  }

  // 8. Pre-validation cleanup: ensure tasks is an array even if single object returned
  if (parsed && !Array.isArray(parsed.tasks) && typeof parsed.tasks === 'object') {
    parsed.tasks = [parsed.tasks]
  }

  // 9. Validate with Zod schema
  const result = taskPlanSchema.safeParse(parsed)

  if (!result.success) {
    console.error('[TaskEngine] LLM output failed Zod validation!')
    console.error('[TaskEngine] Validation errors:', JSON.stringify(result.error.flatten().fieldErrors, null, 2))
    console.error('[TaskEngine] Raw parsed object:', JSON.stringify(parsed, null, 2))
    throw new Error(`LLM output validation failed: ${JSON.stringify(result.error.flatten().fieldErrors)}`)
  }

  console.log(`[TaskEngine] Tactical plan verified: ${result.data.tasks.length} tasks assigned.`)
  return result.data
}

function buildSystemPrompt(
  incident: IncidentInput,
  staff: StaffMember[],
  priorityGuests: GuestRoom[],
  affectedFloorGuests: GuestRoom[]
): string {
  return `You are NEXUS, a crisis coordination AI for a hotel. You receive incident data and staff availability, and you output a structured JSON task plan.

## INCIDENT
Type: ${incident.type}
Severity: ${incident.severity}
Location: ${incident.zone} (Floor ${incident.floor})
Details: ${incident.rawPayload}

## AVAILABLE STAFF
${JSON.stringify(staff, null, 2)}

## PRIORITY GUESTS
${JSON.stringify(priorityGuests, null, 2)}

## ALL GUESTS ON AFFECTED FLOORS
${JSON.stringify(affectedFloorGuests, null, 2)}

## HOTEL GUIDELINES
- Total rooms: ${occupancyData.totalRooms}
- Assembly points: Main Entrance, Side Exit B, Rear Exit
- Elevators: DO NOT USE during fire/gas events.

## YOUR TASK
Generate a JSON task plan. Assign EXACTLY ONE task per available staff member.
- Use the EXACT staffName and staffId from the AVAILABLE STAFF list. Do not hallucinate names.
- Assign a "complexity" score (1-100) to each task representing the required skill/effort level.
- Prioritize life safety and mobility-impaired guests.

## REQUIRED OUTPUT FORMAT
You must return a JSON object with this EXACT structure. 
{
  "incidentSummary": "Brief description of incident and response.",
  "escalationRecommended": true,
  "estimatedClearTime": "10 minutes",
  "tasks": [
    {
      "staffId": "string",
      "staffName": "string",
      "staffRole": "string",
      "description": "Actionable command (min 10 chars).",
      "priority": 1,
      "floor": 3,
      "zone": "string",
      "complexity": 75,
      "reasoning": "Brief explanation."
    }
  ]
}

CRITICAL: Return ONLY the raw JSON object. No \`\`\`json blocks, no markdown, no preamble, no explanation.`
}

/**
 * Extract a JSON object from a potentially messy LLM response.
 */
function extractJSON(raw: string): string {
  // First, try to find JSON between code block markers
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // Then try to find a JSON object directly
  const objectMatch = raw.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    return objectMatch[0]
  }

  // If nothing works, return the raw string and let JSON.parse fail with a clear error
  throw new Error('No JSON object found in LLM response')
}
