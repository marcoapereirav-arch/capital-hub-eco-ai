"use client"

import { useState } from "react"
import { Check, RotateCcw, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  METRICAS,
  metricasPorDefecto,
  porFamiliaDeVariantes,
  type Metrica,
} from "@/lib/meta/metricas"

/**
 * Dónde se elige QUÉ métricas se ven.
 *
 * Está agrupado por FAMILIA DE VARIANTES a propósito. Meta ofrece varias versiones de la
 * misma idea y no lo dice: hay ocho CTR distintos y seis formas de contar clics, y sin
 * verlas juntas es imposible saber en qué se diferencian. Marco, 2026-08-07: "hay varios de
 * una sola métrica, los quiero ver y los quiero tener todos".
 *
 * Dentro de cada familia van primero las que Marco pidió expresamente, y las que hoy vienen
 * vacías en su cuenta quedan marcadas para que no las elija sin saberlo.
 *
 * Hoja inferior en móvil y cajón por la derecha en escritorio, decidido con clases y no con
 * JavaScript (`useIsMobile` miente en el primer pintado).
 */

export const CLAVE_GUARDADO = "ads:metricas-elegidas"

export function leerElegidas(): string[] {
  if (typeof window === "undefined") return metricasPorDefecto()
  try {
    const guardado = window.localStorage.getItem(CLAVE_GUARDADO)
    if (!guardado) return metricasPorDefecto()
    const ids = JSON.parse(guardado) as string[]
    // Se filtra contra el catálogo: si una métrica deja de existir, no rompe la pantalla.
    const validas = ids.filter((id) => METRICAS.some((m) => m.id === id))
    return validas.length > 0 ? validas : metricasPorDefecto()
  } catch {
    return metricasPorDefecto()
  }
}

function guardarElegidas(ids: string[]) {
  try {
    window.localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(ids))
  } catch {
    // Si el navegador no deja guardar, se sigue usando la selección de esta sesión.
  }
}

export function SelectorMetricas({
  elegidas,
  onCambio,
}: {
  elegidas: string[]
  onCambio: (ids: string[]) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const familias = porFamiliaDeVariantes()

  function alternar(id: string) {
    const siguiente = elegidas.includes(id)
      ? elegidas.filter((x) => x !== id)
      : [...elegidas, id]
    onCambio(siguiente)
    guardarElegidas(siguiente)
  }

  function restaurar() {
    const base = metricasPorDefecto()
    onCambio(base)
    guardarElegidas(base)
  }

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-[15px] text-foreground active:bg-muted md:h-9 md:text-sm"
        >
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          Métricas
          <span className="tabular-nums text-muted-foreground">({elegidas.length})</span>
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className={cn(
          "max-h-[85dvh] w-full overflow-y-auto rounded-t-xl pb-safe-4",
          "md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[460px] md:max-w-[460px] md:rounded-none md:border-l md:pb-0"
        )}
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />

        <SheetHeader className="px-4">
          <SheetTitle className="text-[17px] font-semibold text-foreground">
            Qué métricas quieres ver
          </SheetTitle>
        </SheetHeader>

        <p className="px-4 text-[15px] leading-relaxed text-muted-foreground">
          Meta tiene varias versiones de lo mismo. Aquí van agrupadas para que veas en qué se
          diferencian antes de elegir.
        </p>

        <div className="mt-3 flex items-center justify-between gap-3 px-4">
          <span className="text-sm text-muted-foreground tabular-nums">
            {elegidas.length} de {METRICAS.length} elegidas
          </span>
          <button
            type="button"
            onClick={restaurar}
            className="flex h-11 items-center gap-1.5 rounded-lg px-3 text-[15px] text-muted-foreground active:bg-muted md:h-9 md:text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Volver a las recomendadas
          </button>
        </div>

        <div className="mt-2 space-y-5 px-4 pb-6">
          {familias.map((f) => (
            <div key={f.base}>
              <h4 className="text-[15px] font-semibold text-foreground">
                {f.base}{" "}
                <span className="font-normal text-muted-foreground tabular-nums">
                  {f.metricas.length} {f.metricas.length === 1 ? "versión" : "versiones"}
                </span>
              </h4>
              <ul className="mt-2 space-y-1.5">
                {f.metricas.map((m) => (
                  <FilaMetrica
                    key={m.id}
                    metrica={m}
                    marcada={elegidas.includes(m.id)}
                    onClick={() => alternar(m.id)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function FilaMetrica({
  metrica: m,
  marcada,
  onClick,
}: {
  metrica: Metrica
  marcada: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={marcada}
        className={cn(
          "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors active:bg-muted",
          marcada ? "border-brand/50 bg-brand/10" : "border-border bg-card"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
            marcada ? "border-brand bg-brand" : "border-border"
          )}
        >
          {marcada && <Check className="h-3.5 w-3.5 text-brand-ink" />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-medium text-foreground">{m.nombre}</span>
            {m.destacada && (
              <span className="rounded-sm bg-brand/15 px-1.5 py-0.5 text-sm text-brand">
                la que pediste
              </span>
            )}
            {m.grupo === "avanzada" && (
              <span className="rounded-sm bg-muted px-1.5 py-0.5 text-sm text-muted-foreground">
                hoy sin datos
              </span>
            )}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
            {m.explica}
          </span>
        </span>
      </button>
    </li>
  )
}
