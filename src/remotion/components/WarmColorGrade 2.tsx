/**
 * Color grade warm cinematic — aproximación al look de Diego García del Río.
 *
 * Estrategia: dos capas de overlay con `mix-blend-mode` distinto, lo que en CSS
 * imita lo que hacen las LUTs (afecta highlights vs shadows distinto).
 *
 * Capa 1 (overlay): naranja cálido sobre TODO → calienta los midtones.
 * Capa 2 (multiply): ámbar oscuro en sombras → da profundidad cinematográfica.
 *
 * Aplicar este componente ENCIMA del video.
 */
interface WarmColorGradeProps {
  /** Intensidad 0-1. Default 0.7 (matching playbook). */
  intensity?: number
}

export const WarmColorGrade: React.FC<WarmColorGradeProps> = ({ intensity = 0.7 }) => {
  const i = Math.max(0, Math.min(1, intensity))
  return (
    <>
      {/* Capa warm en midtones — soft-light suaviza, no satura demasiado */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(255, 165, 90, 1) 0%, rgba(255, 140, 70, 1) 60%, rgba(255, 110, 50, 1) 100%)',
          mixBlendMode: 'soft-light',
          opacity: 0.55 * i,
          pointerEvents: 'none',
        }}
      />
      {/* Capa muy sutil de overlay puro para potenciar warmth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 130, 60, 1)',
          mixBlendMode: 'overlay',
          opacity: 0.12 * i,
          pointerEvents: 'none',
        }}
      />
      {/* Sombras cálidas (multiply ámbar oscuro) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 60%, rgba(120, 60, 20, 1) 100%)',
          mixBlendMode: 'multiply',
          opacity: 0.18 * i,
          pointerEvents: 'none',
        }}
      />
    </>
  )
}
