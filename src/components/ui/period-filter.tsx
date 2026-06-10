"use client"

import { useState, useEffect, useRef } from "react"
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

  // Inicializar con default si no hay value
  useEffect(() => {
    if (!value) {
      const range = computeRange(defaultPreset)
      if (range) onChange(range)
    }
  }, [])

  // Cerrar al click fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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

  const currentLabel = value?.label ?? PRESETS.find((p) => p.value === defaultPreset)?.label ?? "Período"

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 h-8 rounded-sm border border-border bg-background px-3 text-xs hover:bg-card transition-colors"
      >
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono uppercase tracking-wider text-[10px]">{currentLabel}</span>
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-64 rounded-md border border-border bg-background shadow-xl z-50 overflow-hidden">
          {/* Lista de presets */}
          <div className="py-1">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => selectPreset(p.value)}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs hover:bg-card transition-colors flex items-center justify-between",
                  value?.preset === p.value && "bg-card/60 text-foreground"
                )}
              >
                <span>{p.label}</span>
                {value?.preset === p.value && <span className="text-[10px] font-mono text-muted-foreground">✓</span>}
              </button>
            ))}
          </div>

          {/* Custom date pickers */}
          <div className="border-t border-border px-3 py-3 space-y-2 bg-card/30">
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Personalizado</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block">Desde</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full h-7 rounded-sm border border-border bg-background px-2 text-xs"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block">Hasta</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full h-7 rounded-sm border border-border bg-background px-2 text-xs"
                />
              </label>
            </div>
            <button
              onClick={applyCustom}
              disabled={!customFrom || !customTo || customFrom > customTo}
              className="w-full h-7 rounded-sm bg-foreground text-background text-[10px] font-mono uppercase tracking-wider disabled:opacity-30 hover:opacity-90"
            >
              Aplicar rango
            </button>
          </div>
        </div>
      )}
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
