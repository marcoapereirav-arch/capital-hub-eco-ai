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

  for (const island of islands) {
    const rawStart = island[0].start
    const rawEnd = island[island.length - 1].end
    const srcStart = Math.max(0, rawStart - HEAD_PADDING_SECONDS)
    const srcEnd = rawEnd + TAIL_PADDING_SECONDS
    const duration = srcEnd - srcStart

    segments.push({ sourceStart: srcStart, duration, outputStart: outputOffset })

    for (const w of island) {
      shiftedWords.push({
        word: w.word,
        start: w.start - srcStart + outputOffset,
        end: w.end - srcStart + outputOffset,
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
