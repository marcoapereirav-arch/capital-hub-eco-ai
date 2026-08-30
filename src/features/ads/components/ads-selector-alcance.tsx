"use client"

import { useMemo, useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FilaAnuncio, FilaCampana, FilaConjunto } from "@/lib/meta/panel"

/**
 * QUÉ estás viendo. Con casillas, no con una sola elección.
 *
 * Marco, 2026-08-07: "si de repente existen cinco campañas y quiero ver tres, selecciono
 * las tres y ahí puedo ver todo". Por eso son casillas y los números salen SUMADOS de lo
 * marcado, no de una campaña suelta.
 *
 * Marco, 2026-08-28: "esta es una campaña, pero dentro hay dos conjuntos... quiero también
 * seleccionar los conjuntos que quiero ver internamente con estas métricas... un filtro más
 * para conjuntos y también un filtro más para anuncios". De ahí los TRES niveles.
 *
 * Los conjuntos y los anuncios ya NO exigen marcar antes la campaña. Antes, la lista de
 * conjuntos salía vacía hasta que marcabas una campaña, así que para ver un conjunto había
 * que adivinar de quién colgaba. Ahora cada nivel se puede marcar directo, y lo que se
 * marca arriba solo sirve para ACOTAR lo que se ofrece abajo.
 *
 * Sin nada marcado significa la cuenta entera. Es el estado de entrada y se dice con
 * palabras, no dejando el botón vacío.
 */

const fmtEur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })

export type Alcance = { campanas: string[]; conjuntos: string[]; anuncios: string[] }

type NivelSel = "campanas" | "conjuntos" | "anuncios"

/** Cuantas filas se pintan de golpe. El resto entra con el boton de abajo. */
const POR_TANDA = 20

