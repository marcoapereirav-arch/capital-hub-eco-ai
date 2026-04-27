import { ContentIntelError } from '../lib/errors'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new ContentIntelError('gemini_key_missing', 'GEMINI_API_KEY not set')
  return key
}

const MAX_RETRIES = 4
// Base backoff used when Gemini no da hint de retryDelay explicito.
const BACKOFF_MS = [2000, 8000, 20_000, 45_000] as const

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Parsea hints del formato "Please retry in 40.5s" que Gemini manda en errores 429.
 * Devuelve ms a esperar, o null si no hay hint.
 */
function parseRetryHint(message: string): number | null {
  const m = message.match(/retry in ([\d.]+)s/i)
  if (!m) return null
  const seconds = parseFloat(m[1])
  if (!Number.isFinite(seconds)) return null
  return Math.ceil(seconds * 1000) + 500 // margen extra
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 503 || status === 500 || status === 502 || status === 504
}

interface GeminiFetchResult {
  ok: boolean
  status: number
  json: unknown
  errorMessage?: string
}

async function geminiFetchOnce(url: string, init: RequestInit): Promise<GeminiFetchResult> {
  const res = await fetch(url, init)
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      json,
      errorMessage: json.error?.message ?? `HTTP ${res.status}`,
    }
  }
  return { ok: true, status: res.status, json }
}

async function geminiFetchWithRetries(url: string, init: RequestInit): Promise<unknown> {
  let lastError: string = 'unknown'
  let lastStatus = 0

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await geminiFetchOnce(url, init)
    if (result.ok) return result.json

    lastError = result.errorMessage ?? 'unknown'
    lastStatus = result.status

    if (!isRetryableStatus(result.status) || attempt === MAX_RETRIES) {
      break
    }

    const hint = parseRetryHint(lastError)
    const wait = hint ?? BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]
    await sleep(wait)
  }

  throw new ContentIntelError(
    lastStatus === 429 ? 'gemini_rate_limited' : 'gemini_http_error',
    `Gemini: ${lastError}`,
  )
}

export interface GeminiInlineData {
  inlineData: { mimeType: string; data: string }
}

export interface GeminiTextPart {
  text: string
}

export type GeminiPart = GeminiTextPart | GeminiInlineData

export interface GeminiGenerateParams {
  model: string
  parts: GeminiPart[]
  temperature?: number
  maxOutputTokens?: number
  systemInstruction?: string
}

export interface GeminiGenerateResponse {
  text: string
  usage?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
  model: string
}

interface RawGenerateResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
    finishReason?: string
  }>
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
  error?: { message?: string; status?: string }
}

export async function geminiGenerate(params: GeminiGenerateParams): Promise<GeminiGenerateResponse> {
  const key = getApiKey()
  const url = `${GEMINI_BASE}/models/${params.model}:generateContent?key=${encodeURIComponent(key)}`

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: params.parts,
      },
    ],
    generationConfig: {
      temperature: params.temperature ?? 0.1,
      maxOutputTokens: params.maxOutputTokens ?? 4096,
    },
  }
  if (params.systemInstruction) {
    body.systemInstruction = { parts: [{ text: params.systemInstruction }] }
  }

  const rawJson = (await geminiFetchWithRetries(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })) as RawGenerateResponse

  const text =
    rawJson.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  if (!text) {
    throw new ContentIntelError('gemini_empty_response', 'Gemini returned empty text')
  }

  return {
    text,
    usage: rawJson.usageMetadata
      ? {
          promptTokenCount: rawJson.usageMetadata.promptTokenCount,
          candidatesTokenCount: rawJson.usageMetadata.candidatesTokenCount,
          totalTokenCount: rawJson.usageMetadata.totalTokenCount,
        }
      : undefined,
    model: params.model,
  }
}

// ---------- Embeddings ----------

export interface GeminiEmbedParams {
  model: string
  text: string
  /** Task type mejora la calidad del embedding según el uso. */
  taskType?:
    | 'RETRIEVAL_QUERY'
    | 'RETRIEVAL_DOCUMENT'
    | 'SEMANTIC_SIMILARITY'
    | 'CLASSIFICATION'
    | 'CLUSTERING'
  /** Dimensiones reducidas opcionales. Default del modelo. */
  outputDimensionality?: number
}

export interface GeminiEmbedResponse {
  values: number[]
  model: string
}

interface RawEmbedResponse {
  embedding?: { values?: number[] }
  error?: { message?: string }
}

