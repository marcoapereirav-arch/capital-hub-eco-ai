"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { LayoutGrid, List, User, X, ArrowDownUp, Search, SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTaskStore } from "../store/task-store"
import type { DueRange, SortBy } from "../store/task-store"
import type { Assignee } from "../types/task"
import { ASSIGNEE_LABELS, ROOT_AREAS } from "../types/task"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"

const SORT_LABELS: Record<SortBy, string> = {
  priority: "Prioridad",
  due_asc: "Fecha (próximas)",
  due_desc: "Fecha (lejanas)",
  status: "Estado",
  assignee: "Persona",
  created_desc: "Más reciente",
  created_asc: "Más antigua",
  alpha: "A → Z",
}

/**
 * 5 presets visibles arriba. Cada uno aplica una combinación clara de filtros.
 * El default activo es "pendientes". El usuario clica un chip y ve EXACTAMENTE
 * lo que dice el chip.
 */
type Preset = "pendientes" | "vencidas" | "esta_semana" | "hechas" | "todas"

function isPresetActive(
  preset: Preset,
  status: string,
  dueRange: DueRange,
): boolean {
  if (preset === "pendientes") return status === "next" && dueRange === "all"
  if (preset === "vencidas") return dueRange === "overdue"
  if (preset === "esta_semana") return dueRange === "week"
  if (preset === "hechas") return status === "done"
  if (preset === "todas") return status === "all" && dueRange === "all"
  return false
}

