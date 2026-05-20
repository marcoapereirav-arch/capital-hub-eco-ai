import { useCurrentFrame, useVideoConfig } from 'remotion'

export interface SubtitleWord {
  word: string
  start: number // seconds (output timeline)
  end: number
}

interface SubtitleKaraokeProps {
  words: SubtitleWord[]
  /** Cuántas palabras visibles a la vez. Default 3 (estilo Diego). */
  maxVisibleWords?: number
}

/**
 * Subtítulos karaoke estilo Diego García del Río.
 *
 * Usa CSS real (browser rendering) para clavar al pixel:
 *  - Inter Medium 500
 *  - 40px sobre 1080
 *  - Blanco puro, sin outline
 *  - Posición lower-third (zona pecho del sujeto)
 *
 * El sliding window de 3 palabras avanza con cada palabra hablada.
 */
export const SubtitleKaraoke: React.FC<SubtitleKaraokeProps> = ({
  words,
  maxVisibleWords = 3,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const currentSecond = frame / fps

  if (words.length === 0) return null

  // Encontrar índice de la palabra "actual"
  let currentIndex = -1
  for (let i = 0; i < words.length; i++) {
    if (currentSecond >= words[i].start && currentSecond < (words[i + 1]?.start ?? words[i].end + 0.2)) {
      currentIndex = i
      break
    }
  }

  if (currentIndex === -1) return null

  // Sliding window de N palabras (current + 2 más)
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

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '38%', // zona pecho/cuello del sujeto
        transform: 'translateX(-50%)',
        width: '85%',
        textAlign: 'center',
        fontFamily: 'Inter, "SF Pro Display", -apple-system, sans-serif',
        fontWeight: 500,
        fontSize: 44,
        color: '#FFFFFF',
        // Sutil sombra para legibilidad sobre cualquier fondo (sin outline)
        textShadow:
          '0 2px 8px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.65)',
        letterSpacing: -0.2,
        lineHeight: 1.15,
        // Sentence case heredado del transcript (Whisper devuelve casing natural)
      }}
    >
      {text}
    </div>
  )
}
