// src/lib/gemini.ts — Google AI Client for NEXUS
// Gemini 2.5 Flash (triage), Gemini 2.5 Pro (strategy), Vertex Embeddings, Ollama gemma:7b fallback

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ─── Gemini 2.5 Flash — Stage 1 Triage (~1s) ────────────
export const flashModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
})

// ─── Gemini 2.5 Pro — Stage 4 Strategy (30-60s) ─────────
export const proModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
})

// ─── Vertex AI text-embedding-004 — Stage 3 ─────────────
const GCP_PROJECT = process.env.GCP_PROJECT_ID!
const GCP_LOCATION = process.env.GCP_LOCATION || 'us-central1'

/**
 * Embed an array of texts using Vertex AI text-embedding-004.
 * Batches all texts in a single API call.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const url = `https://${GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${GCP_LOCATION}/publishers/google/models/text-embedding-004:predict`

  // Get access token via ADC (Application Default Credentials)
  const tokenRes = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' } }
  ).catch(() => null)

  let accessToken: string

  if (tokenRes?.ok) {
    // Running on GCP (Cloud Run, etc.)
    const tokenData = await tokenRes.json()
    accessToken = tokenData.access_token
  } else {
    // Running locally — use gcloud CLI token
    const { execSync } = await import('child_process')
    accessToken = execSync('gcloud auth print-access-token', { encoding: 'utf-8' }).trim()
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: texts.map(text => ({ content: text })),
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Vertex Embeddings failed: ${response.status} — ${err}`)
  }

  const data = await response.json()
  return data.predictions.map((p: any) => p.embeddings.values)
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
