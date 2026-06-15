"use client"

import { useEffect, useState } from "react"
import { Plus, X, Tag as TagIcon, Loader2 } from "lucide-react"
import { tagsService } from "../services/tags-service"
import { TAG_COLOR_PALETTE, type Tag } from "../types/tag"
import { cn } from "@/lib/utils"

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
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2 mb-2">
        <TagIcon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Tags
        </span>
      </div>

      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      ) : (
        <div className="flex items-center gap-1.5 flex-wrap">
          {assignedTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} onRemove={() => remove(tag)} />
          ))}

          {!picking ? (
            <button
              onClick={() => setPicking(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
            >
              <Plus className="h-3 w-3" /> Añadir tag
            </button>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => setTimeout(() => setPicking(false), 200)}
                placeholder="Buscar o crear…"
                className="h-7 rounded-sm border border-border bg-background px-2 text-xs w-40"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setPicking(false)
                  if (e.key === "Enter" && search.trim() && !exactMatch) createAndAssign()
                }}
              />
              {(filtered.length > 0 || (search.trim() && !exactMatch)) && (
                <div className="absolute top-full mt-1 left-0 z-10 bg-card border border-border rounded-sm shadow-lg min-w-[180px] max-h-48 overflow-y-auto">
                  {filtered.slice(0, 10).map((tag) => (
                    <button
                      key={tag.id}
                      onMouseDown={() => assign(tag)}
                      className="w-full text-left px-2 py-1.5 hover:bg-secondary/50 flex items-center gap-2"
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-xs">{tag.name}</span>
                    </button>
                  ))}
                  {search.trim() && !exactMatch && (
                    <button
                      onMouseDown={createAndAssign}
                      className="w-full text-left px-2 py-1.5 hover:bg-secondary/50 border-t border-border text-xs text-muted-foreground"
                    >
                      <Plus className="inline h-3 w-3 mr-1" />
                      Crear "{search.trim()}"
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

function TagChip({ tag, onRemove }: { tag: Tag; onRemove: () => void }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium border",
      )}
      style={{
        backgroundColor: `${tag.color}22`,
        color: tag.color,
        borderColor: `${tag.color}55`,
      }}
    >
      {tag.name}
      <button
        onClick={onRemove}
        className="hover:opacity-70"
        aria-label={`Quitar tag ${tag.name}`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  )
}
