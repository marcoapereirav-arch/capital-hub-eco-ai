import type {
  ShotstackClip,
  ShotstackEditPayload,
  ShotstackTimeline,
} from './shotstack'
import type { WhisperTranscript, WhisperWord } from '../types/video-edit'

/**
 * Agrupa palabras de Whisper en frases cortas (3-5 palabras) para subtítulos legibles.
 * Cada frase se convierte en un text clip con start/length precisos.
 */
export interface SubtitlePhrase {
  text: string
  start: number
  length: number
}

const DEFAULT_WORDS_PER_PHRASE = 4
const MIN_PHRASE_DURATION = 0.6 // segundos. Frases más cortas se extienden para que se lean
const MAX_PHRASE_DURATION = 4.0 // segundos. Si una frase dura más, ya no es lectura cómoda

export function groupWordsIntoPhrases(
  words: WhisperWord[],
  wordsPerPhrase: number = DEFAULT_WORDS_PER_PHRASE,
): SubtitlePhrase[] {
  if (words.length === 0) return []
  const phrases: SubtitlePhrase[] = []

  for (let i = 0; i < words.length; i += wordsPerPhrase) {
    const chunk = words.slice(i, i + wordsPerPhrase)
    if (chunk.length === 0) continue
    const start = chunk[0].start
    const rawEnd = chunk[chunk.length - 1].end
    const length = Math.min(
      Math.max(rawEnd - start, MIN_PHRASE_DURATION),
      MAX_PHRASE_DURATION,
    )
    const text = chunk
      .map((w) => w.word.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+([,.!?;:])/g, '$1')
      .trim()
    if (!text) continue
    phrases.push({ text, start, length })
  }

  return phrases
}

// ============================================================================
// Estilo de subtítulo
// ============================================================================

export interface SubtitleStyle {
  fontFamily: string
  fontSize: number
  fontColor: string
  fontWeight?: number | string
  backgroundColor?: string
  backgroundOpacity?: number
  borderRadius?: number
  padding?: number
  strokeColor?: string
  strokeWidth?: number
  position: 'top' | 'center' | 'bottom'
  offsetY?: number
}

/**
 * Estilo Capital Hub por defecto. Provisional — se sustituirá cuando el usuario
 * pase su brand pack. Pensado para vertical 9:16 / Reels.
 */
export const CAPITAL_HUB_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: 'Montserrat ExtraBold',
  fontSize: 60,
  fontColor: '#FFFFFF',
  fontWeight: 800,
  backgroundColor: '#000000',
  backgroundOpacity: 0.55,
  borderRadius: 12,
  padding: 24,
  strokeColor: '#000000',
  strokeWidth: 4,
  position: 'center',
  offsetY: 0.05,
}

function phraseToTextClip(phrase: SubtitlePhrase, style: SubtitleStyle): ShotstackClip {
  return {
    asset: {
      type: 'text',
      text: phrase.text,
      font: {
        family: style.fontFamily,
        size: style.fontSize,
        color: style.fontColor,
        weight: style.fontWeight,
      },
      alignment: { horizontal: 'center', vertical: 'center' },
      background: style.backgroundColor
        ? {
            color: style.backgroundColor,
            opacity: style.backgroundOpacity ?? 0.6,
            borderRadius: style.borderRadius ?? 12,
            padding: style.padding ?? 20,
          }
        : undefined,
      stroke: style.strokeColor
        ? { color: style.strokeColor, width: style.strokeWidth ?? 3 }
        : undefined,
      width: 880,
      height: 220,
    },
    start: phrase.start,
    length: phrase.length,
    fit: 'none',
    position: style.position,
    offset: { y: style.offsetY ?? 0 },
    transition: { in: 'fadeFast', out: 'fadeFast' },
  }
}

// ============================================================================
// Builder principal
// ============================================================================

export interface BuildSubtitledTimelineInput {
  sourceVideoUrl: string
  durationSeconds: number
  transcript: WhisperTranscript
  style?: SubtitleStyle
  wordsPerPhrase?: number
  aspectRatio?: '9:16' | '1:1' | '16:9'
  resolution?: 'sd' | 'hd' | '1080'
}

/**
 * Construye un payload completo de Shotstack: video original + track de subtítulos.
 * No corta silencios ni añade música — esos van en bloques posteriores.
 */
export function buildSubtitledTimelinePayload(
  input: BuildSubtitledTimelineInput,
): ShotstackEditPayload {
  const style = input.style ?? CAPITAL_HUB_SUBTITLE_STYLE
  const phrases = groupWordsIntoPhrases(
    input.transcript.words,
    input.wordsPerPhrase ?? DEFAULT_WORDS_PER_PHRASE,
  )

  const videoClip: ShotstackClip = {
    asset: { type: 'video', src: input.sourceVideoUrl },
    start: 0,
    length: input.durationSeconds,
    fit: 'cover',
  }

  const subtitleClips = phrases.map((p) => phraseToTextClip(p, style))

  const timeline: ShotstackTimeline = {
    background: '#000000',
    tracks: [
      // Track superior = subtítulos (se renderizan encima del video)
      { clips: subtitleClips },
      // Track inferior = video fuente
      { clips: [videoClip] },
    ],
  }

  return {
    timeline,
    output: {
      format: 'mp4',
      resolution: input.resolution ?? 'hd',
      aspectRatio: input.aspectRatio ?? '9:16',
      fps: 30,
      quality: 'high',
    },
  }
}
