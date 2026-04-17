"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutGrid, List, Filter, User, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTaskStore } from "../store/task-store"
import type { GTDStatus, Assignee } from "../types/task"
import { GTD_LABELS, ASSIGNEE_LABELS } from "../types/task"

export function TaskFilters() {
  const filters = useTaskStore((s) => s.filters)
  const setFilters = useTaskStore((s) => s.setFilters)
  const viewMode = useTaskStore((s) => s.viewMode)
  const setViewMode = useTaskStore((s) => s.setViewMode)

  const hasActiveFilters =
    filters.status !== "all" || filters.assignee !== "all"

  return (
    <div className="flex items-center gap-2">
      {/* Status filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground">
            <Filter className="h-3 w-3" />
            {filters.status === "all" ? "Estado" : GTD_LABELS[filters.status]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setFilters({ status: "all" })}>
            Todos
          </DropdownMenuItem>
          {(Object.keys(GTD_LABELS) as GTDStatus[]).map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => setFilters({ status })}
            >
              {GTD_LABELS[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Assignee filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {filters.assignee === "all"
              ? "Persona"
              : ASSIGNEE_LABELS[filters.assignee]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setFilters({ assignee: "all" })}>
            Todos
          </DropdownMenuItem>
          {(Object.keys(ASSIGNEE_LABELS) as Assignee[]).map((assignee) => (
            <DropdownMenuItem
              key={assignee}
              onClick={() => setFilters({ assignee })}
            >
              {ASSIGNEE_LABELS[assignee]}
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
          onClick={() => setFilters({ status: "all", assignee: "all" })}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Done count */}
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
