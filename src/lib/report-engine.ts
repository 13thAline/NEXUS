// src/lib/report-engine.ts — AI After-Action Reporting
import { ollama } from './ollama'
import { prisma } from './prisma'
import { emitToAll } from './socket'

export async function generateAAR(incidentId: string) {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { 
        tasks: true,
        events: { orderBy: { createdAt: 'asc' } }
      }
    })

    if (!incident) return

    console.log(`[ReportEngine] Generating AAR for incident: ${incidentId}...`)

    const logsSummary = incident.events
      .map(e => `[${e.source}] ${e.message}`)
      .join('\n')

    const prompt = `You are NEXUS, a crisis coordination AI. An incident has just been CONTAINED. 
Analyze the following tactical logs and provide a professional After-Action Report (AAR).

## INCIDENT DATA
Type: ${incident.type}
Severity: ${incident.severity}
Location: ${incident.zone}

## TACTICAL LOGS
${logsSummary}

## YOUR TASK
1. Provide a "Tactical Summary" (3-4 sentences) of how the incident was handled.
2. Identify "Key Successes" and "Areas for Improvement".
3. Assign a "Response Efficiency Score" (0-100).
4. Estimate "Guest Safety Rating" (A/B/C/D/F).

## OUTPUT FORMAT (JSON only)
{
  "summary": "...",
  "successes": ["...", "..."],
  "improvements": ["...", "..."],
  "score": 85,
  "safetyRating": "A"
}

Return ONLY the JSON object.`

    const raw = await ollama.chat(prompt)
    const jsonStr = extractJSON(raw)
    const analysis = JSON.parse(jsonStr)

    // Calculate real metrics
    const startTime = new Date(incident.triggeredAt).getTime()
    const endTime = incident.events[incident.events.length - 1]?.createdAt.getTime() || Date.now()
    const durationMins = Math.round((endTime - startTime) / 60000)

    const metrics = {
      durationMins,
      taskCount: incident.tasks.length,
      efficiencyScore: analysis.score,
      safetyRating: analysis.safetyRating
    }

    // Save to DB
    await prisma.incident.update({
      where: { id: incidentId },
      data: {
        analysisReport: analysis.summary + "\n\nSuccesses: " + analysis.successes.join(", ") + "\nImprovements: " + analysis.improvements.join(", "),
        metrics: JSON.stringify(metrics)
      }
    })

    // Broadcast report to dashboard
    emitToAll('incident:report_ready', {
      incidentId,
      report: analysis,
      metrics
    })

    console.log(`[ReportEngine] AAR generated and broadcasted.`)

  } catch (error) {
    console.error('[ReportEngine] Failed to generate AAR:', error)
  }
}

function extractJSON(raw: string): string {
  const match = raw.match(/\{[\s\S]*\}/)
  return match ? match[0] : raw
}
