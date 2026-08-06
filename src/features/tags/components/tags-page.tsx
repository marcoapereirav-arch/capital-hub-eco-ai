"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Tag as TagIcon, Loader2, X, Check } from "lucide-react"
import { tagsService } from "../services/tags-service"
import { TAG_COLOR_PALETTE, type Tag } from "../types/tag"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { BTN_PRIMARY, FIELD, FONT } from "@/features/crm/lib/brand"
import { cn } from "@/lib/utils"

/**
 * Etiquetas del CRM. Diseno del brandkit oficial.
 *
 * El COLOR de cada etiqueta lo elige el usuario y es un dato, no decoracion: por eso
 * sigue saliendo tal cual lo guardo. Lo que va en brandkit es todo lo de alrededor
 * (fondos, bordes, botones, tipografia).
 */
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-bold tracking-tight text-[#F5F6F7]">
            <TagIcon className="h-5 w-5 text-[#4ADE80]" />
            Etiquetas
            <span className="text-[#7C818A]">{tags.length}</span>
          </h1>
          <p className="mt-1 text-[14px] text-[#A6AAB2]">
            Etiquetas reutilizables para segmentar contactos y disparar automatizaciones.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className={BTN_PRIMARY}>
          <Plus className="h-4 w-4" /> Nueva etiqueta
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar etiqueta por nombre"
        aria-label="Buscar etiqueta"
        className={cn(FIELD, "w-full max-w-md")}
      />

      {loading ? (
        <LoadingScreen fullscreen={false} className="py-20" />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[8px] border border-dashed border-[rgba(245,246,247,0.1)] px-6 py-16 text-center">
          <p className="text-[15px] text-[#A6AAB2]">
            {search ? "Ninguna etiqueta coincide con esa búsqueda." : "Todavía no hay etiquetas."}
          </p>
          {!search && (
            <button onClick={() => setCreating(true)} className={BTN_PRIMARY}>
              <Plus className="h-4 w-4" /> Crear la primera
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              onEdit={() => setEditing(tag)}
              onDelete={async () => {
                if (!confirm(`¿Borrar la etiqueta "${tag.name}"? Se quitará de todos los contactos que la tengan.`)) return
                await tagsService.delete(tag.id)
                load()
              }}
            />
          ))}
        </div>
      )}

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
    <div className="rounded-[4px] border border-[rgba(245,246,247,0.1)] bg-[#131318] p-4 transition-colors hover:border-[rgba(245,246,247,0.2)]">
      <div className="flex items-start justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[13px] font-semibold"
          style={{ backgroundColor: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}55` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
          {tag.name}
        </span>
        {/* Visibles siempre: un boton que solo aparece al pasar el cursor no existe en movil. */}
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            aria-label={`Editar la etiqueta ${tag.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-[4px] text-[#A6AAB2] transition-colors hover:bg-[#16161B] hover:text-[#F5F6F7]"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Borrar la etiqueta ${tag.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-[4px] text-[#A6AAB2] transition-colors hover:bg-[#16161B] hover:text-[#E5B567]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {tag.description && (
        <p className="mt-2.5 line-clamp-2 text-[14px] text-[#A6AAB2]">{tag.description}</p>
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
      setError("Ponle un nombre a la etiqueta para poder guardarla.")
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
      setError(e instanceof Error ? e.message : "No se pudo guardar. Inténtalo otra vez.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      style={{ fontFamily: FONT }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tag ? "Editar etiqueta" : "Nueva etiqueta"}
        className="w-full max-w-md space-y-4 rounded-[8px] border border-[rgba(245,246,247,0.1)] bg-[#131318] p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold tracking-tight text-[#F5F6F7]">
            {tag ? "Editar etiqueta" : "Nueva etiqueta"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-[4px] text-[#A6AAB2] transition-colors hover:bg-[#16161B] hover:text-[#F5F6F7]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-center rounded-[4px] border border-[rgba(245,246,247,0.1)] bg-[#16161B] py-4">
          <span
            className="inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[14px] font-semibold"
            style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {name || "Vista previa"}
          </span>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-[#A6AAB2]">Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="vip, pago_fallido, alumno_evergreen"
            className={cn(FIELD, "w-full")}
            autoFocus
          />
        </label>

        <div>
          <span className="mb-2 block text-[13px] font-semibold text-[#A6AAB2]">Color</span>
          <div className="grid grid-cols-6 gap-2">
            {TAG_COLOR_PALETTE.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={c.label}
                aria-pressed={color === c.value}
                className={cn(
                  "flex h-10 items-center justify-center rounded-[4px] border-2 transition-transform",
                  color === c.value
                    ? "scale-105 border-[#F5F6F7]"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: c.value }}
              >
                {color === c.value && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
          <label className="mt-2.5 flex items-center gap-2">
            <span className="text-[13px] text-[#7C818A]">Otro color</span>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Color en hexadecimal"
              className={cn(FIELD, "h-10 w-28")}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-[#A6AAB2]">
            Descripción <span className="font-normal text-[#7C818A]">(opcional)</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cuándo se usa esta etiqueta"
            rows={2}
            className="w-full resize-none rounded-[4px] border border-[rgba(245,246,247,0.1)] bg-[#16161B] px-3 py-2.5 text-[14px] text-[#F5F6F7] placeholder:text-[#7C818A] transition-colors focus:border-[#24462F] focus:outline-none focus:ring-1 focus:ring-[rgba(34,197,94,0.45)]"
          />
        </label>

        {error && <p className="text-[14px] text-[#E5B567]">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[rgba(245,246,247,0.1)] px-4 text-[14px] font-semibold text-[#A6AAB2] transition-colors hover:border-[rgba(245,246,247,0.2)] hover:bg-[#16161B] hover:text-[#F5F6F7]"
          >
            Cancelar
          </button>
          <button onClick={save} disabled={saving} className={BTN_PRIMARY}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {tag ? "Guardar cambios" : "Crear etiqueta"}
          </button>
        </div>
      </div>
    </div>
  )
}
