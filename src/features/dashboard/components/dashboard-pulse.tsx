"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * EL PULSO: que paso cada dia.
 *
 * Mide PERSONAS, no dinero. Es la decision que hace que este grafico siga vivo
 * cuando la facturacion esta a cero: una curva de ingresos hoy seria una raya
 * plana con un cartel encima, que es exactamente lo que Marco vio como una caja
 * vacia. El dinero no desaparece: se marca ENCIMA de la columna del tramo en el
 * que entro, con su importe escrito al lado.
 *
 * Regla de los tramos (una sola frase): el tramo empieza siendo el dia y se
 * agranda (dia, semana, quincena, mes) hasta que quepan 7 o menos. Asi el
 * dibujo es IDENTICO en el telefono y en el ordenador, y cada columna siempre
 * tiene sitio para su numero escrito encima.
 *
 * Misma gramatica que la cadena: PISTA + RELLENO, y la pista se dibuja siempre.
 * Un tramo a cero no desaparece: deja su marca en el suelo, asi que la linea del
 * tiempo se ve completa y nunca parece rota.
 *
 * Se dibuja con cajas del navegador, no con un lienzo que haya que medir: no
 * hay ResizeObserver que pueda medir cero, no hay viewBox que se pueda estirar y
 * no existe la posibilidad de que la tarjeta salga en blanco. Los numeros y las
 * fechas son texto normal colocado alrededor de la pista, asi que se leen aunque
 * el dibujo no llegara a pintarse.
 */

export type TramoPulso = {
  clave: string
  /** Lo que se escribe debajo de la columna: "4" o "4-10". Corto a proposito. */
  etiqueta: string
  /** Palabras normales para la lectura: "lunes 4 de agosto", "del 4 al 10 de agosto". */
  etiquetaLarga: string
  contactos: number
  ingresos: number
}

export function DashboardPulse({
  tramos,
  unidad,
  desde,
  hasta,
  formatoEuro,
}: {
  tramos: TramoPulso[]
  /** "Día" | "Semana" | "Quincena" | "Mes" */
  unidad: string
  /** Extremo izquierdo del eje horizontal, ya formateado. */
  desde: string
  /** Extremo derecho del eje horizontal, ya formateado. */
  hasta: string
  formatoEuro: (n: number) => string
}) {
  const [fijado, setFijado] = useState<string | null>(null)
  const [encima, setEncima] = useState<string | null>(null)

  const max = Math.max(...tramos.map((t) => t.contactos), 1)
  const total = tramos.reduce((s, t) => s + t.contactos, 0)

  const activoClave = encima ?? fijado
  const activo = tramos.find((t) => t.clave === activoClave) ?? null

  const mejor = tramos.reduce<TramoPulso | null>(
    (m, t) => (t.contactos > 0 && (!m || t.contactos > m.contactos) ? t : m),
    null,
  )

  /* El importe se escribe UNA vez, sobre el tramo que mas facturo. A 375 puntos
     una columna mide unos 39, y "2.000 EUR" no cabe dentro: escribirlo en cada
     columna solo conseguiria cortarlo. El resto de tramos con dinero se ven por
     su remate verde macizo y lo dicen al tocarlos. */
  let iDinero = -1
  tramos.forEach((t, i) => {
    if (t.ingresos > 0 && (iDinero < 0 || t.ingresos > tramos[iDinero].ingresos)) iDinero = i
  })

  const lectura = activo
    ? `${mayuscula(activo.etiquetaLarga)}: entraron ${activo.contactos} ${plural(activo.contactos, "contacto", "contactos")}` +
      (activo.ingresos > 0 ? ` y facturaron ${formatoEuro(activo.ingresos)}.` : ".")
    : total === 0
      ? "No entró ningún contacto en este periodo."
      : mejor
        ? `El mejor tramo fue ${mejor.etiquetaLarga}: entraron ${mejor.contactos} ${plural(mejor.contactos, "contacto", "contactos")}.`
        : "No entró ningún contacto en este periodo."

  return (
    <div className="px-4 pt-2 pb-5 md:px-5">
      {/* Eje vertical rotulado con sus dos extremos, en una sola linea. */}
      <div className="flex items-baseline justify-between gap-2 text-sm text-muted-foreground">
        <span>Contactos</span>
        <span className="tabular-nums">0 a {max}</span>
      </div>

      {/* El importe, colocado justo encima de su columna. Se pega al borde
          cuando es el primer o el ultimo tramo, para que nunca se salga. */}
      <div
        className="mt-2 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, tramos.length)},minmax(0,1fr))` }}
      >
        {tramos.map((t, i) => (
          <span
            key={t.clave}
            className={cn(
              "block min-h-5 whitespace-nowrap text-sm font-semibold tabular-nums text-primary",
              i === 0 ? "justify-self-start" : i === tramos.length - 1 ? "justify-self-end" : "justify-self-center",
            )}
          >
            {i === iDinero ? formatoEuro(t.ingresos) : ""}
          </span>
        ))}
      </div>

      <div className="flex h-[180px] items-stretch gap-1.5 md:h-[240px]">
        {tramos.map((t) => {
          const alto = t.contactos > 0 ? Math.max(4, Math.round((t.contactos / max) * 100)) : 0
          const seleccionado = activoClave === t.clave
          return (
            <button
              key={t.clave}
              type="button"
              onClick={() => setFijado(fijado === t.clave ? null : t.clave)}
              onMouseEnter={() => setEncima(t.clave)}
              onMouseLeave={() => setEncima(null)}
              aria-pressed={seleccionado}
              className="flex min-w-0 flex-1 flex-col items-stretch gap-1 text-center"
            >
              {/* El numero SIEMPRE escrito, tambien el 0. En un telefono no hay
                  cursor: un dato que solo se vea al pasar por encima no existe. */}
              <span
                className={cn(
                  "block text-sm tabular-nums",
                  t.contactos > 0 ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {t.contactos}
              </span>

              <span
                className={cn(
                  "relative block min-h-0 flex-1 overflow-hidden rounded-lg bg-muted",
                  seleccionado && "ring-1 ring-ring",
                )}
              >
                {t.contactos > 0 ? (
                  <span
                    className="pulso-in absolute inset-x-0 bottom-0 block bg-primary"
                    style={{ height: `${alto}%` }}
                    aria-hidden
                  />
                ) : (
                  // Tramo a cero: marca en el suelo, no hueco. La linea del
                  // tiempo se ve completa siempre.
                  <span className="absolute inset-x-0 bottom-0 block h-[3px] bg-border" aria-hidden />
                )}
                {t.ingresos > 0 && (
                  <span
                    className="absolute inset-x-0 block h-1.5 bg-primary"
                    style={{ bottom: `${alto}%` }}
                    aria-hidden
                  />
                )}
              </span>

              <span className="block truncate text-sm tabular-nums text-muted-foreground">
                {t.etiqueta}
              </span>
            </button>
          )
        })}
      </div>

      {/* Eje horizontal rotulado con sus dos extremos y el nombre del tramo. */}
      <div className="mt-1 flex items-baseline justify-between gap-2 text-sm text-muted-foreground">
        <span className="truncate">{desde}</span>
        <span className="shrink-0">{unidad}</span>
        <span className="truncate">{hasta}</span>
      </div>

      <p className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-[15px] text-foreground">
        {lectura}
      </p>
    </div>
  )
}

function plural(n: number, uno: string, varios: string): string {
  return n === 1 ? uno : varios
}

function mayuscula(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
