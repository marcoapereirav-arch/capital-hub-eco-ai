import type {
  ShotstackClip,
  ShotstackEditPayload,
  ShotstackTimeline,
  ShotstackTrack,
} from './shotstack'
import type { WhisperTranscript } from '../types/video-edit'
import { trimSilences, type SpeechSegment } from './silence-trim'
import {
  buildKaraokeSubtitleClips,
  DEFAULT_SUBTITLE_TOKENS,
  type SubtitleStyleTokens,
} from './subtitle-builder'

/**
 * Constructores de timeline Shotstack por variante del Playbook Capital Hub.
 *
 * Cada constructor toma:
 *  - URL firmada del video fuente
 *  - duración total del video fuente
 *  - transcript Whisper con words timestamps
 *  - tokens del brand pack (estilo de subs, color grade, aspect, etc)
 *
 * Y devuelve un payload completo listo para `queueRender`.
 */

// ============================================================================
// Tokens compartidos del Brand Pack
// ============================================================================

export interface BrandPackTokens {
  subtitleFontFamily: string
  subtitleFontWeight: number | string
  subtitleFontSizeRelative: 'huge' | 'large' | 'medium'
  subtitleColor: string
  subtitleEmphasisStyle: 'bold-glow' | 'accent-color' | 'larger-bold'
  subtitleEmphasisColor: string | null
  subtitlePosition: 'lower-third' | 'center' | 'upper-third'
  subtitleAnimation: 'word-by-word' | 'phrase' | 'fade'
  subtitleMaxVisibleWords: number
  subtitleBackgroundColor: string | null
  subtitleBackgroundOpacity: number

  variant2BarHeightPx: number
  variant2BarColor: string
  variant2HeadlineFontFamily: string
  variant2HeadlineColor: string

  variant3KeywordSizeMultiplier: number
  variant3KeywordAccentColor: string | null

  colorGradeLut: string
  colorGradeIntensity: number

  aspectRatio: '9:16' | '1:1' | '16:9'
  resolution: 'sd' | 'hd' | '1080'
  fps: 24 | 25 | 30 | 50 | 60

  silenceThresholdMs: number
}

export const DEFAULT_BRAND_TOKENS: BrandPackTokens = {
  subtitleFontFamily: 'Inter ExtraBold',
  subtitleFontWeight: 800,
  subtitleFontSizeRelative: 'large',
  subtitleColor: '#FFFFFF',
  subtitleEmphasisStyle: 'bold-glow',
  subtitleEmphasisColor: null,
  subtitlePosition: 'lower-third',
  subtitleAnimation: 'word-by-word',
  subtitleMaxVisibleWords: 3,
  subtitleBackgroundColor: null,
  subtitleBackgroundOpacity: 0,

  variant2BarHeightPx: 425,
  variant2BarColor: '#000000',
  variant2HeadlineFontFamily: 'Inter ExtraBold',
  variant2HeadlineColor: '#FFFFFF',

  variant3KeywordSizeMultiplier: 2.5,
  variant3KeywordAccentColor: null,

  colorGradeLut: 'cinematic-warm',
  colorGradeIntensity: 0.7,

  aspectRatio: '9:16',
  resolution: '1080',
  fps: 30,

  silenceThresholdMs: 400,
}

function brandToSubtitleStyle(brand: BrandPackTokens): SubtitleStyleTokens {
  const sizeMap: Record<BrandPackTokens['subtitleFontSizeRelative'], number> = {
    huge: 80,
    large: 64,
    medium: 52,
  }
  return {
    fontFamily: brand.subtitleFontFamily,
    fontWeight: brand.subtitleFontWeight,
    fontSize: sizeMap[brand.subtitleFontSizeRelative],
    color: brand.subtitleColor,
    backgroundColor: brand.subtitleBackgroundColor,
    backgroundOpacity: brand.subtitleBackgroundOpacity,
    position: brand.subtitlePosition,
    blockWidth: 900,
    blockHeight: 240,
  }
}

// ============================================================================
// Utilidades comunes: video con cortes de silencio
// ============================================================================

interface BuildTrimmedVideoTrackInput {
  sourceVideoUrl: string
  segments: SpeechSegment[]
}

/**
 * Construye una pista de video con N clips, uno por isla de habla,
 * usando el `trim` de Shotstack para saltar los silencios del original.
 */
function buildTrimmedVideoTrack(input: BuildTrimmedVideoTrackInput): ShotstackTrack {
  const clips: ShotstackClip[] = input.segments.map((seg) => ({
    asset: {
      type: 'video' as const,
      src: input.sourceVideoUrl,
      trim: seg.sourceStart,
    },
    start: seg.outputStart,
    length: seg.duration,
    fit: 'cover',
  }))
  return { clips }
}

/**
 * Pista de subtítulos karaoke a partir de un transcript ya shiftado por silence-trim.
 */
