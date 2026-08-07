"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { metricaPorId, type Metrica } from "@/lib/meta/metricas"
import type { FilaCampana } from "@/lib/meta/panel"

/**
 * La lista de campañas, como la del administrador de anuncios pero con TUS métricas.
 *
 * En móvil NO es una tabla: es una lista de tarjetas. Una rejilla de ocho columnas en 375px
 * da 40 puntos por columna, donde no cabe ni una palabra, y el contenedor recorta lo que se
 * sale sin avisar. En escritorio sí va en tabla, con su cabecera ordenable.
 *
 * Las columnas son exactamente las métricas elegidas en el selector, ni una más.
 */

const POR_PAGINA = 20

const fmt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 })
const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 })
const fmtEur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })

function pinta(valor: number, m: Metrica | undefined): string {
  if (!m) return fmt.format(valor)
  switch (m.forma) {
    case "dinero":
      return fmtEur.format(valor)
    case "porcentaje":
      return `${fmtDec.format(valor)}%`
    case "texto":
      return valor ? fmt.format(valor) : "sin datos"
    default:
      // Las de tipo lista pueden ser coste (decimales) o recuento (enteros).
      if (m.id.startsWith("cost_per")) return fmtEur.format(valor)
      if (m.id.endsWith("_ctr")) return `${fmtDec.format(valor)}%`
      return valor % 1 === 0 ? fmt.format(valor) : fmtDec.format(valor)
  }
}

/** El objetivo de Meta viene en mayúsculas y en inglés. Se traduce a algo legible. */
const OBJETIVOS: Record<string, string> = {
  OUTCOME_LEADS: "Clientes potenciales",
  OUTCOME_TRAFFIC: "Tráfico",
  OUTCOME_ENGAGEMENT: "Interacción",
  OUTCOME_AWARENESS: "Reconocimiento",
  OUTCOME_SALES: "Ventas",
  OUTCOME_APP_PROMOTION: "Promoción de app",
  LINK_CLICKS: "Clics en el enlace",
  LEAD_GENERATION: "Clientes potenciales",
  CONVERSIONS: "Conversiones",
  REACH: "Alcance",
  BRAND_AWARENESS: "Reconocimiento",
  VIDEO_VIEWS: "Reproducciones",
  POST_ENGAGEMENT: "Interacción",
  MESSAGES: "Mensajes",
}

function objetivoLegible(o: string): string {
  return OBJETIVOS[o] ?? o.replace(/^OUTCOME_/, "").replace(/_/g, " ").toLowerCase()
}

