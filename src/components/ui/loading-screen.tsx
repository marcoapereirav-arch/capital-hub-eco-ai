import { cn } from "@/lib/utils"

/**
 * Efecto de carga OFICIAL de Capital Hub. Úsalo SIEMPRE que algo cargue
 * (rutas, secciones, vídeos, fetches). Brandkit: fondo #0F0F12, anillo monocromo
 * girando + monograma "CH" pulsante. Respeta prefers-reduced-motion (motion-safe).
 *
 * - fullscreen (default): ocupa toda la pantalla (para app/loading.tsx y page loads).
 * - fullscreen={false}: rellena su contenedor (para secciones/vídeo: añade `absolute inset-0`).
 */
export function LoadingScreen({
  fullscreen = true,
  className,
}: {
  fullscreen?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center bg-[#0F0F12]",
        fullscreen && "min-h-[100dvh]",
        className,
      )}
      role="status"
      aria-label="Cargando"
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-[#2A2D34]" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#F5F6F7] motion-safe:animate-spin" />
        <span
          className="text-[13px] font-semibold tracking-tight text-white motion-safe:animate-pulse"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          CH
        </span>
      </div>
    </div>
  )
}
