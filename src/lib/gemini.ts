// src/lib/gemini.ts — Google AI Client for NEXUS
// Gemini 2.5 Flash (triage), Gemini 2.5 Pro (strategy), Vertex Embeddings, Ollama gemma:7b fallback

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ─── Gemini 3 Flash — Stage 1 Triage (~1s) ────────────
export const flashModel = genAI.getGenerativeModel({
  model: 'gemini-3-flash-preview',
})

// ─── Gemini 3.1 Pro — Stage 4 Strategy (30-60s) ─────────
export const proModel = genAI.getGenerativeModel({
  model: 'gemini-3.1-pro-preview',
})

// ─── Embeddings gemini-embedding-2 — Stage 3 ─────────────
const embeddingModel = genAI.getGenerativeModel({
  model: 'gemini-embedding-2',
})

/**
 * Embed an array of texts using Gemini API gemini-embedding-2.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings = await Promise.all(
    texts.map(async (text) => {
      const result = await embeddingModel.embedContent(text)
      return result.embedding.values
    })
  )
  return embeddings
}

// ─── Ollama gemma:7b Fallback ────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || 'gemma:7b'

/**
 * Call local Ollama with gemma:7b as fallback when Gemini Pro times out.
 * Returns raw JSON string response.
 */
export async function gemmaFallback(prompt: string): Promise<string> {
  console.log(`[Gemini] Falling back to local Ollama ${FALLBACK_MODEL}...`)

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: FALLBACK_MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.2,
        num_predict: 2048,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama fallback failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.response
}
