"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FolderKanban, CheckCircle2, AlertTriangle, X } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { useTaskStore } from "@/features/tasks/store/task-store"
import type { ParaItem } from "@/features/tasks/types/task"
import { ROOT_AREAS } from "@/features/tasks/types/task"
import { cn } from "@/lib/utils"

const STATUS_ORDER: Record<string, number> = { inbox: 0, next: 1, waiting: 2, someday: 3, done: 4 }
const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

export function AreaDetail({ areaId }: { areaId: string }) {
  const init = useTaskStore((s) => s.init)
  const paraItems = useTaskStore((s) => s.paraItems)
  const tasks = useTaskStore((s) => s.tasks)
  const initialized = useTaskStore((s) => s.initialized)
  const loading = useTaskStore((s) => s.loading)
  const updateParaItem = useTaskStore((s) => s.updateParaItem)
  const addParaItem = useTaskStore((s) => s.addParaItem)

  const [showAssign, setShowAssign] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => { init() }, [init])

  const area = useMemo(() => paraItems.find((p) => p.id === areaId), [paraItems, areaId])
  const rootMeta = ROOT_AREAS.find((r) => r.id === areaId)
  const areaName = area?.name ?? rootMeta?.name ?? "Área"

  const projects = useMemo(
    () => paraItems.filter((p) => p.type === "project" && p.parentId === areaId),
    [paraItems, areaId]
  )

  const directTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.paraId === areaId)
        .sort((a, b) => {
          const sa = STATUS_ORDER[a.status] ?? 9
          const sb = STATUS_ORDER[b.status] ?? 9
          if (sa !== sb) return sa - sb
          return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
        }),
    [tasks, areaId]
  )

  // Proyectos huérfanos disponibles para asignar a esta área
  const orphanProjects = useMemo(
    () => paraItems.filter((p) => p.type === "project" && p.status === "active" && !p.parentId),
    [paraItems]
  )

  async function handleAssign(project: ParaItem) {
    await updateParaItem(project.id, { parentId: areaId })
  }

  async function handleUnassign(project: ParaItem) {
    await updateParaItem(project.id, { parentId: null })
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) return
    setCreating(true)
    try {
      await addParaItem({ name: newProjectName.trim(), type: "project", parentId: areaId })
      setNewProjectName("")
    } finally {
      setCreating(false)
    }
  }

  if (loading && !initialized) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-[15px] text-muted-foreground">
        Cargando área…
      </div>
    )
  }

  if (!area && !rootMeta) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-warn" />
          <p className="text-[15px]">Área no encontrada en BD.</p>
          <Link
            href="/areas"
            className="mt-2 inline-flex h-11 items-center gap-1.5 text-[15px] text-muted-foreground underline"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" /> Volver a áreas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto no-overscroll">
      <PageContainer className="max-w-5xl space-y-6">
        {/* Header. La salida siempre visible y a 44 puntos: en telefono no se
            depende del boton atras del navegador. */}
        <div>
          <Link
            href="/areas"
            className="-ml-1 inline-flex h-11 items-center gap-1.5 rounded-lg px-1 text-[15px] text-muted-foreground active:bg-muted md:h-8 md:text-sm md:hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" /> Áreas
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{areaName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length} proyecto{projects.length === 1 ? "" : "s"} · {directTasks.filter((t) => t.status !== "done").length} task{directTasks.filter((t) => t.status !== "done").length === 1 ? "" : "s"} abiertas en el área
          </p>
        </div>

        {/* Proyectos dentro del área */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-semibold md:text-sm">
              <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
              Proyectos
            </h2>
            <button
              onClick={() => setShowAssign((v) => !v)}
              className="h-11 shrink-0 rounded-lg border border-border px-3 text-[15px] text-foreground active:bg-muted md:h-8 md:text-sm md:hover:bg-muted"
            >
              {showAssign ? "Cerrar" : "+ Asignar / crear"}
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-[15px] text-muted-foreground">
              Ningún proyecto en esta área todavía.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {projects.map((p) => {
                const tcount = tasks.filter((t) => t.paraId === p.id).length
                const open = tasks.filter((t) => t.paraId === p.id && t.status !== "done").length
                return (
                  <li key={p.id} className="flex min-h-[56px] items-center gap-2 px-3 py-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {p.status === "completed" && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      <Link
                        href={`/projects/${p.id}`}
                        className="min-w-0 flex-1 truncate text-[15px] md:text-sm md:hover:underline"
                      >
                        {p.name}
                      </Link>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                      <span className="tabular-nums">{open} / {tcount}</span>
                      {/* La accion de quitar es visible siempre y mide 44: en telefono
                          no hay raton que la descubra. */}
                      <button
                        onClick={() => handleUnassign(p)}
                        className="inline-flex h-11 items-center gap-1 rounded-lg px-2 active:bg-muted md:h-8 md:hover:text-foreground"
                        title="Quitar de esta área"
                      >
                        <X className="h-4 w-4 shrink-0" /> quitar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Panel asignar/crear */}
          {showAssign && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-3">
              {/* Crear nuevo. Una sola columna, etiqueta encima y campo a 44 puntos
                  con letra de 16: por debajo el iPhone se acerca solo al escribir. */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nuevo-proyecto" className="text-sm font-medium text-muted-foreground">
                  Crear proyecto nuevo en esta área
                </label>
                <div className="flex flex-col gap-2 md:flex-row">
                  <input
                    id="nuevo-proyecto"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateProject() }}
                    placeholder="Nombre del proyecto"
                    enterKeyHint="done"
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:flex-1 md:text-sm"
                  />
                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || creating}
                    className="h-11 w-full shrink-0 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-30 md:h-9 md:w-auto md:text-sm"
                  >
                    {creating ? "…" : "Crear"}
                  </button>
                </div>
              </div>

              {/* Asignar huérfano */}
              {orphanProjects.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-muted-foreground">
                    Asignar proyecto huérfano
                  </span>
                  <ul className="divide-y divide-border">
                    {orphanProjects.map((p) => (
                      <li key={p.id} className="flex min-h-[56px] items-center justify-between gap-2 py-1">
                        <span className="min-w-0 flex-1 truncate text-[15px] md:text-sm">{p.name}</span>
                        <button
                          onClick={() => handleAssign(p)}
                          className="h-11 shrink-0 rounded-lg border border-border px-3 text-[15px] text-foreground active:bg-muted md:h-8 md:text-sm md:hover:bg-muted"
                        >
                          + Asignar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Tasks directas del área (sin proyecto) */}
        {directTasks.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[15px] font-semibold md:text-sm">Tareas directas del área (sin proyecto)</h2>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {directTasks.map((t) => (
                <li key={t.id} className={cn(
                  "flex min-h-[56px] flex-col gap-1 px-3 py-2 md:flex-row md:items-center md:justify-between md:gap-3",
                  t.status === "done" && "opacity-50"
                )}>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      t.priority === "urgent" && "bg-destructive",
                      t.priority === "high" && "bg-warn",
                      t.priority === "normal" && "bg-primary",
                      t.priority === "low" && "bg-muted-foreground"
                    )} />
                    <span className="min-w-0 flex-1 truncate text-[15px] md:text-sm">{t.title}</span>
                  </div>
                  {/* `capitalize` deja "Next · Marco" sin tocar el valor del dato. */}
                  <div className="shrink-0 pl-3.5 text-sm text-muted-foreground capitalize md:pl-0">
                    {t.status} · {t.assignee}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PageContainer>
    </div>
  )
}
