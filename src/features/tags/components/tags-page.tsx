"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Tag as TagIcon, Loader2, X, Check } from "lucide-react"
import { tagsService } from "../services/tags-service"
import { TAG_COLOR_PALETTE, type Tag } from "../types/tag"
import { cn } from "@/lib/utils"

export function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Tag | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await tagsService.list()
      setTags(data)
    } finally {
      setLoading(false)
    }
  }

  const filtered = search
    ? tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tags

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <TagIcon className="h-4 w-4 text-muted-foreground" />
            Tags · {tags.length}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Etiquetas reutilizables para segmentar contactos y disparar automatizaciones.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
        >
          <Plus className="h-3 w-3" /> Nuevo tag
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tag por nombre…"
          className="w-full h-9 rounded-sm border border-border bg-background px-3 text-sm"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-md p-8 text-center">
          <TagIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {search ? "Sin tags que coincidan" : "No hay tags todavia. Crea el primero."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              onEdit={() => setEditing(tag)}
              onDelete={async () => {
                if (!confirm(`¿Borrar tag "${tag.name}"? Se quitara de todos los contactos que lo tengan.`)) return
                await tagsService.delete(tag.id)
                load()
              }}
            />
          ))}
        </div>
      )}

      {/* Modales crear / editar */}
      {(creating || editing) && (
        <TagEditor
          tag={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={() => { setCreating(false); setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function TagCard({ tag, onEdit, onDelete }: { tag: Tag; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-card/30 border border-border rounded-md p-4 group hover:border-foreground/30 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs font-medium"
          style={{ backgroundColor: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}55` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
          {tag.name}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={onDelete} className="p-1 rounded-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {tag.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{tag.description}</p>
      )}
    </div>
  )
}

function TagEditor({ tag, onClose, onSaved }: { tag: Tag | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(tag?.name ?? "")
  const [color, setColor] = useState(tag?.color ?? TAG_COLOR_PALETTE[7].value)
  const [description, setDescription] = useState(tag?.description ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!name.trim()) {
      setError("El nombre es obligatorio")
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (tag) {
        await tagsService.update(tag.id, { name: name.trim(), color, description: description.trim() || undefined })
      } else {
        await tagsService.create({ name: name.trim(), color, description: description.trim() || undefined })
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-md p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{tag ? "Editar tag" : "Nuevo tag"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex items-center justify-center py-3 border border-border rounded-sm bg-background/50">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium"
            style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {name || "Vista previa"}
          </span>
        </div>

        {/* Nombre */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. vip, pago_fallido, alumno_evergreen"
            className="w-full mt-1 h-9 rounded-sm border border-border bg-background px-3 text-sm"
            autoFocus
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Color</label>
          <div className="grid grid-cols-6 gap-2 mt-2">
            {TAG_COLOR_PALETTE.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={cn(
                  "h-8 rounded-sm border-2 transition-all flex items-center justify-center",
                  color === c.value ? "border-foreground scale-110" : "border-transparent hover:scale-105",
                )}
                style={{ backgroundColor: c.value }}
                title={c.label}
              >
                {color === c.value && <Check className="h-3 w-3 text-white" />}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Custom hex:</span>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 rounded-sm border border-border bg-background px-2 text-xs font-mono w-24"
            />
          </div>
        </div>

        {/* Descripcion */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="(opcional) Cuándo se usa este tag…"
            rows={2}
            className="w-full mt-1 rounded-sm border border-border bg-background px-3 py-2 text-sm resize-none"
          />
        </div>

        {error && <div className="text-xs text-red-400">{error}</div>}

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border rounded-sm hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-foreground text-background rounded-sm hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            {tag ? "Guardar" : "Crear tag"}
          </button>
        </div>
      </div>
    </div>
  )
}
