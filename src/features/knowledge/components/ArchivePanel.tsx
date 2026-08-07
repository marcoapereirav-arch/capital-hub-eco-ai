'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { cn } from '@/lib/utils'
import { getArchived, restoreSop, purgeSop } from '@/actions/knowledge'
import { QUADRANT_LABEL, type Quadrant } from '@/features/knowledge/services/quadrants'

type ArchivedDoc = { id: string; slug: string; title: string; quadrant: string; subfolder: string | null; archived_at: string }

/**
 * El Archivador. Hoja inferior en telefono, cajon por la derecha en escritorio:
 * el lado va FIJO y el cambio se hace con clases. Antes era un panel absoluto
 * pegado al borde derecho que en un telefono tapaba la pantalla entera y cuyo
 * final quedaba debajo de la barra de abajo.
 */
export function ArchivePanel({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [items, setItems] = useState<ArchivedDoc[] | null>(null)
  const [, start] = useTransition()

  useEffect(() => {
    getArchived()
      .then((d) => setItems(d as ArchivedDoc[]))
      .catch(() => setItems([]))
  }, [])

  function refresh() {
    getArchived().then((d) => setItems(d as ArchivedDoc[])).catch(() => {})
    router.refresh()
  }

  function onRestore(id: string) {
    setItems((prev) => prev?.filter((x) => x.id !== id) ?? prev)
    start(async () => {
      try {
        await restoreSop(id)
        refresh()
      } catch (e) {
        alert((e as Error).message)
        refresh()
      }
    })
  }

  function onPurge(id: string, title: string) {
    if (!confirm(`Borrar DEFINITIVAMENTE "${title}"? Esto sí es irreversible.`)) return
    setItems((prev) => prev?.filter((x) => x.id !== id) ?? prev)
    start(async () => {
      try {
        await purgeSop(id)
        refresh()
      } catch (e) {
        alert((e as Error).message)
        refresh()
      }
    })
  }

  return (
    <Sheet
      open
      onOpenChange={(abierto) => {
        if (!abierto) onClose()
      }}
    >
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className={cn(
          'rounded-t-xl',
          // Las clases del kit para el lado inferior llevan el selector `data-[side=bottom]`,
          // que pesa mas que un `md:` suelto y lo gana. Por eso el escritorio repite la
          // condicion del lado: si no, el cajon sale por la IZQUIERDA y tapa la barra lateral.
          'md:data-[side=bottom]:inset-y-0 md:right-0 md:data-[side=bottom]:left-auto md:data-[side=bottom]:h-full md:data-[side=bottom]:max-h-none md:w-full md:max-w-md md:border-l md:pb-0',
        )}
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader>
          <p className="text-sm font-semibold text-primary">Archivador</p>
          <SheetTitle className="text-[17px] font-semibold">Documentos borrados</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-safe-4">
          {items === null ? (
            <div className="relative min-h-[160px]">
              <LoadingScreen fullscreen={false} className="absolute inset-0" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <h3 className="text-[17px] font-semibold text-foreground">El archivador está vacío.</h3>
              <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                Lo que borres desde el Knowledge cae aquí y se puede recuperar.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((it) => (
                <li key={it.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] text-foreground">{it.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {QUADRANT_LABEL[it.quadrant as Quadrant] ?? it.quadrant}
                      {it.subfolder ? ` › ${it.subfolder}` : ''} ·{' '}
                      {new Date(it.archived_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRestore(it.id)}
                      className="h-11 flex-1 rounded-lg border border-primary/30 px-3 text-[15px] font-semibold text-primary transition-colors active:bg-primary/10 md:h-9"
                    >
                      Restaurar
                    </button>
                    <button
                      onClick={() => onPurge(it.id, it.title)}
                      className="h-11 shrink-0 rounded-lg border border-destructive/30 px-3 text-[15px] text-destructive transition-colors active:bg-destructive/10 md:h-9"
                    >
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
