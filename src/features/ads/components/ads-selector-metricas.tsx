"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Check, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  METRICAS,
  metricaPorId,
  metricasPorDefecto,
  porFamiliaDeVariantes,
  type Metrica,
} from "@/lib/meta/metricas"

/**
 * Dónde se elige QUÉ métricas se ven y EN QUÉ ORDEN.
 *
 * Tres cosas que Marco pidió el 2026-08-07 y que la primera versión no tenía:
 *   1. Buscador. Con 48 métricas, ir mirando familia por familia no es buscar.
 *   2. Poder moverlas. El orden manda en los números grandes y en las columnas de la tabla.
 *   3. Que no se corte. La versión anterior mezclaba hoja inferior y cajón lateral, las dos
 *      posiciones se peleaban y parte del panel quedaba fuera de pantalla. Ahora la
 *      cabecera, el buscador y el pie son FIJOS y solo se desliza la lista.
 *
 * El orden se mueve con flechas, no arrastrando: arrastrar en un teléfono pelea con el
 * dedo que hace scroll y acabas moviendo la página en vez de la métrica.
 */

export const CLAVE_GUARDADO = "ads:metricas-elegidas"

export function leerElegidas(): string[] {
  if (typeof window === "undefined") return metricasPorDefecto()
  try {
    const guardado = window.localStorage.getItem(CLAVE_GUARDADO)
    if (!guardado) return metricasPorDefecto()
    const ids = JSON.parse(guardado) as string[]
    const validas = ids.filter((id) => METRICAS.some((m) => m.id === id))
    return validas.length > 0 ? validas : metricasPorDefecto()
  } catch {
    return metricasPorDefecto()
  }
}

function guardar(ids: string[]) {
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
  const [busqueda, setBusqueda] = useState("")

  function aplicar(ids: string[]) {
    onCambio(ids)
    guardar(ids)
  }

  const enOrden = useMemo(
    () => elegidas.map((id) => metricaPorId(id)).filter((m): m is Metrica => Boolean(m)),
    [elegidas]
  )

  const q = busqueda.trim().toLowerCase()

  // Se busca por nombre Y por explicación: así "personas" encuentra todas las que cuentan
  // gente en vez de clics, aunque no lleven esa palabra en el nombre.
  const familias = useMemo(() => {
    const todas = porFamiliaDeVariantes()
    if (!q) return todas
    return todas
      .map((f) => ({
        ...f,
        metricas: f.metricas.filter(
          (m) =>
            m.nombre.toLowerCase().includes(q) ||
            m.explica.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q)
        ),
      }))
      .filter((f) => f.metricas.length > 0)
  }, [q])

  function mover(indice: number, direccion: -1 | 1) {
    const destino = indice + direccion
    if (destino < 0 || destino >= elegidas.length) return
    const copia = [...elegidas]
    ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
    aplicar(copia)
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

      {/* Altura fija y SIN scroll propio: el que se desliza es solo el bloque de la lista.
          De ahí `flex flex-col`, `overflow-hidden` y `p-0`. Así la cabecera, el buscador y
          el pie quedan siempre visibles y no se corta nada. */}
      <SheetContent
        side="bottom"
        className={cn(
          "flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-xl p-0",
          "md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:w-[440px] md:max-w-[440px] md:rounded-l-xl md:rounded-tr-none md:border-l"
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />

        <SheetHeader className="shrink-0 px-4 pt-2">
          <SheetTitle className="text-[17px] font-semibold text-foreground">
            Qué métricas quieres ver
          </SheetTitle>
        </SheetHeader>

        <div className="shrink-0 px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar métrica"
              inputMode="search"
              className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground md:h-9 md:text-sm"
            />
          </div>
        </div>

        {/* Lo único que se desliza */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {enOrden.length > 0 && (
            <div className="mb-5">
              <h4 className="sticky top-0 z-10 bg-popover py-2 text-[15px] font-semibold text-foreground">
                Las tuyas, en este orden
              </h4>
              <ol className="space-y-1.5">
                {enOrden.map((m, i) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-1 rounded-lg border border-brand/40 bg-brand/10 p-2.5"
                  >
                    <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate px-1 text-[15px] font-medium text-foreground">
                      {m.nombre}
                    </span>
                    <button
                      type="button"
                      onClick={() => mover(i, -1)}
                      disabled={i === 0}
                      aria-label={`Subir ${m.nombre}`}
                      className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted disabled:opacity-30 md:h-8"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(i, 1)}
                      disabled={i === enOrden.length - 1}
                      aria-label={`Bajar ${m.nombre}`}
                      className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted disabled:opacity-30 md:h-8"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicar(elegidas.filter((x) => x !== m.id))}
                      aria-label={`Quitar ${m.nombre}`}
                      className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted md:h-8"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <h4 className="sticky top-0 z-10 bg-popover py-2 text-[15px] font-semibold text-foreground">
            {q ? "Resultados" : "Añadir más"}
          </h4>

          {familias.length === 0 && (
            <p className="py-3 text-[15px] text-muted-foreground">
              Ninguna métrica coincide con lo que buscas.
            </p>
          )}

          {familias.map((f) => (
            <div key={f.base} className="mb-4">
              <p className="mb-1.5 text-sm font-semibold text-muted-foreground">
                {f.base}{" "}
                <span className="font-normal tabular-nums">
                  {f.metricas.length} {f.metricas.length === 1 ? "versión" : "versiones"}
                </span>
              </p>
              <ul className="space-y-1.5">
                {f.metricas.map((m) => (
                  <FilaMetrica
                    key={m.id}
                    metrica={m}
                    marcada={elegidas.includes(m.id)}
                    onClick={() =>
                      aplicar(
                        elegidas.includes(m.id)
                          ? elegidas.filter((x) => x !== m.id)
                          : [...elegidas, m.id]
                      )
                    }
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Pie fijo: siempre alcanzable, sin tener que bajar hasta el final para cerrar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border p-3 pb-safe-4 md:pb-3">
          <button
            type="button"
            onClick={() => aplicar(metricasPorDefecto())}
            className="flex h-11 items-center gap-1.5 rounded-lg px-3 text-[15px] text-muted-foreground active:bg-muted md:h-9 md:text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Recomendadas
          </button>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="h-11 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground md:h-9 md:text-sm"
          >
            Listo
          </button>
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
