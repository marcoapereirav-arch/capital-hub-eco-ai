import { cn } from "@/lib/utils"

/**
 * Contenedor estándar de página del OS.
 *
 * Garantiza ancho + padding + spacing consistentes entre TODAS las páginas
 * y sub-pestañas. Evita que el layout "baile" al cambiar de sección.
 *
 * Uso:
 *   <PageContainer>...</PageContainer>          // ancho normal (max-w-7xl ≈ 1280px)
 *   <PageContainer wide>...</PageContainer>     // full width (para kanbans, gráficas)
 *   <PageContainer narrow>...</PageContainer>   // ancho leído cómodo (max-w-4xl ≈ 896px)
 *
 * El título de la sección lo pone <TopBar>, derivado de la ruta. No hace
 * falta escribirlo en cada página.
 */
export function PageContainer({
  children,
  className,
  wide = false,
  narrow = false,
}: {
  children: React.ReactNode
  className?: string
  wide?: boolean
  narrow?: boolean
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full py-4 md:py-6 space-y-4",
        // El margen lateral respeta el notch cuando el telefono esta girado.
        // Sin esto, en horizontal el contenido de TODAS las pantallas se mete
        // debajo de la muesca lateral y se pierde texto por el borde.
        "px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:px-6",
        // Reserva el sitio de la barra de abajo del telefono. Sin esto, la
        // ultima tarjeta o el ultimo boton de cada pantalla quedan tapados por
        // el menu y no se pueden tocar. Va aqui una sola vez y vale para las 35
        // pantallas; antes estaba escrito a mano en 12 sitios sueltos.
        // NO se usa la clase `pb-mobile-nav`: esa pone el relleno a CERO en
        // escritorio y se comeria el margen inferior de la pantalla grande.
        //
        // La cuenta en telefono: 3.5rem de la barra de abajo + la franja de
        // gestos + 3.5rem del boton verde flotante + 1rem de aire. Sin la parte
        // del boton, este tapa la ultima fila de cada pantalla: se comprobo en
        // Webs (tapaba el lapiz de editar) y en el Dashboard (tapaba las cifras).
        "pb-[calc(7rem+env(safe-area-inset-bottom)+1rem)] md:pb-6",
        wide ? "max-w-full" : narrow ? "max-w-4xl" : "max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  )
}
