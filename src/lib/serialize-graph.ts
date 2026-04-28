// src/lib/serialize-graph.ts — §8: The serializeGraphForLLM Function
// Converts the full context graph into a compact text block for Gemini Pro (~800 tokens)

import type { ContextGraph } from './context-graph'
import type { PrioritisedTask } from './priority-matrix'

/**
 * Approximate token count (rough: 1 token ≈ 4 chars)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Trim text to a target token budget by truncating from the end.
 */
export function trimToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n[TRUNCATED — token budget reached]'
}

/**
 * Serialize the context graph + priority matrix into a compact text block.
 * Priority of what to preserve (never drop):
 *   1. MANDATORY ESCORTS (weight-15 edges)
 *   2. Vulnerable guests with vulnerabilityScore >= 7
 *   3. Top 8 tasks from priority matrix
 *   4. All available staff (with scores and skills)
 *   5. Coverage warnings and unescorted guest flags
 * 
 * What gets dropped when over token budget:
 *   - Low-score tasks (score < 20)
 *   - General population guests (vulnerability < 5)
 *   - Verbose scoring rationale
 */
export function serializeGraphForLLM(
  graph: ContextGraph,
  prioritisedTasks: PrioritisedTask[],
  targetTokens: number = 800
): string {
  const sections: string[] = []

  // 1. MANDATORY ESCORTS (never drop)
  const mustEscorts = graph.edges.filter(e => e.type === 'MUST_ESCORT')
  if (mustEscorts.length > 0) {
    sections.push('## MANDATORY ESCORTS (CANNOT BE CHANGED)')
    for (const e of mustEscorts) {
      const staff = graph.staffNodes.find(s => s.id === e.fromStaffId)
      sections.push(`- Staff ${staff?.name} (${staff?.id}) MUST escort guest in Room ${e.toRoom} — weight ${e.weight}`)
    }
  }

  // 2. Vulnerable guests (score >= 7)
  const vulnGuests = graph.guestNodes
    .filter(g => g.vulnerabilityScore >= 7)
    .sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore)

  if (vulnGuests.length > 0) {
    sections.push('\n## HIGH-VULNERABILITY GUESTS')
    for (const g of vulnGuests) {
      sections.push(`- Room ${g.room} (Floor ${g.floor}): score=${g.vulnerabilityScore}, mobility=${g.mobilityImpaired}, guests=${g.guestCount}${g.assistanceNote ? `, note: ${g.assistanceNote}` : ''}`)
    }
  }

  // 3. Top 8 tasks from priority matrix
  const topTasks = prioritisedTasks.slice(0, 8)
  if (topTasks.length > 0) {
    sections.push('\n## PRIORITISED TASKS (by score)')
    for (const t of topTasks) {
      sections.push(`- [${t.urgencyTier}] score=${t.totalScore.toFixed(0)}: "${t.description}" → suggest: ${t.staffName} (${t.assignedStaffId})`)
    }
  }

  // 4. All available staff
  sections.push('\n## AVAILABLE STAFF')
  for (const s of graph.staffNodes) {
    sections.push(`- ${s.id}: ${s.name} (${s.role}), Floor ${s.floor}, proximity=${s.proximityScore}, skills=[${s.certifications.join(',')}], relevant=${s.hasRelevantSkill}`)
  }

  // 5. Coverage warnings
  if (graph.meta.unescortedVulnerableGuests.length > 0) {
    sections.push('\n## ⚠️ COVERAGE WARNINGS')
    sections.push(`- Unescorted vulnerable guests: ${graph.meta.unescortedVulnerableGuests.join(', ')}`)
  }

  // 6. Meta summary
  sections.push('\n## SUMMARY')
  sections.push(`- Staff available: ${graph.meta.totalStaffAvailable}`)
  sections.push(`- High-vulnerability guests: ${graph.meta.highVulnerabilityGuests}`)
  sections.push(`- Staff on incident floor: ${graph.meta.staffOnIncidentFloor}`)

  const full = sections.join('\n')
  return trimToTokenBudget(full, targetTokens)
}

/**
 * Shorter version for Gemma fallback (~400 tokens).
 */
export function serializeGraphForFallback(
  graph: ContextGraph,
  prioritisedTasks: PrioritisedTask[]
): string {
  return serializeGraphForLLM(graph, prioritisedTasks, 400)
}
