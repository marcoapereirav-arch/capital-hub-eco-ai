"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, SlidersHorizontal } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useTaskStore, filtrarYOrdenar } from "../store/task-store"
import { countActiveFilters, type Task } from "../types/task"
import { FilterControls, FiltersSheet } from "./task-filters"
import { TaskList } from "./task-list"
import { TaskDetailSheet } from "./task-detail-sheet"

/**
 * OPERACIONES · una lista de tareas y nada mas.
 *
 * Un solo nivel: titulo, descripcion, prioridad P1/P2/P3 y responsable. Sin proyectos,
 * sin areas, sin board, sin focos. Marco, 2026-08-07: "lo vamos a organizar solo en un
 * nivel de tareas y ya esta".
 */
export function TasksPage() {
  const init = useTaskStore((s) => s.init)
  const tasks = useTaskStore((s) => s.tasks)
  const users = useTaskStore((s) => s.users)
  const loading = useTaskStore((s) => s.loading)
  const initialized = useTaskStore((s) => s.initialized)
  const error = useTaskStore((s) => s.error)
  const filters = useTaskStore((s) => s.filters)
  const sortBy = useTaskStore((s) => s.sortBy)
  const selectedId = useTaskStore((s) => s.selectedId)
  const setFilters = useTaskStore((s) => s.setFilters)
  const resetFilters = useTaskStore((s) => s.resetFilters)
  const setSortBy = useTaskStore((s) => s.setSortBy)
  const select = useTaskStore((s) => s.select)
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)

  const [nueva, setNueva] = useState("")
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  useEffect(() => {
    init()
  }, [init])

  const visibles = useMemo(
    () => filtrarYOrdenar(tasks, filters, sortBy),
    [tasks, filters, sortBy]
  )

  const cuenta = useMemo(
    () => ({
      pendientes: tasks.filter((t) => t.status === "pendiente").length,
      hechas: tasks.filter((t) => t.status === "hecha").length,
      archivadas: tasks.filter((t) => t.status === "archivada").length,
    }),
    [tasks]
  )

  const filtrosActivos = countActiveFilters(filters)
  const seleccionada = tasks.find((t) => t.id === selectedId) ?? null

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    const title = nueva.trim()
    if (!title) return
    setNueva("")
    await addTask({ title })
  }

  const alternarHecha = (t: Task) =>
    updateTask(t.id, { status: t.status === "hecha" ? "pendiente" : "hecha" })

  if (!initialized && loading) {
    return (
      <div className="relative min-h-[60dvh]">
        <LoadingScreen fullscreen={false} className="absolute inset-0" />
      </div>
    )
  }

  return (
    // `pb-mobile-nav`: PageContainer no reserva sitio para la barra inferior del movil,
    // asi que sin esto la ultima tarea y los botones de pagina quedan debajo y no se
    // pueden tocar. Es el patron que ya usan dashboard, CRM, invitaciones e integraciones.
    <PageContainer className="pb-mobile-nav">
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={crear} className="flex gap-2">
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Escribe una tarea nueva"
          enterKeyHint="done"
          aria-label="Nueva tarea"
          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"
        />
        <button
          type="submit"
          disabled={!nueva.trim()}
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-[15px] font-semibold text-brand-ink active:opacity-90 disabled:opacity-40 md:h-9 md:text-sm"
        >
          <Plus className="size-4" />
          Añadir
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <input
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="Buscar"
          type="search"
          aria-label="Buscar tareas"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"
        />

        {/* TELEFONO: un solo boton de filtros. ORDENADOR: la fila entera. */}
        <button
          type="button"
          onClick={() => setFiltrosAbiertos(true)}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border text-[15px] text-foreground active:bg-muted md:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filtros y orden
          {filtrosActivos > 0 && <span className="tabular-nums">({filtrosActivos})</span>}
        </button>

        <FilterControls
          className="hidden md:flex"
          filters={filters}
          sortBy={sortBy}
          users={users}
          onFilters={setFilters}
          onSort={setSortBy}
        />
      </div>

      <p className="text-sm text-muted-foreground tabular-nums">
        {cuenta.pendientes} pendientes · {cuenta.hechas} hechas · {cuenta.archivadas} archivadas
        {visibles.length > 0 && visibles.length !== tasks.length && (
          <> · {visibles.length} a la vista</>
        )}
      </p>

      {visibles.length === 0 ? (
        <EstadoVacio
          listaVacia={tasks.length === 0}
          hayFiltros={filtrosActivos > 0}
          onQuitarFiltros={resetFilters}
          onVerTodas={() => setFilters({ status: "todas" })}
        />
      ) : (
        <TaskList
          tasks={visibles}
          users={users}
          claveDeFiltros={`${filters.status}|${filters.priority}|${filters.assigneeId}|${filters.search}|${sortBy}`}
          onOpen={select}
          onToggleDone={alternarHecha}
        />
      )}

      <FiltersSheet
        open={filtrosAbiertos}
        onOpenChange={setFiltrosAbiertos}
        onReset={resetFilters}
        filters={filters}
        sortBy={sortBy}
        users={users}
        onFilters={setFilters}
        onSort={setSortBy}
      />

      <TaskDetailSheet
        task={seleccionada}
        users={users}
        onClose={() => select(null)}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />
    </PageContainer>
  )
}

/**
 * Tres huecos distintos, y cada uno dice la verdad. El de "no hay pendientes" existe
 * porque la lista abre filtrada a pendientes: sin el, con 262 tareas hechas la pantalla
 * decia "todavia no hay tareas", que era mentira.
 */
function EstadoVacio({
  listaVacia,
  hayFiltros,
  onQuitarFiltros,
  onVerTodas,
}: {
  listaVacia: boolean
  hayFiltros: boolean
  onQuitarFiltros: () => void
  onVerTodas: () => void
}) {
  const caso = listaVacia ? "vacia" : hayFiltros ? "filtros" : "sin-pendientes"

  const textos = {
    vacia: {
      titulo: "Todavía no hay tareas",
      cuerpo: "Escribe arriba lo que haya que hacer y aparecerá aquí.",
    },
    filtros: {
      titulo: "Nada con esos filtros",
      cuerpo: "Prueba a quitar alguno para ver más.",
    },
    "sin-pendientes": {
      titulo: "No queda nada pendiente",
      cuerpo: "Todo lo que hay está hecho o archivado.",
    },
  }[caso]

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-border px-6 py-10 text-center">
      <h2 className="text-[17px] font-semibold text-foreground">{textos.titulo}</h2>
      <p className="max-w-[38ch] text-[15px] text-muted-foreground">{textos.cuerpo}</p>
      {caso === "filtros" && (
        <button
          type="button"
          onClick={onQuitarFiltros}
          className="h-11 rounded-lg bg-brand px-4 text-[15px] font-semibold text-brand-ink active:opacity-90"
        >
          Quitar filtros
        </button>
      )}
      {caso === "sin-pendientes" && (
        <button
          type="button"
          onClick={onVerTodas}
          className="h-11 rounded-lg border border-border px-4 text-[15px] text-foreground active:bg-muted"
        >
          Ver también las hechas
        </button>
      )}
    </div>
  )
}
