// src/lib/task-engine.ts — The NEXUS Brain
// Core task assignment orchestrator that uses a local LLM to generate
// crisis-specific task plans for hotel staff

import { ollama } from './ollama'
import { taskPlanSchema } from './validators'
import type { TaskPlan, IncidentTriggerInput, StaffMember, GuestRoom } from '@/types'
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
 *
 * Flow:
 * 1. Filter available staff from the roster
 * 2. Identify mobility-impaired guests on affected floors
 * 3. Build a detailed system prompt with all context
 * 4. Send to Ollama (local LLM) for structured JSON output
 * 5. Parse and validate the response with Zod
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
    const errorDetails = result.error.flatten().fieldErrors
    console.error('[TaskEngine] AI Output Schema Mismatch:', errorDetails)
    
    // Provide a more descriptive error back to the UI
    const firstError = Object.entries(errorDetails)[0]
    throw new Error(`AI generated an invalid plan: ${firstError ? `${firstError[0]} ${firstError[1]}` : 'Schema mismatch'}`)
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

## AVAILABLE STAFF (assign each a task)
${JSON.stringify(staff, null, 2)}

## PRIORITY GUESTS (mobility-impaired, require physical assistance)
${JSON.stringify(priorityGuests, null, 2)}

## ALL GUESTS ON AFFECTED FLOORS
${JSON.stringify(affectedFloorGuests, null, 2)}

## HOTEL INFORMATION
Total rooms: ${occupancyData.totalRooms}
Occupied rooms: ${occupancyData.occupiedRooms}
Assembly points: Main Entrance (Front Parking Lot), Side Exit B (Garden Area), Rear Exit (Service Road)
Stairwells: Stairwell A (East), Stairwell B (West) — on every floor
Elevators: DO NOT USE during fire or gas leak incidents

## YOUR TASK
Generate a JSON task plan that assigns exactly one task per available staff member.
Prioritize: (1) life safety of guests, (2) containment, (3) communication, (4) documentation.
Assign staff closest to the incident to the most urgent tasks.
Staff with FIRE_WARDEN certification should handle fire-related coordination.
Staff with CPR or FIRST_AID certification should handle medical tasks.
Mobility-impaired guests MUST each be assigned a dedicated escort staff member.
Task descriptions must be specific, actionable, and in plain English — think of them as radio commands.

## OUTPUT FORMAT (JSON only — no explanation, no markdown, just the JSON object)
{
  "incidentSummary": "One sentence describing what happened and what response is being coordinated.",
  "escalationRecommended": true,
  "estimatedClearTime": "10 minutes",
  "tasks": [
    {
      "staffId": "staff_001",
      "staffName": "Ravi Sharma",
      "staffRole": "SECURITY",
      "description": "Proceed immediately to Floor 3 stairwell B. Direct guests from rooms 301-310 to ground floor assembly point via stairwell. Do not use lifts.",
      "priority": 1,
      "floor": 3,
      "zone": "Stairwell B - Floor 3",
      "reasoning": "Ravi is the nearest security officer with FIRE_WARDEN certification and is already on Floor 1, making them fastest to reach Floor 3."
    }
  ]
}

IMPORTANT: Return ONLY the JSON object. No markdown formatting, no code blocks, no explanation text.`
}

/**
 * Extract a JSON object from a potentially messy LLM response.
 * LLMs sometimes wrap JSON in markdown code blocks or add explanation text.
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
