"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FolderKanban, Plus, CheckCircle2, AlertTriangle } from "lucide-react"
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
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Cargando área…
      </div>
    )
  }

  if (!area && !rootMeta) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-400" />
          <p className="text-sm">Área no encontrada en BD.</p>
          <Link href="/areas" className="text-xs font-mono uppercase tracking-wider text-muted-foreground underline mt-2 inline-block">
            ← Volver a áreas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/areas"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Áreas
          </Link>
          <h1 className="text-2xl font-semibold mt-2">{areaName}</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">
            {projects.length} proyecto{projects.length === 1 ? "" : "s"} · {directTasks.filter((t) => t.status !== "done").length} task{directTasks.filter((t) => t.status !== "done").length === 1 ? "" : "s"} abiertas en el área
          </p>
        </div>

        {/* Proyectos dentro del área */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              Proyectos
            </h2>
            <button
              onClick={() => setShowAssign((v) => !v)}
              className="text-[10px] font-mono uppercase tracking-wider border border-border rounded-sm px-2 py-1 hover:bg-card"
            >
              {showAssign ? "Cerrar" : "+ Asignar / crear"}
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Ningún proyecto en esta área todavía.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {projects.map((p) => {
                const tcount = tasks.filter((t) => t.paraId === p.id).length
                const open = tasks.filter((t) => t.paraId === p.id && t.status !== "done").length
                return (
                  <li key={p.id} className="flex items-center justify-between rounded-sm border border-border px-3 py-2 hover:bg-card/40">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {p.status === "completed" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                      )}
                      <Link href={`/projects/${p.id}`} className="text-sm hover:underline truncate">
                        {p.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      <span>{open} / {tcount}</span>
                      <button
                        onClick={() => handleUnassign(p)}
                        className="hover:text-foreground"
                        title="Quitar de esta área"
                      >
                        × quitar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Panel asignar/crear */}
          {showAssign && (
            <div className="rounded-md border border-border p-3 space-y-3 bg-card/30">
              {/* Crear nuevo */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                  Crear proyecto nuevo en esta área
                </label>
                <div className="flex gap-2">
                  <input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateProject() }}
                    placeholder="Nombre del proyecto"
                    className="flex-1 rounded-sm border border-border bg-background px-2 py-1.5 text-xs"
                  />
                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || creating}
                    className="rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-30"
                  >
                    {creating ? "…" : "Crear"}
                  </button>
                </div>
              </div>

              {/* Asignar huérfano */}
              {orphanProjects.length > 0 && (
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                    Asignar proyecto huérfano
                  </label>
                  <ul className="space-y-1">
                    {orphanProjects.map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-xs">
                        <span className="truncate">{p.name}</span>
                        <button
                          onClick={() => handleAssign(p)}
                          className="text-[10px] font-mono uppercase tracking-wider border border-border rounded-sm px-2 py-0.5 hover:bg-foreground hover:text-background shrink-0"
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
            <h2 className="text-sm font-semibold">Tareas directas del área (sin proyecto)</h2>
            <ul className="space-y-1.5">
              {directTasks.map((t) => (
                <li key={t.id} className={cn(
                  "flex items-center justify-between rounded-sm border border-border px-3 py-2",
                  t.status === "done" && "opacity-50"
                )}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      t.priority === "urgent" && "bg-red-400",
                      t.priority === "high" && "bg-orange-400",
                      t.priority === "normal" && "bg-blue-400",
                      t.priority === "low" && "bg-muted-foreground/40"
                    )} />
                    <span className="text-sm truncate">{t.title}</span>
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {t.status} · {t.assignee}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
