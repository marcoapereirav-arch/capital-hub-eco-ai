"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutGrid, List, Filter, User, X, Calendar, AlertCircle, ArrowDownUp, LayoutGrid as LayoutGridIcon, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTaskStore } from "../store/task-store"
import type { DueRange, SortBy } from "../store/task-store"
import type { GTDStatus, Priority, Assignee } from "../types/task"
import { GTD_LABELS, PRIORITY_LABELS, ASSIGNEE_LABELS, ROOT_AREAS } from "../types/task"

const DUE_RANGE_LABELS: Record<DueRange, string> = {
  all: "Todas las fechas",
  overdue: "Vencidas",
  today: "Hoy",
  week: "Próx 7 días",
  month: "Próx 30 días",
  no_date: "Sin fecha",
}

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

export function TaskFilters() {
  const filters = useTaskStore((s) => s.filters)
  const setFilters = useTaskStore((s) => s.setFilters)
  const viewMode = useTaskStore((s) => s.viewMode)
  const setViewMode = useTaskStore((s) => s.setViewMode)

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.assignee !== "all" ||
    filters.priority !== "all" ||
    filters.areaId !== null ||
    filters.dueRange !== "all" ||
    filters.search !== ""

  const activeAreaName = filters.areaId
    ? ROOT_AREAS.find((a) => a.id === filters.areaId)?.name ?? "Área"
    : null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="Buscar…"
          className="h-7 rounded-sm border border-border bg-background pl-7 pr-2 text-xs w-32 md:w-44"
        />
      </div>

      {/* Status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground">
            <Filter className="h-3 w-3" />
            {filters.status === "all" ? "Estado" : GTD_LABELS[filters.status]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setFilters({ status: "all" })}>Todos</DropdownMenuItem>
          {(Object.keys(GTD_LABELS) as GTDStatus[]).map((s) => (
            <DropdownMenuItem key={s} onClick={() => setFilters({ status: s })}>
              {GTD_LABELS[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            {filters.priority === "all" ? "Prioridad" : PRIORITY_LABELS[filters.priority]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setFilters({ priority: "all" })}>Todas</DropdownMenuItem>
          {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
            <DropdownMenuItem key={p} onClick={() => setFilters({ priority: p })}>
              {PRIORITY_LABELS[p]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Due Range */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {filters.dueRange === "all" ? "Fecha" : DUE_RANGE_LABELS[filters.dueRange]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.keys(DUE_RANGE_LABELS) as DueRange[]).map((r) => (
            <DropdownMenuItem key={r} onClick={() => setFilters({ dueRange: r })}>
              {DUE_RANGE_LABELS[r]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Assignee */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {filters.assignee === "all" ? "Persona" : ASSIGNEE_LABELS[filters.assignee] ?? filters.assignee}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setFilters({ assignee: "all" })}>Todos</DropdownMenuItem>
          {(Object.keys(ASSIGNEE_LABELS) as Assignee[]).map((a) => (
            <DropdownMenuItem key={a} onClick={() => setFilters({ assignee: a })}>
              {ASSIGNEE_LABELS[a]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Area */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground">
            <LayoutGridIcon className="h-3 w-3" />
            {activeAreaName ?? "Área"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setFilters({ areaId: null })}>Todas</DropdownMenuItem>
          {ROOT_AREAS.map((a) => (
            <DropdownMenuItem key={a.id} onClick={() => setFilters({ areaId: a.id })}>
              {a.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground">
            <ArrowDownUp className="h-3 w-3" />
            {SORT_LABELS[filters.sortBy]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.keys(SORT_LABELS) as SortBy[]).map((s) => (
            <DropdownMenuItem key={s} onClick={() => setFilters({ sortBy: s })}>
              {SORT_LABELS[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-1.5 text-xs text-muted-foreground"
          onClick={() => setFilters({
            status: "all",
            assignee: "all",
            priority: "all",
            areaId: null,
            dueRange: "all",
            search: "",
          })}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      <div className="flex-1" />

      {/* Done counter */}
      <DoneCounter />

      {/* View toggle */}
      <div className="flex items-center border border-border rounded-sm">
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 rounded-none ${viewMode === "board" ? "bg-accent" : ""}`}
          onClick={() => setViewMode("board")}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 rounded-none ${viewMode === "list" ? "bg-accent" : ""}`}
          onClick={() => setViewMode("list")}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function DoneCounter() {
  const tasks = useTaskStore((s) => s.tasks)
  const doneCount = tasks.filter((t) => t.status === "done").length
  const totalCount = tasks.length

  if (doneCount === 0) return null

  return (
    <Badge
      variant="outline"
      className="font-mono text-[9px] px-1.5 py-0 border-border text-muted-foreground"
    >
      {doneCount}/{totalCount} done
    </Badge>
  )
}
