"use client"

import { useState, useEffect } from "react"
import {
  Plus, Pencil, Trash2, Layers, Loader2, X, Check, GripVertical, Star,
} from "lucide-react"
import { pipelinesService } from "../services/pipelines-service"
import { STAGE_COLOR_PALETTE, STAGE_KIND_LABEL, type Pipeline, type PipelineStage, type StageKind } from "../types/pipeline"
import { cn } from "@/lib/utils"

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
    <div className={hideHeader ? "space-y-6" : "mx-auto max-w-7xl space-y-6 pb-24"}>
      {/* Header (oculto en modo drawer) */}
      {!hideHeader && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Pipelines · {pipelines.length}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Crea y gestiona tus pipelines del CRM. Cada uno con sus propios stages, orden y colores.
            </p>
          </div>
          <button
            onClick={() => setCreatingPipeline(true)}
            className="inline-flex items-center gap-1 rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
          >
            <Plus className="h-3 w-3" /> Nuevo pipeline
          </button>
        </div>
      )}
      {/* En modo drawer mostramos el boton 'Nuevo pipeline' inline arriba del grid */}
      {hideHeader && (
        <div className="flex justify-end">
          <button
            onClick={() => setCreatingPipeline(true)}
            className="inline-flex items-center gap-1 rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
          >
            <Plus className="h-3 w-3" /> Nuevo pipeline
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : pipelines.length === 0 ? (
        <div className="border border-dashed border-border rounded-md p-8 text-center">
          <Layers className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No hay pipelines. Crea el primero para empezar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
          {/* Lista lateral */}
          <div className="space-y-1">
            {pipelines.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "w-full text-left rounded-sm border px-3 py-2 transition-colors",
                  selectedId === p.id
                    ? "border-foreground/40 bg-card/50"
                    : "border-border hover:border-foreground/20 hover:bg-card/30",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-sm font-medium truncate flex-1">{p.name}</span>
                  {p.isDefault && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {p.stages.length} stages
                </div>
              </button>
            ))}
          </div>

          {/* Detalle del pipeline seleccionado */}
          <div className="space-y-4">
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

      {/* Modales */}
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

  // Drag & drop reorder
  const [draggingId, setDraggingId] = useState<string | null>(null)

  function onDragStart(stageId: string) {
    setDraggingId(stageId)
  }

  async function onDropOn(targetStageId: string) {
    if (!draggingId || draggingId === targetStageId) { setDraggingId(null); return }
    const fromIdx = stages.findIndex((s) => s.id === draggingId)
    const toIdx = stages.findIndex((s) => s.id === targetStageId)
    if (fromIdx < 0 || toIdx < 0) return

    const next = [...stages]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setStages(next)
    setDraggingId(null)
    try {
      await pipelinesService.reorderStages(pipeline.id, next.map((s) => s.id))
      onReload()
    } catch {
      setStages(pipeline.stages)
    }
  }

  return (
    <div className="bg-card/30 border border-border rounded-md p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pipeline.color }} />
            <h2 className="text-sm font-semibold">{pipeline.name}</h2>
            {pipeline.isDefault && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider border border-amber-500/40 text-amber-400 px-1.5 py-0.5 rounded-sm">
                <Star className="h-2.5 w-2.5 fill-amber-400" /> Default
              </span>
            )}
          </div>
          {pipeline.description && (
            <p className="text-xs text-muted-foreground">{pipeline.description}</p>
          )}
        </div>
        <div className="flex gap-1">
          {!pipeline.isDefault && (
            <button
              onClick={setAsDefault}
              className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 border border-border hover:border-foreground/40 rounded-sm"
              title="Marcar como pipeline por defecto"
            >
              <Star className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 border border-border hover:border-foreground/40 rounded-sm"
          >
            <Pencil className="h-3 w-3" />
          </button>
          {allPipelines.length > 1 && (
            <button
              onClick={deletePipeline}
              className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 border border-border hover:border-red-500/60 hover:text-red-400 rounded-sm"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Stages */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Stages · {stages.length}
          </h3>
          <button
            onClick={() => setCreatingStage(true)}
            className="text-[10px] font-mono uppercase tracking-wider inline-flex items-center gap-1 border border-dashed border-border hover:border-foreground/40 px-2 py-1 rounded-sm"
          >
            <Plus className="h-3 w-3" /> Stage
          </button>
        </div>

        <div className="space-y-1.5">
          {stages.length === 0 && (
            <div className="text-xs text-muted-foreground border border-dashed border-border rounded-sm py-6 text-center">
              Sin stages. Crea el primero.
            </div>
          )}
          {stages.map((s) => (
            <div
              key={s.id}
              draggable
              onDragStart={() => onDragStart(s.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropOn(s.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-sm border bg-background/50 hover:bg-card/50 transition-colors group",
                draggingId === s.id && "opacity-50",
              )}
              style={{ borderColor: `${s.color}55` }}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab active:cursor-grabbing" />
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-sm flex-1">{s.name}</span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                {STAGE_KIND_LABEL[s.kind]}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/60">
                {s.key}
              </span>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingStage(s)}
                  className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => deleteStage(s)}
                  className="p-1 rounded-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-md p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{pipeline ? "Editar pipeline" : "Nuevo pipeline"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Webinar 8 de agosto"
            className="w-full mt-1 h-9 rounded-sm border border-border bg-background px-3 text-sm" autoFocus />
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="(opcional) Para qué usas este pipeline"
            className="w-full mt-1 rounded-sm border border-border bg-background px-3 py-2 text-sm resize-none" />
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Color</label>
          <div className="grid grid-cols-6 gap-2 mt-2">
            {STAGE_COLOR_PALETTE.map((c) => (
              <button key={c.value} type="button" onClick={() => setColor(c.value)}
                className={cn("h-8 rounded-sm border-2 flex items-center justify-center",
                  color === c.value ? "border-foreground scale-110" : "border-transparent hover:scale-105")}
                style={{ backgroundColor: c.value }} title={c.label}>
                {color === c.value && <Check className="h-3 w-3 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="text-xs text-red-400">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border rounded-sm hover:bg-secondary">
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-foreground text-background rounded-sm hover:opacity-90 disabled:opacity-50">
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            {pipeline ? "Guardar" : "Crear pipeline"}
          </button>
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-md p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{stage ? "Editar stage" : "Nuevo stage"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-center py-3 border border-border rounded-sm bg-background/50">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium"
            style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {name || "Vista previa"}
          </span>
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Llamada hecha"
            className="w-full mt-1 h-9 rounded-sm border border-border bg-background px-3 text-sm" autoFocus />
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Tipo</label>
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {(["active", "won", "lost", "branch"] as StageKind[]).map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)}
                className={cn("text-[10px] font-mono uppercase tracking-wider py-1.5 border rounded-sm",
                  kind === k ? "border-foreground bg-foreground/10" : "border-border hover:border-foreground/40")}>
                {STAGE_KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Color</label>
          <div className="grid grid-cols-6 gap-2 mt-2">
            {STAGE_COLOR_PALETTE.map((c) => (
              <button key={c.value} type="button" onClick={() => setColor(c.value)}
                className={cn("h-8 rounded-sm border-2 flex items-center justify-center",
                  color === c.value ? "border-foreground scale-110" : "border-transparent hover:scale-105")}
                style={{ backgroundColor: c.value }} title={c.label}>
                {color === c.value && <Check className="h-3 w-3 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="text-xs text-red-400">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border rounded-sm hover:bg-secondary">
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-foreground text-background rounded-sm hover:opacity-90 disabled:opacity-50">
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            {stage ? "Guardar" : "Crear stage"}
          </button>
        </div>
      </div>
    </div>
  )
}
