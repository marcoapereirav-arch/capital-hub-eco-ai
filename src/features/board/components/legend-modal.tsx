"use client"

import { useEffect, useRef, useState } from "react"
import { X, GripHorizontal, Minimize2, Maximize2 } from "lucide-react"

interface LegendModalProps {
  open: boolean
  onClose: () => void
}

export function LegendModal({ open, onClose }: LegendModalProps) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [minimized, setMinimized] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  // Posición inicial: top-right del viewport
  useEffect(() => {
    if (open && !initialized && typeof window !== "undefined") {
      setPos({ x: window.innerWidth - 460, y: 80 })
      setInitialized(true)
    }
  }, [open, initialized])

  function onPointerDown(e: React.PointerEvent) {
    if (!panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    dragState.current = { x: e.clientX, y: e.clientY, ox: rect.left, oy: rect.top }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.x
    const dy = e.clientY - dragState.current.y
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 200, dragState.current.ox + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 60, dragState.current.oy + dy)),
    })
  }

  function onPointerUp(e: React.PointerEvent) {
    dragState.current = null
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="fixed z-[90] w-[440px] max-w-[95vw] rounded-lg border border-border bg-card/95 backdrop-blur shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Header con drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex items-center justify-between border-b border-border px-3 py-2 cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="font-heading text-sm font-semibold">Cómo leer el Board</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setMinimized((v) => !v)}
            className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            title={minimized ? "Expandir" : "Minimizar"}
          >
            {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="space-y-4 p-4 text-xs max-h-[70vh] overflow-y-auto">
          <section>
            <h3 className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              Color del fondo = status
            </h3>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-blue-600/40 border border-blue-500" />
                <span><strong>next</strong> — lista para accionar</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-yellow-600/35 border border-dashed border-yellow-500" />
                <span><strong>waiting</strong> — bloqueada esperando algo</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-purple-600/35 border border-purple-500" />
                <span><strong>someday</strong> — backlog no priorizado</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-zinc-700/40 border border-zinc-600" />
                <span><strong>inbox</strong> — sin clasificar</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-600/40 border border-green-500" />
                <span><strong>done</strong> — completada (se atenúa con el tiempo)</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              Tamaño + badge P0/P1/P2/P3 = prioridad
            </h3>
            <ul className="space-y-1">
              <li><span className="rounded-sm border border-red-400/60 bg-red-500/40 px-1.5 py-0.5 font-mono text-[9px] font-bold">P0</span> + 🔥 = <strong>urgent</strong> · 24h</li>
              <li><span className="rounded-sm border border-orange-400/50 bg-orange-500/30 px-1.5 py-0.5 font-mono text-[9px] font-bold">P1</span> = <strong>high</strong> · esta semana</li>
              <li><span className="rounded-sm border border-zinc-400/40 bg-zinc-500/30 px-1.5 py-0.5 font-mono text-[9px] font-bold">P2</span> = <strong>normal</strong> · 2-3 semanas</li>
              <li><span className="rounded-sm border border-zinc-600/40 bg-zinc-700/30 px-1.5 py-0.5 font-mono text-[9px] font-bold">P3</span> = <strong>low</strong> · cuando haya tiempo</li>
            </ul>
            <p className="mt-1 text-muted-foreground text-[10px]">El nodo P0 mide ~260px, el P3 ~145px — la diferencia se ve a simple vista.</p>
          </section>

          <section>
            <h3 className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              Badges en cada tarjeta
            </h3>
            <ul className="space-y-1">
              <li>↖️ <strong>P0/P1/P2/P3</strong> + 🔥 si urgent — esquina sup. izquierda</li>
              <li>↗️ <strong>📅 fecha</strong> — esquina sup. derecha (solo si tiene)</li>
              <li>↘️ <strong>⚡ EN VIVO</strong> cyan parpadeante — esquina inf. derecha (lo que se está haciendo AHORA)</li>
              <li>👤 <strong>MA / AV / EQ</strong> — assignee (Marco / Adrián / Equipo)</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              Borde de color = proyecto / área
            </h3>
            <p className="text-muted-foreground">Cada proyecto tiene un color único. El borde de la tarea es ese color → se ve a qué proyecto pertenece.</p>
          </section>

          <section>
            <h3 className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              Done atenuado por antigüedad
            </h3>
            <ul className="space-y-1">
              <li>Hoy → 90% · ~7d → 70% · ~30d → 50% · 90+d → 25%</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              Líneas (edges)
            </h3>
            <ul className="space-y-1">
              <li>· Sutil del color del proyecto → tarea ↔ proyecto</li>
              <li>· Naranja dashed animada → "depende de"</li>
              <li>· Dorada sutil hacia centro → contribución a la MISIÓN</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              Tip
            </h3>
            <p className="text-muted-foreground">
              Este panel se puede arrastrar (header) y minimizar (icono). Mantenlo abierto mientras navegas.
            </p>
          </section>
        </div>
      )}
    </div>
  )
}
