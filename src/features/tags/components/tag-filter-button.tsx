"use client"

import { useState, useEffect, useRef } from "react"
import { Tag as TagIcon, Check, X } from "lucide-react"
import type { Tag } from "../types/tag"
import { cn } from "@/lib/utils"

/**
 * Filtro por etiquetas (se pueden marcar varias). Un contacto pasa el filtro si tiene
 * AL MENOS UNA de las marcadas.
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
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    document.addEventListener("keydown", onEscape)
    return () => {
      document.removeEventListener("mousedown", onClickOutside)
      document.removeEventListener("keydown", onEscape)
    }
  }, [open])

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  const activo = selected.size > 0

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "inline-flex min-h-[44px] items-center rounded-[4px] border transition-colors",
          activo
            ? "border-[#24462F] bg-[#101710] text-[#4ADE80]"
            : "border-[rgba(245,246,247,0.1)] bg-[#16161B] text-[#A6AAB2] hover:text-[#F5F6F7]"
        )}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
          className="inline-flex min-h-[44px] items-center gap-2 px-3 text-[14px] font-semibold"
        >
          <TagIcon className="h-4 w-4" />
          Etiquetas
          {activo && <span className="tabular-nums">({selected.size})</span>}
        </button>
        {activo && (
          // Boton propio, no un <span> con onClick dentro de otro boton: eso era HTML
          // invalido y no se podia usar con el teclado.
          <button
            onClick={() => onChange(new Set())}
            aria-label="Quitar el filtro de etiquetas"
            className="flex h-11 w-9 items-center justify-center rounded-r-[4px] transition-colors hover:bg-[#16161B]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-72 min-w-[240px] overflow-y-auto overscroll-contain rounded-[4px] border border-[rgba(245,246,247,0.1)] bg-[#16161B] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.85)]">
          {allTags.length === 0 ? (
            <p className="px-3 py-3 text-[14px] text-[#A6AAB2]">
              Todavía no hay etiquetas. Se crean en la pestaña Etiquetas.
            </p>
          ) : (
            allTags.map((tag) => {
              const isSelected = selected.has(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggle(tag.id)}
                  aria-pressed={isSelected}
                  className="flex min-h-[44px] w-full items-center gap-2.5 px-3 text-left text-[14px] text-[#F5F6F7] transition-colors hover:bg-[#131318]"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border",
                      isSelected
                        ? "border-[#22C55E] bg-[#22C55E]"
                        : "border-[rgba(245,246,247,0.2)]"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-[#08130C]" />}
                  </span>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="truncate">{tag.name}</span>
                </button>
              )
            })
          )}
          {activo && (
            <p className="border-t border-[rgba(245,246,247,0.1)] px-3 py-2 text-[13px] text-[#7C818A]">
              Se muestran los contactos que tengan alguna de las marcadas.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