export function TaskFilters() {
  const filters = useTaskStore((s) => s.filters)
  const setFilters = useTaskStore((s) => s.setFilters)
  const resetFilters = useTaskStore((s) => s.resetFilters)
  const viewMode = useTaskStore((s) => s.viewMode)
  const setViewMode = useTaskStore((s) => s.setViewMode)
  const tasks = useTaskStore((s) => s.tasks)

  // Hoja inferior con los filtros secundarios. En telefono no caben seis
  // controles en una fila: se juntan detras de un solo boton "Filtros".
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  // Counts por preset en vivo. CRÍTICO: cada count debe coincidir EXACTAMENTE con
  // el filtro que aplica el preset al hacer click. Si el chip "Vencidas" filtra
  // status=next AND dueRange=overdue, el count debe ser SOLO las que cumplen ambos.
  // Antes el bug era: vencidas++ contaba TODAS las que tenian due_date pasada
  // (incluido done). Al filtrar con status=next mostraba 1 sola pero el chip decía 63.
  const counts = useMemo(() => {
    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const week = new Date(startToday)
    week.setDate(week.getDate() + 7)
    let pendientes = 0
    let vencidas = 0
    let esta_semana = 0
    let hechas = 0
    for (const t of tasks) {
      if (t.status === "done") {
        hechas++
        continue   // las done NO entran en ningún otro count
      }
      // A partir de aquí solo tareas NO done (next/waiting/someday/inbox)
      if (t.status === "next") pendientes++
      // Vencidas y Esta semana: solo cuentan las que estan en status=next
      // (que es el filtro que aplica el preset al hacer click).
      if (t.status === "next" && t.dueDate) {
        const due = new Date(t.dueDate)
        if (due < startToday) vencidas++
        else if (due < week) esta_semana++
      }
    }
    return { pendientes, vencidas, esta_semana, hechas, todas: tasks.length }
  }, [tasks])

  function applyPreset(p: Preset) {
    if (p === "pendientes") setFilters({ status: "next", dueRange: "all" })
    else if (p === "vencidas") setFilters({ status: "next", dueRange: "overdue" })
    else if (p === "esta_semana") setFilters({ status: "next", dueRange: "week" })
    else if (p === "hechas") setFilters({ status: "done", dueRange: "all" })
    else if (p === "todas") setFilters({ status: "all", dueRange: "all" })
  }

  const hasSecondaryFilter =
    filters.assignee !== "all" ||
    filters.priority !== "all" ||
    filters.areaId !== null ||
    filters.search !== ""

  // Cuantos filtros secundarios estan puestos, para el numero del boton "Filtros".
  const activosSecundarios =
    (filters.assignee !== "all" ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0) +
    (filters.areaId !== null ? 1 : 0)

  const activeAreaName = filters.areaId
    ? ROOT_AREAS.find((a) => a.id === filters.areaId)?.name ?? "Área"
    : null

  // Cada preset con el token que le corresponde: rojo de error para lo vencido,
  // ambar de aviso para lo de esta semana, verde de marca para lo hecho. Antes
  // eran blue / red / amber / green de Tailwind, cuatro colores fuera de marca.
  const PRESETS: Array<{ id: Preset; label: string; count: number; color: string }> = [
    { id: "pendientes", label: "Pendientes", count: counts.pendientes, color: "border-border text-foreground bg-muted" },
    { id: "vencidas", label: "Vencidas", count: counts.vencidas, color: "border-destructive/40 text-destructive bg-destructive/10" },
    { id: "esta_semana", label: "Esta semana", count: counts.esta_semana, color: "border-warn/40 text-warn bg-warn/10" },
    { id: "hechas", label: "Hechas", count: counts.hechas, color: "border-primary/40 text-primary bg-primary/10" },
    { id: "todas", label: "Todas", count: counts.todas, color: "border-border text-muted-foreground bg-card" },
  ]

  function limpiar() {
    resetFilters()
    applyPreset("pendientes")
  }

  const listaOrden = (Object.keys(SORT_LABELS) as SortBy[])
  const listaPersonas = (Object.keys(ASSIGNEE_LABELS) as Assignee[])

  return (
    <div className="space-y-2">
      {/* PRESETS (fila 1) — tira deslizable en telefono, fila normal en monitor */}
      <div className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 md:mx-0 md:flex-wrap md:items-center md:overflow-visible md:px-0">
        {PRESETS.map((p) => {
          const active = isPresetActive(p.id, filters.status, filters.dueRange)
          return (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={cn(
                "inline-flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-lg border px-3 text-[15px] whitespace-nowrap transition-colors md:h-8 md:px-2.5 md:text-sm",
                active ? p.color + " font-semibold" : "border-border text-muted-foreground md:hover:bg-card md:hover:text-foreground"
              )}
            >
              {p.label}
              <span className={cn(
                "flex min-w-[20px] items-center justify-center rounded-sm px-1 text-sm tabular-nums",
                active ? "bg-foreground/10" : "bg-card/60"
              )}>
                {p.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ================= TELEFONO: busqueda propia + vista + Filtros ================= */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Buscar…"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            className="h-11 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-border">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-l-lg text-[15px]",
                viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
            >
              <List className="h-4 w-4 shrink-0" /> Lista
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={cn(
                "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-r-lg text-[15px]",
                viewMode === "board" ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" /> Board
            </button>
          </div>

          <button
            onClick={() => setFiltrosAbiertos(true)}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-[15px] text-foreground active:bg-muted"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            Filtros
            {activosSecundarios > 0 && <span className="tabular-nums">({activosSecundarios})</span>}
          </button>
        </div>
      </div>

      {/* Hoja inferior con los filtros secundarios */}
      <Sheet open={filtrosAbiertos} onOpenChange={setFiltrosAbiertos}>
        <SheetContent side="bottom" className="rounded-t-xl pb-safe-4 md:hidden">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border" />
          <SheetHeader className="px-4 pb-0">
            <SheetTitle className="text-[17px] font-semibold">Filtros</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">Persona</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters({ assignee: "all" })}
                  className={cn(
                    "h-11 rounded-lg border px-3 text-[15px]",
                    filters.assignee === "all"
                      ? "border-primary/40 bg-primary/10 font-semibold text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  Todas
                </button>
                {listaPersonas.map((a) => (
                  <button
                    key={a}
                    onClick={() => setFilters({ assignee: a })}
                    className={cn(
                      "h-11 rounded-lg border px-3 text-[15px]",
                      filters.assignee === a
                        ? "border-primary/40 bg-primary/10 font-semibold text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {ASSIGNEE_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>

            {activeAreaName && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Área</span>
                <button
                  onClick={() => setFilters({ areaId: null })}
                  className="inline-flex h-11 w-fit items-center gap-1.5 rounded-lg border border-border px-3 text-[15px] text-foreground"
                >
                  {activeAreaName}
                  <X className="h-4 w-4 shrink-0" />
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">Orden</span>
              <div className="flex flex-wrap gap-2">
                {listaOrden.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilters({ sortBy: s })}
                    className={cn(
                      "h-11 rounded-lg border px-3 text-[15px]",
                      filters.sortBy === s
                        ? "border-primary/40 bg-primary/10 font-semibold text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {SORT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {hasSecondaryFilter && (
              <button
                onClick={() => {
                  limpiar()
                  setFiltrosAbiertos(false)
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-border text-[15px] text-foreground active:bg-muted"
              >
                <X className="h-4 w-4 shrink-0" /> Limpiar
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ================= ESCRITORIO: la barra en una fila ================= */}
      <div className="hidden md:flex md:flex-wrap md:items-center md:gap-1.5">
        <div className="relative">
          <Search className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Buscar…"
            type="search"
            className="md:h-8 w-44 rounded-lg border border-border bg-background pr-2 pl-7 text-base md:text-sm"
          />
        </div>

        {/* Persona */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("gap-1", filters.assignee !== "all" ? "bg-card text-foreground" : "text-muted-foreground")}>
              <User className="h-3 w-3" />
              {filters.assignee === "all" ? "Persona" : ASSIGNEE_LABELS[filters.assignee] ?? filters.assignee}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setFilters({ assignee: "all" })}>Todas</DropdownMenuItem>
            {listaPersonas.map((a) => (
              <DropdownMenuItem key={a} onClick={() => setFilters({ assignee: a })}>
                {ASSIGNEE_LABELS[a]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Área */}
        {activeAreaName && (
          <Badge variant="outline" className="md:h-8 gap-1 text-sm">
            {activeAreaName}
            <button onClick={() => setFilters({ areaId: null })} aria-label="Quitar filtro de área">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        <div className="flex-1" />

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <ArrowDownUp className="h-3 w-3" />
              {SORT_LABELS[filters.sortBy]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {listaOrden.map((s) => (
              <DropdownMenuItem key={s} onClick={() => setFilters({ sortBy: s })}>
                {SORT_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border">
          <button
            onClick={() => setViewMode("list")}
            className={cn("inline-flex md:h-8 items-center gap-1 rounded-l-lg px-2 text-sm", viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <List className="h-3 w-3" /> Lista
          </button>
          <button
            onClick={() => setViewMode("board")}
            className={cn("inline-flex md:h-8 items-center gap-1 rounded-r-lg px-2 text-sm", viewMode === "board" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid className="h-3 w-3" /> Board
          </button>
        </div>

        {/* Reset */}
        {hasSecondaryFilter && (
          <button
            onClick={limpiar}
            className="inline-flex md:h-8 items-center gap-1 rounded-lg border border-border px-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
