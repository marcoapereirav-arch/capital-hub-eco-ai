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
      {/* Capa warm en midtones — soft-light, naranja suave */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(255, 200, 155, 1) 0%, rgba(255, 180, 140, 1) 60%, rgba(245, 160, 120, 1) 100%)',
          mixBlendMode: 'soft-light',
          opacity: 0.30 * i,
          pointerEvents: 'none',
        }}
      />
      {/* Capa muy sutil de overlay puro para potenciar warmth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 160, 110, 1)',
          mixBlendMode: 'overlay',
          opacity: 0.05 * i,
          pointerEvents: 'none',
        }}
      />
      {/* Sombras cálidas (multiply ámbar oscuro) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 60%, rgba(140, 90, 55, 1) 100%)',
          mixBlendMode: 'multiply',
          opacity: 0.10 * i,
          pointerEvents: 'none',
        }}
      />
    </>
  )
}
