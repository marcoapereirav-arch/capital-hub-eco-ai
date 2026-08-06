"use client"

import { useEffect, useState } from "react"
import { Plus, X, Loader2 } from "lucide-react"
import { tagsService } from "../services/tags-service"
import { TAG_COLOR_PALETTE, type Tag } from "../types/tag"
import { FIELD } from "@/features/crm/lib/brand"
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
    <div className="border-b border-[rgba(245,246,247,0.1)] px-4 py-3">
      <p className="mb-2 text-[13px] font-semibold text-[#A6AAB2]">Etiquetas</p>

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-[#7C818A]" />
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {assignedTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} onRemove={() => remove(tag)} />
          ))}

          {!picking ? (
            <button
              onClick={() => setPicking(true)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[3px] border border-dashed border-[rgba(245,246,247,0.2)] px-2.5 text-[13px] font-semibold text-[#A6AAB2] transition-colors hover:border-[#24462F] hover:text-[#4ADE80]"
            >
              <Plus className="h-3.5 w-3.5" /> Añadir etiqueta
            </button>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => setTimeout(() => setPicking(false), 200)}
                placeholder="Buscar o crear"
                aria-label="Buscar o crear etiqueta"
                className={cn(FIELD, "h-10 w-48")}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setPicking(false)
                  if (e.key === "Enter" && search.trim() && !exactMatch) createAndAssign()
                }}
              />
              {(filtered.length > 0 || (search.trim() && !exactMatch)) && (
                <div className="absolute left-0 top-full z-20 mt-1 max-h-52 min-w-[200px] overflow-y-auto overscroll-contain rounded-[4px] border border-[rgba(245,246,247,0.1)] bg-[#16161B] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.85)]">
                  {filtered.slice(0, 10).map((tag) => (
                    <button
                      key={tag.id}
                      onMouseDown={() => assign(tag)}
                      className="flex min-h-[40px] w-full items-center gap-2 px-3 text-left text-[14px] text-[#F5F6F7] transition-colors hover:bg-[#131318]"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="truncate">{tag.name}</span>
                    </button>
                  ))}
                  {search.trim() && !exactMatch && (
                    <button
                      onMouseDown={createAndAssign}
                      className="flex min-h-[40px] w-full items-center gap-1.5 border-t border-[rgba(245,246,247,0.1)] px-3 text-left text-[14px] text-[#4ADE80] transition-colors hover:bg-[#131318]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Crear {search.trim()}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-[13px] text-[#E5B567]">{error}</p>}
    </div>
  )
}

function TagChip({ tag, onRemove }: { tag: Tag; onRemove: () => void }) {
  return (
    <span
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[3px] border px-2.5 text-[13px] font-medium"
      style={{
        backgroundColor: `${tag.color}1f`,
        color: tag.color,
        borderColor: `${tag.color}4d`,
      }}
    >
      {tag.name}
      <button
        onClick={onRemove}
        className="transition-opacity hover:opacity-70"
        aria-label={`Quitar la etiqueta ${tag.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}
