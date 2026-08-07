"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { PipelinesPage } from "./pipelines-page"

/**
 * Gestor de pipelines DENTRO del entorno actual (no se navega a otra pagina).
 *
 * Por que aqui y no en una pagina:
 *   El usuario configura pipelines en el contexto del CRM (kanban o lista),
 *   sin perder de vista los contactos. Configurar y volver = 1 toque.
 *
 * El lado NO se decide con JavaScript: `useIsMobile()` devuelve false hasta que
 * monta, asi que se pintaria primero un cajon lateral y despues saltaria abajo.
 * Se deja `side="bottom"` fijo y el ordenador se ajusta con clases md:.
 */
export function PipelinesManagerDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="bottom"
        className={
          // El `!` no es adorno: la base de sheet.tsx pinta el lado inferior con
          // `data-[side=bottom]:...`, que compila como `.clase[data-side=bottom]` y
          // pesa mas que cualquier clase de una sola palabra. Sin el, ni la pantalla
          // entera del telefono ni el cajon del ordenador llegan a aplicarse.
          // TELEFONO: hoja a pantalla completa. El gestor tiene lista + detalle, y
          // con media pantalla no se ve nada de las dos.
          "h-[100dvh]! max-h-[100dvh]! w-full gap-0 rounded-t-xl " +
          // ORDENADOR: cajon ancho por la derecha, con las mismas clases y cero JavaScript.
          "md:inset-y-0! md:right-0! md:left-auto! md:h-full! md:max-h-none! md:w-[52rem] md:max-w-[52rem] md:rounded-l-xl md:border-l"
        }
      >
        {/* La agarradera es lo que hace que se lea como hoja y no como error */}
        <div className="mx-auto mt-1 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />
        {/* pr-14: el boton de cerrar de la hoja mide 44 puntos en telefono y vive en
            la esquina de arriba a la derecha. Sin este hueco, la descripcion se mete
            por debajo de la X. */}
        <SheetHeader className="shrink-0 px-4 pr-14 md:px-6">
          <SheetTitle className="text-[17px] font-semibold">Gestor de pipelines</SheetTitle>
          <SheetDescription>Crea, edita y reordena pipelines y sus stages.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-safe-4 md:px-6">
          <PipelinesPage hideHeader />
        </div>
      </SheetContent>
    </Sheet>
  )
}
