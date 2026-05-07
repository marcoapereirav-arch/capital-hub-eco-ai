import { interpolate, useCurrentFrame } from 'remotion'

type Props = {
  text: string
  x: number
  y: number
  frameWidth: number
  frameHeight: number
  delayFrames: number
  fadeFrames: number
}

export const VivenciaText: React.FC<Props> = ({
  text,
  x,
  y,
  delayFrames,
  fadeFrames,
}) => {
  const frame = useCurrentFrame()

  const opacity = interpolate(
    frame,
    [delayFrames, delayFrames + fadeFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  const translateY = interpolate(
    frame,
    [delayFrames, delayFrames + fadeFrames],
    [6, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${translateY}px)`,
        opacity,
        color: '#FFFFFF',
        fontFamily:
          '"Inter Tight", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
        fontWeight: 700,
        fontSize: 32,
        lineHeight: 1.05,
        letterSpacing: '-0.01em',
        textAlign: 'center',
        whiteSpace: 'pre-line',
        textShadow:
          '0 1px 2px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.45), 0 0 1px rgba(0,0,0,0.7)',
        pointerEvents: 'none',
      }}
    >
      {text}
    </div>
  )
}
