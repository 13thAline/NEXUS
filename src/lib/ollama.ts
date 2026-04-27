<<<<<<< HEAD
// src/lib/ollama.ts — Local LLM Client via Ollama
// Uses native Node.js HTTP for stability with long-running local model requests
import http from 'http';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const PRIMARY_MODEL = process.env.OLLAMA_MODEL || 'llama3:latest';
const FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || 'phi3:mini';

async function isModelAvailable(model: string): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.models?.some((m: { name: string }) => m.name.startsWith(model.split(':')[0])) ?? false;
=======
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
>>>>>>> origin/feature/ollama-fix
  } catch {
    return false;
  }
}

export const ollama = {
  async chat(prompt: string): Promise<string> {
    try {
      console.log(`[Ollama] Requesting primary model: ${PRIMARY_MODEL}...`);
      return await generateWithModel(PRIMARY_MODEL, prompt);
    } catch (primaryError: any) {
      console.warn(`[Ollama] Primary model (${PRIMARY_MODEL}) failed:`, primaryError.message || primaryError);
      console.log(`[Ollama] Attempting fallback to: ${FALLBACK_MODEL}...`);

<<<<<<< HEAD
      const fallbackAvailable = await isModelAvailable(FALLBACK_MODEL);
      if (!fallbackAvailable) {
        throw new Error(`Critical Error: Both ${PRIMARY_MODEL} and ${FALLBACK_MODEL} are unavailable. Please pull them in Ollama.`);
=======
      const fallbackAvailable = await isModelAvailable(FALLBACK_MODEL)
      if (!fallbackAvailable) {
        throw new Error(
          `Both models unavailable. Ensure Ollama is running at ${OLLAMA_URL}`
        )
>>>>>>> origin/feature/ollama-fix
      }
      return await generateWithModel(FALLBACK_MODEL, prompt);
    }
  },

  async healthCheck() {
    try {
<<<<<<< HEAD
      const res = await fetch(`${OLLAMA_URL}/api/tags`);
      const data = await res.json();
      return { ok: res.ok, models: data.models?.map((m: any) => m.name) || [] };
    } catch (err) {
      return { ok: false, models: [], error: 'Ollama unreachable' };
    }
  }
};

async function generateWithModel(model: string, prompt: string): Promise<string> {
  const url = new URL(`${OLLAMA_URL}/api/generate`);
  const body = JSON.stringify({
    model,
    prompt,
    stream: false,
    format: 'json',
    options: {
      temperature: 0.1,
      num_predict: 2048,
    },
  });

  return new Promise((resolve, reject) => {
    // We use a massive 15-minute timeout for slow local hardware
    const TIMEOUT_MS = 15 * 60 * 1000;

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
=======
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
>>>>>>> origin/feature/ollama-fix
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(responseBody);
              resolve(data.response);
            } catch (e) {
              reject(new Error('AI response was not valid JSON'));
            }
          } else {
            reject(new Error(`Ollama error ${res.statusCode}: ${responseBody}`));
          }
        });
      }
    );

<<<<<<< HEAD
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error(`AI Request timed out after 15 minutes. Check your PC's CPU usage.`));
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}
=======
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
>>>>>>> origin/feature/ollama-fix
