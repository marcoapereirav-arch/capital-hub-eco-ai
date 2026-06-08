"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Video, FileText, Loader2, X, ExternalLink, Eye, Image as ImageIcon } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { cn } from "@/lib/utils"
import { buildEmbed } from "../lib/video-embed"

type RouteRow = { id: number; name: string; slug?: string | null; description?: string | null; product_key?: string | null; display_order?: number; active?: boolean }
type FormationRow = { id: number; route_id: number; name: string; description?: string | null; image_url?: string | null; level?: string | null; display_order?: number; active?: boolean }
type ModuleRow = { id: number; formation_id: number; name: string; description?: string | null; display_order?: number; content_type?: string }
type Attachment = { name: string; url: string; type?: string; size?: number }
type LessonRow = { id: number; module_id: number; title: string; content?: string | null; video_url?: string | null; video_provider?: string | null; duration?: string | null; position?: number; attachments?: Attachment[] }

type Tree = {
  routes: RouteRow[]
  formations: FormationRow[]
  modules: ModuleRow[]
  lessons: LessonRow[]
}

type EditTarget =
  | { type: "route"; row?: RouteRow }
  | { type: "formation"; routeId: number; row?: FormationRow }
  | { type: "module"; formationId: number; row?: ModuleRow }
  | { type: "lesson"; moduleId: number; row?: LessonRow }
  | null

