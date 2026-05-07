import { AbsoluteFill, OffthreadVideo, staticFile, useVideoConfig } from 'remotion'
import { z } from 'zod'
import { VivenciaText } from '../components/VivenciaText'

export const MisionVivenciasPropsSchema = z.object({
  videoSrc: z.string().default('raw/parque-aereo.mp4'),
})

export type MisionVivenciasProps = z.infer<typeof MisionVivenciasPropsSchema>

export const defaultMisionVivenciasProps: MisionVivenciasProps = {
  videoSrc: 'raw/parque-aereo.mp4',
}

type Vivencia = { text: string; x: number; y: number }

// Distribución de 28 frases sobre 1080x1920.
// Posiciones pensadas para no chocar entre sí (separación mínima ~140px) y
// cubrir el frame de forma orgánica, no en grilla rígida.
const VIVENCIAS: Vivencia[] = [
  { text: 'perdido en\npensamientos', x: 540, y: 230 },
  { text: 'comiendo\nsolo', x: 220, y: 320 },
  { text: 'mudándose\npronto', x: 870, y: 360 },
  { text: 'cotilleando', x: 540, y: 470 },
  { text: 'matando\nel tiempo', x: 200, y: 540 },
  { text: 'recién\nprometidos', x: 870, y: 580 },
  { text: 'no quería\nestar solo', x: 540, y: 690 },
  { text: 'poniéndose\nal día', x: 215, y: 760 },
  { text: 'sentados más\ncerca de lo normal', x: 870, y: 800 },
  { text: 'riéndose\nde todo', x: 540, y: 920 },
  { text: 'primer\naniversario', x: 200, y: 990 },
  { text: 'la misma\nhistoria', x: 870, y: 1030 },
  { text: 'perdiendo la\nnoción del tiempo', x: 540, y: 1140 },
  { text: 'necesitaba\naire', x: 215, y: 1210 },
  { text: 'conversación\nincómoda', x: 870, y: 1250 },
  { text: 'día libre', x: 540, y: 1360 },
  { text: 'energía\nsin fin', x: 220, y: 1430 },
  { text: 'pasándolo\nbien', x: 875, y: 1470 },
  { text: 'sin\npreocupaciones', x: 540, y: 1580 },
  { text: 'cómodo en\nel silencio', x: 215, y: 1650 },
  { text: 'sin plan', x: 870, y: 1690 },
  { text: 'pensando qué\nviene ahora', x: 540, y: 1790 },
  { text: 'modo no\nmolestar', x: 220, y: 175 },
  { text: 'rutina\nde siempre', x: 875, y: 200 },
  { text: 'celebrando', x: 410, y: 1880 },
  { text: 'esperando\nrespuesta', x: 670, y: 1860 },
  { text: 'mejores\namigos', x: 870, y: 145 },
  { text: 'mi hora\nfavorita', x: 215, y: 110 },
]

export const MisionVivencias: React.FC<MisionVivenciasProps> = ({ videoSrc }) => {
  const { width, height } = useVideoConfig()

  // Fade-in escalonado: cada texto aparece con 1.5 frames de delay extra,
  // duración del fade = 9 frames (~300ms a 30fps). Empieza tras 6f iniciales.
  const STAGGER_FRAMES = 1.5
  const FADE_FRAMES = 9
  const INITIAL_DELAY = 6

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Capa video: el drone shot horizontal escalado para llenar 9:16 con crop centrado */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <OffthreadVideo
          src={staticFile(videoSrc)}
          style={{
            position: 'absolute',
            width: 'auto',
            height: '100%',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>

      {/* Vignette muy suave para legibilidad de los textos */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Capa de textos */}
      {VIVENCIAS.map((v, i) => (
        <VivenciaText
          key={i}
          text={v.text}
          x={v.x}
          y={v.y}
          frameWidth={width}
          frameHeight={height}
          delayFrames={INITIAL_DELAY + i * STAGGER_FRAMES}
          fadeFrames={FADE_FRAMES}
        />
      ))}
    </AbsoluteFill>
  )
}
