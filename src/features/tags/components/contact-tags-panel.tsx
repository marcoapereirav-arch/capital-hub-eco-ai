"use client"

import { useEffect, useState } from "react"
import { Plus, X, Tag as TagIcon } from "lucide-react"
import { tagsService } from "../services/tags-service"
import { TAG_COLOR_PALETTE, type Tag } from "../types/tag"
import { LoadingScreen } from "@/components/ui/loading-screen"

/**
 * Panel de tags para un contacto. Muestra los tags asignados y permite anadir/quitar.
 * Si el tag no existe, lo crea inline.
 */
export function ContactTagsPanel({ contactId }: { contactId: string }) {
  const [assignedTags, setAssignedTags] = useState<Tag[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [picking, setPicking] = useState(false)
  const [search, setSearch] = useState("")

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
    }
  }

  async function remove(tag: Tag) {
    setAssignedTags((prev) => prev.filter((t) => t.id !== tag.id))
    try {
      await tagsService.removeFromContact(contactId, tag.id)
    } catch {
      setAssignedTags((prev) => [...prev, tag])
    }
  }

  async function createAndAssign() {
    const name = search.trim()
    if (!name) return
    try {
      const newTag = await tagsService.create({
        name,
        color: TAG_COLOR_PALETTE[Math.floor(Math.random() * TAG_COLOR_PALETTE.length)].value,
      })
      setAllTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)))
      await assign(newTag)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error creando tag")
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
      <div className="mb-2 flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-muted-foreground">Tags</span>
      </div>

      {loading ? (
        <LoadingScreen fullscreen={false} className="min-h-[56px] bg-transparent" />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {assignedTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} onRemove={() => remove(tag)} />
          ))}

          {!picking ? (
            <button
              onClick={() => setPicking(true)}
              className="inline-flex h-11 items-center gap-1 rounded-lg border border-dashed border-border px-3 text-[15px] text-muted-foreground transition-colors md:h-8 md:text-sm md:hover:text-foreground"
            >
              <Plus className="h-4 w-4" /> Añadir tag
            </button>
          ) : (
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => setTimeout(() => setPicking(false), 200)}
                placeholder="Buscar o crear…"
                className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-8 md:w-56 md:text-sm"
                autoFocus
                enterKeyHint="done"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setPicking(false)
                  if (e.key === "Enter" && search.trim() && !exactMatch) createAndAssign()
                }}
              />
              {(filtered.length > 0 || (search.trim() && !exactMatch)) && (
                <div className="absolute top-full left-0 z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-lg md:w-56">
                  {filtered.slice(0, 10).map((tag) => (
                    <button
                      key={tag.id}
                      onMouseDown={() => assign(tag)}
                      className="flex h-11 w-full items-center gap-2 px-3 text-left text-[15px] text-foreground active:bg-muted md:h-9 md:text-sm md:hover:bg-muted"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="min-w-0 truncate">{tag.name}</span>
                    </button>
                  ))}
                  {search.trim() && !exactMatch && (
                    <button
                      onMouseDown={createAndAssign}
                      className="flex h-11 w-full items-center gap-1 border-t border-border px-3 text-left text-[15px] text-muted-foreground active:bg-muted md:h-9 md:text-sm md:hover:bg-muted"
                    >
                      <Plus className="h-4 w-4" />
                      Crear &quot;{search.trim()}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * El color del chip lo elige el usuario al crear el tag: es un dato de producto,
 * por eso va en `style` y no en clases del tema.
 */
function TagChip({ tag, onRemove }: { tag: Tag; onRemove: () => void }) {
  return (
    <span
      className="inline-flex h-11 items-center gap-0.5 rounded-sm border pr-0 pl-2.5 text-sm font-medium md:h-6"
      style={{
        backgroundColor: `${tag.color}22`,
        color: tag.color,
        borderColor: `${tag.color}55`,
      }}
    >
      {tag.name}
      <button
        onClick={onRemove}
        className="inline-flex h-11 w-11 items-center justify-center rounded-sm md:h-6 md:w-6"
        aria-label={`Quitar tag ${tag.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}
