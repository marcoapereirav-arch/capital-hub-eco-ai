import { useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT_FAMILIES, loadCapitalHubFonts } from '../lib/fonts'

/**
 * Captions estilo Diego — versión sin Sequences anidadas.
 *
 * Un solo componente que usa useCurrentFrame para detectar la palabra activa
 * y renderiza la ventana de N palabras alrededor. Esta es la implementación que
 * funcionaba en v12 antes de meter Sequences (que producía solapamiento).
 */

export interface CaptionDiegoProps {
  words: { word: string; start: number; end: number }[]
  fontSize?: number
  /** Posición vertical (0=top, 1=bottom). 0.62 = zona pecho/cuello del sujeto. */
  verticalPosition?: number
  maxVisibleWords?: number
}

export const CaptionDiego: React.FC<CaptionDiegoProps> = ({
  words,
  fontSize = 44,
  verticalPosition = 0.62,
  maxVisibleWords = 3,
}) => {
  const frame = useCurrentFrame()
  const { fps, height } = useVideoConfig()
  loadCapitalHubFonts()

  if (words.length === 0) return null

  const currentSecond = frame / fps

  // Encontrar índice de la palabra activa en este momento
  let currentIndex = -1
  for (let i = 0; i < words.length; i++) {
    const next = words[i + 1]?.start ?? words[i].end + 0.2
    if (currentSecond >= words[i].start && currentSecond < next) {
      currentIndex = i
      break
    }
  }

  if (currentIndex === -1) return null

  // Ventana sliding alrededor de la palabra activa
  const half = Math.max(1, Math.floor(maxVisibleWords / 2))
  const windowStart = Math.max(0, currentIndex - half + 1)
  const windowEnd = Math.min(words.length, windowStart + maxVisibleWords)
  const realStart = Math.max(0, windowEnd - maxVisibleWords)
  const visible = words.slice(realStart, windowEnd)

  const text = visible
    .map((w) => w.word.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim()

  if (!text) return null

  const top = Math.round(height * verticalPosition)

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '85%',
          fontFamily: FONT_FAMILIES.primary,
          fontSize,
          fontWeight: 500,
          color: '#FFFFFF',
          textShadow:
            '0 2px 8px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.7)',
          letterSpacing: -0.2,
          lineHeight: 1.18,
        }}
      >
        {text}
      </div>
    </div>
  )
}