export function SelectorAlcance({
  campanas,
  conjuntos,
  anuncios,
  valor,
  onCambio,
}: {
  campanas: FilaCampana[]
  conjuntos: FilaConjunto[]
  anuncios: FilaAnuncio[]
  valor: Alcance
  onCambio: (a: Alcance) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  // Una lista cada vez. Antes iban las tres apiladas y el desplegable se convertia en un
  // scroll sin fin: para llegar a los anuncios habia que pasar por encima de todo lo demas.
  // Marco, 2026-08-28: "campañas por un lado, conjuntos por otro, anuncios por otro".
  const [pestana, setPestana] = useState<NivelSel>("campanas")
  // Y dentro de la lista, de 20 en 20. La cuenta tiene mas de cien anuncios.
  const [verHasta, setVerHasta] = useState(POR_TANDA)

  // La etiqueta nombra el nivel MÁS FINO que esté marcado: si hay anuncios sueltos
  // marcados, eso es lo que estás viendo, aunque también haya campañas marcadas.
  const etiqueta = useMemo(() => {
    const uno = (ids: string[], lista: { id: string; nombre: string }[], plural: string) =>
      ids.length === 1 ? (lista.find((x) => x.id === ids[0])?.nombre ?? `1 ${plural}`) : null

    if (valor.anuncios.length > 0)
      return uno(valor.anuncios, anuncios, "anuncio") ?? `${valor.anuncios.length} anuncios`
    if (valor.conjuntos.length > 0)
      return uno(valor.conjuntos, conjuntos, "conjunto") ?? `${valor.conjuntos.length} conjuntos`
    if (valor.campanas.length > 0)
      return uno(valor.campanas, campanas, "campaña") ?? `${valor.campanas.length} campañas`
    return "Toda la cuenta"
  }, [valor, campanas, conjuntos, anuncios])

  const q = busqueda.trim().toLowerCase()
  const coincide = (n: string) => !q || n.toLowerCase().includes(q)
  const porGasto = <T extends { valores: Record<string, number> }>(a: T, b: T) =>
    (b.valores.spend ?? 0) - (a.valores.spend ?? 0)

  // Ordenadas por gasto, de mayor a menor. Meta devuelve tambien campañas que no gastaron
  // nada en el periodo, y si salen las primeras el selector abre con lo que no importa.
  // Las de cero quedan abajo y apagadas, para que se vea que existen pero no confundan.
  const campanasVisibles = useMemo(
    () => campanas.filter((c) => coincide(c.nombre)).sort(porGasto),
    [campanas, q]
  )

  // Si hay campañas marcadas, solo se ofrecen sus conjuntos. Si no, todos: asi se puede ir
  // directo a un conjunto sin saber de que campaña cuelga.
  const conjuntosVisibles = useMemo(() => {
    const dentro =
      valor.campanas.length > 0
        ? conjuntos.filter((c) => valor.campanas.includes(c.campanaId))
        : conjuntos
    return dentro.filter((c) => coincide(c.nombre)).sort(porGasto)
  }, [conjuntos, valor.campanas, q])

  // Igual un nivel mas abajo: acota por conjunto si lo hay, si no por campaña, si no todos.
  const anunciosVisibles = useMemo(() => {
    const dentro =
      valor.conjuntos.length > 0
        ? anuncios.filter((a) => valor.conjuntos.includes(a.conjuntoId))
        : valor.campanas.length > 0
          ? anuncios.filter((a) => valor.campanas.includes(a.campanaId))
          : anuncios
    return dentro.filter((a) => coincide(a.nombre)).sort(porGasto)
  }, [anuncios, valor.conjuntos, valor.campanas, q])

  /**
   * Al desmarcar una campaña se sueltan sus conjuntos Y sus anuncios. Si no, quedarían
   * filtrando por algo que ya no está marcado y los números no cuadrarían con lo que se lee
   * en el botón.
   */
  function alternarCampana(id: string) {
    const marcadas = valor.campanas.includes(id)
      ? valor.campanas.filter((x) => x !== id)
      : [...valor.campanas, id]

    if (marcadas.length === 0) {
      onCambio({ campanas: [], conjuntos: valor.conjuntos, anuncios: valor.anuncios })
      return
    }
    const dentro = (campanaId: string) => marcadas.includes(campanaId)
    onCambio({
      campanas: marcadas,
      conjuntos: valor.conjuntos.filter((x) =>
        conjuntos.some((c) => c.id === x && dentro(c.campanaId))
      ),
      anuncios: valor.anuncios.filter((x) =>
        anuncios.some((a) => a.id === x && dentro(a.campanaId))
      ),
    })
  }

  function alternarConjunto(id: string) {
    const marcados = valor.conjuntos.includes(id)
      ? valor.conjuntos.filter((x) => x !== id)
      : [...valor.conjuntos, id]

    onCambio({
      campanas: valor.campanas,
      conjuntos: marcados,
      // Mismo motivo que arriba, un nivel mas abajo.
      anuncios:
        marcados.length === 0
          ? valor.anuncios
          : valor.anuncios.filter((x) =>
              anuncios.some((a) => a.id === x && marcados.includes(a.conjuntoId))
            ),
    })
  }

  function alternarAnuncio(id: string) {
    onCambio({
      ...valor,
      anuncios: valor.anuncios.includes(id)
        ? valor.anuncios.filter((x) => x !== id)
        : [...valor.anuncios, id],
    })
  }

  // La lista que se esta mirando ahora mismo, ya normalizada a un formato comun.
  const listaActiva = useMemo(() => {
    if (pestana === "conjuntos")
      return conjuntosVisibles.map((c) => ({
        id: c.id,
        titulo: c.nombre,
        pie: `${c.campanaNombre} · ${fmtEur.format(c.valores.spend ?? 0)}`,
        gasto: c.valores.spend ?? 0,
        marcada: valor.conjuntos.includes(c.id),
        alternar: () => alternarConjunto(c.id),
      }))
    if (pestana === "anuncios")
      return anunciosVisibles.map((a) => ({
        id: a.id,
        titulo: a.nombre,
        pie: `${a.conjuntoNombre} · ${fmtEur.format(a.valores.spend ?? 0)}`,
        gasto: a.valores.spend ?? 0,
        marcada: valor.anuncios.includes(a.id),
        alternar: () => alternarAnuncio(a.id),
      }))
    return campanasVisibles.map((c) => ({
      id: c.id,
      titulo: c.nombre,
      pie:
        (c.valores.spend ?? 0) > 0
          ? fmtEur.format(c.valores.spend)
          : "sin gasto en este periodo",
      gasto: c.valores.spend ?? 0,
      marcada: valor.campanas.includes(c.id),
      alternar: () => alternarCampana(c.id),
    }))
  }, [pestana, campanasVisibles, conjuntosVisibles, anunciosVisibles, valor])

  const visibles = listaActiva.slice(0, verHasta)
  const quedan = listaActiva.length - visibles.length

  // Al cambiar de pestaña o de busqueda se vuelve a empezar: si no, cambiar de "Anuncios"
  // (donde habias abierto 60) a "Campañas" (que tiene 3) dejaria el boton diciendo cosas
  // raras y la lista arrancaria por donde no toca.
  function irA(n: NivelSel) {
    setPestana(n)
    setVerHasta(POR_TANDA)
  }

  const PESTANAS: { id: NivelSel; etiqueta: string; total: number; marcados: number }[] = [
    { id: "campanas", etiqueta: "Campañas", total: campanasVisibles.length, marcados: valor.campanas.length },
    { id: "conjuntos", etiqueta: "Conjuntos", total: conjuntosVisibles.length, marcados: valor.conjuntos.length },
    { id: "anuncios", etiqueta: "Anuncios", total: anunciosVisibles.length, marcados: valor.anuncios.length },
  ]

  const acotada =
    (pestana === "conjuntos" && valor.campanas.length > 0) ||
    (pestana === "anuncios" && (valor.conjuntos.length > 0 || valor.campanas.length > 0))

  const nada = { campanas: [], conjuntos: [], anuncios: [] }
  const marcados =
    valor.campanas.length + valor.conjuntos.length + valor.anuncios.length
  const hayFiltro = marcados > 0

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
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            abierto && "rotate-180"
          )}
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
              "absolute z-50 mt-2 w-[min(460px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-lg",
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
                  onChange={(e) => {
                    setBusqueda(e.target.value)
                    setVerHasta(POR_TANDA)
                  }}
                  placeholder="Buscar campaña, conjunto o anuncio"
                  inputMode="search"
                  className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground md:h-9 md:text-sm"
                />
              </div>
            </div>

            {/* Fija: es el reset y no debe perderse dentro del scroll de la lista. */}
            <button
              type="button"
              onClick={() => onCambio(nada)}
              className={cn(
                "flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left active:bg-muted",
                !hayFiltro && "bg-brand/10"
              )}
            >
              <Casilla marcada={!hayFiltro} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-foreground">
                  Toda la cuenta
                </span>
                <span className="block text-sm text-muted-foreground">
                  Sin filtrar por nada
                </span>
              </span>
            </button>

            {/* Una pestaña por nivel. Fijas: se cambia de lista sin tener que subir. */}
            <div
              role="tablist"
              aria-label="Qué quieres marcar"
              className="flex gap-1 border-b border-border p-2"
            >
              {PESTANAS.map((t) => {
                const activa = t.id === pestana
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={activa}
                    onClick={() => irA(t.id)}
                    className={cn(
                      "flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[15px] font-medium transition-colors md:h-9 md:text-sm",
                      activa
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground active:bg-muted md:hover:text-foreground"
                    )}
                  >
                    {t.etiqueta}
                    <span
                      className={cn(
                        "tabular-nums",
                        activa
                          ? "opacity-70"
                          : t.marcados > 0
                            ? "font-semibold text-brand"
                            : "text-muted-foreground"
                      )}
                    >
                      {t.marcados > 0 ? t.marcados : t.total}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Lo unico que se desliza. El buscador, las pestañas y el pie no se mueven. */}
            <div className="max-h-[min(52dvh,22rem)] overflow-y-auto overscroll-contain p-2">
              {acotada && (
                <p className="px-3 pb-1 pt-1 text-sm text-muted-foreground">
                  Solo los de lo que has marcado antes.
                </p>
              )}

              {listaActiva.length === 0 && <Vacio />}

              {visibles.map((f) => (
                <Fila
                  key={f.id}
                  marcada={f.marcada}
                  titulo={f.titulo}
                  pie={f.pie}
                  apagada={f.gasto === 0}
                  onClick={f.alternar}
                />
              ))}

              {quedan > 0 && (
                <button
                  type="button"
                  onClick={() => setVerHasta((v) => v + POR_TANDA)}
                  className="mt-1 flex h-11 w-full items-center justify-center rounded-lg text-[15px] font-medium text-muted-foreground active:bg-muted md:h-9 md:text-sm"
                >
                  Ver {Math.min(quedan, POR_TANDA)} más
                  <span className="ml-1.5 tabular-nums opacity-70">({quedan} sin ver)</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border p-3">
              <span className="text-sm text-muted-foreground tabular-nums">
                {hayFiltro
                  ? `${marcados} ${marcados === 1 ? "marcado" : "marcados"}`
                  : "Sin filtrar"}
              </span>
              <div className="flex gap-2">
                {hayFiltro && (
                  <button
                    type="button"
                    onClick={() => onCambio(nada)}
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

function Vacio() {
  return <p className="px-3 py-2 text-sm text-muted-foreground">Ninguno coincide.</p>
}

function Fila({
  marcada,
  titulo,
  pie,
  onClick,
  apagada = false,
}: {
  marcada: boolean
  titulo: string
  pie: string
  onClick: () => void
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
