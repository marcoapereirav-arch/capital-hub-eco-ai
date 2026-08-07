"use client"

import { useEffect, useState } from "react"
import { Plus, X } from "lucide-react"
import { tagsService } from "../services/tags-service"
import { TAG_COLOR_PALETTE, type Tag } from "../types/tag"
import { FIELD } from "@/features/crm/lib/brand"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { cn } from "@/lib/utils"

/**
 * Etiquetas de un contacto dentro de su ficha: las que tiene, quitar y anadir.
 * Si se escribe un nombre que no existe, la crea al vuelo.
 */
export function ContactTagsPanel({ contactId }: { contactId: string }) {
  const [assignedTags, setAssignedTags] = useState<Tag[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [picking, setPicking] = useState(false)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [contactId])

  async function load() {
    setLoading(true)
    try {
      const [forContact, all] = await Promise.all([
        tagsService.listForContact(contactId),
        tagsService.list(),
      ])
      setAssignedTags(forContact)
      setAllTags(all)
    } finally {
      setLoading(false)
    }
  }

  async function assign(tag: Tag) {
    setAssignedTags((prev) => [...prev, tag])
    setPicking(false)
    setSearch("")
    try {
      await tagsService.assignToContact(contactId, tag.id)
    } catch {
      setAssignedTags((prev) => prev.filter((t) => t.id !== tag.id))
      setError("No se pudo añadir la etiqueta. Inténtalo otra vez.")
    }
  }

  async function remove(tag: Tag) {
    setAssignedTags((prev) => prev.filter((t) => t.id !== tag.id))
    try {
      await tagsService.removeFromContact(contactId, tag.id)
    } catch {
      setAssignedTags((prev) => [...prev, tag])
      setError("No se pudo quitar la etiqueta. Inténtalo otra vez.")
    }
  }

  async function createAndAssign() {
    const name = search.trim()
    if (!name) return
    setError(null)
    try {
      const newTag = await tagsService.create({
        name,
        color: TAG_COLOR_PALETTE[Math.floor(Math.random() * TAG_COLOR_PALETTE.length)].value,
      })
      setAllTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)))
      await assign(newTag)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la etiqueta.")
    }
  }

  const assignedIds = new Set(assignedTags.map((t) => t.id))
  const available = allTags.filter((t) => !assignedIds.has(t.id))
  const filtered = search
    ? available.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : available
  const exactMatch = allTags.some((t) => t.name.toLowerCase() === search.toLowerCase())

  return (
    <div className="border-b border-border px-4 py-3">
      <p className="mb-2 text-[14px] font-semibold text-muted-foreground md:text-[13px]">Etiquetas</p>

      {loading ? (
        <LoadingScreen fullscreen={false} className="min-h-[56px] bg-transparent" />
      ) : (
        <div className="flex flex-wrap items-center gap-2 md:gap-1.5">
          {assignedTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} onRemove={() => remove(tag)} />
          ))}

          {!picking ? (
            <button
              onClick={() => setPicking(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[3px] border border-dashed border-foreground/20 px-2.5 text-[14px] font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary md:min-h-[36px] md:text-[13px]"
            >
              <Plus className="h-4 w-4 md:h-3.5 md:w-3.5" /> Añadir etiqueta
            </button>
          ) : (
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => setTimeout(() => setPicking(false), 200)}
                placeholder="Buscar o crear"
                aria-label="Buscar o crear etiqueta"
                className={cn(FIELD, "w-full md:h-10 md:w-48")}
                autoFocus
                enterKeyHint="done"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setPicking(false)
                  if (e.key === "Enter" && search.trim() && !exactMatch) createAndAssign()
                }}
              />
              {(filtered.length > 0 || (search.trim() && !exactMatch)) && (
                <div className="absolute left-0 top-full z-20 mt-1 max-h-52 w-full overflow-y-auto overscroll-contain rounded-[4px] border border-border bg-popover shadow-[0_18px_40px_-16px_rgba(0,0,0,0.85)] md:w-auto md:min-w-[200px]">
                  {filtered.slice(0, 10).map((tag) => (
                    <button
                      key={tag.id}
                      onMouseDown={() => assign(tag)}
                      className="flex min-h-[44px] w-full items-center gap-2 px-3 text-left text-[14px] text-foreground transition-colors active:bg-card md:min-h-[40px] md:hover:bg-card"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="min-w-0 truncate">{tag.name}</span>
                    </button>
                  ))}
                  {search.trim() && !exactMatch && (
                    <button
                      onMouseDown={createAndAssign}
                      className="flex min-h-[44px] w-full items-center gap-1.5 border-t border-border px-3 text-left text-[14px] text-primary transition-colors active:bg-card md:min-h-[40px] md:hover:bg-card"
                    >
                      <Plus className="h-4 w-4 md:h-3.5 md:w-3.5" />
                      Crear {search.trim()}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-[14px] text-warn md:text-[13px]">{error}</p>}
    </div>
  )
}

/**
 * El color del chip lo elige el usuario al crear la etiqueta: es un dato de producto,
 * por eso va en `style` y no en clases.
 */
function TagChip({ tag, onRemove }: { tag: Tag; onRemove: () => void }) {
  return (
    <span
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[3px] border pl-2.5 pr-0 text-[14px] font-medium md:min-h-[36px] md:pr-1 md:text-[13px]"
      style={{
        backgroundColor: `${tag.color}1f`,
        color: tag.color,
        borderColor: `${tag.color}4d`,
      }}
    >
      {tag.name}
      <button
        onClick={onRemove}
        className="inline-flex h-11 w-11 items-center justify-center rounded-[3px] transition-opacity hover:opacity-70 md:h-6 md:w-6"
        aria-label={`Quitar la etiqueta ${tag.name}`}
      >
        <X className="h-4 w-4 md:h-3.5 md:w-3.5" />
      </button>
    </span>
  )
}
