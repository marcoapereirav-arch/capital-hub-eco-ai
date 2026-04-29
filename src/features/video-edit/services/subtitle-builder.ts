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
  // v5 — Spec confirmado por usuario tras analizar 3 capturas reales de Diego:
  //   subs sutiles, peso semibold, SIN outline, blanco limpio, ~42px sobre 1080.
  //   v2/v3/v4 fallaron porque metí stroke (todo me salió hueco/negro).
  //   v5 va sin stroke. Punto.
  fontFamily: 'Inter',
  fontWeight: 600,
  fontSize: 42,
  color: '#FFFFFF',
  backgroundColor: null,
  backgroundOpacity: 0,
  position: 'lower-third',
  blockWidth: 760,
  blockHeight: 140,
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
      // Estilo Diego: subs en la zona del pecho/cuello del sujeto, no pegados
      // al borde inferior. offset 0.28 = ~28% desde el borde inferior hacia
      // el centro.
      return { position: 'bottom', offsetY: 0.28 }
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
      // v5: SIN stroke. Diego usa subs blancos limpios sin outline visible.
      // Cualquier stroke en este tamaño hace que se vea hueco/contorneado.
      // Si es ilegible sobre un fondo claro, es decisión del usuario al grabar
      // (background con contraste suficiente).
      width: style.blockWidth ?? 760,
      height: style.blockHeight ?? 180,
    },
    start: frame.start,
    length: frame.length,
    fit: 'none',
    position,
    offset: { y: offsetY },
  }))
}
