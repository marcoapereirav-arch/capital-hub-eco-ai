import { AbsoluteFill, OffthreadVideo, staticFile, useVideoConfig } from 'remotion'
import { z } from 'zod'
import { VivenciaText } from '../components/VivenciaText'

export const MisionVivenciasPropsSchema = z.object({
  videoSrc: z.string().default('raw/parque-aereo-ai.mp4'),
})

export type MisionVivenciasProps = z.infer<typeof MisionVivenciasPropsSchema>

export const defaultMisionVivenciasProps: MisionVivenciasProps = {
  videoSrc: 'raw/parque-aereo-ai.mp4',
}

type Vivencia = { text: string; x: number; y: number }

// Distribución de 28 frases sobre 1080x1920, anclada a los grupos visibles
// del clip generado por Veo 3 (parque cenital con ~30 grupos en mantas).
const VIVENCIAS: Vivencia[] = [
  // Fila superior (4 grupos visibles)
  { text: 'mi hora\nfavorita', x: 200, y: 140 },
  { text: 'mejores\namigos', x: 720, y: 110 },
  { text: 'mudándose\npronto', x: 920, y: 240 },
  { text: 'comiendo\nsolo', x: 380, y: 230 },

  // Segunda fila
  { text: 'cotilleando', x: 560, y: 360 },
  { text: 'modo no\nmolestar', x: 220, y: 410 },
  { text: 'recién\nprometidos', x: 880, y: 430 },
  { text: 'matando\nel tiempo', x: 720, y: 510 },

  // Tercera fila — centro de gravedad
  { text: 'no quería\nestar solo', x: 420, y: 580 },
  { text: 'sentados más\ncerca de lo normal', x: 920, y: 640 },
  { text: 'poniéndose\nal día', x: 220, y: 690 },
  { text: 'rutina\nde siempre', x: 600, y: 740 },

  // Cuarta fila
  { text: 'riéndose\nde todo', x: 380, y: 870 },
  { text: 'la misma\nhistoria', x: 800, y: 880 },
  { text: 'pasándolo\nbien', x: 200, y: 940 },
  { text: 'conversación\nincómoda', x: 1000, y: 990 },

  // Quinta fila
  { text: 'perdido en\npensamientos', x: 560, y: 1040 },
  { text: 'primer\naniversario', x: 220, y: 1110 },
  { text: 'energía\nsin fin', x: 880, y: 1180 },
  { text: 'celebrando', x: 380, y: 1240 },

  // Sexta fila
  { text: 'perdiendo la\nnoción del tiempo', x: 600, y: 1340 },
  { text: 'necesitaba\naire', x: 200, y: 1380 },
  { text: 'cómodo en\nel silencio', x: 940, y: 1430 },
  { text: 'día libre', x: 400, y: 1490 },

  // Séptima fila — abajo
  { text: 'sin\npreocupaciones', x: 700, y: 1620 },
  { text: 'sin plan', x: 220, y: 1660 },
  { text: 'pensando qué\nviene ahora', x: 540, y: 1790 },
  { text: 'esperando\nrespuesta', x: 900, y: 1830 },
]

export const MisionVivencias: React.FC<MisionVivenciasProps> = ({ videoSrc }) => {
  const { width, height } = useVideoConfig()

  // Fade-in escalonado más rápido para 8s totales: las 28 frases entran en ~1s.
  const STAGGER_FRAMES = 1
  const FADE_FRAMES = 9
  const INITIAL_DELAY = 4

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
