"use client"

import { useEffect, useRef, useState } from "react"
import { X, GripHorizontal, Minimize2, Maximize2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface LegendModalProps {
  /** Hoja inferior del telefono. La abre un boton `md:hidden`. */
  hojaAbierta: boolean
  onCerrarHoja: () => void
  /** Panel arrastrable del monitor. Lo abre un boton `hidden md:inline-flex`. */
  panelAbierto: boolean
  onCerrarPanel: () => void
}

export function LegendModal({
  hojaAbierta,
  onCerrarHoja,
  panelAbierto,
  onCerrarPanel,
}: LegendModalProps) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [minimized, setMinimized] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  // Posición inicial: top-right del viewport
  useEffect(() => {
    if (panelAbierto && !initialized && typeof window !== "undefined") {
      setPos({ x: window.innerWidth - 460, y: 80 })
      setInitialized(true)
    }
  }, [panelAbierto, initialized])

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

  return (
    <>
      {/* TELEFONO: hoja inferior. Un panel arrastrable de 440 puntos no cabe en
          una pantalla de 375 y ademas arrastrar pelea con el dedo que desplaza.
          Lleva su propio estado porque la capa de fondo de la hoja vive en
          sheet.tsx y no admite clases: si se abriera en monitor, taparia el board
          entero y lo dejaria sin responder al raton. */}
      <Sheet open={hojaAbierta} onOpenChange={(abierto) => { if (!abierto) onCerrarHoja() }}>
        <SheetContent side="bottom" className="rounded-t-xl pb-safe-4">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border" />
          <SheetHeader className="px-4 pb-0">
            <SheetTitle className="text-[17px] font-semibold">Cómo leer el Board</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <LegendContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* ESCRITORIO: el panel arrastrable de siempre */}
      {panelAbierto && (
      <div
        ref={panelRef}
        className="fixed z-[90] hidden max-w-[95vw] rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur md:block md:w-[440px]"
        style={{ left: pos.x, top: pos.y }}
      >
        {/* Header con drag handle */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="flex cursor-move items-center justify-between border-b border-border px-3 py-2 select-none"
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="font-heading text-sm font-semibold">Cómo leer el Board</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setMinimized((v) => !v)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              title={minimized ? "Expandir" : "Minimizar"}
            >
              {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onCerrarPanel}
              className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Cerrar leyenda"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <div className="max-h-[70dvh] overflow-y-auto p-4">
            <LegendContent />
          </div>
        )}
      </div>
      )}
    </>
  )
}

/**
 * El texto de la leyenda es el mismo en telefono y en monitor. Los cuadraditos de
 * color reproducen EXACTAMENTE los tokens que pinta task-node.tsx: si un dia
 * cambian ahi, aqui tambien.
 */
function LegendContent() {
  return (
    <div className="space-y-4 text-sm">
      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-muted-foreground">
          Color del fondo = status
        </h3>
        <ul className="space-y-1">
          <li className="flex items-center gap-2">
            <div className="h-4 w-4 shrink-0 rounded-sm border border-border bg-secondary" />
            <span><strong>next</strong> — lista para accionar</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-4 w-4 shrink-0 rounded-sm border border-dashed border-warn bg-warn/10" />
            <span><strong>waiting</strong> — bloqueada esperando algo</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-4 w-4 shrink-0 rounded-sm border border-border bg-card" />
            <span><strong>someday</strong> — backlog no priorizado</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-4 w-4 shrink-0 rounded-sm border border-border bg-popover" />
            <span><strong>inbox</strong> — sin clasificar</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-4 w-4 shrink-0 rounded-sm border border-primary bg-primary/15" />
            <span><strong>done</strong> — completada (se atenúa con el tiempo)</span>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-muted-foreground">
          Tamaño + badge P0/P1/P2/P3 = prioridad
        </h3>
        <ul className="space-y-1">
          <li><span className="rounded-sm border border-destructive/60 bg-destructive/20 px-1.5 py-0.5 text-sm font-bold text-destructive">P0</span> = <strong>urgent</strong> · 24h</li>
          <li><span className="rounded-sm border border-warn/60 bg-warn/20 px-1.5 py-0.5 text-sm font-bold text-warn">P1</span> = <strong>high</strong> · esta semana</li>
          <li><span className="rounded-sm border border-border bg-muted px-1.5 py-0.5 text-sm font-bold text-foreground">P2</span> = <strong>normal</strong> · 2-3 semanas</li>
          <li><span className="rounded-sm border border-border bg-card px-1.5 py-0.5 text-sm font-bold text-muted-foreground">P3</span> = <strong>low</strong> · cuando haya tiempo</li>
        </ul>
        <p className="mt-1 text-sm text-muted-foreground">El nodo P0 mide ~260px, el P3 ~145px — la diferencia se ve a simple vista.</p>
      </section>

      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-muted-foreground">
          Badges en cada tarjeta
        </h3>
        <ul className="space-y-1">
          <li><strong>P0/P1/P2/P3</strong> — esquina sup. izquierda</li>
          <li><strong>fecha</strong> — esquina sup. derecha (solo si tiene)</li>
          <li><strong>EN VIVO</strong> en verde — esquina inf. derecha (lo que se está haciendo AHORA)</li>
          <li><strong>MA / AV / EQ</strong> — assignee (Marco / Adrián / Equipo)</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-muted-foreground">
          Borde de color = proyecto / área
        </h3>
        <p className="text-muted-foreground">Cada proyecto tiene un color único. El borde de la tarea es ese color → se ve a qué proyecto pertenece.</p>
      </section>

      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-muted-foreground">
          Done atenuado por antigüedad
        </h3>
        <ul className="space-y-1">
          <li>Hoy → 90% · ~7d → 70% · ~30d → 50% · 90+d → 25%</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-muted-foreground">
          Líneas (edges)
        </h3>
        <ul className="space-y-1">
          <li>· Sutil del color del proyecto → tarea ↔ proyecto</li>
          <li>· Naranja dashed animada → &quot;depende de&quot;</li>
          <li>· Dorada sutil hacia centro → contribución a la MISIÓN</li>
        </ul>
      </section>

      {/* Solo en monitor: en telefono la leyenda es una hoja inferior, no un panel
          arrastrable, asi que este consejo describiria algo que ahi no existe. */}
      <section className="hidden md:block">
        <h3 className="mb-1.5 text-sm font-semibold text-muted-foreground">
          Tip
        </h3>
        <p className="text-muted-foreground">
          Este panel se puede arrastrar (header) y minimizar (icono). Mantenlo abierto mientras navegas.
        </p>
      </section>
    </div>
  )
}
