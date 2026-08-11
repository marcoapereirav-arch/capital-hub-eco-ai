"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { ListaPaginada } from "@/components/ui/lista-paginada"
import { PersonChip, PriorityChip, StatusChip } from "./task-chips"
import { nombreDe, type OsUser, type Task } from "../types/task"

/**
 * La lista. Fichas en el telefono, filas en el ordenador.
 *
 * La paginacion NO se escribe aqui: la pone `<ListaPaginada>`, que es por donde pasa
 * TODA lista del OS (maximo 20 por pagina, vuelta arriba al cambiar de pagina y "viendo
 * X a Y de Z"). Escribir otra al lado seria duplicar la regla y acabar con dos que se
 * portan distinto.
 */
export function TaskList({
  tasks,
  users,
  claveDeFiltros,
  onOpen,
  onToggleDone,
}: {
  tasks: Task[]
  users: OsUser[]
  /** Cambia cuando cambian filtros u orden: la paginacion vuelve a la primera pagina. */
  claveDeFiltros: string
  onOpen: (id: string) => void
  onToggleDone: (task: Task) => void
}) {
  if (!tasks.length) return null

  return (
    <ListaPaginada
      items={tasks}
      claveDeFiltros={claveDeFiltros}
      nombreSingular="tarea"
      nombrePlural="tareas"
    >
      {(pagina) => (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {pagina.map((t) => {
            const responsable = nombreDe(users, t.assigneeId)
            const hecha = t.status === "hecha"
            return (
              <li key={t.id} className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => onToggleDone(t)}
                  aria-label={
                    hecha ? `Marcar ${t.title} como pendiente` : `Marcar ${t.title} como hecha`
                  }
                  className="flex w-11 shrink-0 items-center justify-center active:bg-muted md:w-12"
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-sm border",
                      hecha ? "border-brand bg-brand text-brand-ink" : "border-border"
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
      )}
    </ListaPaginada>
  )
}
