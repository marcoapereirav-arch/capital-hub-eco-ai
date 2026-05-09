import Replicate from 'replicate'
import type { WhisperTranscript, WhisperWord } from '../types/video-edit'

/**
 * Modelo: victor-upmeet/whisperx con align_output=true.
 *
 * Devuelve word-level timestamps REALES con alineación forzada (forced
 * alignment), por lo que los subtítulos clavan al ms con la voz.
 *
 * El otro modelo que probamos (vaibhavs10/incredibly-fast-whisper) NO
 * devuelve word-level, solo chunks de 30s. Y openai/whisper tampoco
 * acepta el parámetro word_timestamps. Whisperx es la mejor opción
 * disponible en Replicate para nuestro caso.
 *
 * Acepta video directo (extrae audio via ffmpeg internally).
 */
const WHISPER_MODEL =
  'victor-upmeet/whisperx:84d2ad2d6194fe98a17d2b60bef1c7f910c46b2f6fd38996ca457afd9c8abfcb'

interface WhisperxWord {
  word: string
  start: number
  end: number
  score?: number
}

interface WhisperxSegment {
  start: number
  end: number
  text: string
  words?: WhisperxWord[]
}

interface WhisperxOutput {
  segments?: WhisperxSegment[]
  detected_language?: string
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
 * Devuelve transcript con palabras + timestamps por palabra (word-level real,
 * no aproximado).
 */
export async function transcribeAudioFromUrl(
  signedAudioUrl: string,
  language: string = 'es',
): Promise<WhisperTranscript> {
  const replicate = getReplicate()

  const output = (await replicate.run(WHISPER_MODEL, {
    input: {
      audio_file: signedAudioUrl,
      language, // ISO code (es, en, fr, ...)
      align_output: true, // crítico: activa word-level timestamps con forced alignment
      batch_size: 64,
      temperature: 0,
      // VAD parámetros: dejamos los defaults (0.5 / 0.363). El VAD recorta
      // silencios largos del transcript pero NO afecta el audio del video
      // — solo lo que se transcribe. Si vemos que se come repeticiones
      // intencionadas del speaker, ajustamos estos parámetros.
    },
  })) as WhisperxOutput

  const segments = output.segments ?? []
  const words: WhisperWord[] = []
  const textParts: string[] = []

  for (const seg of segments) {
    if (seg.text) textParts.push(seg.text.trim())

    if (seg.words && seg.words.length > 0) {
      // Word-level real desde whisperx (align_output=true)
      for (const w of seg.words) {
        if (
          typeof w.start !== 'number' ||
          typeof w.end !== 'number' ||
          !w.word ||
          w.word.trim().length === 0
        ) {
          continue
        }
        words.push({
          word: w.word.trim(),
          start: w.start,
          end: w.end > w.start ? w.end : w.start + 0.05,
        })
      }
    } else if (typeof seg.start === 'number' && typeof seg.end === 'number' && seg.text) {
      // Fallback: si por alguna razón un segmento no tiene words (raro con
      // align_output=true), aproximamos distribuyendo el tiempo proporcional
      // al length de cada palabra. Mejor que perder ese segmento.
      const segWords = seg.text.trim().split(/\s+/).filter(Boolean)
      const segDuration = seg.end - seg.start
      const totalChars =
        segWords.reduce((acc, w) => acc + w.length, 0) || segWords.length
      let cursor = seg.start
      for (const word of segWords) {
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
  }

  return {
    text: textParts.join(' '),
    language: output.detected_language ?? language,
    words: dedupeConsecutiveDuplicates(words),
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
