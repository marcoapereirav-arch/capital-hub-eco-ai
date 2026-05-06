import Replicate from 'replicate'
import type { WhisperTranscript, WhisperWord } from '../types/video-edit'

// Modelo: openai/whisper (large-v3). MENOS limpieza automática que WhisperX —
// captura repeticiones reales del hablante (frases que se truncan y reformulan).
// El otro modelo VAD-cleanea las repeticiones y el LLM-edit no podía atacarlas.
// Acepta video directo (extrae audio via ffmpeg internally).
const WHISPER_MODEL =
  'openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e'

interface OpenAIWhisperSegment {
  id?: number
  start?: number
  end?: number
  text?: string
  // openai/whisper no devuelve word-level timestamps por defecto, pero podemos
  // pedirlo. Si no vienen, fallback a word=segment.
}

interface OpenAIWhisperOutput {
  detected_language?: string
  transcription?: string
  segments?: OpenAIWhisperSegment[]
  // Algunas variantes devuelven word-level si activas word_timestamps
  word_timestamps?: Array<{ word: string; start: number; end: number }>
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
 * Acepta video (MOV/MP4) — WhisperX lo demultiplexa con ffmpeg automaticamente.
 * Devuelve transcript con palabras + timestamps.
 */
export async function transcribeAudioFromUrl(
  signedAudioUrl: string,
  language: string = 'es',
): Promise<WhisperTranscript> {
  const replicate = getReplicate()

  const output = (await replicate.run(WHISPER_MODEL, {
    input: {
      audio: signedAudioUrl,
      language,
      transcription: 'plain text',
      condition_on_previous_text: true,
      // word_timestamps: true → Whisper devuelve timestamps EXACTOS por palabra
      // en vez de timestamps por segmento. Sin esto, los timestamps se
      // aproximan distribuyendo el tiempo del segmento proporcionalmente al
      // length de cada palabra → causa descuadre visible en los subs.
      word_timestamps: true,
      temperature: 0,
    },
  })) as OpenAIWhisperOutput

  const segments = output.segments ?? []
  const words: WhisperWord[] = []
  const textParts: string[] = []

  for (const seg of segments) {
    if (seg.text) textParts.push(seg.text.trim())
    if (typeof seg.start !== 'number' || typeof seg.end !== 'number' || !seg.text) continue

    // Distribuir tiempo del segmento entre las palabras proporcionalmente
    const segmentWords = seg.text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
    if (segmentWords.length === 0) continue

    const segDuration = seg.end - seg.start
    const totalChars = segmentWords.reduce((acc, w) => acc + w.length, 0) || segmentWords.length

    let cursor = seg.start
    for (const word of segmentWords) {
      const portion = (word.length || 1) / totalChars
      const wordDuration = segDuration * portion
      words.push({
        word,
        start: cursor,
        end: cursor + wordDuration,
      })
      cursor += wordDuration
    }
  }

  // Si Replicate devolvió word_timestamps directamente, los preferimos
  let finalWords: WhisperWord[]
  if (output.word_timestamps && output.word_timestamps.length > 0) {
    finalWords = output.word_timestamps.map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }))
  } else {
    finalWords = words
  }

  return {
    text: output.transcription ?? textParts.join(' '),
    language: output.detected_language ?? language,
    words: dedupeConsecutiveDuplicates(finalWords),
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
