"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { LayoutGrid, FolderKanban, CheckSquare, AlertTriangle } from "lucide-react"
import { useTaskStore } from "@/features/tasks/store/task-store"
import { ROOT_AREAS } from "@/features/tasks/types/task"
import { cn } from "@/lib/utils"

// 4 colores discretos para los cuadrantes (uno por área)
const AREA_COLORS: Record<string, { ring: string; tint: string; dot: string }> = {
  area_marketing: { ring: "ring-blue-500/30", tint: "bg-blue-500/[0.04]", dot: "bg-blue-400" },
  area_producto:  { ring: "ring-green-500/30", tint: "bg-green-500/[0.04]", dot: "bg-green-400" },
  area_ventas:    { ring: "ring-amber-500/30", tint: "bg-amber-500/[0.04]", dot: "bg-amber-400" },
  area_finanzas:  { ring: "ring-purple-500/30", tint: "bg-purple-500/[0.04]", dot: "bg-purple-400" },
}

export function AreasOverview() {
  const init = useTaskStore((s) => s.init)
  const paraItems = useTaskStore((s) => s.paraItems)
  const tasks = useTaskStore((s) => s.tasks)
  const initialized = useTaskStore((s) => s.initialized)
  const loading = useTaskStore((s) => s.loading)

  useEffect(() => { init() }, [init])

  // Áreas en BD (vs lo que esperamos)
  const areasInDb = useMemo(
    () => paraItems.filter((p) => p.type === "area" && ROOT_AREAS.some((r) => r.id === p.id)),
    [paraItems]
  )
  const missingAreas = useMemo(
    () => ROOT_AREAS.filter((r) => !areasInDb.some((a) => a.id === r.id)),
    [areasInDb]
  )

  // Proyectos huérfanos (sin parentId asignado)
  const orphanProjects = useMemo(
    () => paraItems.filter((p) => p.type === "project" && p.status === "active" && !p.parentId),
    [paraItems]
  )

  if (loading && !initialized) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Cargando áreas…
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Áreas</h1>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider ml-2">
            4 cuadrantes · cada área agrupa sus proyectos
          </span>
        </div>

        {/* Warning si faltan áreas (migración no aplicada) */}
        {missingAreas.length > 0 && (
          <div className="flex items-start gap-2 rounded-sm border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="font-mono uppercase tracking-wider text-amber-400">
                Faltan {missingAreas.length} área{missingAreas.length === 1 ? "" : "s"} en BD
              </div>
              <p className="text-muted-foreground">
                Aplica la migración <code className="font-mono">0024_para_items_hierarchy_and_finanzas.sql</code> en Supabase. Faltan: {missingAreas.map((a) => a.name).join(", ")}.
              </p>
            </div>
          </div>
        )}

        {/* 4 cuadrantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ROOT_AREAS.map((area) => {
            const dbArea = areasInDb.find((a) => a.id === area.id)
            const exists = !!dbArea
            const projects = paraItems.filter(
              (p) => p.type === "project" && p.parentId === area.id
            )
            const activeProjects = projects.filter((p) => p.status === "active")
            const directTasks = tasks.filter((t) => t.paraId === area.id && t.status !== "done")
            const projectTasks = tasks.filter(
              (t) => projects.some((p) => p.id === t.paraId) && t.status !== "done"
            )
            const totalOpenTasks = directTasks.length + projectTasks.length
            const colors = AREA_COLORS[area.id]

            return (
              <Link
                key={area.id}
                href={exists ? `/areas/${area.id}` : "#"}
                className={cn(
                  "rounded-md border border-border/40 p-4 ring-1 transition-all hover:border-border",
                  colors.ring,
                  colors.tint,
                  !exists && "opacity-50 pointer-events-none"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", colors.dot)} />
                    <h2 className="text-base font-semibold">{area.name}</h2>
                  </div>
                  {!exists && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded-sm">
                      Faltan datos
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Proyectos activos</div>
                      <div className="font-mono font-medium">
                        {activeProjects.length}
                        {projects.length > activeProjects.length && (
                          <span className="text-muted-foreground"> / {projects.length}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Tareas abiertas</div>
                      <div className="font-mono font-medium">{totalOpenTasks}</div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Proyectos huérfanos */}
        {orphanProjects.length > 0 && (
          <div className="rounded-md border border-border/40 p-4 bg-background">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Proyectos sin área asignada</h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {orphanProjects.length} pendiente{orphanProjects.length === 1 ? "" : "s"} de clasificar
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Entra en un área y úsa el botón "Asignar proyecto" para mover estos a su cuadrante.
            </p>
            <ul className="space-y-1.5">
              {orphanProjects.map((p) => {
                const tcount = tasks.filter((t) => t.paraId === p.id && t.status !== "done").length
                return (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {tcount} task{tcount === 1 ? "" : "s"}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
