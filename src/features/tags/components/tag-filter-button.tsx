"use client"

import { useState, useEffect, useRef } from "react"
import { Tag as TagIcon, Check, X } from "lucide-react"
import type { Tag } from "../types/tag"
import { cn } from "@/lib/utils"

/**
 * Filtro multi-tag.
 *
 * En telefono NO se usa este boton: los filtros del CRM viven todos dentro de la
 * hoja inferior "Filtros", y alli se pinta <TagFilterList /> directamente. Un menu
 * flotante en telefono se sale de la pantalla y no se puede arrastrar.
 */
export function TagFilterButton({
  allTags,
  selected,
  onChange,
}: {
  allTags: Tag[]
  selected: Set<string>
  onChange: (s: Set<string>) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-11 items-center gap-1.5 rounded-lg border bg-card px-3 text-[15px] transition-colors md:h-8 md:px-2 md:text-sm",
          selected.size > 0
            ? "border-primary/40 text-foreground"
            : "border-border text-muted-foreground md:hover:text-foreground"
        )}
      >
        <TagIcon className="h-4 w-4" />
        Tags
        {selected.size > 0 && <span className="tabular-nums">· {selected.size}</span>}
      </button>

      {selected.size > 0 && (
        <button
          onClick={() => onChange(new Set())}
          aria-label="Quitar el filtro de tags"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground md:h-8 md:w-8 md:hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 max-h-72 w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          <TagFilterList allTags={allTags} selected={selected} onChange={onChange} />
        </div>
      )}
    </div>
  )
}

/**
 * La lista en si, sin envoltorio. Se usa tal cual dentro de la hoja de filtros del
 * telefono y dentro del menu flotante del ordenador.
 */
export function TagFilterList({
  allTags,
  selected,
  onChange,
}: {
  allTags: Tag[]
  selected: Set<string>
  onChange: (s: Set<string>) => void
}) {
  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  if (allTags.length === 0) {
    return (
      <div className="px-3 py-3 text-sm text-muted-foreground">
        Sin tags todavía. Crea desde /crm/tags.
      </div>
    )
  }

  return (
    <div>
      {allTags.map((tag) => {
        const isSelected = selected.has(tag.id)
        return (
          <button
            key={tag.id}
            onClick={() => toggle(tag.id)}
            className="flex h-11 w-full items-center gap-2 px-3 text-left text-[15px] text-foreground active:bg-muted md:h-9 md:text-sm md:hover:bg-muted"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                isSelected ? "border-primary bg-primary/10" : "border-border"
              )}
            >
              {isSelected && <Check className="h-3 w-3 text-primary" />}
            </span>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <span className="min-w-0 truncate">{tag.name}</span>
          </button>
        )
      })}
      {selected.size > 0 && (
        <div className="border-t border-border px-3 py-2 text-sm text-muted-foreground">
          Lógica: coincide cualquier (OR)
        </div>
      )}
    </div>
  )
}
