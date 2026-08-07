"use client"

import { useState } from "react"
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * LA CADENA: de contacto a venta.
 *
 * Un solo objeto que cae por la pantalla y se va estrechando, con el dinero
 * colgando arriba. Sustituye a cuatro bloques de cifras del panel anterior (las
 * cuatro mini lecturas, la tarjeta grande de facturacion, la lista "Resumen del
 * periodo" y la rejilla de ocho tarjetas de KPI): ninguno de esos numeros se
 * pierde, todos pasan a estar DIBUJADOS aqui dentro.
 *
 * La gramatica es una sola y se repite en toda la pagina: PISTA + RELLENO. La
 * pista SIEMPRE se dibuja, aunque el valor sea 0. Un grafico a cero se lee como
 * una pantalla rota; una pista vacia con su 0 escrito encima se lee como algo
 * dibujado a proposito que esta esperando datos. Es la decision mas importante
 * del rediseno, porque hoy el panel se abre con ceros.
 *
 * No hay nada que medir: todo son cajas del navegador y los estrechamientos son
 * recortes (clip-path) en porcentaje. Asi es IMPOSIBLE que la pieza salga en
 * blanco, que es el fallo que ya se cometio dos veces con graficos que se median
 * a si mismos.
 *
 * El ambar (token warn) esta racionado: aparece como maximo una vez en esta
 * pieza, en el eslabon que mas gente pierde, y NUNCA cuando todo esta a cero,
 * porque si no ha pasado nada no existe un eslabon peor.
 */

export type EslabonCadena = {
  clave: string
  nombre: string
  /** El total del escalon. Es lo que mide la pista entera. */
  valor: number
  /** Lo que de verdad pasa al escalon siguiente (en Llamadas, las que se hicieron). */
  salida: number
  /** Trozo de la pista que quedo sin cumplir, dibujado con borde punteado. */
  hueco: { valor: number; texto: string } | null
  /** El mismo dato del periodo anterior. null cuando ese dato no se carga hoy. */
  anterior: number | null
  /** Linea de 14 bajo el escalon (el latido, el ticket medio). */
  pie: string | null
  /** Lectura larga en palabras normales cuando se toca la fila. */
  lectura: string
  href: string
  hrefTexto: string
}

export type ConectorCadena = {
  de: number
  a: number
  /** "26 entraron, 0 se agendaron" */
  texto: string
  /** "26 no agendaron". null cuando no se pierde a nadie. */
  perdida: string | null
}

export function DashboardChain({
  facturado,
  comparacion,
  cobro,
  eslabones,
  conectores,
  lecturaPorDefecto,
  enlacePorDefecto,
  botonPrincipal,
  pie,
}: {
  facturado: string
  comparacion: { texto: string; sube: boolean } | null
  cobro: { pct: number; cobrado: string; porCobrar: string } | null
  eslabones: EslabonCadena[]
  conectores: ConectorCadena[]
  lecturaPorDefecto: string
  enlacePorDefecto: { texto: string; href: string }
  botonPrincipal: { texto: string; href: string } | null
  pie: { texto: string; href: string } | null
}) {
  const [activo, setActivo] = useState<string | null>(null)

  // La escala manda sobre los tres escalones a la vez: por eso los tres juntos
  // dibujan un escalonado descendente que ES el embudo del periodo.
  const base = Math.max(...eslabones.map((e) => Math.max(e.valor, e.anterior ?? 0)), 1)
  const ancho = (v: number) => Math.max(0, Math.min(100, (v / base) * 100))

  /* El unico ambar de la pieza: el conector que pierde mas proporcion de gente.
     Solo se enciende si de verdad hay gente que se cae. */
  let peor = -1
  let peorPct = Number.POSITIVE_INFINITY
  conectores.forEach((c, i) => {
    if (c.de <= 0 || c.a >= c.de) return
    const pct = c.a / c.de
    if (pct < peorPct) {
      peorPct = pct
      peor = i
    }
  })

  const seleccionado = eslabones.find((e) => e.clave === activo) ?? null
  const lectura = seleccionado ? seleccionado.lectura : lecturaPorDefecto
  const enlace = seleccionado
    ? { texto: seleccionado.hrefTexto, href: seleccionado.href }
    : enlacePorDefecto

  return (
    <div className="px-4 pt-4 pb-5 md:px-5 md:pt-5">
      {/* EL DINERO, colgando del final de la cadena pero a la vista desde arriba */}
      <span className="block text-sm font-semibold text-muted-foreground">Facturado</span>
      <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="text-4xl font-bold leading-none tabular-nums text-foreground md:text-5xl">
          {facturado}
        </span>
        {comparacion && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-semibold",
              comparacion.sube ? "text-primary" : "text-muted-foreground",
            )}
          >
            {comparacion.sube ? (
              <TrendingUp className="size-4" aria-hidden />
            ) : (
              <TrendingDown className="size-4" aria-hidden />
            )}
            {comparacion.texto}
          </span>
        )}
      </div>

      {/* LA BARRA DE COBRO. Solo existe si hay facturacion: con 0 EUR seria un
          carril vacio con "0 EUR" en los dos extremos, o sea un objeto que no
          dice nada. */}
      {cobro && (
        <div className="mt-4">
          <div className="relative h-3 w-full overflow-hidden rounded-lg bg-muted">
            <div
              className="cadena-in absolute inset-y-0 left-0 bg-primary"
              style={{ width: `${cobro.pct}%` }}
              aria-hidden
            />
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold tabular-nums text-primary">{cobro.cobrado} cobrado</span>
            <span className="tabular-nums text-muted-foreground">{cobro.porCobrar} por cobrar</span>
          </div>
        </div>
      )}

      {/* LA CADENA */}
      <div className="mt-6">
        {eslabones.map((e, i) => {
          const conector = conectores[i]
          const abierto = activo === e.clave
          const wSalida = ancho(e.salida)
          const wHueco = e.hueco ? ancho(e.hueco.valor) : 0
          return (
            <div key={e.clave}>
              <button
                type="button"
                onClick={() => setActivo(abierto ? null : e.clave)}
                aria-pressed={abierto}
                className="block w-full min-h-11 text-left"
              >
                <div className="flex items-end justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">
                    {e.nombre}
                  </span>
                  <span className="shrink-0 text-3xl font-bold leading-none tabular-nums text-foreground">
                    {e.valor}
                  </span>
                </div>

                {/* PISTA + RELLENO. La pista se dibuja SIEMPRE, con datos o sin ellos. */}
                <div
                  className={cn(
                    "relative mt-2 h-3 w-full overflow-hidden rounded-lg bg-muted",
                    abierto && "ring-1 ring-ring",
                  )}
                >
                  <div
                    className="cadena-in absolute inset-y-0 left-0 bg-primary"
                    style={{ width: `${wSalida}%`, animationDelay: `${i * 90}ms` }}
                    aria-hidden
                  />
                  {e.hueco && (
                    <div
                      className="absolute inset-y-0 rounded-lg border border-dashed border-border"
                      style={{ left: `${wSalida}%`, width: `${wHueco}%` }}
                      aria-hidden
                    />
                  )}
                  {/* La marca fina del periodo anterior va ENCIMA del relleno, asi
                      que asoma tanto si hoy vamos por delante como por detras. */}
                  {e.anterior !== null && e.anterior > 0 && (
                    <div
                      className="absolute inset-y-0 w-0.5 bg-muted-foreground"
                      style={{ left: `calc(${ancho(e.anterior)}% - 1px)` }}
                      aria-hidden
                    />
                  )}
                </div>

                {(e.hueco || e.pie) && (
                  <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    {e.hueco ? (
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {e.hueco.texto}
                      </span>
                    ) : (
                      <span />
                    )}
                    {e.pie && (
                      <span className="text-sm tabular-nums text-muted-foreground">{e.pie}</span>
                    )}
                  </div>
                )}
              </button>

              {/* EL CONECTOR: la banda se estrecha y la perdida sale del dibujo
                  como una cuna hacia la derecha, con su numero y dos palabras. */}
              {conector && <Conector conector={conector} ancho={ancho} esPeor={peor === i} />}
            </div>
          )
        })}
      </div>

      {/* LA FRANJA DE LECTURA: nunca esta vacia. Por defecto lee el eslabon que
          mas pierde; al tocar un escalon, pasa a leer ese escalon. En un telefono
          no hay cursor, asi que una lectura permanente vale mas que una etiqueta
          que solo sale al pasar por encima. */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
        <p className="min-w-0 flex-1 text-[15px] text-foreground">{lectura}</p>
        <a
          href={enlace.href}
          className="inline-flex h-11 shrink-0 items-center gap-1 text-sm font-semibold text-foreground md:h-8"
        >
          {enlace.texto}
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
      </div>

      {pie && (
        <a
          href={pie.href}
          className="mt-3 inline-flex h-11 items-center gap-1 text-sm text-muted-foreground md:h-8"
        >
          {pie.texto}
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
      )}

      {botonPrincipal && (
        <a
          href={botonPrincipal.href}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 md:w-auto"
        >
          {botonPrincipal.texto}
        </a>
      )}
    </div>
  )
}

