"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutGrid, List, User, X, ArrowDownUp, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTaskStore } from "../store/task-store"
import type { DueRange, SortBy } from "../store/task-store"
import type { Assignee } from "../types/task"
import { ASSIGNEE_LABELS, ROOT_AREAS } from "../types/task"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

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

  const activeAreaName = filters.areaId
    ? ROOT_AREAS.find((a) => a.id === filters.areaId)?.name ?? "Área"
    : null

  const PRESETS: Array<{ id: Preset; label: string; count: number; color: string }> = [
    { id: "pendientes", label: "Pendientes", count: counts.pendientes, color: "border-blue-500/40 text-blue-400 bg-blue-500/[0.06]" },
    { id: "vencidas", label: "Vencidas", count: counts.vencidas, color: "border-red-500/40 text-red-400 bg-red-500/[0.06]" },
    { id: "esta_semana", label: "Esta semana", count: counts.esta_semana, color: "border-amber-500/40 text-amber-400 bg-amber-500/[0.06]" },
    { id: "hechas", label: "Hechas", count: counts.hechas, color: "border-green-500/40 text-green-400 bg-green-500/[0.06]" },
    { id: "todas", label: "Todas", count: counts.todas, color: "border-border text-muted-foreground bg-card/30" },
  ]

  return (
    <div className="space-y-2">
      {/* PRESETS (fila 1) — chips grandes y claros, click directo */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {PRESETS.map((p) => {
          const active = isPresetActive(p.id, filters.status, filters.dueRange)
          return (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-xs font-mono uppercase tracking-wider transition-colors",
                active ? p.color + " font-semibold" : "border-border text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              {p.label}
              <span className={cn(
                "min-w-[18px] px-1 rounded-sm text-[10px] flex items-center justify-center",
                active ? "bg-foreground/10" : "bg-card/60"
              )}>
                {p.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* FILTROS SECUNDARIOS (fila 2) — para refinar dentro del preset */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Buscar…"
            className="h-7 rounded-sm border border-border bg-background pl-7 pr-2 text-xs w-32 md:w-44"
          />
        </div>

        {/* Persona */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-7 px-2 gap-1 text-xs", filters.assignee !== "all" ? "text-foreground bg-card" : "text-muted-foreground")}>
              <User className="h-3 w-3" />
              {filters.assignee === "all" ? "Persona" : ASSIGNEE_LABELS[filters.assignee] ?? filters.assignee}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setFilters({ assignee: "all" })}>Todas</DropdownMenuItem>
            {(Object.keys(ASSIGNEE_LABELS) as Assignee[]).map((a) => (
              <DropdownMenuItem key={a} onClick={() => setFilters({ assignee: a })}>
                {ASSIGNEE_LABELS[a]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Área */}
        {activeAreaName && (
          <Badge variant="outline" className="gap-1 h-7 text-xs">
            {activeAreaName}
            <button onClick={() => setFilters({ areaId: null })}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        <div className="flex-1" />

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground">
              <ArrowDownUp className="h-3 w-3" />
              {SORT_LABELS[filters.sortBy]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(SORT_LABELS) as SortBy[]).map((s) => (
              <DropdownMenuItem key={s} onClick={() => setFilters({ sortBy: s })}>
                {SORT_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle */}
        <div className="flex items-center border border-border rounded-sm">
          <button
            onClick={() => setViewMode("list")}
            className={cn("h-7 px-2 inline-flex items-center gap-1 text-xs", viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <List className="h-3 w-3" /> Lista
          </button>
          <button
            onClick={() => setViewMode("board")}
            className={cn("h-7 px-2 inline-flex items-center gap-1 text-xs", viewMode === "board" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid className="h-3 w-3" /> Board
          </button>
        </div>

        {/* Reset */}
        {hasSecondaryFilter && (
          <button
            onClick={() => {
              resetFilters()
              applyPreset("pendientes")
            }}
            className="h-7 px-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-sm"
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
