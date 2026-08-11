"use client"

/**
 * La rejilla de numeros del panel.
 *
 * REGLA DURA (Marco, 2026-08-07): todas las metricas se enseñan SIEMPRE, con su
 * nombre y su numero propio, haya o no haya datos. Nunca se esconde una tarjeta
 * porque el periodo venga vacio. Lo que se rompio en el barrido anterior fue
 * justo esto: el revenue y el cash collected estaban escritos para NO pintarse
 * si no habia dinero, asi que la pantalla se quedaba muda.
 *
 * Y la diferencia que si importa:
 *   - un CONTEO vacio es 0. Cero contactos es un dato: se escribe 0.
 *   - un PORCENTAJE o una MEDIA sin divisor no es 0, es que no se puede calcular.
 *     Ahi va un guion. Escribir 0% cuando no hubo ni una llamada es mentir.
 */

export type Kpi = {
  clave: string
  etiqueta: string
  /** null = no se puede calcular todavia. Se pinta un guion, nunca un cero. */
  valor: number | null
  formato: "euro" | "numero" | "porcentaje"
  /** Comparacion con el periodo anterior. null si no hay con que comparar. */
  delta?: { texto: string; sube: boolean } | null
  /** Frase corta que explica de donde sale, para quien no lo tenga en la cabeza. */
  ayuda?: string
}

function formatear(valor: number | null, formato: Kpi["formato"], eur: (n: number) => string) {
  if (valor === null) return "—"
  if (formato === "euro") return eur(valor)
  if (formato === "porcentaje") return `${Math.round(valor)}%`
  return String(Math.round(valor))
}

export function DashboardKpis({
  kpis,
  cargando,
  eur,
}: {
  kpis: Kpi[]
  cargando: boolean
  eur: (n: number) => string
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {kpis.map((k, i) => (
        <li
          key={k.clave}
          className="hud-in rounded-lg border border-border bg-card p-4"
          style={{ animationDelay: `${60 + i * 30}ms` }}
        >
          <div className="text-sm text-muted-foreground">{k.etiqueta}</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">
            {cargando ? "…" : formatear(k.valor, k.formato, eur)}
          </div>
          {!cargando && k.delta && (
            <div
              className={
                k.delta.sube
                  ? "mt-1 text-sm font-medium tabular-nums text-primary"
                  : "mt-1 text-sm font-medium tabular-nums text-muted-foreground"
              }
            >
              {k.delta.texto} vs periodo anterior
            </div>
          )}
          {!cargando && !k.delta && k.ayuda && (
            <div className="mt-1 text-sm text-muted-foreground">{k.ayuda}</div>
          )}
        </li>
      ))}
    </ul>
  )
}
