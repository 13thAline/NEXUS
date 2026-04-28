// src/lib/report-engine.ts — AI After-Action Reporting
// Uses Gemini 2.5 Flash for classification, writes to Firestore for real-time

import { flashModel } from './gemini'
import { prisma } from './prisma'
import { updateFirestoreIncident } from './firebase-admin'

export async function generateAAR(incidentId: string) {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        tasks: true,
        logs: { orderBy: { timestamp: 'asc' } },
      },
    })

    if (!incident) return

    console.log(`[ReportEngine] Generating AAR for incident: ${incidentId}...`)

    const logsSummary = incident.logs
      .map(e => `[${e.timestamp}] ${e.event}`)
      .join('\n')

    const prompt = `You are NEXUS, a crisis coordination AI. An incident has been CONTAINED.
Analyze the tactical logs and provide an After-Action Report.

## INCIDENT DATA
Type: ${incident.type}
Severity: ${incident.severity}
Location: ${incident.zone}

## TACTICAL LOGS
${logsSummary}

Respond with JSON:
{
  "summary": "3-4 sentence tactical summary",
  "successes": ["...", "..."],
  "improvements": ["...", "..."],
  "score": 85,
  "safetyRating": "A"
}`

    const result = await flashModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    })

    const analysis = JSON.parse(result.response.text())

    const startTime = new Date(incident.timestamp).getTime()
    const endTime = incident.logs[incident.logs.length - 1]?.timestamp?.getTime?.() || Date.now()
    const durationMins = Math.round((endTime - startTime) / 60000)

    const metrics = {
      durationMins,
      taskCount: incident.tasks.length,
      efficiencyScore: analysis.score,
      safetyRating: analysis.safetyRating,
    }

    const reportText = `${analysis.summary}\n\nSuccesses: ${analysis.successes.join(', ')}\nImprovements: ${analysis.improvements.join(', ')}`

    // Save to PostgreSQL
    await prisma.incident.update({
      where: { id: incidentId },
      data: {
        analysisReport: reportText,
        metrics: JSON.stringify(metrics),
      },
    })

    // Broadcast via Firestore
    await updateFirestoreIncident(incidentId, {
      analysisReport: reportText,
      metrics: JSON.stringify(metrics),
      reportReady: true,
    })

    console.log(`[ReportEngine] AAR generated and saved.`)
  } catch (error) {
    console.error('[ReportEngine] Failed to generate AAR:', error)
  }
}
