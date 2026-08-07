"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  PRIORITIES,
  SORT_LABELS,
  STATUS_LABELS,
  STATUSES,
  type Filters,
  type OsUser,
  type SortBy,
} from "../types/task"

const CAMPO =
  "h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"

/**
 * Los mismos controles en los dos sitios: dentro de la hoja inferior en telefono,
 * en una fila en el ordenador. Se escriben UNA vez.
 */
export function FilterControls({
  filters,
  sortBy,
  users,
  onFilters,
  onSort,
  className,
}: {
  filters: Filters
  sortBy: SortBy
  users: OsUser[]
  onFilters: (patch: Partial<Filters>) => void
  onSort: (s: SortBy) => void
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 md:flex md:items-center md:gap-2", className)}>
      <label className="flex flex-col gap-1.5 md:w-48">
        <span className="text-sm font-medium text-muted-foreground md:sr-only">Estado</span>
        <select
          value={filters.status}
          onChange={(e) => onFilters({ status: e.target.value as Filters["status"] })}
          className={CAMPO}
        >
          <option value="todas">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 md:w-36">
        <span className="text-sm font-medium text-muted-foreground md:sr-only">Prioridad</span>
        <select
          value={filters.priority}
          onChange={(e) => onFilters({ priority: e.target.value as Filters["priority"] })}
          className={CAMPO}
        >
          <option value="todas">Toda prioridad</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 md:w-48">
        <span className="text-sm font-medium text-muted-foreground md:sr-only">Responsable</span>
        <select
          value={filters.assigneeId}
          onChange={(e) => onFilters({ assigneeId: e.target.value })}
          className={CAMPO}
        >
          <option value="todos">Todo el equipo</option>
          <option value="sin">Sin responsable</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 md:w-44">
        <span className="text-sm font-medium text-muted-foreground md:sr-only">Ordenar por</span>
        <select
          value={sortBy}
          onChange={(e) => onSort(e.target.value as SortBy)}
          className={CAMPO}
        >
          {(Object.keys(SORT_LABELS) as SortBy[]).map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

/** En telefono los filtros viven en una hoja inferior, no en una fila apretada. */
export function FiltersSheet({
  open,
  onOpenChange,
  onReset,
  ...controls
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onReset: () => void
  filters: Filters
  sortBy: SortBy
  users: OsUser[]
  onFilters: (patch: Partial<Filters>) => void
  onSort: (s: SortBy) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-xl pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div aria-hidden className="mx-auto mt-1 h-1 w-10 rounded-full bg-border" />
        <SheetHeader className="px-4 pb-0">
          <SheetTitle className="text-[17px] font-semibold">Filtros y orden</SheetTitle>
        </SheetHeader>
        <div className="px-4">
          <FilterControls {...controls} />
        </div>
        <div className="flex gap-2 px-4 pb-2">
          <button
            type="button"
            onClick={onReset}
            className="h-11 flex-1 rounded-lg border border-border text-[15px] text-foreground active:bg-muted"
          >
            Quitar filtros
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-lg bg-brand text-[15px] font-semibold text-background active:opacity-90"
          >
            Ver resultados
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
