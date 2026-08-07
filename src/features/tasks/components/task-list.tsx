"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { PersonChip, PriorityChip, StatusChip } from "./task-chips"
import { nombreDe, type OsUser, type Task } from "../types/task"

/** Ninguna lista del OS se pinta entera. Maximo 20 por pagina. */
const POR_PAGINA = 20

export function TaskList({
  tasks,
  users,
  claveDeFiltros,
  onOpen,
  onToggleDone,
}: {
  tasks: Task[]
  users: OsUser[]
  /** Cambia cuando cambian filtros/orden: la paginacion vuelve a la primera pagina. */
  claveDeFiltros: string
  onOpen: (id: string) => void
  onToggleDone: (task: Task) => void
}) {
  const [pagina, setPagina] = useState(1)
  const arriba = useRef<HTMLDivElement | null>(null)

  const paginas = Math.max(1, Math.ceil(tasks.length / POR_PAGINA))

  useEffect(() => {
    setPagina(1)
  }, [claveDeFiltros])

  // Si un filtro deja menos paginas de las que habia, no se ensena una pagina en blanco.
  useEffect(() => {
    setPagina((p) => Math.min(p, paginas))
  }, [paginas])

  const visibles = useMemo(
    () => tasks.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA),
    [tasks, pagina]
  )

  const irA = (p: number) => {
    setPagina(p)
    arriba.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }

  if (!tasks.length) return null

  const desde = (pagina - 1) * POR_PAGINA + 1
  const hasta = Math.min(pagina * POR_PAGINA, tasks.length)

  return (
    <div>
      <div ref={arriba} />

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {visibles.map((t) => {
          const responsable = nombreDe(users, t.assigneeId)
          const hecha = t.status === "hecha"
          return (
            <li key={t.id} className="flex items-stretch">
              <button
                type="button"
                onClick={() => onToggleDone(t)}
                aria-label={hecha ? `Marcar ${t.title} como pendiente` : `Marcar ${t.title} como hecha`}
                className="flex w-11 shrink-0 items-center justify-center active:bg-muted md:w-12"
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-sm border",
                    hecha ? "border-brand bg-brand text-background" : "border-border"
                  )}
                >
                  {hecha && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onOpen(t.id)}
                className="flex min-h-[56px] min-w-0 flex-1 flex-col gap-1 py-3 pr-3 text-left active:bg-muted md:flex-row md:items-center md:gap-3 md:py-2.5"
              >
                <span
                  className={cn(
                    "min-w-0 flex-1 text-[15px] font-medium",
                    hecha ? "text-muted-foreground line-through" : "text-foreground",
                    "line-clamp-2 md:truncate md:line-clamp-none"
                  )}
                >
                  {t.title}
                </span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 md:shrink-0 md:flex-nowrap md:justify-end">
                  <PriorityChip priority={t.priority} />
                  {t.status !== "pendiente" && <StatusChip status={t.status} />}
                  <PersonChip nombre={responsable} className="md:w-40 md:justify-end" />
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {paginas > 1 && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => irA(pagina - 1)}
            disabled={pagina === 1}
            className="h-11 flex-1 rounded-lg border border-border text-[15px] text-foreground active:bg-muted disabled:opacity-40 md:h-9 md:flex-none md:px-4"
          >
            Anterior
          </button>
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            Viendo {desde} a {hasta} de {tasks.length}
          </span>
          <button
            type="button"
            onClick={() => irA(pagina + 1)}
            disabled={pagina === paginas}
            className="h-11 flex-1 rounded-lg border border-border text-[15px] text-foreground active:bg-muted disabled:opacity-40 md:h-9 md:flex-none md:px-4"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
