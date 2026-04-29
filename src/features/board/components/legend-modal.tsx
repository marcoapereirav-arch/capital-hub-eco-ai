"use client"

import { X } from "lucide-react"

interface LegendModalProps {
  open: boolean
  onClose: () => void
}

export function LegendModal({ open, onClose }: LegendModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-card shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-5 py-3">
          <h2 className="font-heading text-base font-semibold">📖 Cómo leer el Board</h2>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-5 p-5 text-sm">
          {/* COLORES POR STATUS */}
          <section>
            <h3 className="mb-2 font-heading text-xs uppercase tracking-wide text-muted-foreground">
              🎨 Color del FONDO = status de la tarea
            </h3>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-green-600/40 border border-green-500" />
                <span className="text-foreground">Verde — <strong>done</strong> (completada)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-blue-600/40 border border-blue-500" />
                <span className="text-foreground">Azul — <strong>next</strong> (lista para accionar)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-yellow-600/35 border border-dashed border-yellow-500" />
                <span className="text-foreground">Amarillo + dashed — <strong>waiting</strong> (parada esperando)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-zinc-600/30 border border-zinc-500" />
                <span className="text-foreground">Gris claro — <strong>someday</strong> (backlog)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-zinc-700/40 border border-zinc-600" />
                <span className="text-foreground">Gris oscuro — <strong>inbox</strong> (sin clasificar)</span>
              </li>
            </ul>
          </section>

          {/* BORDE */}
          <section>
            <h3 className="mb-2 font-heading text-xs uppercase tracking-wide text-muted-foreground">
              🖌 Color del BORDE = proyecto al que pertenece
            </h3>
            <p className="text-muted-foreground">
              Cada proyecto (Webs+CRM, Marketing, Operaciones, etc.) tiene un color único asignado.
              El borde de la tarea es ese color.
            </p>
          </section>

          {/* TAMAÑO */}
          <section>
            <h3 className="mb-2 font-heading text-xs uppercase tracking-wide text-muted-foreground">
              📏 Tamaño = prioridad
            </h3>
            <ul className="space-y-1 text-foreground">
              <li>• <strong>Más grande</strong> → urgent</li>
              <li>• Mediano-grande → high</li>
              <li>• Mediano → normal</li>
              <li>• Pequeño → low</li>
            </ul>
          </section>

          {/* IN PROGRESS */}
          <section>
            <h3 className="mb-2 font-heading text-xs uppercase tracking-wide text-muted-foreground">
              ⚡ Parpadeo cyan + ícono Zap = EN VIVO ahora
            </h3>
            <p className="text-muted-foreground">
              Las tareas que se están trabajando AHORA AHORA AHORA tienen un glow cyan parpadeante.
              Es la señal de "esto se está moviendo en este momento".
            </p>
          </section>

          {/* DONE ATENUADO */}
          <section>
            <h3 className="mb-2 font-heading text-xs uppercase tracking-wide text-muted-foreground">
              🌗 Done se atenúa con el tiempo
            </h3>
            <ul className="space-y-1 text-foreground">
              <li>• Done <strong>de hoy</strong> → 90% opacidad (visible)</li>
              <li>• Done de hace <strong>~7 días</strong> → 70%</li>
              <li>• Done de hace <strong>~30 días</strong> → 50%</li>
              <li>• Done de hace <strong>90+ días</strong> → 25% (mínimo, queda como historial)</li>
            </ul>
          </section>

          {/* ÍCONOS */}
          <section>
            <h3 className="mb-2 font-heading text-xs uppercase tracking-wide text-muted-foreground">
              🔥 Otros símbolos
            </h3>
            <ul className="space-y-1 text-foreground">
              <li>🔥 Llama naranja → tarea <strong>urgent</strong></li>
              <li>📅 Calendar badge → tarea con <strong>fecha límite</strong></li>
              <li>👤 MA / AV / EQ → assignee (Marco / Adrián / Equipo)</li>
              <li>⚡ Zap cyan → la task está <strong>en vivo ahora mismo</strong></li>
            </ul>
          </section>

          {/* EDGES */}
          <section>
            <h3 className="mb-2 font-heading text-xs uppercase tracking-wide text-muted-foreground">
              ➰ Líneas (edges)
            </h3>
            <ul className="space-y-2 text-foreground">
              <li>
                <strong>Línea sutil del color del proyecto</strong> → conecta cada task con su proyecto.
              </li>
              <li>
                <strong>Línea naranja DASHED ANIMADA "depende"</strong> → la task de origen DEPENDE de la otra.
                No se puede empezar hasta que la dependencia esté done. Cuando ambas son done, la línea se vuelve gris.
              </li>
              <li>
                <strong>Línea dorada sutil hacia la MISIÓN</strong> → cada proyecto contribuye al goal central.
              </li>
            </ul>
          </section>

          {/* MISIÓN */}
          <section>
            <h3 className="mb-2 font-heading text-xs uppercase tracking-wide text-muted-foreground">
              🎯 Nodo central MISIÓN
            </h3>
            <p className="text-muted-foreground">
              Es el goal transversal del proyecto: <strong>1.000€/día en publi alcanzando los 5 KPIs</strong>.
              Todos los proyectos orbitan a su alrededor porque todo lo que hacemos existe para llegar a esa misión.
              Para entender los KPIs y su flujo en detalle, abre <strong>📖 Estrategia</strong> arriba.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
