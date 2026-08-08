"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Calendar, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Filtro de período reusable para CUALQUIER dashboard del OS.
 *
 * Devuelve { from: Date, to: Date } al callback onChange cada vez que el usuario
 * cambia la selección. El padre pasa ese rango a sus queries (`sent_at >= from
 * AND sent_at <= to`, etc).
 *
 * Presets soportados:
 *   - hoy
 *   - esta_semana (lunes 00:00 → ahora)
 *   - este_mes (día 1 00:00 → ahora)
 *   - 7d (últimos 7 días)
 *   - 15d (últimos 15 días)
 *   - 30d (últimos 30 días)
 *   - este_ano (1 ene → ahora)
 *   - custom (date pickers from/to)
 *
 * Default: 7d.
 *
 * URL sync: cuando cambia, actualiza el query string ?period=7d (o ?from=&to=
 * cuando es custom) para que el filtro persista en navegación + bookmarks.
 */

export type PeriodRange = { from: Date; to: Date; preset: string; label: string }

const PRESETS: Array<{ value: string; label: string }> = [
  { value: "hoy", label: "Hoy" },
  { value: "esta_semana", label: "Esta semana" },
  { value: "este_mes", label: "Este mes" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "15d", label: "Últimos 15 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "este_ano", label: "Este año" },
  { value: "custom", label: "Personalizado" },
]

export function PeriodFilter({
  value,
  onChange,
  className,
  defaultPreset = "7d",
}: {
  value?: PeriodRange
  onChange: (range: PeriodRange) => void
  className?: string
  defaultPreset?: string
}) {
  const [open, setOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState<string>("")
  const [customTo, setCustomTo] = useState<string>("")
  const containerRef = useRef<HTMLDivElement>(null)
  /* El desplegable se dibuja en el `body` (portal) para que ningun contenedor
     con recorte lo corte. Por eso hace falta su PROPIA referencia: sin ella,
     "tocar fuera" lo consideraba fuera de si mismo. */
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Calcula la posición del dropdown anclado al botón cuando se abre.
  // El dropdown se renderiza vía Portal en document.body, así NO lo recorta
  // ningún contenedor con overflow:hidden (problema raíz: el dropdown
  // anidado se cortaba dentro del PageContainer / SidebarInset / scroll
  // wrapper del layout (main)).
  useEffect(() => {
    if (!open || !buttonRef.current) return
    const updatePos = () => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      const popoverWidth = 264 // w-64 = 16rem = 256px + border = 264 approx
      // Por defecto alineado a la izquierda del botón. Si se sale por la derecha,
      // ajusta a la derecha del viewport.
      let left = rect.left
      if (left + popoverWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - popoverWidth - 8)
      }
      // Por defecto debajo del botón. Si no cabe abajo (popover ~ 280px alto), lo pone arriba.
      const popoverHeight = 320
      let top = rect.bottom + 4
      if (top + popoverHeight > window.innerHeight - 8) {
        top = Math.max(8, rect.top - popoverHeight - 4)
      }
      setPopoverPos({ top, left })
    }
    updatePos()
    window.addEventListener("scroll", updatePos, true)
    window.addEventListener("resize", updatePos)
    return () => {
      window.removeEventListener("scroll", updatePos, true)
      window.removeEventListener("resize", updatePos)
    }
  }, [open])

  // Inicializar con default si no hay value
  useEffect(() => {
    if (!value) {
      const range = computeRange(defaultPreset)
      if (range) onChange(range)
    }
  }, [])

  /* Cerrar al tocar fuera.
     ============================================================================
     EL FALLO QUE ESTO ARREGLA (2026-08-08). El desplegable vive en el `body` por
     el portal, asi que NO esta dentro de `containerRef`. Al pulsar una opcion,
     este mismo manejador lo consideraba "fuera", cerraba el desplegable en el
     `mousedown`, React lo quitaba del documento, y el `click` posterior ya no
     encontraba boton al que llegar: `selectPreset` NUNCA se ejecutaba.
     Resultado: el filtro se abria, se elegia un periodo y no pasaba nada. En
     TODAS las pantallas del OS que lo usan, no solo en el panel.
     La cuenta que faltaba: mirar tambien dentro del propio desplegable.
     ============================================================================ */
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const destino = e.target as Node
      const dentroDelBoton = containerRef.current?.contains(destino)
      const dentroDelDesplegable = popoverRef.current?.contains(destino)
      if (!dentroDelBoton && !dentroDelDesplegable) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open])

  function selectPreset(preset: string) {
    if (preset === "custom") {
      // Si hay un range válido custom, lo mantenemos; si no, abrir custom vacío
      const now = new Date()
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      setCustomFrom(toInputDate(d7))
      setCustomTo(toInputDate(now))
      // No cierra el dropdown, espera a que el usuario seleccione fechas
      return
    }
    const range = computeRange(preset)
    if (range) {
      onChange(range)
      setOpen(false)
    }
  }

  function applyCustom() {
    if (!customFrom || !customTo) return
    const from = new Date(customFrom + "T00:00:00")
    const to = new Date(customTo + "T23:59:59")
    if (from > to) return
    const label = `${formatDateShort(from)} – ${formatDateShort(to)}`
    onChange({ from, to, preset: "custom", label })
    setOpen(false)
  }

  /* Lo que se lee en el boton. Si el padre no pasa `value`, esto se queda
     clavado en la etiqueta por defecto elijas lo que elijas: parece roto aunque
     los datos cambien. Por eso TODA pantalla tiene que pasar `value`. */
  const currentLabel = value?.label ?? PRESETS.find((p) => p.value === defaultPreset)?.label ?? "Período"

  const popover = open && mounted && popoverPos ? (
    <div
      ref={popoverRef}
      style={{ position: "fixed", top: popoverPos.top, left: popoverPos.left, zIndex: 9999 }}
      className="w-[min(16rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
    >
      <div className="p-1.5">
        {PRESETS.map((p) => {
          const active = (value?.preset ?? defaultPreset) === p.value
          return (
            <button
              key={p.value}
              onClick={() => selectPreset(p.value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span>{p.label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
            </button>
          )
        })}
      </div>

      <div className="space-y-2.5 border-t border-border px-3.5 py-3.5">
        <div className="text-sm font-semibold text-muted-foreground">Personalizado</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="block text-sm text-muted-foreground">Desde</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-11 md:h-8 w-full rounded-lg border border-border bg-card px-2 text-base md:text-sm text-foreground outline-none focus:border-ring"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-sm text-muted-foreground">Hasta</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-11 md:h-8 w-full rounded-lg border border-border bg-card px-2 text-base md:text-sm text-foreground outline-none focus:border-ring"
            />
          </label>
        </div>
        <button
          onClick={applyCustom}
          disabled={!customFrom || !customTo || customFrom > customTo}
          className="h-11 md:h-8 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          Aplicar rango
        </button>
      </div>
    </div>
  ) : null

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((s) => !s)}
        aria-label="Cambiar el periodo"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[15px] text-foreground transition-colors active:bg-muted md:h-9 md:text-sm"
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{currentLabel}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {popover && createPortal(popover, document.body)}
    </div>
  )
}

// === Utilidades ===

export function computeRange(preset: string): PeriodRange | null {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case "hoy":
      return { from: startOfDay, to: now, preset, label: "Hoy" }
    case "esta_semana": {
      // Lunes 00:00 → ahora
      const day = startOfDay.getDay() // 0=domingo
      const diff = day === 0 ? 6 : day - 1
      const monday = new Date(startOfDay)
      monday.setDate(monday.getDate() - diff)
      return { from: monday, to: now, preset, label: "Esta semana" }
    }
    case "este_mes": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: first, to: now, preset, label: "Este mes" }
    }
    case "7d": {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return { from: d, to: now, preset, label: "Últimos 7 días" }
    }
    case "15d": {
      const d = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
      return { from: d, to: now, preset, label: "Últimos 15 días" }
    }
    case "30d": {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return { from: d, to: now, preset, label: "Últimos 30 días" }
    }
    case "este_ano": {
      const jan1 = new Date(now.getFullYear(), 0, 1)
      return { from: jan1, to: now, preset, label: "Este año" }
    }
    default:
      return null
  }
}

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" })
}
