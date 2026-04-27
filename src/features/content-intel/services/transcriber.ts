import { EMBEDDING_DIMENSIONS, GEMINI_EMBED_MODEL, GEMINI_TRANSCRIBE_MODEL, MAX_TRANSCRIPT_CHARS } from '../constants'
import { ContentIntelError, toErrorMessage } from '../lib/errors'
import {
  geminiDeleteFile,
  geminiEmbed,
  geminiGenerate,
  geminiGenerateWithFile,
  geminiUploadFile,
  type GeminiPart,
} from './gemini-client'

const INLINE_SIZE_LIMIT = 18 * 1024 * 1024 // 18MB safety margin (Gemini accepts up to 20MB inline)

const TRANSCRIBE_PROMPT =
  'Transcribe este video palabra por palabra en el idioma hablado. Devuelve SOLO el transcript sin comentarios, sin descripción visual, sin marcas de tiempo. Si el video no tiene audio hablado o es instrumental, responde exactamente: [NO_SPEECH].'

export interface TranscribeResult {
  transcript: string
  language: string | null
  model: string
  cost_usd: number
  tokens_used: number
}

async function downloadVideo(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new ContentIntelError(
      'video_download_failed',
      `Video download ${res.status} for ${url.slice(0, 100)}`,
    )
  }
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = res.headers.get('content-type') ?? 'video/mp4'
  return { buffer, mimeType: mimeType.split(';')[0].trim() }
}

/**
 * Estimación rough de coste basado en tokens. Gemini 2.5 Flash es ~$0.075/M input, $0.30/M output.
 * Video cuesta distinto pero usamos tokens como proxy.
 */
function estimateCost(tokens: number): number {
  return (tokens / 1_000_000) * 0.15
}

function detectLanguage(transcript: string): string | null {
  // Heurística simple: detectar si es español por palabras frecuentes.
  const sample = transcript.slice(0, 500).toLowerCase()
  const spanishMarkers = /\b(que|de|la|el|los|las|y|en|una|por|con|para|mi|si|no|me|te|se|es|lo|como)\b/g
  const matches = sample.match(spanishMarkers)
  if (matches && matches.length > 5) return 'es'
  const englishMarkers = /\b(the|and|of|to|a|is|in|that|it|for|on|with|as|this|you|be|have|are)\b/g
  const enMatches = sample.match(englishMarkers)
  if (enMatches && enMatches.length > 5) return 'en'
  return null
}

export async function transcribeVideo(videoUrl: string): Promise<TranscribeResult> {
  let download: { buffer: Buffer; mimeType: string }
  try {
    download = await downloadVideo(videoUrl)
  } catch (err) {
    throw new ContentIntelError(
      'video_download_failed',
      `No se pudo descargar el video: ${toErrorMessage(err)}`,
      err,
    )
  }

  const { buffer, mimeType } = download
  let result: { text: string; tokens: number }

  if (buffer.byteLength <= INLINE_SIZE_LIMIT) {
    const parts: GeminiPart[] = [
      {
        inlineData: { mimeType, data: buffer.toString('base64') },
      },
      { text: TRANSCRIBE_PROMPT },
    ]
    const out = await geminiGenerate({
      model: GEMINI_TRANSCRIBE_MODEL,
      parts,
      temperature: 0,
      maxOutputTokens: 8192,
    })
    result = { text: out.text, tokens: out.usage?.totalTokenCount ?? 0 }
  } else {
    const uploaded = await geminiUploadFile(buffer, mimeType)
    try {
      const out = await geminiGenerateWithFile({
        model: GEMINI_TRANSCRIBE_MODEL,
        fileUri: uploaded.fileUri,
        fileMimeType: uploaded.mimeType,
        promptText: TRANSCRIBE_PROMPT,
        temperature: 0,
        maxOutputTokens: 8192,
      })
      result = { text: out.text, tokens: out.usage?.totalTokenCount ?? 0 }
    } finally {
      void geminiDeleteFile(uploaded.name)
    }
  }

  const transcript = result.text.trim().slice(0, MAX_TRANSCRIPT_CHARS)

  if (transcript === '[NO_SPEECH]' || transcript.length < 5) {
    return {
      transcript: '[NO_SPEECH]',
      language: null,
      model: GEMINI_TRANSCRIBE_MODEL,
      cost_usd: estimateCost(result.tokens),
      tokens_used: result.tokens,
    }
  }

  return {
    transcript,
    language: detectLanguage(transcript),
    model: GEMINI_TRANSCRIBE_MODEL,
    cost_usd: estimateCost(result.tokens),
    tokens_used: result.tokens,
  }
}

// ---------- Embeddings ----------

export interface EmbedResult {
  values: number[]
  model: string
  dimensions: number
}

export async function embedText(text: string, taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT'): Promise<EmbedResult> {
  const truncated = text.slice(0, 8000)
  const out = await geminiEmbed({
    model: GEMINI_EMBED_MODEL,
    text: truncated,
    taskType,
    outputDimensionality: EMBEDDING_DIMENSIONS,
  })
  return { values: out.values, model: out.model, dimensions: out.values.length }
}
