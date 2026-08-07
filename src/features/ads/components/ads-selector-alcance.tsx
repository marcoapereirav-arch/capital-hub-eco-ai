"use client"

import { useMemo, useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FilaCampana, FilaConjunto } from "@/lib/meta/panel"

/**
 * QUÉ estás viendo. Con casillas, no con una sola elección.
 *
 * Marco, 2026-08-07: "si de repente existen cinco campañas y quiero ver tres, selecciono
 * las tres y ahí puedo ver todo". Por eso son casillas y los números salen SUMADOS de lo
 * marcado, no de una campaña suelta.
 *
 * Sin nada marcado significa la cuenta entera. Es el estado de entrada y se dice con
 * palabras, no dejando el botón vacío.
 */

const fmtEur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })

export type Alcance = { campanas: string[]; conjuntos: string[] }

export function SelectorAlcance({
  campanas,
  conjuntos,
  valor,
  onCambio,
}: {
  campanas: FilaCampana[]
  conjuntos: FilaConjunto[]
  valor: Alcance
  onCambio: (a: Alcance) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState("")

  const etiqueta = useMemo(() => {
    if (valor.conjuntos.length > 0) {
      return valor.conjuntos.length === 1
        ? conjuntos.find((c) => c.id === valor.conjuntos[0])?.nombre ?? "1 conjunto"
        : `${valor.conjuntos.length} conjuntos`
    }
    if (valor.campanas.length > 0) {
      return valor.campanas.length === 1
        ? campanas.find((c) => c.id === valor.campanas[0])?.nombre ?? "1 campaña"
        : `${valor.campanas.length} campañas`
    }
    return "Toda la cuenta"
  }, [valor, campanas, conjuntos])

  const q = busqueda.trim().toLowerCase()

  // Ordenadas por gasto, de mayor a menor. Meta devuelve tambien campañas que no gastaron
  // nada en el periodo, y si salen las primeras el selector abre con lo que no importa.
  // Las de cero quedan abajo y marcadas, para que se vea que existen pero no confundan.
  const campanasVisibles = useMemo(() => {
    const base = q ? campanas.filter((c) => c.nombre.toLowerCase().includes(q)) : campanas
    return [...base].sort((a, b) => (b.valores.spend ?? 0) - (a.valores.spend ?? 0))
  }, [campanas, q])

  // Los conjuntos que se enseñan son los de las campañas marcadas. Sin campañas marcadas
  // no se enseña ninguno: una lista de todos los conjuntos de la cuenta no ayuda a nadie.
  const conjuntosVisibles = useMemo(() => {
    if (valor.campanas.length === 0) return []
    const dentro = conjuntos.filter((c) => valor.campanas.includes(c.campanaId))
    const filtrados = q ? dentro.filter((c) => c.nombre.toLowerCase().includes(q)) : dentro
    return [...filtrados].sort((a, b) => (b.valores.spend ?? 0) - (a.valores.spend ?? 0))
  }, [conjuntos, valor.campanas, q])

  function alternarCampana(id: string) {
    const marcadas = valor.campanas.includes(id)
      ? valor.campanas.filter((x) => x !== id)
      : [...valor.campanas, id]
    // Al desmarcar una campaña se sueltan sus conjuntos: si no, quedarían filtrando por
    // algo que ya no está seleccionado y los números no cuadrarían con lo que se lee.
    const suyos = new Set(conjuntos.filter((c) => !marcadas.includes(c.campanaId)).map((c) => c.id))
    onCambio({ campanas: marcadas, conjuntos: valor.conjuntos.filter((x) => !suyos.has(x)) })
  }

  function alternarConjunto(id: string) {
    onCambio({
      campanas: valor.campanas,
      conjuntos: valor.conjuntos.includes(id)
        ? valor.conjuntos.filter((x) => x !== id)
        : [...valor.conjuntos, id],
    })
  }

  const hayFiltro = valor.campanas.length > 0 || valor.conjuntos.length > 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex h-11 max-w-full items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-[15px] text-foreground active:bg-muted md:h-9 md:text-sm"
      >
        <span className="shrink-0 text-muted-foreground">Viendo</span>
        <span className="min-w-0 truncate font-medium">{etiqueta}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", abierto && "rotate-180")}
        />
      </button>

      {abierto && (
        <>
          {/* Capa para cerrar tocando fuera. En movil es lo que se espera. */}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setAbierto(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div
            className={cn(
              "absolute z-50 mt-2 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-lg",
              // Se ancla a la izquierda del boton. En pantallas estrechas se centra para
              // que no se salga por ningun lado: era justo lo que se cortaba antes.
              "left-0 max-sm:left-1/2 max-sm:-translate-x-1/2"
            )}
          >
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar campaña o conjunto"
                  inputMode="search"
                  className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground md:h-9 md:text-sm"
                />
              </div>
            </div>

            {/* La lista es lo unico que se desliza: el buscador de arriba y el pie de abajo
                quedan siempre a la vista. */}
            <div className="max-h-[min(60dvh,26rem)] overflow-y-auto overscroll-contain p-2">
              <button
                type="button"
                onClick={() => onCambio({ campanas: [], conjuntos: [] })}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left active:bg-muted",
                  !hayFiltro && "bg-brand/10"
                )}
              >
                <Casilla marcada={!hayFiltro} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-foreground">
                    Toda la cuenta
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Todas las campañas juntas
                  </span>
                </span>
              </button>

              <p className="px-3 pb-1 pt-3 text-sm font-semibold text-muted-foreground">
                Campañas
              </p>
              {campanasVisibles.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">Ninguna coincide.</p>
              )}
              {campanasVisibles.map((c) => (
                <Fila
                  key={c.id}
                  marcada={valor.campanas.includes(c.id)}
                  titulo={c.nombre}
                  pie={
                    (c.valores.spend ?? 0) > 0
                      ? fmtEur.format(c.valores.spend)
                      : "sin gasto en este periodo"
                  }
                  apagada={(c.valores.spend ?? 0) === 0}
                  onClick={() => alternarCampana(c.id)}
                />
              ))}

              {conjuntosVisibles.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-3 text-sm font-semibold text-muted-foreground">
                    Conjuntos de las campañas marcadas
                  </p>
                  {conjuntosVisibles.map((c) => (
                    <Fila
                      key={c.id}
                      marcada={valor.conjuntos.includes(c.id)}
                      titulo={c.nombre}
                      pie={`${c.campanaNombre} · ${fmtEur.format(c.valores.spend ?? 0)}`}
                      onClick={() => alternarConjunto(c.id)}
                      sangrado
                    />
                  ))}
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border p-3">
              <span className="text-sm text-muted-foreground">
                {hayFiltro
                  ? `${valor.campanas.length} ${valor.campanas.length === 1 ? "campaña" : "campañas"}${valor.conjuntos.length ? ` · ${valor.conjuntos.length} conjuntos` : ""}`
                  : "Sin filtrar"}
              </span>
              <div className="flex gap-2">
                {hayFiltro && (
                  <button
                    type="button"
                    onClick={() => onCambio({ campanas: [], conjuntos: [] })}
                    className="flex h-11 items-center gap-1.5 rounded-lg px-3 text-[15px] text-muted-foreground active:bg-muted md:h-9 md:text-sm"
                  >
                    <X className="h-4 w-4" />
                    Quitar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="h-11 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground md:h-9 md:text-sm"
                >
                  Ver
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Fila({
  marcada,
  titulo,
  pie,
  onClick,
  sangrado = false,
  apagada = false,
}: {
  marcada: boolean
  titulo: string
  pie: string
  onClick: () => void
  sangrado?: boolean
  /** Sin gasto en el periodo: se puede marcar igual, pero no compite por la atencion. */
  apagada?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={marcada}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left active:bg-muted",
        marcada && "bg-brand/10",
        sangrado && "pl-7",
        apagada && !marcada && "opacity-60"
      )}
    >
      <Casilla marcada={marcada} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-foreground">{titulo}</span>
        <span className="block truncate text-sm text-muted-foreground tabular-nums">{pie}</span>
      </span>
    </button>
  )
}

function Casilla({ marcada }: { marcada: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
        marcada ? "border-brand bg-brand" : "border-border"
      )}
    >
      {marcada && <Check className="h-3.5 w-3.5 text-brand-ink" />}
    </span>
  )
}
