import type { ShotstackClip } from './shotstack'
import type { ShiftedWord } from './silence-trim'

/**
 * Constructor de subtítulos para Shotstack.
 *
 * Estrategia "word-by-word karaoke" del Playbook Capital Hub:
 *   - Máximo N palabras visibles a la vez (default 3, según playbook).
 *   - Sliding window: a cada nueva palabra hablada, la ventana avanza.
 *   - Cada estado de la ventana = 1 text clip.
 *   - Posición lower-third por defecto.
 */

export interface SubtitleStyleTokens {
  fontFamily: string
  fontWeight?: number | string
  fontSize: number
  color: string
  backgroundColor?: string | null
  backgroundOpacity?: number
  position: 'lower-third' | 'center' | 'upper-third'
  /** Subtítulos centrados horizontalmente, ancho del bloque visible. */
  blockWidth?: number
  blockHeight?: number
}

export const DEFAULT_SUBTITLE_TOKENS: SubtitleStyleTokens = {
  // SF Pro Display no está disponible cross-platform en Shotstack — usamos Inter
  // que es un equivalente Apple-style libre. Cuando lleguen capturas y queramos
  // SF Pro exacto, se sube como custom font asset.
  fontFamily: 'Inter ExtraBold',
  fontWeight: 800,
  fontSize: 64,
  color: '#FFFFFF',
  backgroundColor: null,
  backgroundOpacity: 0,
  position: 'lower-third',
  blockWidth: 900,
  blockHeight: 240,
}

function positionToShotstack(pos: SubtitleStyleTokens['position']): {
  position: ShotstackClip['position']
  offsetY: number
} {
  switch (pos) {
    case 'upper-third':
      return { position: 'top', offsetY: -0.18 }
    case 'center':
      return { position: 'center', offsetY: 0 }
    case 'lower-third':
    default:
      // 'bottom' coloca el clip en la zona inferior; offset negativo lo sube
      // un poco para no quedar pegado al borde absoluto del frame.
      return { position: 'bottom', offsetY: 0.18 }
  }
}

function buildKaraokeFrames(
  words: ShiftedWord[],
  maxVisibleWords: number,
): { text: string; start: number; length: number }[] {
  if (words.length === 0) return []

  const frames: { text: string; start: number; length: number }[] = []
  const half = Math.max(1, Math.floor(maxVisibleWords / 2))

  for (let i = 0; i < words.length; i++) {
    const windowStart = Math.max(0, i - half + 1)
    const windowEnd = Math.min(words.length, windowStart + maxVisibleWords)
    const realStart = Math.max(0, windowEnd - maxVisibleWords)
    const visible = words.slice(realStart, windowEnd)

    const text = visible
      .map((w) => w.word.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+([,.!?;:])/g, '$1')
      .trim()

    if (!text) continue

    const stateStart = words[i].start
    const nextWord = words[i + 1]
    const stateEnd = nextWord ? nextWord.start : words[i].end + 0.18
    const length = Math.max(0.05, stateEnd - stateStart)

    frames.push({ text, start: stateStart, length })
  }

  return frames
}

export function buildKaraokeSubtitleClips(
  words: ShiftedWord[],
  options: {
    maxVisibleWords?: number
    style?: Partial<SubtitleStyleTokens>
  } = {},
): ShotstackClip[] {
  const maxVisible = options.maxVisibleWords ?? 3
  const style: SubtitleStyleTokens = { ...DEFAULT_SUBTITLE_TOKENS, ...options.style }
  const { position, offsetY } = positionToShotstack(style.position)

  const frames = buildKaraokeFrames(words, maxVisible)

  return frames.map((frame) => ({
    asset: {
      type: 'text' as const,
      text: frame.text,
      font: {
        family: style.fontFamily,
        size: style.fontSize,
        color: style.color,
        weight: style.fontWeight,
        lineHeight: 1.1,
      },
      alignment: { horizontal: 'center', vertical: 'center' },
      background:
        style.backgroundColor && (style.backgroundOpacity ?? 0) > 0
          ? {
              color: style.backgroundColor,
              opacity: style.backgroundOpacity ?? 0.5,
              borderRadius: 8,
              padding: 16,
            }
          : undefined,
      stroke: { color: '#000000', width: 4 },
      width: style.blockWidth ?? 900,
      height: style.blockHeight ?? 240,
    },
    start: frame.start,
    length: frame.length,
    fit: 'none',
    position,
    offset: { y: offsetY },
  }))
}
