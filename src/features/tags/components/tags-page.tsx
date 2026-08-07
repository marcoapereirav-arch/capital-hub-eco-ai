"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Plus, Pencil, Trash2, Tag as TagIcon, Loader2, X, Check } from "lucide-react"
import { tagsService } from "../services/tags-service"
import { TAG_COLOR_PALETTE, type Tag } from "../types/tag"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { BTN_GHOST, BTN_PRIMARY, CARD, FIELD, FONT, PANEL } from "@/features/crm/lib/brand"
import { cn } from "@/lib/utils"

/**
 * Etiquetas del CRM. Diseno del brandkit oficial.
 *
 * El COLOR de cada etiqueta lo elige el usuario y es un dato, no decoracion: por eso
 * sigue saliendo tal cual lo guardo, por `style`. Lo que va en brandkit es todo lo de
 * alrededor (fondos, bordes, textos, botones), y se pinta con los tokens del tema
 * (`bg-card`, `border-border`, `text-muted-foreground`...) definidos en
 * `src/app/globals.css`. Las clases largas reutilizables viven en
 * `@/features/crm/lib/brand`, que tambien esta escrito con esos tokens.
 *
 * Medidas de telefono: todo lo que se toca mide 44 puntos de alto y la letra nunca baja
 * de 14 puntos. Las variantes `md:` devuelven la densidad de monitor.
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
      {/* En telefono el titulo y la accion van uno debajo de otro; a partir de md vuelven
          a la misma linea, con la accion a la derecha. */}
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-[20px] font-bold tracking-tight text-foreground">
            <TagIcon className="h-5 w-5 text-primary" />
            Etiquetas
            <span className="tabular-nums text-muted-foreground">{tags.length}</span>
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Etiquetas reutilizables para segmentar contactos y disparar automatizaciones.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className={cn(BTN_PRIMARY, "w-full md:w-auto")}>
          <Plus className="h-4 w-4" /> Nueva etiqueta
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar etiqueta por nombre"
        aria-label="Buscar etiqueta"
        inputMode="search"
        enterKeyHint="search"
        className={cn(FIELD, "w-full max-w-md")}
      />

      {loading ? (
        <LoadingScreen fullscreen={false} className="py-20" />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[8px] border border-dashed border-border px-6 py-16 text-center">
          <p className="text-[15px] text-muted-foreground">
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
    <div className={cn(CARD, "p-4 transition-colors hover:border-foreground/20")}>
      <div className="flex items-start justify-between gap-2">
        <span
          className="inline-flex min-w-0 items-center gap-1.5 rounded-[3px] px-2 py-1 text-[14px] font-semibold md:text-[13px]"
          style={{ backgroundColor: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}55` }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
          <span className="min-w-0 truncate">{tag.name}</span>
        </span>
        {/* Visibles siempre: un boton que solo aparece al pasar el cursor no existe en movil.
            44 puntos en telefono, 36 en monitor. */}
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            aria-label={`Editar la etiqueta ${tag.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-[4px] text-muted-foreground transition-colors hover:bg-popover hover:text-foreground md:h-9 md:w-9"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Borrar la etiqueta ${tag.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-[4px] text-muted-foreground transition-colors hover:bg-popover hover:text-warn md:h-9 md:w-9"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {tag.description && (
        <p className="mt-2.5 line-clamp-2 text-[14px] text-muted-foreground">{tag.description}</p>
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

  // La ventana se pinta en el body con un portal, NUNCA anidada aqui dentro: si
  // algun padre tiene desenfoque o transform, pasa a ser el marco de referencia de
  // lo que es `fixed` y la ventana se encoge en una esquina. Es el fallo recurrente
  // de la SOP 47 (causa raiz 3), que ya paso con la campana de notificaciones.
  const contenido = (
    // En telefono el editor es una hoja pegada abajo (se alcanza con el pulgar); a partir
    // de md vuelve a ser la ventana centrada de siempre.
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 md:items-center md:p-4"
      onClick={onClose}
      style={{ fontFamily: FONT }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tag ? "Editar etiqueta" : "Nueva etiqueta"}
        className={cn(
          PANEL,
          "w-full max-w-none space-y-4 rounded-t-[8px] rounded-b-none p-4 pb-safe-4",
          "max-h-[88dvh] overflow-y-auto shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]",
          "md:max-h-none md:max-w-md md:rounded-b-[8px] md:p-6 md:pb-6"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold tracking-tight text-foreground">
            {tag ? "Editar etiqueta" : "Nueva etiqueta"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-[4px] text-muted-foreground transition-colors hover:bg-popover hover:text-foreground md:h-9 md:w-9"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-center rounded-[4px] border border-border bg-popover py-4">
          <span
            className="inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[14px] font-semibold"
            style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {name || "Vista previa"}
          </span>
        </div>

        <label className="block">
          <Etiqueta>Nombre</Etiqueta>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="vip, pago_fallido, alumno_evergreen"
            enterKeyHint="next"
            className={cn(FIELD, "w-full")}
            autoFocus
          />
        </label>

        <div>
          <Etiqueta>Color</Etiqueta>
          {/* Cada muestra mide 44 puntos en telefono. */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {TAG_COLOR_PALETTE.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={c.label}
                aria-pressed={color === c.value}
                className={cn(
                  "flex h-11 items-center justify-center rounded-[4px] border-2 transition-transform md:h-10",
                  color === c.value
                    ? "scale-105 border-foreground"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: c.value }}
              >
                {color === c.value && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
          <label className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="text-[14px] text-muted-foreground md:text-[13px]">Otro color</span>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Color en hexadecimal"
              className={cn(FIELD, "w-28 tabular-nums md:h-10")}
            />
          </label>
        </div>

        <label className="block">
          <Etiqueta>
            Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
          </Etiqueta>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cuándo se usa esta etiqueta"
            rows={2}
            className="w-full resize-none rounded-[4px] border border-border bg-popover px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/45"
          />
        </label>

        {error && <p className="text-[14px] text-warn">{error}</p>}

        {/* En telefono los dos botones se reparten el ancho; en monitor vuelven a la
            derecha, con su tamano natural. */}
        <div className="flex gap-2 pt-1 md:justify-end">
          <button onClick={onClose} className={cn(BTN_GHOST, "flex-1 md:flex-none")}>
            Cancelar
          </button>
          <button onClick={save} disabled={saving} className={cn(BTN_PRIMARY, "flex-1 md:flex-none")}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {tag ? "Guardar cambios" : "Crear etiqueta"}
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === "undefined") return null
  return createPortal(contenido, document.body)
}

/**
 * Titulo de un campo. Va en su propio componente a proposito: escrito pegado al `<input>`
 * el candado lo confunde con la letra DEL campo (mira dos lineas arriba y dos abajo) y
 * bloquea el guardado. Aqui la clase no toca ningun campo.
 *
 * 14 puntos en telefono, 13 en monitor.
 */
function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[14px] font-semibold text-muted-foreground md:text-[13px]">
      {children}
    </span>
  )
}
