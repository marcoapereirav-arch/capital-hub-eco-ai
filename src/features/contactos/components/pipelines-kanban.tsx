"use client"

import { useEffect, useMemo, useState } from "react"
import { Euro, MoveRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { TagChips } from "@/features/tags/components/tag-chips"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { bordeDeStage } from "./stage-chip"

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
      {/* ============ TELEFONO: una columna cada vez ============ */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        {/* Tira de columnas. Es el UNICO deslizamiento lateral permitido, y vive
            dentro de su propia caja: nunca arrastra la pagina entera. */}
        <div className="flex shrink-0 snap-x gap-1 overflow-x-auto px-4 pb-2">
          {stages.map((s) => {
            const total = (grouped.get(s.value) ?? []).length
            return (
              <button
                key={s.value}
                onClick={() => setColumnaActiva(s.value)}
                className={cn(
                  "h-11 shrink-0 snap-start rounded-lg px-3 text-[15px] whitespace-nowrap",
                  columnaActiva === s.value
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "bg-card text-muted-foreground"
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
        <div className="no-overscroll min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)]">
          {listaActiva.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
              <h3 className="text-[17px] font-semibold text-foreground">Esta etapa está vacía</h3>
              <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                Los contactos que muevas a esta etapa aparecen aquí.
              </p>
            </div>
          ) : (
            listaActiva.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card">
                <button
                  onClick={() => onSelect(c.id)}
                  className="flex min-h-[56px] w-full flex-col gap-1 p-3 text-left active:bg-muted"
                >
                  <span className="truncate text-[15px] font-medium text-foreground">{c.full_name}</span>
                  <span className="truncate text-sm text-muted-foreground">{c.email}</span>
                  {tagsByContact && (tagsByContact.get(c.id)?.length ?? 0) > 0 && (
                    <span className="block pt-0.5">
                      <TagChips tags={tagsByContact.get(c.id) ?? []} max={3} size="xs" />
                    </span>
                  )}
                  {c.products.length > 0 && (
                    <span className="flex flex-wrap gap-1 pt-0.5">
                      {c.products.map((p) => (
                        <span key={p} className="rounded-sm border border-border px-1.5 py-0.5 text-sm text-muted-foreground">
                          {p}
                        </span>
                      ))}
                    </span>
                  )}
                  {c.total_revenue > 0 && (
                    <span className="flex items-center gap-1 pt-0.5 text-sm tabular-nums text-primary">
                      <Euro className="h-3.5 w-3.5" />
                      {c.total_revenue.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setMoviendo(c)}
                  className="flex h-11 w-full items-center gap-1.5 border-t border-border px-3 text-left text-[15px] text-muted-foreground active:bg-muted"
                >
                  <MoveRight className="h-4 w-4" /> Mover a…
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============ ORDENADOR: el tablero en fila ============ */}
      <div className="no-overscroll hidden min-h-0 flex-1 overflow-x-auto overflow-y-hidden md:block">
        <div className="flex h-full gap-3 pb-1 pl-4 md:pl-6">
          {stages.map((s) => {
            const list = grouped.get(s.value) ?? []
            const totalRev = list.reduce((acc, c) => acc + (c.total_revenue ?? 0), 0)
            const isOver = overStage === s.value
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
                  "flex h-full w-72 shrink-0 flex-col rounded-lg border bg-card/40 p-2 transition-colors",
                  bordeDeStage(s.value),
                  isOver && "bg-card ring-2 ring-ring"
                )}
              >
                <div className="mb-2 flex shrink-0 items-center justify-between px-1.5">
                  <div className="min-w-0 truncate text-sm font-semibold text-foreground">{s.label}</div>
                  <div className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {list.length}
                    {totalRev > 0 && <span className="ml-2 text-primary">{Math.round(totalRev)}€</span>}
                  </div>
                </div>

                {/* Lista de cards con SCROLL VERTICAL propio. */}
                <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                  {list.length === 0 ? (
                    <div className="px-1.5 py-2 text-sm text-muted-foreground">Vacío</div>
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
                        className={cn(
                          "cursor-grab rounded-lg border border-border bg-card p-2 text-sm shadow-sm transition-colors hover:border-foreground/40 active:cursor-grabbing",
                          dragging === c.id && "opacity-50"
                        )}
                      >
                        <div className="truncate font-medium text-foreground">{c.full_name}</div>
                        <div className="truncate text-sm text-muted-foreground">{c.email}</div>
                        {tagsByContact && (tagsByContact.get(c.id)?.length ?? 0) > 0 && (
                          <div className="mt-1">
                            <TagChips tags={tagsByContact.get(c.id) ?? []} max={3} size="xs" />
                          </div>
                        )}
                        {c.products.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.products.map((p) => (
                              <span key={p} className="rounded-sm border border-border px-1 py-0.5 text-sm text-muted-foreground md:text-xs">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                        {c.total_revenue > 0 && (
                          <div className="mt-1 flex items-center gap-0.5 text-sm tabular-nums text-primary">
                            <Euro className="h-3 w-3" />
                            {c.total_revenue.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
          {/* Espaciador: garantiza margen derecho al llegar al final del tablero.
              En flex + overflow-x-auto el padding-right del contenedor no se
              respeta en el extremo del desplazamiento. */}
          <div aria-hidden className="w-4 shrink-0 md:w-8" />
        </div>
      </div>

      {/* Hoja "Mover a" del telefono */}
      <Sheet open={moviendo !== null} onOpenChange={(o) => { if (!o) setMoviendo(null) }}>
        <SheetContent side="bottom" className="max-h-[85dvh] w-full gap-0 overflow-y-auto rounded-t-xl pb-safe-4 md:hidden">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border" />
          {/* pr-14: el boton de cerrar de la hoja mide 44 puntos en telefono y vive
              en la esquina de arriba a la derecha. Sin este hueco, un nombre largo
              se mete por debajo de la X. */}
          <SheetHeader className="px-4 pr-14">
            <SheetTitle className="text-[17px] font-semibold">
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
                className="flex h-12 w-full items-center px-4 text-left text-[15px] text-foreground active:bg-muted disabled:opacity-40"
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
