"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { LayoutGrid, FolderKanban, CheckSquare, AlertTriangle } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { useTaskStore } from "@/features/tasks/store/task-store"
import { ROOT_AREAS } from "@/features/tasks/types/task"
import { cn } from "@/lib/utils"

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
      <div className="flex h-full items-center justify-center px-6 text-[15px] text-muted-foreground">
        Cargando áreas…
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto no-overscroll">
      <PageContainer className="max-w-6xl space-y-6">
        {/* Header. La bajada baja de linea en telefono en vez de estirar la fila
            mas alla del borde de la pantalla. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <LayoutGrid className="h-5 w-5 shrink-0 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">Áreas</h1>
          <span className="w-full text-sm text-muted-foreground md:ml-2 md:w-auto">
            4 cuadrantes · cada área agrupa sus proyectos
          </span>
        </div>

        {/* Warning si faltan áreas (migración no aplicada) */}
        {missingAreas.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <div className="min-w-0 space-y-1">
              <div className="text-sm font-semibold text-warn">
                Faltan {missingAreas.length} área{missingAreas.length === 1 ? "" : "s"} en BD
              </div>
              <p className="text-sm break-words text-muted-foreground">
                Aplica la migración <code>0024_para_items_hierarchy_and_finanzas.sql</code> en Supabase. Faltan: {missingAreas.map((a) => a.name).join(", ")}.
              </p>
            </div>
          </div>
        )}

        {/* 4 cuadrantes */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

            return (
              <Link
                key={area.id}
                href={exists ? `/areas/${area.id}` : "#"}
                className={cn(
                  "rounded-lg border border-border bg-card p-4 transition-colors active:bg-muted md:hover:border-primary/50",
                  !exists && "pointer-events-none opacity-50"
                )}
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <h2 className="min-w-0 flex-1 truncate text-base font-semibold">{area.name}</h2>
                  {!exists && (
                    <span className="shrink-0 rounded-sm border border-warn/40 px-1.5 py-0.5 text-sm text-warn">
                      Faltan datos
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="text-sm text-muted-foreground">Proyectos activos</div>
                      <div className="font-medium tabular-nums">
                        {activeProjects.length}
                        {projects.length > activeProjects.length && (
                          <span className="text-muted-foreground"> / {projects.length}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="text-sm text-muted-foreground">Tareas abiertas</div>
                      <div className="font-medium tabular-nums">{totalOpenTasks}</div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Proyectos huérfanos */}
        {orphanProjects.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold md:text-sm">Proyectos sin área asignada</h2>
              <span className="text-sm text-muted-foreground">
                {orphanProjects.length} pendiente{orphanProjects.length === 1 ? "" : "s"} de clasificar
              </span>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Entra en un área y úsa el botón &quot;Asignar proyecto&quot; para mover estos a su cuadrante.
            </p>
            <ul className="divide-y divide-border">
              {orphanProjects.map((p) => {
                const tcount = tasks.filter((t) => t.paraId === p.id && t.status !== "done").length
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-[15px] md:text-sm">{p.name}</span>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {tcount} task{tcount === 1 ? "" : "s"}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