function buildKaraokeSubtitleTrack(
  shiftedWords: { word: string; start: number; end: number }[],
  brand: BrandPackTokens,
): ShotstackTrack {
  const clips = buildKaraokeSubtitleClips(shiftedWords, {
    maxVisibleWords: brand.subtitleMaxVisibleWords,
    style: brandToSubtitleStyle(brand),
  })
  return { clips }
}

// ============================================================================
// VARIANTE 1 — Vertical Clean
// ============================================================================

export interface BuildVerticalCleanInput {
  sourceVideoUrl: string
  durationSeconds: number
  transcript: WhisperTranscript
  brand?: Partial<BrandPackTokens>
  applySilenceTrim?: boolean
}

export interface BuildResult {
  payload: ShotstackEditPayload
  /** Duración del output (post silence-trim) en segundos. */
  outputDuration: number
  /** Segundos de silencio recortados. */
  silenceRemoved: number
}

export function buildVerticalCleanPayload(input: BuildVerticalCleanInput): BuildResult {
  const brand: BrandPackTokens = { ...DEFAULT_BRAND_TOKENS, ...input.brand }
  const apply = input.applySilenceTrim !== false

  // 1) Detectar islas de habla y shiftar palabras al output timeline
  const trim = apply
    ? trimSilences(input.transcript.words, brand.silenceThresholdMs)
    : {
        segments: [
          {
            sourceStart: 0,
            duration: input.durationSeconds,
            outputStart: 0,
          },
        ],
        shiftedWords: input.transcript.words.map((w) => ({
          word: w.word,
          start: w.start,
          end: w.end,
        })),
        totalOutputDuration: input.durationSeconds,
        silenceRemoved: 0,
      }

  // 2) Construir pista de video con N clips trimmeados
  const videoTrack = buildTrimmedVideoTrack({
    sourceVideoUrl: input.sourceVideoUrl,
    segments: trim.segments,
  })

  // 3) Construir pista de subtítulos karaoke
  const subtitleTrack = buildKaraokeSubtitleTrack(trim.shiftedWords, brand)

  // 4) Timeline (orden importa: tracks superiores se renderizan encima)
  const timeline: ShotstackTimeline = {
    background: '#000000',
    tracks: [subtitleTrack, videoTrack],
  }

  return {
    payload: {
      timeline,
      output: {
        format: 'mp4',
        resolution: brand.resolution,
        aspectRatio: brand.aspectRatio,
        fps: brand.fps,
        quality: 'high',
      },
    },
    outputDuration: trim.totalOutputDuration,
    silenceRemoved: trim.silenceRemoved,
  }
}

// ============================================================================
// VARIANTE 2 — Horizontal Framed (STUB hasta capturas)
// ============================================================================

export function buildHorizontalFramedPayload(_input: BuildVerticalCleanInput & {
  headlineText: string
}): BuildResult {
  // TODO: implementar tras recibir capturas que confirmen:
  //   - altura exacta de las franjas
  //   - tipografía y tamaño del headline
  //   - estilo del border/sombra entre franja y video centrado
  throw new Error('preset_pending_references: horizontal-framed espera referencias visuales')
}

// ============================================================================
// VARIANTE 3 — Edit Dinámico (STUB hasta capturas)
// ============================================================================

export interface BuildEditDinamicoInput extends BuildVerticalCleanInput {
  brollClips: { url: string; durationSeconds: number }[]
  hookKeywords?: { word: string; atSecond: number }[]
}

export function buildEditDinamicoPayload(_input: BuildEditDinamicoInput): BuildResult {
  // TODO: implementar tras recibir capturas que confirmen:
  //   - tipografía exacta de palabras destacadas grandes
  //   - color de acento (si lo hay)
  //   - tipo de transiciones entre clips de b-roll
  //   - cadencia exacta de inserción de b-roll
  throw new Error('preset_pending_references: edit-dinamico espera referencias visuales')
}

// ============================================================================
// Selector por preset_slug
// ============================================================================

export interface BuildByPresetInput extends BuildVerticalCleanInput {
  presetSlug: string
  headlineText?: string
  brollClips?: { url: string; durationSeconds: number }[]
}

export function buildPayloadByPreset(input: BuildByPresetInput): BuildResult {
  switch (input.presetSlug) {
    case 'vertical-clean':
      return buildVerticalCleanPayload(input)
    case 'horizontal-framed':
      return buildHorizontalFramedPayload({
        ...input,
        headlineText: input.headlineText ?? '',
      })
    case 'edit-dinamico':
      return buildEditDinamicoPayload({
        ...input,
        brollClips: input.brollClips ?? [],
      })
    case 'podcast-clip':
      // Mismo pipeline que vertical-clean por defecto. El usuario elegirá
      // variante visual real más adelante.
      return buildVerticalCleanPayload(input)
    default:
      throw new Error(`preset_unknown: ${input.presetSlug}`)
  }
}

// ============================================================================
// Backwards compat con el render endpoint actual.
// ============================================================================

export function buildSubtitledTimelinePayload(input: {
  sourceVideoUrl: string
  durationSeconds: number
  transcript: WhisperTranscript
}): ShotstackEditPayload {
  return buildVerticalCleanPayload(input).payload
}
