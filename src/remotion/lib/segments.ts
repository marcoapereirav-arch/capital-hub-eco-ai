/**
 * Helpers para construir cut lists desde palabras del transcript.
 *
 * Adaptado y simplificado de Editor Pro Max (github.com/Hainrixz/editor-pro-max).
 *
 * Diferencia clave con el original: trabajamos con palabras de Whisper
 * (start/end por palabra) en lugar de un JSON de silence-segments precomputado.
 */

export interface SpeechSegment {
  startSeconds: number
  endSeconds: number
}

export interface ShiftedSegment extends SpeechSegment {
  /** Tiempo en el output (post-cut). */
  outputStart: number
  outputEnd: number
}

/**
 * Agrupa palabras en speech segments separados por silencios > thresholdMs.
 */
export function wordsToSegments(
  words: { start: number; end: number }[],
  silenceThresholdMs: number = 400,
): SpeechSegment[] {
  if (words.length === 0) return []
  const thresholdS = silenceThresholdMs / 1000

  const segments: SpeechSegment[] = []
  let currentStart = words[0].start
  let currentEnd = words[0].end

  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end
    if (gap >= thresholdS) {
      segments.push({ startSeconds: currentStart, endSeconds: currentEnd })
      currentStart = words[i].start
    }
    currentEnd = words[i].end
  }
  segments.push({ startSeconds: currentStart, endSeconds: currentEnd })

  return segments
}

/**
 * Añade padding a cada segmento y filtra los que queden demasiado cortos.
 */
export function buildCutList(
  segments: SpeechSegment[],
  options: { paddingSeconds?: number; minSegmentSeconds?: number } = {},
): SpeechSegment[] {
  const { paddingSeconds = 0.08, minSegmentSeconds = 0.2 } = options
  return segments
    .map((seg) => ({
      startSeconds: Math.max(0, seg.startSeconds - paddingSeconds),
      endSeconds: seg.endSeconds + paddingSeconds,
    }))
    .filter((seg) => seg.endSeconds - seg.startSeconds >= minSegmentSeconds)
}

/**
 * Une segmentos adyacentes con gap < threshold.
 */
export function mergeSegments(
  segments: SpeechSegment[],
  gapThresholdSeconds: number = 0.3,
): SpeechSegment[] {
  if (segments.length === 0) return []
  const sorted = [...segments].sort((a, b) => a.startSeconds - b.startSeconds)
  const merged: SpeechSegment[] = [{ ...sorted[0] }]

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    const current = sorted[i]
    if (current.startSeconds - last.endSeconds <= gapThresholdSeconds) {
      last.endSeconds = Math.max(last.endSeconds, current.endSeconds)
    } else {
      merged.push({ ...current })
    }
  }
  return merged
}

/**
 * Calcula los outputStart/outputEnd para cada segmento (cuándo aparece en el video final).
 */
export function withOutputTimings(segments: SpeechSegment[]): ShiftedSegment[] {
  let cursor = 0
  return segments.map((seg) => {
    const duration = seg.endSeconds - seg.startSeconds
    const result: ShiftedSegment = {
      ...seg,
      outputStart: cursor,
      outputEnd: cursor + duration,
    }
    cursor += duration
    return result
  })
}

/**
 * Shifta las palabras del transcript al timeline output.
 * Una palabra que cae fuera de cualquier segmento se descarta.
 */
export function shiftWords(
  words: { word: string; start: number; end: number }[],
  segments: ShiftedSegment[],
): { word: string; start: number; end: number }[] {
  const shifted: { word: string; start: number; end: number }[] = []
  for (const w of words) {
    for (const seg of segments) {
      if (w.start >= seg.startSeconds && w.end <= seg.endSeconds) {
        const offset = seg.outputStart - seg.startSeconds
        shifted.push({
          word: w.word,
          start: w.start + offset,
          end: Math.max(w.end + offset, w.start + offset + 0.05),
        })
        break
      }
    }
  }
  return shifted
}