export function ListaCampanas({
  campanas,
  elegidas,
  titulo = "Tus campañas",
}: {
  campanas: FilaCampana[]
  elegidas: string[]
  /** Cambia segun el nivel: campañas de la cuenta, o conjuntos de lo marcado. */
  titulo?: string
}) {
  const [busqueda, setBusqueda] = useState("")
  const [orden, setOrden] = useState<{ id: string; desc: boolean }>({ id: "spend", desc: true })
  const [pagina, setPagina] = useState(0)

  const columnas = useMemo(
    () => elegidas.map((id) => metricaPorId(id)).filter((m): m is Metrica => Boolean(m)),
    [elegidas]
  )

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const base = q ? campanas.filter((c) => c.nombre.toLowerCase().includes(q)) : campanas
    return [...base].sort((a, b) => {
      const va = a.valores[orden.id] ?? 0
      const vb = b.valores[orden.id] ?? 0
      return orden.desc ? vb - va : va - vb
    })
  }, [campanas, busqueda, orden])

  // Si un filtro deja menos páginas de las que había, se cae a la última en vez de
  // enseñar una página en blanco.
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas - 1)
  const visibles = filtradas.slice(paginaSegura * POR_PAGINA, (paginaSegura + 1) * POR_PAGINA)

  const totales = useMemo(() => {
    const out: Record<string, number> = {}
    for (const c of columnas) {
      // Los promedios (CTR, coste medio, frecuencia) NO se suman: sumarlos no significa
      // nada. Se deja en blanco y quien quiera el dato mira el total de arriba.
      const esPromedio =
        c.id.endsWith("_ctr") || c.id.startsWith("cost_per") || c.id === "cpc" ||
        c.id === "cpm" || c.id === "cpp" || c.id === "frequency" || c.forma === "texto"
      out[c.id] = esPromedio ? Number.NaN : filtradas.reduce((s, f) => s + (f.valores[c.id] ?? 0), 0)
    }
    return out
  }, [filtradas, columnas])

  function ordenarPor(id: string) {
    setOrden((o) => (o.id === id ? { id, desc: !o.desc } : { id, desc: true }))
    setPagina(0)
  }

  if (campanas.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card">
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <h3 className="text-[17px] font-semibold text-foreground">
            No hay campañas en este periodo
          </h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            Cambia las fechas de arriba para ver otro rango, o comprueba en Facebook que las
            campañas estuvieron activas.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-[17px] font-semibold text-foreground">{titulo}</h3>
          <span className="text-sm text-muted-foreground tabular-nums">
            {filtradas.length} de {campanas.length}
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(0)
            }}
            placeholder="Buscar campaña"
            inputMode="search"
            enterKeyHint="search"
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"
          />
        </div>
      </header>

      {/* ── MÓVIL: una tarjeta por campaña ── */}
      <ul className="divide-y divide-border md:hidden">
        {visibles.map((c) => (
          <li key={c.id} className="px-4 py-3">
            <p className="text-[15px] font-medium text-foreground">{c.nombre}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{objetivoLegible(c.objetivo)}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
              {columnas.map((m) => (
                <div key={m.id}>
                  <dt className="text-sm text-muted-foreground">{m.nombre}</dt>
                  <dd className="text-[15px] font-semibold text-foreground tabular-nums">
                    {pinta(c.valores[m.id] ?? 0, m)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* ── ESCRITORIO: la tabla, con su propio scroll lateral para no arrastrar la página ── */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full md:min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Campaña</th>
              {columnas.map((m) => (
                <th key={m.id} className="px-4 py-2.5 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => ordenarPor(m.id)}
                    title={m.explica}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {m.nombre}
                    {orden.id === m.id &&
                      (orden.desc ? (
                        <ArrowDown className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ))}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((c) => (
              <tr key={c.id} className="border-b border-border/60 last:border-0">
                <td className="max-w-[280px] px-4 py-2.5">
                  <p className="truncate font-medium text-foreground">{c.nombre}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {objetivoLegible(c.objetivo)}
                  </p>
                </td>
                {columnas.map((m) => (
                  <td
                    key={m.id}
                    className="px-4 py-2.5 text-right text-foreground tabular-nums"
                  >
                    {pinta(c.valores[m.id] ?? 0, m)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/40">
              <td className="px-4 py-2.5 font-semibold text-foreground">Total</td>
              {columnas.map((m) => (
                <td
                  key={m.id}
                  className="px-4 py-2.5 text-right font-semibold text-foreground tabular-nums"
                >
                  {Number.isNaN(totales[m.id]) ? (
                    <span className="font-normal text-muted-foreground">promedio</span>
                  ) : (
                    pinta(totales[m.id], m)
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {totalPaginas > 1 && (
        <footer className="flex items-center justify-between gap-3 border-t border-border p-3">
          <button
            type="button"
            disabled={paginaSegura === 0}
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            className="h-11 flex-1 rounded-lg border border-border text-[15px] text-foreground disabled:opacity-40 md:h-9 md:flex-none md:px-4 md:text-sm"
          >
            Anterior
          </button>
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {paginaSegura * POR_PAGINA + 1} a{" "}
            {Math.min((paginaSegura + 1) * POR_PAGINA, filtradas.length)} de {filtradas.length}
          </span>
          <button
            type="button"
            disabled={paginaSegura >= totalPaginas - 1}
            onClick={() => setPagina((p) => p + 1)}
            className="h-11 flex-1 rounded-lg border border-border text-[15px] text-foreground disabled:opacity-40 md:h-9 md:flex-none md:px-4 md:text-sm"
          >
            Siguiente
          </button>
        </footer>
      )}
    </section>
  )
}

export { pinta as pintaValor, objetivoLegible }
