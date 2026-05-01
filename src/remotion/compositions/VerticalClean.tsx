import { AbsoluteFill, OffthreadVideo, Sequence, useVideoConfig } from 'remotion'
import { z } from 'zod'
import { SubtitleKaraoke, type SubtitleWord } from '../components/SubtitleKaraoke'
import { WarmColorGrade } from '../components/WarmColorGrade'

/**
 * Composición Remotion para Variante 1 — Vertical Clean (estilo Diego).
 *
 * Recibe del pipeline:
 *  - URL del video fuente
 *  - segments[] de habla (sourceStart + duration + outputStart) ya post silence-trim + LLM-cuts
 *  - words[] palabras shifted al timeline output
 *  - rotationDegrees (0/90/180/270 — auto-detected via ffprobe)
 *  - colorGradeIntensity (0-1)
 *
 * Salida: video 9:16 1080×1920 con cortes + subs Diego + warm cinematic.
 */

export const VideoSegmentSchema = z.object({
  sourceStart: z.number(),
  duration: z.number(),
  outputStart: z.number(),
})

export const SubtitleWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
})

export const VerticalCleanPropsSchema = z.object({
  sourceVideoUrl: z.string(),
  segments: z.array(VideoSegmentSchema),
  words: z.array(SubtitleWordSchema),
  rotationDegrees: z.number().default(0),
  colorGradeIntensity: z.number().min(0).max(1).default(0.7),
})

export type VerticalCleanProps = z.infer<typeof VerticalCleanPropsSchema>

export const defaultVerticalCleanProps: VerticalCleanProps = {
  sourceVideoUrl: '',
  segments: [],
  words: [],
  rotationDegrees: 0,
  colorGradeIntensity: 0.7,
}

export const VerticalClean: React.FC<VerticalCleanProps> = ({
  sourceVideoUrl,
  segments,
  words,
  rotationDegrees,
  colorGradeIntensity,
}) => {
  const { fps } = useVideoConfig()

  // Para una rotación 90/270 el "frame" del video tras rotar tiene dimensiones swapped.
  // CSS transform rotate gira alrededor del centro pero NO ajusta dimensiones del bbox.
  // Solución: cuando rotamos 90 o 270, escalamos al inverso del aspect del canvas para
  // que tras la rotación el video llene el frame.
  const isPortraitRotation = rotationDegrees === 90 || rotationDegrees === 270
  // El video iPhone HEVC viene en bytes 1920x1080 (landscape). Si lo rotamos 90/270,
  // queremos que el lado largo (1920) sea la altura del canvas (1920). El video ya
  // ocupa eso. Los lados cortos (1080) cubren el ancho.
  // Como CSS rotate se aplica DESPUÉS del layout, el contenedor del video tiene que
  // tener width = canvasHeight y height = canvasWidth para que tras rotar coincida.
  const videoStyle: React.CSSProperties = isPortraitRotation
    ? {
        position: 'absolute',
        width: 1920,
        height: 1080,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) rotate(${rotationDegrees}deg)`,
        objectFit: 'cover',
      }
    : {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        objectFit: 'cover',
        transform: rotationDegrees !== 0 ? `rotate(${rotationDegrees}deg)` : undefined,
      }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* TRACK 1: video con cortes (cada segmento es un Sequence con startFrom) */}
      {segments.map((seg, idx) => {
        const startFrame = Math.round(seg.outputStart * fps)
        const durationInFrames = Math.max(1, Math.round(seg.duration * fps))
        return (
          <Sequence
            key={`seg-${idx}`}
            from={startFrame}
            durationInFrames={durationInFrames}
            layout="absolute-fill"
          >
            <OffthreadVideo
              src={sourceVideoUrl}
              startFrom={Math.round(seg.sourceStart * fps)}
              endAt={Math.round((seg.sourceStart + seg.duration) * fps)}
              style={videoStyle}
              muted={false}
            />
          </Sequence>
        )
      })}

      {/* TRACK 2: color grade warm (encima del video, debajo de los subs) */}
      <WarmColorGrade intensity={colorGradeIntensity} />

      {/* TRACK 3: subtítulos karaoke */}
      <SubtitleKaraoke words={words as SubtitleWord[]} maxVisibleWords={3} />
    </AbsoluteFill>
  )
}
