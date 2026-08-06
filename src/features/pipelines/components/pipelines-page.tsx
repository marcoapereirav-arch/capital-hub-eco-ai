"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Layers, Loader2, GripVertical, Star } from "lucide-react"
import { pipelinesService } from "../services/pipelines-service"
import { STAGE_COLOR_PALETTE, STAGE_KIND_LABEL, type Pipeline, type PipelineStage, type StageKind } from "../types/pipeline"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { cn } from "@/lib/utils"

/**
 * Hoja inferior en telefono, ventana centrada en ordenador. El lado se fija en
 * "bottom" y el ordenador se ajusta con clases md:, nunca con JavaScript.
 */
const CLASES_HOJA =
  "max-h-[85dvh] w-full gap-0 overflow-y-auto rounded-t-xl pb-safe-4 " +
  // El `!` es obligatorio: la base de sheet.tsx pinta el lado inferior con
  // `data-[side=bottom]:...`, que compila como `.clase[data-side=bottom]` y pesa
  // mas que `md:left-auto`. Sin el, el cajon del ordenador sale pegado al borde
  // izquierdo y con la altura de una hoja de telefono.
  "md:inset-y-0! md:right-0! md:left-auto! md:h-full! md:max-h-none! md:w-[28rem] md:max-w-[28rem] md:rounded-l-xl md:border-l md:pb-4"

/** Un desplegable/campo del kit con los estilos del tema y 44 puntos en telefono. */
const CLASES_CAMPO =
  "h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"

