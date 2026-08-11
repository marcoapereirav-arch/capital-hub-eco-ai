"use client"

import { cn } from "@/lib/utils"

/**
 * Barras horizontales. El grafico de esta seccion.
 *
 * Por que horizontales: en un telefono de 375 puntos las etiquetas de un eje de abajo no
 * caben y salen cortadas o giradas. Con la barra tumbada, el nombre va a la izquierda y la
 * barra crece a la derecha. Ver receta 7 de la skill os-movil-primero.
 *
 * Reglas que cumple, del brandkit:
 *  · el numero va ESCRITO al final de cada barra, siempre visible (en el telefono no hay
 *    cursor, asi que un dato que solo aparece al pasar el raton no existe)
 *  · el maximo esta rotulado arriba, que es el "eje" de este grafico
 *  · maximo 7 barras: lo que sobra se junta en "Otros"
 *  · no se usa SVG estirado. Es ancho en porcentaje, asi que no hay lienzo que deformar.
 */

export type Barra = {
  clave: string
  etiqueta: string
  valor: number
  /** Segunda linea pequena debajo del nombre. Opcional. */
  detalle?: string
  /** Marca la barra como "algo que mirar" (se pinta hueca, no verde). */
  atencion?: boolean
}

const MAXIMO_BARRAS = 7

export function BarrasHorizontales({
  titulo,
  barras,
  formato = (n) => n.toLocaleString("es-ES"),
  unidad,
  vacio = "Todavía no hay datos en este periodo.",
  mantenerOrden = false,
}: {
  titulo: string
  barras: Barra[]
  formato?: (n: number) => string
  /** Que mide el eje, en palabras normales. Ej: "personas" o "euros". */
  unidad: string
  vacio?: string
  /**
   * Deja el orden que llega. Se usa para el tiempo: una linea temporal ordenada de mayor
   * a menor deja de ser una linea temporal y no se entiende nada.
   */
  mantenerOrden?: boolean
}) {
  const ordenadas = mantenerOrden ? [...barras] : [...barras].sort((a, b) => b.valor - a.valor)
  const visibles = ordenadas.slice(0, MAXIMO_BARRAS)
  const resto = ordenadas.slice(MAXIMO_BARRAS)

  if (resto.length) {
    visibles.push({
      clave: "__otros",
      etiqueta: `Otros (${resto.length})`,
      valor: resto.reduce((s, b) => s + b.valor, 0),
    })
  }

  const maximo = Math.max(...visibles.map((b) => b.valor), 1)
  // Hay grafico en cuanto hay filas, aunque todas valgan cero.
  //
  // Antes se exigia que algun valor fuera mayor que cero, y eso escondia informacion de
  // verdad: un afiliado con 40 visitas y ninguna persona registrada desaparecia entero de
  // la pantalla, como si no existiera. Ver un cero al lado de su nombre dice mucho mas que
  // no verlo. Lo encontro la prueba de la cadena, no una suposicion.
  const hayFilas = visibles.length > 0
  const hayAlgunValor = visibles.some((b) => b.valor > 0)

  return (
    <section className="rounded-xl border border-border bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[17px] font-semibold text-foreground">{titulo}</h3>
        {hayAlgunValor && (
          <p className="text-sm text-muted-foreground">
            De 0 a <span className="tabular-nums font-semibold text-foreground">{formato(maximo)}</span> {unidad}
          </p>
        )}
      </div>

      {!hayFilas ? (
        <p className="mt-4 text-[15px] text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visibles.map((b) => {
            const ancho = Math.max((b.valor / maximo) * 100, b.valor > 0 ? 3 : 0)
            return (
              <li key={b.clave}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
                    {b.etiqueta}
                  </span>
                  <span className="shrink-0 text-[15px] font-semibold tabular-nums text-foreground">
                    {formato(b.valor)}
                  </span>
                </div>
                {b.detalle && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{b.detalle}</p>
                )}
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-lg bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-lg transition-[width] duration-500",
                      b.atencion ? "border border-border bg-secondary" : "bg-primary",
                    )}
                    style={{ width: `${ancho}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
