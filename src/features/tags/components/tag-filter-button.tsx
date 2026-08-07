"use client"

import { useState, useEffect, useRef } from "react"
import { Tag as TagIcon, Check, X } from "lucide-react"
import type { Tag } from "../types/tag"
import { cn } from "@/lib/utils"

/**
 * Filtro por etiquetas (se pueden marcar varias). Un contacto pasa el filtro si tiene
 * AL MENOS UNA de las marcadas.
 *
 * En telefono NO se usa este boton: los filtros del CRM viven todos dentro de la hoja
 * inferior "Filtros", y alli se pinta <TagFilterList /> directamente. Un menu flotante
 * en telefono se sale de la pantalla y no se puede arrastrar.
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

  const activo = selected.size > 0

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "inline-flex min-h-[44px] items-center rounded-[4px] border transition-colors",
          activo
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border bg-popover text-muted-foreground md:hover:text-foreground"
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
            className="flex h-11 w-11 items-center justify-center rounded-r-[4px] transition-colors hover:bg-popover md:w-9"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-72 w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-[4px] border border-border bg-popover shadow-[0_18px_40px_-16px_rgba(0,0,0,0.85)] md:w-auto md:min-w-[240px]">
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
      <p className="px-3 py-3 text-[14px] text-muted-foreground">
        Todavía no hay etiquetas. Se crean en la pestaña Etiquetas.
      </p>
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
            aria-pressed={isSelected}
            className="flex min-h-[44px] w-full items-center gap-2.5 px-3 text-left text-[14px] text-foreground transition-colors active:bg-card md:hover:bg-card"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-foreground/20"
              )}
            >
              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
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
        <p className="border-t border-border px-3 py-2 text-[14px] text-muted-foreground md:text-[13px]">
          Se muestran los contactos que tengan alguna de las marcadas.
        </p>
      )}
    </div>
  )
}