export function PipelinesPage({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creatingPipeline, setCreatingPipeline] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await pipelinesService.list()
      setPipelines(data)
      if (!selectedId && data.length > 0) {
        setSelectedId(data.find((p) => p.isDefault)?.id ?? data[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  const selected = pipelines.find((p) => p.id === selectedId) ?? null

  return (
    <div className={hideHeader ? "space-y-4 py-4 md:space-y-6" : "mx-auto max-w-7xl space-y-4 py-4 md:space-y-6"}>
      {/* Header (oculto en modo hoja) */}
      {!hideHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Pipelines · <span className="tabular-nums">{pipelines.length}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea y gestiona tus pipelines del CRM. Cada uno con sus propios stages, orden y colores.
            </p>
          </div>
        </div>
      )}

      {/* Accion principal: siempre a ancho completo en telefono */}
      <button
        onClick={() => setCreatingPipeline(true)}
        className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 md:ml-auto md:h-9 md:w-auto md:text-sm"
      >
        <Plus className="h-4 w-4" /> Nuevo pipeline
      </button>

      {loading ? (
        <LoadingScreen fullscreen={false} className="min-h-[200px]" />
      ) : pipelines.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <Layers className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-[17px] font-semibold text-foreground">Todavía no hay pipelines</h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            Un pipeline son las etapas por las que pasa un contacto. Crea el primero para empezar.
          </p>
          <button
            onClick={() => setCreatingPipeline(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90"
          >
            <Plus className="h-4 w-4" /> Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
          {/* Lista de pipelines. En telefono es una tira deslizable de fichas; en
              ordenador, la columna lateral de siempre. */}
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0">
            {pipelines.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "w-56 shrink-0 snap-start rounded-lg border px-3 py-2 text-left transition-colors md:w-full",
                  selectedId === p.id
                    ? "border-primary/40 bg-card"
                    : "border-border md:hover:bg-card"
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground md:text-sm">{p.name}</span>
                  {p.isDefault && <Star className="h-4 w-4 shrink-0 fill-primary text-primary" />}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="tabular-nums">{p.stages.length}</span> stages
                </div>
              </button>
            ))}
          </div>

          {/* Detalle del pipeline seleccionado */}
          <div className="min-w-0 space-y-4">
            {selected && (
              <PipelineDetail
                pipeline={selected}
                allPipelines={pipelines}
                onEdit={() => setEditingPipeline(selected)}
                onReload={load}
              />
            )}
          </div>
        </div>
      )}

      {/* Crear / editar pipeline */}
      {(creatingPipeline || editingPipeline) && (
        <PipelineEditor
          pipeline={editingPipeline}
          onClose={() => { setCreatingPipeline(false); setEditingPipeline(null) }}
          onSaved={() => { setCreatingPipeline(false); setEditingPipeline(null); load() }}
        />
      )}
    </div>
  )
}

function PipelineDetail({
  pipeline,
  allPipelines,
  onEdit,
  onReload,
}: {
  pipeline: Pipeline
  allPipelines: Pipeline[]
  onEdit: () => void
  onReload: () => void
}) {
  const [creatingStage, setCreatingStage] = useState(false)
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null)
  const [stages, setStages] = useState(pipeline.stages)

  useEffect(() => { setStages(pipeline.stages) }, [pipeline.stages])

  async function deletePipeline() {
    if (!confirm(`¿Borrar pipeline "${pipeline.name}"? Se perdera la asignacion de contactos a este pipeline.`)) return
    try {
      await pipelinesService.delete(pipeline.id)
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error borrando pipeline")
    }
  }

  async function setAsDefault() {
    await pipelinesService.update(pipeline.id, { isDefault: true })
    onReload()
  }

  async function deleteStage(stage: PipelineStage) {
    if (!confirm(`¿Borrar stage "${stage.name}"?`)) return
    try {
      await pipelinesService.deleteStage(pipeline.id, stage.id)
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  // Reordenar arrastrando. En telefono el dedo que arrastra pelea con el dedo que
  // desplaza, asi que ahi el orden se cambia con las flechas de cada fila.
  const [draggingId, setDraggingId] = useState<string | null>(null)

  function onDragStart(stageId: string) {
    setDraggingId(stageId)
  }

  async function guardarOrden(next: PipelineStage[]) {
    setStages(next)
    try {
      await pipelinesService.reorderStages(pipeline.id, next.map((s) => s.id))
      onReload()
    } catch {
      setStages(pipeline.stages)
    }
  }

  async function onDropOn(targetStageId: string) {
    if (!draggingId || draggingId === targetStageId) { setDraggingId(null); return }
    const fromIdx = stages.findIndex((s) => s.id === draggingId)
    const toIdx = stages.findIndex((s) => s.id === targetStageId)
    if (fromIdx < 0 || toIdx < 0) return

    const next = [...stages]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setDraggingId(null)
    await guardarOrden(next)
  }

  async function mover(idx: number, delta: number) {
    const destino = idx + delta
    if (destino < 0 || destino >= stages.length) return
    const next = [...stages]
    const [moved] = next.splice(idx, 1)
    next.splice(destino, 0, moved)
    await guardarOrden(next)
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: pipeline.color }} />
            <h2 className="min-w-0 truncate text-[17px] font-semibold text-foreground">{pipeline.name}</h2>
            {pipeline.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-primary/40 px-1.5 py-0.5 text-sm text-primary">
                <Star className="h-3 w-3 fill-primary" /> Default
              </span>
            )}
          </div>
          {pipeline.description && (
            <p className="text-[15px] text-muted-foreground md:text-sm">{pipeline.description}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {!pipeline.isDefault && (
            <button
              onClick={setAsDefault}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground md:h-9 md:w-9 md:hover:text-foreground"
              title="Marcar como pipeline por defecto"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            aria-label="Editar pipeline"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground md:h-9 md:w-9 md:hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {allPipelines.length > 1 && (
            <button
              onClick={deletePipeline}
              aria-label="Borrar pipeline"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground md:h-9 md:w-9 md:hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stages */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Stages · <span className="tabular-nums">{stages.length}</span>
          </h3>
          <button
            onClick={() => setCreatingStage(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-[15px] text-foreground md:h-8 md:text-sm"
          >
            <Plus className="h-4 w-4" /> Stage
          </button>
        </div>

        <div className="space-y-1.5">
          {stages.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-6 text-center text-[15px] text-muted-foreground">
              Sin stages. Crea el primero.
            </div>
          )}
          {stages.map((s, idx) => (
            <div
              key={s.id}
              draggable
              onDragStart={() => onDragStart(s.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropOn(s.id)}
              className={cn(
                "group flex flex-wrap items-center gap-2 rounded-lg border bg-background px-2 py-2 transition-colors md:px-3",
                draggingId === s.id && "opacity-50"
              )}
              style={{ borderColor: `${s.color}55` }}
            >
              <GripVertical className="hidden h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing md:block" />
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="min-w-0 flex-1 truncate text-[15px] text-foreground md:text-sm">{s.name}</span>
              <span className="shrink-0 text-sm text-muted-foreground">{STAGE_KIND_LABEL[s.kind]}</span>

              {/* En telefono el orden se cambia con las flechas: arrastrar pelea
                  con el dedo que hace scroll y no se puede soltar donde toca. */}
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => mover(idx, -1)}
                  disabled={idx === 0}
                  aria-label={`Subir ${s.name}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground disabled:opacity-30 md:hidden"
                >
                  <span aria-hidden className="text-[17px] leading-none">↑</span>
                </button>
                <button
                  onClick={() => mover(idx, 1)}
                  disabled={idx === stages.length - 1}
                  aria-label={`Bajar ${s.name}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground disabled:opacity-30 md:hidden"
                >
                  <span aria-hidden className="text-[17px] leading-none">↓</span>
                </button>
                <button
                  onClick={() => setEditingStage(s)}
                  aria-label={`Editar ${s.name}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground opacity-100 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 md:hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteStage(s)}
                  aria-label={`Borrar ${s.name}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground opacity-100 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 md:hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(creatingStage || editingStage) && (
        <StageEditor
          pipelineId={pipeline.id}
          stage={editingStage}
          onClose={() => { setCreatingStage(false); setEditingStage(null) }}
          onSaved={() => { setCreatingStage(false); setEditingStage(null); onReload() }}
        />
      )}
    </div>
  )
}

function PipelineEditor({ pipeline, onClose, onSaved }: {
  pipeline: Pipeline | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(pipeline?.name ?? "")
  const [description, setDescription] = useState(pipeline?.description ?? "")
  const [color, setColor] = useState(pipeline?.color ?? STAGE_COLOR_PALETTE[1].value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!name.trim()) { setError("Nombre requerido"); return }
    setSaving(true)
    setError(null)
    try {
      if (pipeline) {
        await pipelinesService.update(pipeline.id, { name: name.trim(), description: description.trim() || null, color })
      } else {
        await pipelinesService.create({ name: name.trim(), description: description.trim() || undefined, color })
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className={CLASES_HOJA}>
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader className="px-4">
          <SheetTitle className="text-[17px] font-semibold">
            {pipeline ? "Editar pipeline" : "Nuevo pipeline"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-2">
          <label className="flex flex-col gap-1.5">
            <Etiqueta>Nombre</Etiqueta>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Webinar 8 de agosto"
              enterKeyHint="next"
              className={CLASES_CAMPO}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <Etiqueta>Descripción</Etiqueta>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="(opcional) Para qué usas este pipeline"
              className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            />
          </label>

          <SelectorDeColor color={color} onChange={setColor} />

          {error && <p className="text-[15px] text-destructive">{error}</p>}
        </div>

        {/* La accion principal va abajo con sticky (no fixed): el desplazamiento
            real lo hace la hoja, y `fixed` se queda donde el teclado lo tapa. */}
        <div className="sticky bottom-0 z-10 flex gap-2 border-t border-border bg-popover px-4 pt-3 pb-2">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-border text-[15px] text-foreground md:h-9 md:flex-none md:px-4 md:text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50 md:h-9 md:flex-none md:px-4 md:text-sm"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {pipeline ? "Guardar" : "Crear pipeline"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function StageEditor({ pipelineId, stage, onClose, onSaved }: {
  pipelineId: string
  stage: PipelineStage | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(stage?.name ?? "")
  const [color, setColor] = useState(stage?.color ?? STAGE_COLOR_PALETTE[11].value)
  const [kind, setKind] = useState<StageKind>(stage?.kind ?? "active")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!name.trim()) { setError("Nombre requerido"); return }
    setSaving(true)
    setError(null)
    try {
      if (stage) {
        await pipelinesService.updateStage(pipelineId, stage.id, { name: name.trim(), color, kind })
      } else {
        await pipelinesService.addStage(pipelineId, { name: name.trim(), color, kind })
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className={CLASES_HOJA}>
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader className="px-4">
          <SheetTitle className="text-[17px] font-semibold">
            {stage ? "Editar stage" : "Nuevo stage"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-2">
          {/* Vista previa: el color lo elige el usuario, por eso va en style */}
          <div className="flex items-center justify-center rounded-lg border border-border bg-background py-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[15px] font-medium"
              style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {name || "Vista previa"}
            </span>
          </div>

          <label className="flex flex-col gap-1.5">
            <Etiqueta>Nombre</Etiqueta>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Llamada hecha"
              enterKeyHint="done"
              className={CLASES_CAMPO}
              autoFocus
            />
          </label>

          <div>
            <Etiqueta>Tipo</Etiqueta>
            <div className="mt-2 grid grid-cols-2 gap-1.5 md:grid-cols-4">
              {(["active", "won", "lost", "branch"] as StageKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "h-11 rounded-lg border text-[15px] md:h-9 md:text-sm",
                    kind === k
                      ? "border-primary bg-primary/10 font-semibold text-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {STAGE_KIND_LABEL[k]}
                </button>
              ))}
            </div>
          </div>

          <SelectorDeColor color={color} onChange={setColor} />

          {error && <p className="text-[15px] text-destructive">{error}</p>}
        </div>

        <div className="sticky bottom-0 z-10 flex gap-2 border-t border-border bg-popover px-4 pt-3 pb-2">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-border text-[15px] text-foreground md:h-9 md:flex-none md:px-4 md:text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50 md:h-9 md:flex-none md:px-4 md:text-sm"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {stage ? "Guardar" : "Crear stage"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Paleta de colores del pipeline o del stage. Los colores son datos que elige el
 * USUARIO, no diseno: por eso van en `style`. Cada muestra mide 44 puntos.
 */
function SelectorDeColor({ color, onChange }: { color: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Etiqueta>Color</Etiqueta>
      <div className="mt-2 flex flex-wrap gap-2">
        {STAGE_COLOR_PALETTE.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={cn(
              "h-11 w-11 rounded-lg border-2 md:h-8 md:w-8",
              color === c.value ? "border-foreground" : "border-transparent"
            )}
            style={{ backgroundColor: c.value }}
            title={c.label}
            aria-label={c.label}
            aria-pressed={color === c.value}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Etiqueta de un campo. Va en su propio componente a proposito: escrita pegada
 * al <input> el candado la confunde con la letra DEL campo (mira dos lineas
 * arriba y dos abajo) y bloquea el guardado. Aqui la clase no toca ningun campo.
 */
function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-muted-foreground">{children}</span>
}
