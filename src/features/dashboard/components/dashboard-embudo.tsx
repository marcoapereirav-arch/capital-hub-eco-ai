"use client"

import { cn } from "@/lib/utils"

/**
 * EL EMBUDO. Un solo dibujo para todos los embudos del negocio.
 *
 * Por que se rehizo (Marco, 2026-08-08): habia siete graficos, cada uno dibujado
 * de una forma distinta, y ninguno se entendia de un vistazo. "Si yo entro y veo
 * el grafico, tengo que entender que hay."
 *
 * Las tres decisiones que lo hacen legible sin leer nada:
 *
 *  1. FORMA DE EMBUDO DE VERDAD. La barra de cada paso mide lo que mide: si la
 *     mitad de la gente se cae, la barra siguiente es la mitad de ancha. El ojo
 *     ya sabe que pasa antes de leer el numero.
 *
 *  2. LA CAIDA SE DIBUJA, NO SE CUENTA. Entre paso y paso hay una cuña que ES la
 *     gente que se pierde, con su numero dentro. Antes eso era un porcentaje
 *     suelto flotando que no decia de que.
 *
 *  3. EL AMBAR SOLO EN UN SITIO: el escalon donde mas gente se pierde. Si ves
 *     ambar, ahi esta el problema. En ningun otro lugar del panel aparece.
 *
 * Cero texto explicativo debajo: lo que hay que entender esta dentro del dibujo.
 */

export type PasoEmbudo = {
  clave: string
  /** Nombre corto y en palabras normales: "Contactos", "Agendaron", "Vinieron". */
  etiqueta: string
  valor: number
}

export type OpcionEmbudo = {
  id: string
  nombre: string
  pasos: PasoEmbudo[]
}

export function DashboardEmbudo({
  opciones,
  seleccionado,
  onSeleccionar,
  cargando,
  vacio,
}: {
  opciones: OpcionEmbudo[]
  seleccionado: string
  onSeleccionar: (id: string) => void
  cargando: boolean
  vacio?: { titulo: string; explicacion: string }
}) {
  const activo = opciones.find((o) => o.id === seleccionado) ?? opciones[0]
  const pasos = activo?.pasos ?? []
  const entrada = pasos[0]?.valor ?? 0

  /* Cual es el escalon donde mas gente se pierde. Es lo unico que se pinta en
     ambar en todo el panel. Solo cuenta si de verdad se cae alguien. */
  let peorIndice = -1
  let peorCaida = 0
  for (let i = 1; i < pasos.length; i++) {
    const caida = pasos[i - 1].valor - pasos[i].valor
    if (caida > peorCaida) {
      peorCaida = caida
      peorIndice = i
    }
  }

  /* El ancho de cada barra, en porcentaje de la entrada. Nunca baja de 6% para
     que un paso a cero siga teniendo un sitio visible en el dibujo: si
     desapareciera, el embudo pareceria roto en vez de vacio. */
  const ancho = (valor: number) => (entrada > 0 ? Math.max(6, (valor / entrada) * 100) : 6)

  if (cargando) {
    return <div className="h-[360px]" />
  }

  if (pasos.length === 0 || entrada === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <h3 className="text-[17px] font-semibold text-foreground">
          {vacio?.titulo ?? "Todavía no hay nadie en este embudo"}
        </h3>
        <p className="max-w-[38ch] text-[15px] text-muted-foreground">
          {vacio?.explicacion ?? "Cuando entre la primera persona, su recorrido aparece aquí."}
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 pb-6 pt-2 md:px-5">
      <ul>
        {pasos.map((paso, i) => {
          const anchoPaso = ancho(paso.valor)
          const anchoPrevio = i > 0 ? ancho(pasos[i - 1].valor) : anchoPaso
          const caida = i > 0 ? pasos[i - 1].valor - pasos[i].valor : 0
          const esPeor = i === peorIndice

          return (
            <li key={paso.clave}>
              {/* LA CUÑA: es la gente que se cae, dibujada a escala.
                  Va ANTES de la barra del paso, porque la caida ocurre al
                  pasar del escalon anterior a este. */}
              {i > 0 && (
                <div className="relative h-14">
                  <div
                    className={cn(
                      "absolute inset-0 transition-colors",
                      esPeor ? "bg-warn/20" : "bg-muted/40",
                    )}
                    style={{
                      clipPath: `polygon(${50 - anchoPrevio / 2}% 0%, ${50 + anchoPrevio / 2}% 0%, ${50 + anchoPaso / 2}% 100%, ${50 - anchoPaso / 2}% 100%)`,
                    }}
                    aria-hidden
                  />
                  <div className="relative flex h-full items-center justify-center">
                    <span
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums",
                        esPeor ? "bg-warn text-warn-foreground" : "text-muted-foreground",
                      )}
                    >
                      {caida === 0
                        ? "no se cayó nadie"
                        : `${caida} se ${caida === 1 ? "cayó" : "cayeron"}`}
                      {esPeor && caida > 0 ? " · aquí se pierde más" : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* EL ESCALON: nombre, numero y barra a escala. */}
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[15px] font-semibold text-foreground">
                  {paso.etiqueta}
                </span>
                <span className="shrink-0 text-2xl font-bold tabular-nums tracking-tight text-foreground">
                  {paso.valor}
                </span>
              </div>
              <div className="mt-1.5 flex justify-center">
                <div
                  className={cn(
                    "h-7 rounded-lg transition-[width] duration-700 ease-out",
                    paso.valor === 0 ? "bg-muted" : "bg-brand",
                  )}
                  style={{ width: `${anchoPaso}%` }}
                  aria-hidden
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** El desplegable que elige que embudo se mira. Va en la cabecera de la tarjeta. */
export function SelectorEmbudo({
  opciones,
  valor,
  onChange,
}: {
  opciones: OpcionEmbudo[]
  valor: string
  onChange: (id: string) => void
}) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Elegir qué embudo se ve"
      className="h-11 max-w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"
    >
      {opciones.map((o) => (
        <option key={o.id} value={o.id}>
          {o.nombre}
        </option>
      ))}
    </select>
  )
}
