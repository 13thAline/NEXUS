// src/lib/ollama.ts — FIXED VERSION

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const PRIMARY_MODEL = process.env.OLLAMA_MODEL || 'llama3:latest'
const FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || 'phi3:mini'

interface OllamaGenerateResponse {
  model: string
  response: string
  done: boolean
  eval_count?: number
  eval_duration?: number
}

async function isModelAvailable(model: string): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`)
    if (!res.ok) return false
    const data = await res.json()
    return data.models?.some((m: { name: string }) =>
      m.name.startsWith(model.split(':')[0])
    ) ?? false
  } catch {
    return false
  }
}

export const ollama = {
  async chat(prompt: string): Promise<string> {
    try {
      return await generateWithModel(PRIMARY_MODEL, prompt)
    } catch (primaryError) {
      console.warn(`Primary model (${PRIMARY_MODEL}) failed:`, primaryError)
      console.log(`Falling back to ${FALLBACK_MODEL}...`)

      const fallbackAvailable = await isModelAvailable(FALLBACK_MODEL)
      if (!fallbackAvailable) {
        throw new Error(
          `Both models unavailable. Ensure Ollama is running at ${OLLAMA_URL}`
        )
      }

      return await generateWithModel(FALLBACK_MODEL, prompt)
    }
  },

  async healthCheck() {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`)
      const data = await res.json()
      return {
        ok: true,
        models: data.models?.map((m: any) => m.name) ?? [],
      }
    } catch {
      return { ok: false, models: [] }
    }
  },
}

async function generateWithModel(
  model: string,
  prompt: string
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.1,
          num_predict: 2048, // increased for complex plans
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Ollama error (${model}): ${err}`)
    }

    const data: OllamaGenerateResponse = await response.json()

    if (data.eval_duration) {
      const tps =
        (data.eval_count ?? 0) / (data.eval_duration / 1e9)
      console.log(
        `[Ollama] ${model}: ${data.eval_count} tokens in ${(data.eval_duration / 1e9).toFixed(1)}s (${tps.toFixed(1)} tok/s)`
      )
    }

    return data.response

  } finally {
    clearTimeout(timeout)
  }
}