export function ContenidoPage() {
  const [tree, setTree] = useState<Tree>({ routes: [], formations: [], modules: [], lessons: [] })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [edit, setEdit] = useState<EditTarget>(null)
  const [previewLesson, setPreviewLesson] = useState<LessonRow | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await fetch("/api/admin/content/tree").then((r) => r.json())
      setTree(data)
    } finally {
      setLoading(false)
    }
  }

  function toggle(key: string) {
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  }

  async function deleteRow(type: string, id: number, label: string) {
    if (!confirm(`Borrar "${label}"? Esto borra todo lo que cuelga abajo.`)) return
    await fetch(`/api/admin/content/${type}?id=${id}`, { method: "DELETE" })
    load()
  }

  return (
    <>
      <ShellHeader title="Contenido alumnos" />

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Contenido de formación</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Sube los vídeos, descripciones y archivos. Los alumnos verán automáticamente solo el contenido del producto que compraron.
            </p>
          </div>
          <button
            onClick={() => setEdit({ type: "route" })}
            className="rounded-sm border border-border/40 px-3 py-2 text-xs font-mono uppercase tracking-wider hover:bg-card flex items-center gap-2"
          >
            <Plus className="h-3 w-3" /> Nueva Ruta
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Cargando…
          </div>
        ) : tree.routes.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/40 p-12 text-center text-sm text-muted-foreground">
            No hay rutas. Crea la primera con &quot;Nueva Ruta&quot;.
          </div>
        ) : (
          <div className="space-y-1.5">
            {tree.routes.map((route) => {
              const isOpen = expanded.has(`r-${route.id}`)
              const formations = tree.formations.filter((f) => f.route_id === route.id)
              return (
                <div key={route.id} className="rounded-md border border-border/40 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-card/30 hover:bg-card/50 transition-colors">
                    <button onClick={() => toggle(`r-${route.id}`)} className="text-muted-foreground hover:text-foreground">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-2">
                        {route.name}
                        {route.product_key && <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-amber-500/[0.1] text-amber-400 border border-amber-500/30">producto</span>}
                      </div>
                      {route.description && <div className="text-xs text-muted-foreground truncate">{route.description}</div>}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {formations.length} formaciones
                    </span>
                    <RowActions
                      onEdit={() => setEdit({ type: "route", row: route })}
                      onDelete={() => deleteRow("routes", route.id, route.name)}
                      onAdd={() => setEdit({ type: "formation", routeId: route.id })}
                      addLabel="Formación"
                    />
                  </div>

                  {isOpen && formations.map((formation) => {
                    const fKey = `f-${formation.id}`
                    const fOpen = expanded.has(fKey)
                    const modules = tree.modules.filter((m) => m.formation_id === formation.id)
                    return (
                      <div key={formation.id} className="border-t border-border/40">
                        <div className="flex items-center gap-2 px-3 py-2.5 pl-8 hover:bg-card/30 transition-colors">
                          <button onClick={() => toggle(fKey)} className="text-muted-foreground hover:text-foreground">
                            {fOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{formation.name}</div>
                            {formation.description && <div className="text-[11px] text-muted-foreground truncate">{formation.description}</div>}
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {modules.length} módulos
                          </span>
                          <RowActions
                            onEdit={() => setEdit({ type: "formation", routeId: route.id, row: formation })}
                            onDelete={() => deleteRow("formations", formation.id, formation.name)}
                            onAdd={() => setEdit({ type: "module", formationId: formation.id })}
                            addLabel="Módulo"
                          />
                        </div>

                        {fOpen && modules.map((module) => {
                          const mKey = `m-${module.id}`
                          const mOpen = expanded.has(mKey)
                          const lessons = tree.lessons.filter((l) => l.module_id === module.id)
                          return (
                            <div key={module.id} className="border-t border-border/40">
                              <div className="flex items-center gap-2 px-3 py-2 pl-14 hover:bg-card/30 transition-colors">
                                <button onClick={() => toggle(mKey)} className="text-muted-foreground hover:text-foreground">
                                  {mOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] truncate">{module.name}</div>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                  {lessons.length} lecciones
                                </span>
                                <RowActions
                                  onEdit={() => setEdit({ type: "module", formationId: formation.id, row: module })}
                                  onDelete={() => deleteRow("modules", module.id, module.name)}
                                  onAdd={() => setEdit({ type: "lesson", moduleId: module.id })}
                                  addLabel="Lección"
                                />
                              </div>

                              {mOpen && lessons.map((lesson) => (
                                <div key={lesson.id} className="flex items-center gap-2 px-3 py-1.5 pl-20 border-t border-border/40 hover:bg-card/30 transition-colors">
                                  <Video className="h-3 w-3 text-blue-400 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs truncate">{lesson.title}</div>
                                    <div className="text-[9px] font-mono text-muted-foreground truncate flex items-center gap-1.5">
                                      {lesson.video_provider && <span className="px-1 py-0.5 bg-blue-500/[0.1] text-blue-400 border border-blue-500/30 rounded-sm">{lesson.video_provider}</span>}
                                      {lesson.duration && <span>{lesson.duration}</span>}
                                      {lesson.attachments && lesson.attachments.length > 0 && <span>{lesson.attachments.length} adjuntos</span>}
                                    </div>
                                  </div>
                                  {lesson.video_url && (
                                    <button
                                      onClick={() => setPreviewLesson(lesson)}
                                      className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
                                      title="Preview"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </button>
                                  )}
                                  <RowActions
                                    onEdit={() => setEdit({ type: "lesson", moduleId: module.id, row: lesson })}
                                    onDelete={() => deleteRow("lessons", lesson.id, lesson.title)}
                                  />
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {edit && <EditModal target={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load() }} />}
        {previewLesson && <PreviewModal lesson={previewLesson} onClose={() => setPreviewLesson(null)} />}
      </div>
    </>
  )
}

function RowActions({
  onEdit,
  onDelete,
  onAdd,
  addLabel,
}: {
  onEdit: () => void
  onDelete: () => void
  onAdd?: () => void
  addLabel?: string
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {onAdd && (
        <button
          onClick={(e) => { e.stopPropagation(); onAdd() }}
          className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border/40 rounded-sm px-1.5 py-0.5 hover:bg-card flex items-center gap-1"
          title={`Añadir ${addLabel}`}
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit() }}
        className="text-muted-foreground hover:text-foreground p-1"
        title="Editar"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="text-muted-foreground hover:text-red-400 p-1"
        title="Borrar"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )
}

function EditModal({ target, onClose, onSaved }: { target: NonNullable<EditTarget>; onClose: () => void; onSaved: () => void }) {
  const isNew = !("row" in target) || !target.row

  // Estado del form
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    const row = "row" in target ? target.row : undefined
    const base: Record<string, unknown> = { ...(row ?? {}) }
    if (target.type === "formation" && !base.route_id) base.route_id = target.routeId
    if (target.type === "module" && !base.formation_id) base.formation_id = target.formationId
    if (target.type === "lesson" && !base.module_id) base.module_id = target.moduleId
    return base
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setSubmitting(true)
    setError(null)
    const type = target.type === "route" ? "routes" : target.type === "formation" ? "formations" : target.type === "module" ? "modules" : "lessons"
    try {
      const method = isNew ? "POST" : "PATCH"
      const url = `/api/admin/content/${type}` + (!isNew ? `?id=${(form as { id: number }).id}` : "")
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error guardando")
        return
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red")
    } finally {
      setSubmitting(false)
    }
  }

  const title = isNew ? "Nueva" : "Editar"
  const typeLabel = target.type === "route" ? "Ruta" : target.type === "formation" ? "Formación" : target.type === "module" ? "Módulo" : "Lección"

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border rounded-t-lg md:rounded-lg w-full max-w-2xl my-auto md:my-0 max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm font-semibold">{title} {typeLabel}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {target.type === "route" && <RouteForm form={form} setForm={setForm} />}
          {target.type === "formation" && <FormationForm form={form} setForm={setForm} />}
          {target.type === "module" && <ModuleForm form={form} setForm={setForm} />}
          {target.type === "lesson" && <LessonForm form={form} setForm={setForm} />}

          {error && <div className="text-xs text-red-400 border border-red-500/30 bg-red-500/[0.06] rounded-sm p-2">{error}</div>}
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border p-3 flex gap-2">
          <button onClick={onClose} className="rounded-sm border border-border/40 px-4 py-2 text-xs font-mono uppercase tracking-wider hover:bg-card">
            Cancelar
          </button>
          <button onClick={submit} disabled={submitting} className="flex-1 rounded-sm bg-foreground text-background px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold disabled:opacity-30 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando</> : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      {children}
      {hint && <p className="text-[10px] font-mono text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm", props.className)} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm resize-none", props.className)} />
}

function RouteForm({ form, setForm }: { form: Record<string, unknown>; setForm: (f: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Nombre"><Input value={(form.name as string) ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Descripción"><Textarea rows={3} value={(form.description as string) ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      <Field label="Slug (url-friendly)" hint="ej: ia-integrator">
        <Input value={(form.slug as string) ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
      </Field>
      <Field label="Product key" hint="Vincula a producto vendido: ia_integrator | media_buyer_digital | comercial_closing">
        <Input value={(form.product_key as string) ?? ""} onChange={(e) => setForm({ ...form, product_key: e.target.value })} />
      </Field>
      <Field label="Orden">
        <Input type="number" value={(form.display_order as number) ?? 1} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 1 })} />
      </Field>
    </>
  )
}

function FormationForm({ form, setForm }: { form: Record<string, unknown>; setForm: (f: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Nombre"><Input value={(form.name as string) ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Descripción"><Textarea rows={3} value={(form.description as string) ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      <Field label="Imagen URL (cover)" hint="ej: https://drive.google.com/...">
        <Input value={(form.image_url as string) ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
      </Field>
      <Field label="Nivel"><Input value={(form.level as string) ?? ""} placeholder="basic / intermediate / advanced" onChange={(e) => setForm({ ...form, level: e.target.value })} /></Field>
      <Field label="Orden"><Input type="number" value={(form.display_order as number) ?? 1} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 1 })} /></Field>
    </>
  )
}

function ModuleForm({ form, setForm }: { form: Record<string, unknown>; setForm: (f: Record<string, unknown>) => void }) {
  return (
    <>
      <Field label="Nombre del módulo"><Input value={(form.name as string) ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Descripción"><Textarea rows={3} value={(form.description as string) ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      <Field label="Orden"><Input type="number" value={(form.display_order as number) ?? 1} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 1 })} /></Field>
    </>
  )
}

function LessonForm({ form, setForm }: { form: Record<string, unknown>; setForm: (f: Record<string, unknown>) => void }) {
  const videoUrl = (form.video_url as string) ?? ""
  const embed = videoUrl ? buildEmbed(videoUrl) : null
  const attachments = (form.attachments as Attachment[]) ?? []

  function addAttachment() {
    setForm({ ...form, attachments: [...attachments, { name: "", url: "", type: "" }] })
  }
  function updateAttachment(i: number, patch: Partial<Attachment>) {
    const next = [...attachments]
    next[i] = { ...next[i], ...patch }
    setForm({ ...form, attachments: next })
  }
  function removeAttachment(i: number) {
    setForm({ ...form, attachments: attachments.filter((_, idx) => idx !== i) })
  }

  return (
    <>
      <Field label="Título"><Input value={(form.title as string) ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
      <Field label="Descripción / contenido (markdown)">
        <Textarea rows={4} value={(form.content as string) ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      </Field>

      <Field
        label="Video URL"
        hint="Soporta: YouTube, Vimeo, Loom, Google Drive (file/d/...), Wistia, Mux y MP4 directos. Pega el enlace y se embebe automáticamente."
      >
        <Input value={videoUrl} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://www.loom.com/share/abc..." />
        {embed && embed.isEmbeddable && (
          <div className="mt-2 text-[10px] font-mono text-green-400 flex items-center gap-1">
            ✓ Detectado: {embed.provider}
          </div>
        )}
        {embed && !embed.isEmbeddable && videoUrl && (
          <div className="mt-2 text-[10px] font-mono text-amber-400 flex items-center gap-1">
            ⚠ URL no reconocida. Probablemente no se embedará bien.
          </div>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Duración (mm:ss)"><Input value={(form.duration as string) ?? ""} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="12:34" /></Field>
        <Field label="Posición en módulo"><Input type="number" value={(form.position as number) ?? 1} onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 1 })} /></Field>
      </div>

      {/* Adjuntos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Adjuntos</label>
          <button onClick={addAttachment} className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border/40 rounded-sm px-2 py-1 flex items-center gap-1">
            <Plus className="h-2.5 w-2.5" /> Añadir adjunto
          </button>
        </div>
        {attachments.length === 0 ? (
          <p className="text-[10px] font-mono text-muted-foreground py-2">Sin adjuntos. Añade enlaces a PDFs, plantillas, etc.</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((att, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_60px_24px] gap-2 items-center">
                <Input placeholder="Nombre" value={att.name} onChange={(e) => updateAttachment(i, { name: e.target.value })} />
                <Input placeholder="URL del archivo" value={att.url} onChange={(e) => updateAttachment(i, { url: e.target.value })} />
                <Input placeholder="PDF" value={att.type ?? ""} onChange={(e) => updateAttachment(i, { type: e.target.value })} />
                <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-red-400">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function PreviewModal({ lesson, onClose }: { lesson: LessonRow; onClose: () => void }) {
  const embed = lesson.video_url ? buildEmbed(lesson.video_url) : null
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{lesson.title}</h3>
            {embed && <p className="text-[10px] font-mono text-muted-foreground">{embed.provider} · {lesson.duration ?? ""}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {embed?.isEmbeddable && embed.embedUrl && (
            <div className="aspect-video bg-black rounded-md overflow-hidden">
              {embed.provider === "direct" ? (
                <video src={embed.embedUrl} controls className="w-full h-full" />
              ) : (
                <iframe src={embed.embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; fullscreen; picture-in-picture" />
              )}
            </div>
          )}
          {lesson.content && (
            <div className="text-sm whitespace-pre-wrap text-muted-foreground">{lesson.content}</div>
          )}
          {lesson.attachments && lesson.attachments.length > 0 && (
            <div className="border-t border-border/40 pt-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Adjuntos ({lesson.attachments.length})</p>
              <div className="space-y-1">
                {lesson.attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs hover:text-foreground text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span className="flex-1 truncate">{att.name}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
