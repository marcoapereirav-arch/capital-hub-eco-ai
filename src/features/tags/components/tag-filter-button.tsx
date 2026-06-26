"use client"

import { useState, useEffect, useRef } from "react"
import { Tag as TagIcon, Check, X } from "lucide-react"
import type { Tag } from "../types/tag"
import { cn } from "@/lib/utils"

/**
 * Boton de filtro multi-tag. Compacto.
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

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-8 inline-flex items-center gap-1 rounded-sm border bg-background px-2 text-xs transition-colors",
          selected.size > 0
            ? "border-foreground/40 text-foreground"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        <TagIcon className="h-3 w-3" />
        Tags
        {selected.size > 0 && (
          <span className="font-mono tabular-nums">· {selected.size}</span>
        )}
        {selected.size > 0 && (
          <span
            className="ml-1 hover:opacity-70"
            onClick={(e) => { e.stopPropagation(); onChange(new Set()) }}
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-card border border-border rounded-sm shadow-lg min-w-[220px] max-h-72 overflow-y-auto">
          {allTags.length === 0 ? (
            <div className="px-3 py-3 text-[11px] text-muted-foreground">
              Sin tags todavía. Crea desde /crm/tags.
            </div>
          ) : (
            allTags.map((tag) => {
              const isSelected = selected.has(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggle(tag.id)}
                  className="w-full text-left px-3 py-1.5 hover:bg-secondary flex items-center gap-2 text-xs"
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-sm border flex items-center justify-center shrink-0",
                      isSelected ? "border-foreground bg-foreground/10" : "border-border",
                    )}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 text-foreground" />}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="truncate">{tag.name}</span>
                </button>
              )
            })
          )}
          {selected.size > 0 && (
            <div className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
              <span className="font-mono">Lógica:</span> coincide cualquier (OR)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
