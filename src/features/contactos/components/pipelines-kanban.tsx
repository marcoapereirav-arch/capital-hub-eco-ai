"use client"

import { useEffect, useMemo, useState } from "react"
import { MoveRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { TagChips } from "@/features/tags/components/tag-chips"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FONT, stageTone } from "@/features/crm/lib/brand"

type Contact = {
  id: string
  full_name: string
  email: string
  phone: string | null
  stage: string | null
  products: string[]
  total_revenue: number
}

type Stage = { value: string; label: string }

type TagsPorContacto = Map<string, import("@/features/tags/types/tag").Tag[]>

export function PipelinesKanban({
  contacts,
  stages,
  onUpdateStage,
  onSelect,
  tagsByContact,
}: {
  contacts: Contact[]
  stages: Stage[]
  onUpdateStage: (contactId: string, newStage: string) => void
  onSelect: (id: string) => void
  tagsByContact?: TagsPorContacto
}) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)
  const [columnaActiva, setColumnaActiva] = useState<string | null>(stages[0]?.value ?? null)
  // En telefono mover una tarjeta NO se hace arrastrando: el dedo que arrastra
  // pelea con el dedo que desplaza. Cada tarjeta abre una hoja con "Mover a".
  const [moviendo, setMoviendo] = useState<Contact | null>(null)

  useEffect(() => {
    if (stages.length === 0) return
    if (!stages.some((s) => s.value === columnaActiva)) setColumnaActiva(stages[0].value)
  }, [stages, columnaActiva])

  const grouped = useMemo(() => {
    const map = new Map<string, Contact[]>()
    for (const s of stages) map.set(s.value, [])
    for (const c of contacts) {
      const stage = c.stage ?? "lead"
      const arr = map.get(stage) ?? []
      arr.push(c)
      map.set(stage, arr)
    }
    return map
  }, [contacts, stages])

  const listaActiva = grouped.get(columnaActiva ?? "") ?? []

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ------------ TELEFONO: una columna cada vez ------------ */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        {/* Tira de columnas. Es el UNICO deslizamiento lateral permitido, y vive
            dentro de su propia caja: nunca arrastra la pagina entera. */}
        <div className="flex shrink-0 snap-x gap-2 overflow-x-auto px-4 pb-2">
          {stages.map((s) => {
            const total = (grouped.get(s.value) ?? []).length
            const activa = columnaActiva === s.value
            return (
              <button
                key={s.value}
                onClick={() => setColumnaActiva(s.value)}
                aria-pressed={activa}
                className={cn(
                  "h-11 shrink-0 snap-start whitespace-nowrap rounded-[4px] border px-3 text-[14px] transition-colors",
                  activa
                    ? "border-primary/30 bg-primary/10 font-semibold text-primary"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {s.label} <span className="tabular-nums">{total}</span>
              </button>
            )
          })}
        </div>

        {/* El hueco de abajo se calcula igual que en PageContainer: esta columna NO
            pasa por el, su altura llega hasta el borde de la ventana y la barra de
            abajo (56 puntos mas la franja de gestos) taparia la ultima tarjeta y su
            boton "Mover a...". */}
        <div className="no-overscroll min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-[calc(3.5rem+var(--sab)+1rem)]">
          {listaActiva.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
              <h3 className="text-[17px] font-semibold text-foreground">Esta etapa está vacía</h3>
              <p className="max-w-[38ch] text-[14px] text-muted-foreground">
                Los contactos que muevas a esta etapa aparecen aquí.
              </p>
            </div>
          ) : (
            listaActiva.map((c) => (
              <div
                key={c.id}
                className="overflow-hidden rounded-[4px] border border-border bg-card"
              >
                <button
                  onClick={() => onSelect(c.id)}
                  className="flex min-h-[56px] w-full flex-col gap-1 p-3 text-left active:bg-popover"
                >
                  <span className="truncate text-[15px] font-semibold text-foreground">{c.full_name}</span>
                  <span className="truncate text-[14px] text-muted-foreground">{c.email}</span>
                  {tagsByContact && (tagsByContact.get(c.id)?.length ?? 0) > 0 && (
                    <span className="block pt-0.5">
                      <TagChips tags={tagsByContact.get(c.id) ?? []} max={3} size="xs" />
                    </span>
                  )}
                  {c.products.length > 0 && (
                    <span className="flex flex-wrap gap-1 pt-0.5">
                      {c.products.map((p) => (
                        <span
                          key={p}
                          className="rounded-[3px] border border-border px-1.5 py-0.5 text-[14px] text-muted-foreground"
                        >
                          {p}
                        </span>
                      ))}
                    </span>
                  )}
                  {c.total_revenue > 0 && (
                    <span className="pt-0.5 text-[14px] font-semibold tabular-nums text-primary">
                      {Math.round(c.total_revenue).toLocaleString("es-ES")} EUR
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setMoviendo(c)}
                  className="flex h-11 w-full items-center gap-2 border-t border-border px-3 text-left text-[14px] font-semibold text-muted-foreground active:bg-popover"
                >
                  <MoveRight className="h-4 w-4" /> Mover a…
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ------------ ORDENADOR: el tablero en fila ------------ */}
      {/* El desplazamiento lateral vive AQUI. El padding va al contenido interior para
          que ambos extremos respeten margen al llegar al final. */}
      <div className="no-overscroll hidden min-h-0 flex-1 overflow-x-auto overflow-y-hidden md:block">
        <div className="flex h-full gap-3 pb-1 pl-4 md:pl-6">
          {stages.map((s) => {
            const list = grouped.get(s.value) ?? []
            const totalRev = list.reduce((acc, c) => acc + (c.total_revenue ?? 0), 0)
            const isOver = overStage === s.value
            const tone = stageTone(s.value)
            return (
              <div
                key={s.value}
                onDragOver={(e) => { e.preventDefault(); setOverStage(s.value) }}
                onDragLeave={() => setOverStage(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData("text/contact-id")
                  if (id) onUpdateStage(id, s.value)
                  setOverStage(null)
                  setDragging(null)
                }}
                className={cn(
                  "flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-[8px] border bg-card transition-colors",
                  isOver
                    ? "border-primary/30 bg-primary/10"
                    : "border-border"
                )}
              >
                {/* Linea de color del stage. Es lo unico que distingue una columna de otra:
                    gris que se aclara segun avanza el funnel, VERDE en la venta, ambar en el
                    aviso. Antes cada columna llevaba un neon distinto (cian, violeta, naranja),
                    que no significaba nada y no esta en el brandkit. */}
                <div
                  aria-hidden
                  className="h-[3px] w-full shrink-0"
                  style={{ backgroundColor: tone.rule }}
                />

                <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2.5">
                  <span className="truncate text-[14px] font-semibold text-foreground">{s.label}</span>
                  <span className="flex shrink-0 items-baseline gap-2">
                    <span className="md:text-[13px] tabular-nums text-muted-foreground">{list.length}</span>
                    {totalRev > 0 && (
                      <span className="md:text-[13px] font-semibold tabular-nums text-primary">
                        {Math.round(totalRev).toLocaleString("es-ES")} EUR
                      </span>
                    )}
                  </span>
                </div>

                {/* Lista de fichas con SCROLL VERTICAL propio. */}
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-2 pb-2">
                  {list.length === 0 ? (
                    <p className="px-1.5 py-3 md:text-[13px] text-muted-foreground">
                      {isOver ? "Suelta aquí" : "Sin contactos"}
                    </p>
                  ) : (
                    list.map((c) => (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/contact-id", c.id)
                          e.dataTransfer.effectAllowed = "move"
                          setDragging(c.id)
                        }}
                        onDragEnd={() => { setDragging(null); setOverStage(null) }}
                        onClick={() => onSelect(c.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            onSelect(c.id)
                          }
                        }}
                        className={cn(
                          "cursor-grab rounded-[4px] border border-border bg-popover p-2.5",
                          "transition-colors hover:border-foreground/20 active:cursor-grabbing",
                          "focus:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/45",
                          dragging === c.id && "opacity-50"
                        )}
                      >
                        <p className="truncate text-[14px] font-semibold text-foreground">{c.full_name}</p>
                        <p className="truncate md:text-[13px] text-muted-foreground">{c.email}</p>
                        {tagsByContact && (tagsByContact.get(c.id)?.length ?? 0) > 0 && (
                          <div className="mt-1.5">
                            <TagChips tags={tagsByContact.get(c.id) ?? []} max={3} size="xs" />
                          </div>
                        )}
                        {c.products.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {c.products.map((p) => (
                              <span
                                key={p}
                                className="rounded-[3px] border border-border px-1.5 py-0.5 md:text-[12px] text-muted-foreground"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                        {c.total_revenue > 0 && (
                          <p className="mt-1.5 md:text-[13px] font-semibold tabular-nums text-primary">
                            {Math.round(c.total_revenue).toLocaleString("es-ES")} EUR
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
          {/* Espaciador: garantiza margen derecho al llegar al final del tablero. En flex
              + overflow-x-auto el padding-right del contenedor NO se respeta en el extremo
              del desplazamiento. */}
          <div aria-hidden className="w-4 shrink-0 md:w-8" />
        </div>
      </div>

      {/* Hoja "Mover a" del telefono */}
      <Sheet open={moviendo !== null} onOpenChange={(o) => { if (!o) setMoviendo(null) }}>
        <SheetContent
          side="bottom"
          style={{ fontFamily: FONT }}
          className="max-h-[85dvh] w-full gap-0 overflow-y-auto rounded-t-[8px] border-border bg-card pb-safe-4 md:hidden"
        >
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-foreground/20" />
          {/* pr-14: el boton de cerrar de la hoja mide 44 puntos en telefono y vive
              en la esquina de arriba a la derecha. Sin este hueco, un nombre largo
              se mete por debajo de la X. */}
          <SheetHeader className="px-4 pr-14">
            <SheetTitle className="text-[17px] font-semibold text-foreground">
              Mover {moviendo?.full_name ?? ""}
            </SheetTitle>
          </SheetHeader>
          <div className="pb-2">
            {stages.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  const c = moviendo
                  setMoviendo(null)
                  if (c) onUpdateStage(c.id, s.value)
                }}
                disabled={moviendo?.stage === s.value}
                className="flex h-12 w-full items-center px-4 text-left text-[15px] text-foreground active:bg-popover disabled:opacity-40"
              >
                {s.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
