import Replicate from 'replicate'
import type { WhisperTranscript, WhisperWord } from '../types/video-edit'

/**
 * Modelo: vaibhavs10/incredibly-fast-whisper.
 *
 * Devuelve word-level timestamps REALES (no aproximados). Hace alineación
 * forzada del audio con cada palabra del transcript, por lo que los
 * subtítulos clavan al ms con la voz.
 *
 * Antes usábamos openai/whisper que NO soporta word_timestamps — solo
 * devuelve timestamps por segmento y aproximábamos por palabra
 * proporcionalmente al length, causando descuadre visible en subs.
 *
 * Acepta video directo (extrae audio via ffmpeg internally).
 */
const WHISPER_MODEL = 'vaibhavs10/incredibly-fast-whisper'

interface IncrediblyFastWhisperChunk {
  text: string
  timestamp: [number, number] // [start_seconds, end_seconds]
}

interface IncrediblyFastWhisperOutput {
  text?: string
  chunks?: IncrediblyFastWhisperChunk[]
}

// Códigos ISO → nombres aceptados por incredibly-fast-whisper
const LANGUAGE_MAP: Record<string, string> = {
  es: 'spanish',
  en: 'english',
  fr: 'french',
  de: 'german',
  it: 'italian',
  pt: 'portuguese',
}

function getReplicate(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN no esta configurado en .env.local')
  }
  return new Replicate({ auth: token })
}

/**
 * Transcribe un video subido a Supabase Storage via su URL publica firmada.
 * Acepta video (MOV/MP4) — el modelo demultiplexa con ffmpeg automaticamente.
 * Devuelve transcript con palabras + timestamps por palabra.
 */
export async function transcribeAudioFromUrl(
  signedAudioUrl: string,
  language: string = 'es',
): Promise<WhisperTranscript> {
  const replicate = getReplicate()
  const lang = LANGUAGE_MAP[language] ?? language

  const output = (await replicate.run(WHISPER_MODEL, {
    input: {
      audio: signedAudioUrl,
      task: 'transcribe',
      language: lang,
      batch_size: 24,
      timestamp: 'word', // crítico: timestamps reales por palabra
      diarise_audio: false,
    },
  })) as IncrediblyFastWhisperOutput

  const chunks = output.chunks ?? []
  if (chunks.length === 0) {
    return {
      text: output.text ?? '',
      language,
      words: [],
    }
  }

  // Mapear chunks → words. El modelo a veces incluye chunks con timestamp null
  // al final (cuando no puede alinear la última palabra) — los filtramos.
  const rawWords: WhisperWord[] = chunks
    .filter(
      (c) =>
        c.timestamp &&
        Array.isArray(c.timestamp) &&
        typeof c.timestamp[0] === 'number' &&
        typeof c.timestamp[1] === 'number' &&
        c.text &&
        c.text.trim().length > 0,
    )
    .map((c) => ({
      word: c.text.trim(),
      start: c.timestamp[0],
      end: c.timestamp[1],
    }))
    // Defensa: end debe ser > start. Si no, le damos al menos 50ms.
    .map((w) => ({
      ...w,
      end: w.end > w.start ? w.end : w.start + 0.05,
    }))

  return {
    text: output.text ?? rawWords.map((w) => w.word).join(' '),
    language,
    words: dedupeConsecutiveDuplicates(rawWords),
  }
}

/**
 * Red de seguridad: elimina palabras consecutivas duplicadas (caso típico de
 * "que que que" cuando el speaker se traba). El LLM-edit aggressive ya intenta
 * detectar estas, pero como fallback pre-LLM filtramos los casos obvios:
 *
 *  - Misma palabra (case-insensitive, sin puntuación)
 *  - Gap entre fin de la primera y start de la siguiente < 0.5s
 *  - La primera dura < 0.4s (palabra "truncada", no énfasis intencional)
 *
 * Conservamos la ÚLTIMA ocurrencia (la "buena", típicamente la que el speaker
 * deja como definitiva). Repeticiones intencionadas con pausa entre palabras
 * o más largas se respetan.
 */
function dedupeConsecutiveDuplicates(words: WhisperWord[]): WhisperWord[] {
  if (words.length < 2) return words

  const normalize = (w: string) =>
    w.toLowerCase().replace(/[.,!?;:¿¡"'()]/g, '').trim()

  const result: WhisperWord[] = []
  for (let i = 0; i < words.length; i++) {
    const current = words[i]
    const next = words[i + 1]
    if (next) {
      const gap = next.start - current.end
      const currentDuration = current.end - current.start
      const sameWord = normalize(current.word) === normalize(next.word)
      if (sameWord && gap < 0.5 && currentDuration < 0.4) {
        // Saltamos current (palabra truncada/repetida), conservamos next
        continue
      }
    }
    result.push(current)
  }
  return result
}
