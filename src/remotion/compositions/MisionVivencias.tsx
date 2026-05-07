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

// 28 frases ancladas sobre los grupos visibles en el clip Veo 3 v2 (parque
// cenital con cámara fija, ~30 grupos en mantas, edificios al fondo).
// Coordenadas calibradas mirando el frame medio (t=4s) del clip.
const VIVENCIAS: Vivencia[] = [
  // Fila lejana (grupos pequeños arriba, debajo de los edificios y árboles)
  { text: 'mejores\namigos', x: 230, y: 320 },
  { text: 'mi hora\nfavorita', x: 470, y: 290 },
  { text: 'mudándose\npronto', x: 740, y: 320 },
  { text: 'comiendo\nsolo', x: 970, y: 380 },

  // Segunda fila
  { text: 'cotilleando', x: 200, y: 460 },
  { text: 'modo no\nmolestar', x: 420, y: 470 },
  { text: 'recién\nprometidos', x: 660, y: 460 },
  { text: 'matando\nel tiempo', x: 880, y: 480 },

  // Fila tercera
  { text: 'rutina\nde siempre', x: 280, y: 620 },
  { text: 'no quería\nestar solo', x: 500, y: 600 },
  { text: 'poniéndose\nal día', x: 700, y: 640 },
  { text: 'sentados más\ncerca de lo normal', x: 940, y: 660 },

  // Cuarta — zona media
  { text: 'pasándolo\nbien', x: 200, y: 800 },
  { text: 'riéndose\nde todo', x: 420, y: 800 },
  { text: 'la misma\nhistoria', x: 620, y: 810 },
  { text: 'conversación\nincómoda', x: 880, y: 850 },

  // Quinta
  { text: 'primer\naniversario', x: 250, y: 980 },
  { text: 'perdido en\npensamientos', x: 520, y: 990 },
  { text: 'energía\nsin fin', x: 760, y: 1000 },
  { text: 'celebrando', x: 940, y: 1040 },

  // Sexta
  { text: 'necesitaba\naire', x: 220, y: 1180 },
  { text: 'perdiendo la\nnoción del tiempo', x: 520, y: 1200 },
  { text: 'cómodo en\nel silencio', x: 820, y: 1220 },

  // Séptima — primer plano grupos cercanos
  { text: 'día libre', x: 320, y: 1430 },
  { text: 'sin\npreocupaciones', x: 700, y: 1450 },

  // Octava — abajo último plano
  { text: 'sin plan', x: 260, y: 1660 },
  { text: 'pensando qué\nviene ahora', x: 580, y: 1730 },
  { text: 'esperando\nrespuesta', x: 880, y: 1820 },
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
