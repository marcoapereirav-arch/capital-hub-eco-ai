import type { WhisperWord } from '../types/video-edit'

/**
 * Detecta "islas de habla": grupos consecutivos de palabras con gap < threshold.
 * Los huecos entre islas se cortan al ensamblar el timeline.
 */

export interface SpeechSegment {
  /** Inicio en el video FUENTE (segundos). Usar como `trim` en Shotstack. */
  sourceStart: number
  /** Duración del segmento (segundos). */
  duration: number
  /** Inicio en el video OUTPUT (segundos), tras quitar silencios previos. */
  outputStart: number
}

export interface ShiftedWord {
  word: string
  /** Tiempo en el output (sin silencios). */
  start: number
  end: number
}

export interface TrimResult {
  segments: SpeechSegment[]
  shiftedWords: ShiftedWord[]
  totalOutputDuration: number
  /** Cuánto silencio se quitó en total (segundos). */
  silenceRemoved: number
}

/** Pequeña cola de respiro al final de cada isla para no cortar la última sílaba. */
const TAIL_PADDING_SECONDS = 0.08
/** Pequeña entrada al inicio para no cortar la primera sílaba. */
const HEAD_PADDING_SECONDS = 0.05

/**
 * @param thresholdMs - cualquier silencio >= este valor se elimina.
 *                     Default 400ms (Playbook Capital Hub).
 */
export function trimSilences(
  words: WhisperWord[],
  thresholdMs: number = 400,
): TrimResult {
  if (words.length === 0) {
    return { segments: [], shiftedWords: [], totalOutputDuration: 0, silenceRemoved: 0 }
  }

  const thresholdS = thresholdMs / 1000

  // 1) Agrupar palabras en islas
  const islands: WhisperWord[][] = [[words[0]]]
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end
    if (gap >= thresholdS) {
      islands.push([words[i]])
    } else {
      islands[islands.length - 1].push(words[i])
    }
  }

  // 2) Construir segmentos (con padding) y palabras shiftadas
  const segments: SpeechSegment[] = []
  const shiftedWords: ShiftedWord[] = []
  let outputOffset = 0
  let originalEnd = 0

  // Mínima duración de un segmento de video. Shotstack rechaza length <= 0.
  // Whisper a veces devuelve start === end para palabras tipo numeros/siglas.
  const MIN_SEGMENT_DURATION = 0.2

  for (const island of islands) {
    const rawStart = island[0].start
    const rawEndOriginal = island[island.length - 1].end
    // Si la última palabra tiene start === end, ampliamos el rawEnd hacia
    // el end real de la palabra anterior o sumamos un fallback.
    const rawEnd = Math.max(rawEndOriginal, rawStart + 0.1)
    const srcStart = Math.max(0, rawStart - HEAD_PADDING_SECONDS)
    const srcEndCandidate = rawEnd + TAIL_PADDING_SECONDS
    const srcEnd = Math.max(srcEndCandidate, srcStart + MIN_SEGMENT_DURATION)
    const duration = srcEnd - srcStart

    segments.push({ sourceStart: srcStart, duration, outputStart: outputOffset })

    for (const w of island) {
      shiftedWords.push({
        word: w.word,
        start: w.start - srcStart + outputOffset,
        end: Math.max(w.end, w.start + 0.05) - srcStart + outputOffset,
      })
    }

    outputOffset += duration
    originalEnd = Math.max(originalEnd, rawEnd)
  }

  return {
    segments,
    shiftedWords,
    totalOutputDuration: outputOffset,
    silenceRemoved: Math.max(0, originalEnd - outputOffset),
  }
}
