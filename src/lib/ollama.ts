// src/lib/ollama.ts — Local LLM Client via Ollama
// Uses the Ollama REST API directly for maximum control over generation parameters

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const PRIMARY_MODEL = process.env.OLLAMA_MODEL || 'llama3:latest'
const FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || 'phi3:mini'

interface OllamaGenerateResponse {
  model: string
  response: string
  done: boolean
  total_duration?: number
  load_duration?: number
  eval_count?: number
  eval_duration?: number
}

async function isModelAvailable(model: string): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`)
    if (!res.ok) return false
    const data = await res.json()
    return data.models?.some((m: { name: string }) => m.name.startsWith(model.split(':')[0])) ?? false
  } catch {
    return false
  }
}

export const ollama = {
  /**
   * Send a prompt to the local LLM and get a JSON response.
   * Automatically falls back to phi3:mini if the primary model fails.
   */
  async chat(prompt: string): Promise<string> {
    // Try primary model first
    try {
      return await generateWithModel(PRIMARY_MODEL, prompt)
    } catch (primaryError) {
      console.warn(`Primary model (${PRIMARY_MODEL}) failed:`, primaryError)
      console.log(`Falling back to ${FALLBACK_MODEL}...`)

      // Check if fallback is available
      const fallbackAvailable = await isModelAvailable(FALLBACK_MODEL)
      if (!fallbackAvailable) {
        throw new Error(
          `Both primary (${PRIMARY_MODEL}) and fallback (${FALLBACK_MODEL}) models unavailable. ` +
          `Ensure Ollama is running at ${OLLAMA_URL} with at least one model pulled.`
        )
      }

      return await generateWithModel(FALLBACK_MODEL, prompt)
    }
  },

  /**
   * Check if Ollama is reachable and has models available.
   */
  async healthCheck(): Promise<{ ok: boolean; models: string[]; error?: string }> {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`)
      if (!res.ok) {
        return { ok: false, models: [], error: `Ollama returned ${res.status}` }
      }
      const data = await res.json()
      const models = data.models?.map((m: { name: string }) => m.name) ?? []
      return { ok: true, models }
    } catch (err) {
      return { ok: false, models: [], error: `Cannot reach Ollama at ${OLLAMA_URL}` }
    }
  }
}

async function generateWithModel(model: string, prompt: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000) // 2 minute timeout

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',           // Force JSON output mode
        options: {
          temperature: 0.1,       // Low temp = deterministic, structured output
          num_predict: 2048,      // Enough tokens for a full task plan
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`Ollama error (${model}): ${response.status} — ${errorText}`)
    }

    const data: OllamaGenerateResponse = await response.json()

    if (data.eval_duration) {
      const tokensPerSec = (data.eval_count ?? 0) / (data.eval_duration / 1e9)
      console.log(`[Ollama] ${model}: ${data.eval_count} tokens in ${(data.eval_duration / 1e9).toFixed(1)}s (${tokensPerSec.toFixed(1)} tok/s)`)
    }

    return data.response
  } finally {
    clearTimeout(timeout)
  }
}
