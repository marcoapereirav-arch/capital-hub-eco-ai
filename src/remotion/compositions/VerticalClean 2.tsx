import { AbsoluteFill, OffthreadVideo, Sequence, useVideoConfig } from 'remotion'
import { z } from 'zod'
import { CaptionDiego } from '../components/CaptionDiego'
import { WarmColorGrade } from '../components/WarmColorGrade'

/**
 * Composición Variante 1 — Vertical Clean (estilo Diego García del Río).
 *
 * v2: refactor usando @remotion/captions (más robusto que mi karaoke manual).
 * El video viene PRE-ROTADO por ffmpeg (rotación bakeada en pixels), así que
 * aquí no aplicamos transform CSS — confiamos en el archivo ya orientado.
 *
 * Inputs:
 *  - sourceVideoUrl: URL del video YA pre-procesado (rotación aplicada)
 *  - segments: islas de habla con outputStart/duration (post silence-trim + LLM-cuts)
 *  - words: palabras con timestamps en el output timeline (post silence-trim)
 *  - colorGradeIntensity: 0-1
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
  colorGradeIntensity,
}) => {
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* TRACK 1: video con cortes (cada segmento = un Sequence con startFrom) */}
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
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              muted={false}
            />
          </Sequence>
        )
      })}

      {/* TRACK 2: color grade warm (encima del video, debajo de los subs) */}
      <WarmColorGrade intensity={colorGradeIntensity} />

      {/* TRACK 3: subtítulos estilo Diego con @remotion/captions */}
      <CaptionDiego words={words} />
    </AbsoluteFill>
  )
}
