"use client"

import { Eye, ChevronDown, Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

const IMPERSONATABLE_ROLES: Array<{ value: string; label: string }> = [
  { value: "marketing", label: "Marketing" },
  { value: "formador", label: "Formador" },
  { value: "closer", label: "Closer" },
  { value: "setter", label: "Setter" },
]

/**
 * Dropdown visible solo para super_admin/admin que permite ver el OS como otro rol.
 * Setea la cookie view_as_role vía POST /api/admin/view-as y refresca la página.
 *
 * Si el admin ya está impersonando un rol, el ViewAsRoleBanner aparece arriba con
 * el botón "Volver a vista admin".
 *
 * NO es una ventana emergente: es un menu anclado al boton que lo abre. Por eso NO
 * lleva el patron de modal (portal al body, alto en dvh, cabecera y pie fijos).
 *
 * Lo que SI se arreglo: antes el cierre dependia de un velo `fixed inset-0`, y un
 * velo `fixed` solo funciona si ningun padre tiene transform ni z-index propio.
 * Aqui los dos padres lo rompen: en telefono el sidebar vive dentro de un Sheet de
 * Radix, que conserva un `transform: translate(0)` al acabar su animacion (el
 * `animation-fill-mode: both` de tailwindcss-animate), asi que el velo se encogia
 * al ancho de la hoja; en ordenador el contenedor del sidebar es `fixed z-10`, que
 * crea su propio contexto de apilado, asi que el velo quedaba por debajo de la
 * pagina y tocar fuera no cerraba nada. Se sustituye por escucha en `document`
 * (toque fuera) + Escape, que funciona en los dos sitios y no deja capas sueltas.
 */
export function ViewAsRoleDropdown({ currentViewAs }: { currentViewAs: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const contenedorRef = useRef<HTMLDivElement>(null)

  // Siempre hay salida: tocar fuera cierra, Escape cierra, y el propio boton alterna.
  useEffect(() => {
    if (!open) return

    function alTocarFuera(evento: PointerEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) setOpen(false)
    }
    function alPulsarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", alTocarFuera, true)
    document.addEventListener("keydown", alPulsarTecla)
    return () => {
      document.removeEventListener("pointerdown", alTocarFuera, true)
      document.removeEventListener("keydown", alPulsarTecla)
    }
  }, [open])

  async function pickRole(role: string | null) {
    setLoading(role ?? "_clear")
    try {
      await fetch("/api/admin/view-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      router.refresh()
      setOpen(false)
    } finally {
      setLoading(null)
    }
  }

  const label = currentViewAs
    ? `Viendo como: ${IMPERSONATABLE_ROLES.find((r) => r.value === currentViewAs)?.label ?? currentViewAs}`
    : "Ver como rol"

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-[15px] text-foreground transition-colors active:bg-secondary md:h-8 md:px-2 md:text-sm md:hover:border-foreground"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Eye className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Ver el OS como otro rol"
          className="no-overscroll absolute right-0 bottom-full left-0 z-50 mb-1 max-h-[min(60dvh,20rem)] min-w-[min(16rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
        >
          {currentViewAs && (
            <button
              type="button"
              role="menuitem"
              onClick={() => pickRole(null)}
              disabled={loading !== null}
              className="flex h-11 w-full items-center justify-between gap-2 border-b border-border px-3 text-left text-[15px] font-semibold text-muted-foreground transition-colors active:bg-secondary disabled:opacity-50 md:h-9 md:text-sm md:hover:bg-secondary"
            >
              <span className="truncate">Salir (vista admin)</span>
              {loading === "_clear" && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2} />
              )}
            </button>
          )}
          {IMPERSONATABLE_ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="menuitem"
              onClick={() => pickRole(r.value)}
              disabled={loading !== null}
              className="flex h-11 w-full items-center justify-between gap-2 px-3 text-left text-[15px] text-foreground transition-colors active:bg-secondary disabled:opacity-50 md:h-9 md:text-sm md:hover:bg-secondary"
            >
              <span className="truncate">{r.label}</span>
              {currentViewAs === r.value ? (
                <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
              ) : loading === r.value ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
                  strokeWidth={2}
                />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