export async function geminiEmbed(params: GeminiEmbedParams): Promise<GeminiEmbedResponse> {
  const key = getApiKey()
  const url = `${GEMINI_BASE}/models/${params.model}:embedContent?key=${encodeURIComponent(key)}`

  const body: Record<string, unknown> = {
    model: `models/${params.model}`,
    content: { parts: [{ text: params.text }] },
  }
  if (params.taskType) body.taskType = params.taskType
  if (params.outputDimensionality) body.outputDimensionality = params.outputDimensionality

  const rawJson = (await geminiFetchWithRetries(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })) as RawEmbedResponse

  const values = rawJson.embedding?.values
  if (!values || !Array.isArray(values)) {
    throw new ContentIntelError('gemini_embed_empty', 'Gemini embedding returned no values')
  }

  return { values, model: params.model }
}

// ---------- Files API (for videos > 20MB or reusable) ----------

export interface GeminiFileUploadResult {
  fileUri: string
  mimeType: string
  name: string
}

export async function geminiUploadFile(
  buffer: Buffer,
  mimeType: string,
  displayName?: string,
): Promise<GeminiFileUploadResult> {
  const key = getApiKey()
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(key)}`

  const metadata = {
    file: { display_name: displayName ?? `upload-${Date.now()}` },
  }

  const boundary = `----boundary-${Date.now().toString(16)}`
  const parts: Buffer[] = []

  parts.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: ${mimeType}\r\n\r\n`,
    ),
  )
  parts.push(buffer)
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`))
  const body = Buffer.concat(parts)

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'X-Goog-Upload-Protocol': 'multipart',
    },
    body,
    cache: 'no-store',
  })

  const json = (await res.json().catch(() => ({}))) as {
    file?: { uri?: string; mimeType?: string; name?: string }
    error?: { message?: string }
  }

  if (!res.ok || !json.file?.uri) {
    const msg = json.error?.message ?? `HTTP ${res.status}`
    throw new ContentIntelError('gemini_upload_failed', `Gemini upload: ${msg}`)
  }

  const fileName = json.file.name ?? ''
  // Espera hasta que el archivo esté ACTIVE antes de devolverlo.
  // Gemini procesa videos en background y no se pueden usar hasta que terminan.
  if (fileName) {
    await waitForFileActive(fileName)
  }

  return {
    fileUri: json.file.uri,
    mimeType: json.file.mimeType ?? mimeType,
    name: fileName,
  }
}

async function waitForFileActive(name: string, maxWaitMs = 120_000): Promise<void> {
  const key = getApiKey()
  const url = `${GEMINI_BASE}/${name}?key=${encodeURIComponent(key)}`
  const deadline = Date.now() + maxWaitMs
  let delay = 2000

  while (Date.now() < deadline) {
    const res = await fetch(url, { cache: 'no-store' })
    const json = (await res.json().catch(() => ({}))) as {
      state?: string
      error?: { message?: string }
    }
    const state = json.state ?? 'UNKNOWN'
    if (state === 'ACTIVE') return
    if (state === 'FAILED') {
      throw new ContentIntelError(
        'gemini_file_processing_failed',
        `Gemini file processing failed: ${json.error?.message ?? 'unknown'}`,
      )
    }
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(delay * 1.5, 10_000)
  }
  throw new ContentIntelError(
    'gemini_file_timeout',
    `File ${name} no llegó a ACTIVE en ${maxWaitMs}ms`,
  )
}

export async function geminiDeleteFile(name: string): Promise<void> {
  if (!name) return
  const key = getApiKey()
  const url = `${GEMINI_BASE}/${name}?key=${encodeURIComponent(key)}`
  await fetch(url, { method: 'DELETE', cache: 'no-store' }).catch(() => {
    // Best-effort delete. Gemini Files expire en ~48h de todas formas.
  })
}

export interface GeminiFileReference {
  fileData: { fileUri: string; mimeType: string }
}

export async function geminiGenerateWithFile(params: {
  model: string
  fileUri: string
  fileMimeType: string
  promptText: string
  temperature?: number
  maxOutputTokens?: number
}): Promise<GeminiGenerateResponse> {
  return geminiGenerate({
    model: params.model,
    parts: [
      { fileData: { fileUri: params.fileUri, mimeType: params.fileMimeType } } as unknown as GeminiPart,
      { text: params.promptText },
    ],
    temperature: params.temperature,
    maxOutputTokens: params.maxOutputTokens,
  })
}
