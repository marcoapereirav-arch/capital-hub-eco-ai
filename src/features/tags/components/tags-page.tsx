"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Tag as TagIcon, Loader2 } from "lucide-react"
import { tagsService } from "../services/tags-service"
import { TAG_COLOR_PALETTE, type Tag } from "../types/tag"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { LoadingScreen } from "@/components/ui/loading-screen"
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
    <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <TagIcon className="h-4 w-4 text-muted-foreground" />
            Tags · <span className="tabular-nums">{tags.length}</span>
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground md:text-sm">
            Etiquetas reutilizables para segmentar contactos y disparar automatizaciones.
          </p>
        </div>
      </div>

      {/* Buscador en su propia linea + accion principal, como manda la barra de
          herramientas en telefono (maximo dos cosas visibles). */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tag por nombre…"
          inputMode="search"
          enterKeyHint="search"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:max-w-md md:text-sm"
        />
        <button
          onClick={() => setCreating(true)}
          className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 md:ml-auto md:h-9 md:w-auto md:text-sm"
        >
          <Plus className="h-4 w-4" /> Nuevo tag
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <LoadingScreen fullscreen={false} className="min-h-[200px]" />
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <TagIcon className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-[17px] font-semibold text-foreground">
            {search ? "Ningún tag coincide" : "Todavía no hay tags"}
          </h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            {search
              ? "Prueba con otro nombre o crea uno nuevo."
              : "Los tags que crees aparecen aquí y se pueden asignar a cualquier contacto."}
          </p>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90"
          >
            <Plus className="h-4 w-4" /> Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Crear / editar */}
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
    <div className="group rounded-xl border border-border bg-card p-3 transition-colors md:hover:border-foreground/30">
      <div className="flex items-start justify-between gap-2">
        {/* El color del tag lo elige el usuario: es un dato, no diseno */}
        <span
          className="inline-flex min-w-0 items-center gap-1.5 rounded-sm border px-2 py-1 text-[15px] font-medium md:text-sm"
          style={{ backgroundColor: `${tag.color}22`, color: tag.color, borderColor: `${tag.color}55` }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
          <span className="min-w-0 truncate">{tag.name}</span>
        </span>
        {/* En telefono no hay raton: estas acciones se ven siempre */}
        <div className="flex shrink-0 gap-0.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
          <button
            onClick={onEdit}
            aria-label={`Editar ${tag.name}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground md:h-8 md:w-8 md:hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Borrar ${tag.name}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground md:h-8 md:w-8 md:hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {tag.description && (
        <p className="mt-2 line-clamp-2 text-[15px] text-muted-foreground md:text-sm">{tag.description}</p>
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
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="bottom"
        className={
          "max-h-[85dvh] w-full gap-0 overflow-y-auto rounded-t-xl pb-safe-4 " +
          // El `!` es obligatorio: la base de sheet.tsx pinta el lado inferior con
          // `data-[side=bottom]:...`, que compila como `.clase[data-side=bottom]` y
          // pesa mas que `md:left-auto`. Sin el, el cajon del ordenador sale pegado
          // al borde izquierdo y con la altura de una hoja de telefono.
          "md:inset-y-0! md:right-0! md:left-auto! md:h-full! md:max-h-none! md:w-[28rem] md:max-w-[28rem] md:rounded-l-xl md:border-l md:pb-4"
        }
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader className="px-4">
          <SheetTitle className="text-[17px] font-semibold">{tag ? "Editar tag" : "Nuevo tag"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-2">
          {/* Vista previa */}
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
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. vip, pago_fallido, alumno_evergreen"
              enterKeyHint="next"
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"
              autoFocus
            />
          </label>

          {/* Color: lo elige el usuario, va en style. Cada muestra, 44 puntos. */}
          <div>
            <Etiqueta>Color</Etiqueta>
            <div className="mt-2 flex flex-wrap gap-2">
              {TAG_COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Etiqueta>Custom hex:</Etiqueta>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Color en hexadecimal"
                className="h-11 w-28 rounded-lg border border-border bg-card px-3 text-base text-foreground tabular-nums md:h-8 md:text-sm"
              />
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <Etiqueta>Descripción</Etiqueta>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="(opcional) Cuándo se usa este tag…"
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            />
          </label>

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
            {tag ? "Guardar" : "Crear tag"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
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