/**
 * Un tramo de banda que se estrecha. Los dos trozos son recortes en porcentaje,
 * asi que no hay nada que medir y no puede quedarse en blanco.
 */
function Conector({
  conector,
  ancho,
  esPeor,
}: {
  conector: ConectorCadena
  ancho: (v: number) => number
  esPeor: boolean
}) {
  const wArriba = ancho(conector.de)
  const wAbajo = ancho(conector.a)
  const pct = conector.de > 0 ? Math.round((conector.a / conector.de) * 100) : null
  const seEnsancha = conector.a > conector.de

  return (
    <div className="relative h-[52px]">
      {/* La banda que cae y se estrecha */}
      {(wArriba > 0 || wAbajo > 0) && (
        <div
          className="absolute inset-0 bg-primary/25"
          style={{
            clipPath: `polygon(0% 0%, ${wArriba}% 0%, ${wAbajo}% 100%, 0% 100%)`,
          }}
          aria-hidden
        />
      )}
      {/* La cuna de los que se caen, saliendo del dibujo hacia la derecha */}
      {wArriba > wAbajo && (
        <div
          className={cn("absolute inset-0", esPeor ? "bg-warn/25" : "bg-muted")}
          style={{
            clipPath: `polygon(${wAbajo}% 100%, ${wArriba}% 0%, ${wArriba}% 100%)`,
          }}
          aria-hidden
        />
      )}
      {/* Guia fina cuando todavia no hay nada que dibujar: la cadena se sigue
          leyendo como una figura y no como tres barras sueltas. */}
      {wArriba === 0 && wAbajo === 0 && (
        <div className="absolute inset-y-1 left-0 w-px border-l border-dashed border-border" aria-hidden />
      )}

      {/* En telefono las dos lecturas se apilan, cada una en su linea y entera. Antes
          compartian fila y la de la izquierda se cortaba a media palabra ("26 entraron,
          0 ..."), que es justo lo que hace que un dibujo deje de explicarse solo.
          A partir de md vuelven a ir enfrentadas, que ahi si caben. */}
      <div className="absolute inset-0 flex flex-col items-start justify-center gap-0 px-1 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-3">
        <span className="min-w-0 max-w-full text-sm leading-tight text-foreground">
          {conector.texto}
          {seEnsancha ? (
            <span className="text-muted-foreground"> {"·"} vienen de contactos anteriores</span>
          ) : pct !== null ? (
            <span className="tabular-nums text-muted-foreground"> {"·"} {pct}%</span>
          ) : null}
        </span>
        {conector.perdida && (
          <span
            className={cn(
              "min-w-0 max-w-full text-sm leading-tight tabular-nums md:shrink-0",
              esPeor ? "font-semibold text-warn" : "text-muted-foreground",
            )}
          >
            {conector.perdida}
            {esPeor ? " · aquí se cae" : ""}
          </span>
        )}
      </div>
    </div>
  )
}
