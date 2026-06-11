"use client"

import { useState, useTransition } from "react"
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Trash2,
  Pencil,
  Save,
  X,
  Video,
  FileText,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  actionCreateModule,
  actionUpdateModule,
  actionDeleteModule,
  actionCreateLesson,
  actionUpdateLesson,
  actionDeleteLesson,
} from "../services/contenido-actions"
import type { Route, Formation, ContenidoModule, Lesson } from "../services/contenido-service"

interface Props {
  routes: Route[]
  formations: Formation[]
  modules: ContenidoModule[]
  lessons: Lesson[]
}

/**
 * Admin de contenido: árbol expandible Route → Formation → Module → Lesson.
 * El profesor crea, edita y borra módulos y lecciones con libertad total.
 * Cada lección permite editar título, video_url y bunny_video_id.
 */
export function ContenidoAdmin({ routes, formations, modules, lessons }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<{ type: "module" | "lesson"; id: number } | null>(null)
  const [creatingIn, setCreatingIn] = useState<{ type: "module" | "lesson"; parentId: number } | null>(null)
  const [pending, startTransition] = useTransition()

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {routes.map((r) => {
        const routeFormations = formations.filter((f) => f.route_id === r.id)
        return (
          <section key={r.id} className="rounded-md border border-border bg-card/30">
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Route
              </span>
              <h2 className="text-base font-semibold">{r.name}</h2>
              <span className="text-[10px] font-mono text-muted-foreground">
                {routeFormations.length} formaciones
              </span>
            </div>

            <div className="p-3 space-y-3">
              {routeFormations.map((f) => {
                const formationModules = modules.filter((m) => m.formation_id === f.id)
                const fKey = `f-${f.id}`
                const isOpen = expanded.has(fKey)
                return (
                  <div key={f.id} className="rounded-sm border border-border/40 bg-background/30">
                    <button
                      onClick={() => toggle(fKey)}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-card/40 transition-colors"
                    >
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                        Formación
                      </span>
                      <span className="text-sm font-medium">{f.name}</span>
                      <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                        {formationModules.length} módulos
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2">
                        {formationModules.map((m) => {
                          const moduleLessons = lessons.filter((l) => l.module_id === m.id)
                          const mKey = `m-${m.id}`
                          const isModuleOpen = expanded.has(mKey)
                          const isEditingThisModule = editing?.type === "module" && editing.id === m.id
                          return (
                            <div key={m.id} className="rounded-sm border border-border/30 bg-background/40">
                              <div className="px-3 py-2 flex items-center gap-2">
                                <button onClick={() => toggle(mKey)} className="text-muted-foreground hover:text-foreground">
                                  {isModuleOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </button>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Módulo</span>
                                {isEditingThisModule ? (
                                  <ModuleEditForm module={m} onCancel={() => setEditing(null)} onSaved={() => setEditing(null)} pending={pending} startTransition={startTransition} />
                                ) : (
                                  <>
                                    <span className="text-sm">{m.name}</span>
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      {moduleLessons.length} lecciones
                                    </span>
                                    <div className="ml-auto flex items-center gap-1">
                                      <button onClick={() => setEditing({ type: "module", id: m.id })} className="p-1 text-muted-foreground hover:text-foreground" title="Editar">
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (!confirm(`Borrar módulo "${m.name}" + sus lecciones?`)) return
                                          startTransition(async () => {
                                            await actionDeleteModule(m.id)
                                          })
                                        }}
                                        className="p-1 text-muted-foreground hover:text-red-400"
                                        title="Borrar módulo"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>

                              {isModuleOpen && (
                                <div className="px-3 pb-2 ml-5 space-y-1">
                                  {moduleLessons.map((l) => {
                                    const isEditingThisLesson = editing?.type === "lesson" && editing.id === l.id
                                    return (
                                      <div key={l.id} className="rounded-sm bg-background/60 px-2.5 py-1.5">
                                        {isEditingThisLesson ? (
                                          <LessonEditForm lesson={l} onCancel={() => setEditing(null)} onSaved={() => setEditing(null)} pending={pending} startTransition={startTransition} />
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            {l.bunny_video_id || l.video_url ? <Video className="h-3 w-3 text-green-400" /> : <FileText className="h-3 w-3 text-muted-foreground" />}
                                            <span className="text-xs">{l.position}. {l.title}</span>
                                            {l.bunny_video_id && (
                                              <span className="text-[9px] font-mono text-green-400">bunny</span>
                                            )}
                                            <div className="ml-auto flex items-center gap-1">
                                              <button onClick={() => setEditing({ type: "lesson", id: l.id })} className="p-0.5 text-muted-foreground hover:text-foreground" title="Editar">
                                                <Pencil className="h-3 w-3" />
                                              </button>
                                              <button
                                                onClick={() => {
                                                  if (!confirm(`Borrar lección "${l.title}"?`)) return
                                                  startTransition(async () => {
                                                    await actionDeleteLesson(l.id)
                                                  })
                                                }}
                                                className="p-0.5 text-muted-foreground hover:text-red-400"
                                                title="Borrar lección"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}

                                  {creatingIn?.type === "lesson" && creatingIn.parentId === m.id ? (
                                    <CreateLessonForm moduleId={m.id} onCancel={() => setCreatingIn(null)} onCreated={() => setCreatingIn(null)} pending={pending} startTransition={startTransition} />
                                  ) : (
                                    <button
                                      onClick={() => setCreatingIn({ type: "lesson", parentId: m.id })}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
                                    >
                                      <Plus className="h-3 w-3" /> Lección
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {creatingIn?.type === "module" && creatingIn.parentId === f.id ? (
                          <CreateModuleForm formationId={f.id} onCancel={() => setCreatingIn(null)} onCreated={() => setCreatingIn(null)} pending={pending} startTransition={startTransition} />
                        ) : (
                          <button
                            onClick={() => setCreatingIn({ type: "module", parentId: f.id })}
                            className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground border border-dashed border-border/40 hover:border-border rounded-sm"
                          >
                            <Plus className="h-3 w-3" /> Nuevo módulo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
      {pending && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-md px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground shadow-md">
          <Loader2 className="h-3 w-3 animate-spin" /> Guardando…
        </div>
      )}
    </div>
  )
}

// ============ Inline forms ============

function CreateModuleForm({ formationId, onCancel, onCreated, pending, startTransition }: { formationId: number; onCancel: () => void; onCreated: () => void; pending: boolean; startTransition: React.TransitionStartFunction }) {
  const [name, setName] = useState("")
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        startTransition(async () => {
          await actionCreateModule(formationId, name)
          onCreated()
        })
      }}
      className="flex items-center gap-2 p-2 rounded-sm border border-border/40 bg-background/60"
    >
      <Plus className="h-3 w-3 text-amber-400" />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del módulo"
        autoFocus
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button type="submit" disabled={pending || !name.trim()} className="p-1 text-green-400 disabled:opacity-50">
        <Save className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </form>
  )
}

function CreateLessonForm({ moduleId, onCancel, onCreated, pending, startTransition }: { moduleId: number; onCancel: () => void; onCreated: () => void; pending: boolean; startTransition: React.TransitionStartFunction }) {
  const [title, setTitle] = useState("")
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        startTransition(async () => {
          await actionCreateLesson(moduleId, title)
          onCreated()
        })
      }}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm bg-background/60"
    >
      <Plus className="h-3 w-3 text-cyan-400" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título de la lección"
        autoFocus
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button type="submit" disabled={pending || !title.trim()} className="p-1 text-green-400 disabled:opacity-50">
        <Save className="h-3 w-3" />
      </button>
      <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
        <X className="h-3 w-3" />
      </button>
    </form>
  )
}

function ModuleEditForm({ module: m, onCancel, onSaved, pending, startTransition }: { module: ContenidoModule; onCancel: () => void; onSaved: () => void; pending: boolean; startTransition: React.TransitionStartFunction }) {
  const [name, setName] = useState(m.name)
  const [description, setDescription] = useState(m.description ?? "")
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          await actionUpdateModule(m.id, name, description || null)
          onSaved()
        })
      }}
      className="flex-1 flex items-center gap-2"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className="flex-1 bg-background border border-border rounded-sm px-2 py-1 text-sm outline-none"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción (opcional)"
        className="flex-1 bg-background border border-border rounded-sm px-2 py-1 text-xs outline-none"
      />
      <button type="submit" disabled={pending} className="p-1 text-green-400 disabled:opacity-50">
        <Save className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </form>
  )
}

function LessonEditForm({ lesson, onCancel, onSaved, pending, startTransition }: { lesson: Lesson; onCancel: () => void; onSaved: () => void; pending: boolean; startTransition: React.TransitionStartFunction }) {
  const [title, setTitle] = useState(lesson.title)
  const [content, setContent] = useState(lesson.content ?? "")
  const [videoUrl, setVideoUrl] = useState(lesson.video_url ?? "")
  const [bunnyId, setBunnyId] = useState(lesson.bunny_video_id ?? "")

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          await actionUpdateLesson(lesson.id, {
            title,
            content: content || null,
            video_url: videoUrl || null,
            bunny_video_id: bunnyId || null,
          })
          onSaved()
        })
      }}
      className="space-y-2 w-full"
    >
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="flex-1 bg-background border border-border rounded-sm px-2 py-1 text-sm outline-none"
          autoFocus
        />
        <button type="submit" disabled={pending} className="p-1 text-green-400 disabled:opacity-50">
          <Save className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Descripción / contenido escrito de la lección"
        rows={2}
        className="w-full bg-background border border-border rounded-sm px-2 py-1 text-xs outline-none resize-none"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Video URL (YouTube/Loom/Vimeo - opcional si usas Bunny)"
          className="bg-background border border-border rounded-sm px-2 py-1 text-xs outline-none"
        />
        <input
          value={bunnyId}
          onChange={(e) => setBunnyId(e.target.value)}
          placeholder="Bunny Video ID (preferido)"
          className="bg-background border border-border rounded-sm px-2 py-1 text-xs outline-none"
        />
      </div>
    </form>
  )
}
