"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { cn } from "@/lib/utils"
import { metricaPorId, type Metrica } from "@/lib/meta/metricas"
import type { FilaAnuncio, FilaCampana, FilaConjunto, FilaDesglose } from "@/lib/meta/panel"
import { Embudo, ETIQUETA_PLATAFORMA, Evolucion } from "./ads-graficos"
import { Anillos, Desglose, Medidor, PorDiaDeSemana, Reparto } from "./ads-graficos-reparto"
import { ListaCampanas, pintaValor } from "./ads-campanas"
import { SelectorMetricas, leerElegidas } from "./ads-selector-metricas"
import { SelectorAlcance, type Alcance } from "./ads-selector-alcance"

/**
 * El panel de Campanas.
 *
 * Colocado en rejilla, no en columna: la referencia que trajo Marco pone entre ocho y doce
 * bloques por pantalla y uno HEROE grande. Aqui el heroe es la evolucion, que ocupa dos
 * tercios, con el rosco del reparto al lado. Debajo, tres bloques por fila.
 *
 * Filosofia: visual primero, numeros despues. Lo que se ve al entrar son graficos; la tabla
 * queda al final para el que quiera la cifra exacta.
 *
 * El filtro de fechas es el del OS (`PeriodFilter`) y manda sobre todo lo de abajo. Ver SOP
 * producto/58.
 */

type Respuesta =
  | {
      ok: true
      totales: Record<string, number>
      anteriores: Record<string, number>
      embudo: { impresiones: number; clicsSalientes: number; visitasWeb: number; leads: number }
      dias: { fecha: string; gasto: number; leads: number; clicsSalientes: number }[]
      campanas: FilaCampana[]
      conjuntos: FilaConjunto[]
      anuncios: FilaAnuncio[]
      plataformas: FilaDesglose[]
      edades: FilaDesglose[]
      moneda: string
    }
  | { ok: false; error: string; sinPermiso: boolean }

const fmtEur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })

/**
 * A que altura de la campaña estas mirando.
 *
 * Antes esto no se elegia: el panel lo decidia solo mirando si habia campañas marcadas, y
 * los anuncios no existian en ningun sitio. Marco, 2026-08-28: "quiero tambien seleccionar
 * los conjuntos que quiero ver internamente con estas metricas... un filtro mas para
 * conjuntos y tambien un filtro mas para anuncios".
 */
type Nivel = "campanas" | "conjuntos" | "anuncios"

const NIVELES: { id: Nivel; etiqueta: string; singular: string }[] = [
  { id: "campanas", etiqueta: "Campañas", singular: "campañas" },
  { id: "conjuntos", etiqueta: "Conjuntos", singular: "conjuntos" },
  { id: "anuncios", etiqueta: "Anuncios", singular: "anuncios" },
]

function aFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Coste por lead. Meta no siempre lo devuelve, asi que se calcula si falta. */
function costePorLead(v: Record<string, number>): number {
  if (v.costePorLead > 0) return v.costePorLead
  return v.leads > 0 ? v.spend / v.leads : 0
}

export function AdsPanel() {
  const [rango, setRango] = useState<PeriodRange | null>(null)
  const [datos, setDatos] = useState<Respuesta | null>(null)
  const [cargando, setCargando] = useState(false)
  const [elegidas, setElegidas] = useState<string[]>([])
  // Que campanas, conjuntos o anuncios estan marcados. Vacio = la cuenta entera.
  const [alcance, setAlcance] = useState<Alcance>({ campanas: [], conjuntos: [], anuncios: [] })
  // A que altura se mira la tabla y el reparto. Se elige a mano, no se deduce.
  const [nivel, setNivel] = useState<Nivel>("campanas")

  // Las metricas guardadas se leen tras montar: `localStorage` no existe en el servidor y
  // leerlo en el primer pintado haria que la pantalla salte de unas columnas a otras.
  useEffect(() => {
    setElegidas(leerElegidas())
  }, [])

  useEffect(() => {
    if (!rango) return
    let cancelado = false
    setCargando(true)
    const q = new URLSearchParams({ from: aFecha(rango.from), to: aFecha(rango.to) })
    if (alcance.campanas.length) q.set("campanas", alcance.campanas.join(","))
    if (alcance.conjuntos.length) q.set("conjuntos", alcance.conjuntos.join(","))
    if (alcance.anuncios.length) q.set("anuncios", alcance.anuncios.join(","))
    fetch(`/api/admin/ads/panel?${q}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelado) setDatos(j as Respuesta)
      })
      .catch(() => {
        if (!cancelado) setDatos({ ok: false, error: "No se pudo conectar", sinPermiso: false })
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
    // Se depende de las fechas sueltas: el objeto es nuevo en cada pintado y dispararia
    // la peticion en bucle.
  }, [
    rango?.from.getTime(),
    rango?.to.getTime(),
    alcance.campanas.join(","),
    alcance.conjuntos.join(","),
    alcance.anuncios.join(","),
  ])

  // Las filas del nivel que se este mirando, ya con su linea de contexto: un conjunto se
  // entiende con su campana al lado, y un anuncio con su conjunto. Sin eso, dieciseis
  // anuncios que empiezan igual son dieciseis lineas indistinguibles.
  const filas: { id: string; nombre: string; objetivo: string; valores: Record<string, number> }[] =
    !datos?.ok
      ? []
      : nivel === "anuncios"
        ? datos.anuncios.map((a) => ({
            id: a.id,
            nombre: a.nombre,
            objetivo: a.conjuntoNombre,
            valores: a.valores,
          }))
        : nivel === "conjuntos"
          ? datos.conjuntos.map((c) => ({
              id: c.id,
              nombre: c.nombre,
              objetivo: c.campanaNombre,
              valores: c.valores,
            }))
          : datos.campanas

  // Esto NO es una lista que se pinte: es la entrada del rosco de reparto, que se queda
  // con las cinco primeras y agrupa el resto en "otras". La lista que SI se pinta es la
  // tabla de abajo, y esa va de 20 en 20 dentro de `ListaCampanas`.
  const porciones: { clave: string; nombre: string; valor: number }[] = []
  for (const f of filas) {
    porciones.push({ clave: f.id, nombre: f.nombre, valor: f.valores.spend ?? 0 })
  }

  const etiquetaNivel = NIVELES.find((n) => n.id === nivel)?.singular ?? "campañas"

  const cpl = datos?.ok ? costePorLead(datos.totales) : 0
  const cplAntes = datos?.ok ? costePorLead(datos.anteriores) : 0

  return (
    <div className="space-y-4">
      {/* Barra de arriba: que estas viendo, de cuando, y con que metricas */}
      <div className="flex flex-wrap items-center gap-2">
        <SelectorAlcance
          campanas={datos?.ok ? datos.campanas : []}
          conjuntos={datos?.ok ? datos.conjuntos : []}
          anuncios={datos?.ok ? datos.anuncios : []}
          valor={alcance}
          onCambio={setAlcance}
        />
        <PeriodFilter value={rango ?? undefined} onChange={setRango} defaultPreset="30d" />
        <SelectorMetricas elegidas={elegidas} onCambio={setElegidas} />
        {cargando && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Trayendo datos de Meta
          </span>
        )}
      </div>

      {datos && !datos.ok && <Aviso error={datos.error} sinPermiso={datos.sinPermiso} />}

      {datos?.ok && (
        <>
          <FilaNumeros
            totales={datos.totales}
            anteriores={datos.anteriores}
            dias={datos.dias}
            elegidas={elegidas}
          />

          {/* Fila heroe: la evolucion ocupa dos tercios, el rosco el otro */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Evolucion dias={datos.dias} />
            </div>
            <Reparto porciones={porciones} unidad={etiquetaNivel} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Embudo
              pasos={[
                // Los cuatro escalones se llaman como en Facebook. Antes ponia "Cargaron
                // la pagina" y "Leads", que no existen con ese nombre en ningun sitio.
                { nombre: "Impresiones", valor: datos.embudo.impresiones },
                { nombre: "Clics salientes únicos", valor: datos.embudo.clicsSalientes },
                { nombre: "Visitas a la página de destino", valor: datos.embudo.visitasWeb },
                { nombre: "Clientes potenciales", valor: datos.embudo.leads },
              ]}
            />
            {cpl > 0 && (
              <Medidor
                titulo="Coste por cliente potencial"
                valor={cpl}
                referencia={cplAntes > 0 ? cplAntes : null}
                pieReferencia={
                  cplAntes > 0
                    ? `Antes costaba ${fmtEur.format(cplAntes)}. Es la raya de fuera del arco.`
                    : "No hay periodo anterior con el que comparar."
                }
              />
            )}
            <Anillos
              titulo="Dónde se muestra"
              filas={datos.plataformas}
              etiqueta={(k) => ETIQUETA_PLATAFORMA[k] ?? k}
            />
          </div>

          {/* La edad va ancha (seis barras horizontales agradecen el sitio) y los siete dias
              van estrechos: con dos tercios de pantalla para siete barras queda un desierto. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Desglose
                titulo="Qué edad responde"
                filas={datos.edades}
                etiqueta={(k) => `${k} años`}
              />
            </div>
            <PorDiaDeSemana dias={datos.dias} />
          </div>

          <ListaCampanas
            titulo={NIVELES.find((n) => n.id === nivel)?.etiqueta ?? "Campañas"}
            campanas={filas}
            elegidas={elegidas}
            unidad={etiquetaNivel}
            pestanas={
              <PestanasNivel
                valor={nivel}
                onCambio={setNivel}
                cuentas={{
                  campanas: datos.campanas.length,
                  conjuntos: datos.conjuntos.length,
                  anuncios: datos.anuncios.length,
                }}
              />
            }
          />
        </>
      )}

      {!datos && !cargando && (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-card px-6 text-center">
          <p className="text-[15px] text-muted-foreground">Elige un periodo para empezar.</p>
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── piezas ───────────────────────── */

/**
 * A que altura miras: campañas, conjuntos o anuncios.
 *
 * Va DENTRO de la cabecera de la tabla, no suelto en la barra de arriba, porque es lo que
 * manda sobre esa tabla y sobre el rosco del reparto. Con el numero al lado se ve de un
 * vistazo cuantas filas hay en cada nivel antes de cambiar.
 *
 * Es una fila de botones, no un desplegable: son tres opciones y caben. Un desplegable
 * esconderia lo que hay detras y obligaria a dos toques.
 */
function PestanasNivel({
  valor,
  onCambio,
  cuentas,
}: {
  valor: Nivel
  onCambio: (n: Nivel) => void
  cuentas: Record<Nivel, number>
}) {
  return (
    <div
      role="tablist"
      aria-label="A qué altura quieres ver los números"
      className="flex w-full gap-1 overflow-x-auto rounded-lg border border-border bg-background p-1"
    >
      {NIVELES.map((n) => {
        const activa = n.id === valor
        return (
          <button
            key={n.id}
            type="button"
            role="tab"
            aria-selected={activa}
            onClick={() => onCambio(n.id)}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[15px] font-medium transition-colors md:h-9 md:text-sm",
              activa
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground active:bg-muted md:hover:text-foreground"
            )}
          >
            {n.etiqueta}
            <span className={cn("tabular-nums", activa ? "opacity-70" : "text-muted-foreground")}>
              {cuentas[n.id]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * La fila de numeros grandes.
 *
 * Etiqueta pequena en gris arriba, cifra grande debajo, y al pie la mini tendencia con el
 * cambio. Sin mayusculas espaciadas: cuestan leer y el brandkit las prohibe fuera del
 * wordmark. Dos columnas en el telefono: cuatro en 375px salen a 90 puntos y no cabe una
 * cifra de dinero con separadores.
 */
function FilaNumeros({
  totales,
  anteriores,
  dias,
  elegidas,
}: {
  totales: Record<string, number>
  anteriores: Record<string, number>
  dias: { fecha: string; gasto: number; leads: number }[]
  elegidas: string[]
}) {
  // SIN recorte. Antes habia un `.slice(0, 5)` y elegir nueve metricas enseñaba cinco:
  // el selector decia "(9)" y la pantalla mentia. Se ven todas las que se marquen.
  const metricas = elegidas
    .map((id) => metricaPorId(id))
    .filter((m): m is Metrica => Boolean(m))

  if (metricas.length === 0) return null

  // La mini tendencia se dibuja con el dia a dia que ya tenemos. Solo hay serie diaria de
  // gasto y de leads, asi que el resto de metricas no llevan linea: mejor sin ella que
  // con una inventada.
  const serie = (id: string): number[] | null => {
    if (dias.length < 3) return null
    if (id === "spend") return dias.map((d) => d.gasto)
    if (id === "leads") return dias.map((d) => d.leads)
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {/* El degradado de las mini lineas se declara UNA vez: una copia por tarjeta serian
          identificadores repetidos en la pagina. */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <linearGradient id="chispa-relleno" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {metricas.map((m, i) => {
        const ahora = totales[m.id] ?? 0
        const antes = anteriores[m.id] ?? 0
        const cambio = antes > 0 ? ((ahora - antes) / antes) * 100 : null
        // En un coste, bajar es bueno. En el resto, subir es bueno.
        const menosEsMejor = m.id.startsWith("cost_per") || m.id === "cpc" || m.id === "cpm"
        // En el telefono van de dos en dos: si el total es impar, la ultima se quedaba
        // sola a media fila con un hueco al lado. Ocupa las dos columnas y la fila cierra.
        const huerfana = metricas.length % 2 === 1 && i === metricas.length - 1
        return (
          <div
            key={m.id}
            className={cn(
              "flex flex-col overflow-hidden rounded-lg border border-border bg-card",
              huerfana && "col-span-2 md:col-span-1"
            )}
          >
            <div className="flex items-start justify-between gap-2 px-3.5 pt-3.5">
              {/* Dos lineas, no `truncate`: "Coste por clic saliente unico" se cortaba. */}
              <p className="min-w-0 text-sm leading-snug text-muted-foreground">{m.nombre}</p>
              <Cambio porcentaje={cambio} menosEsMejor={menosEsMejor} />
            </div>
            <p className="mt-auto px-3.5 pt-3 text-[30px] font-bold leading-none tracking-tight text-foreground tabular-nums">
              {pintaValor(ahora, m)}
            </p>
            <Chispa valores={serie(m.id)} />
          </div>
        )
      })}
    </div>
  )
}

/**
 * Mini linea de tendencia, sangrada a los bordes de la tarjeta.
 *
 * La dibujan LAS CINCO tarjetas. Antes solo la tenian las que tienen serie diaria (gasto y
 * leads) y las otras cuatro dejaban un hueco vacio: una fila donde uno lleva adorno y
 * cuatro no, no es una fila. Sin serie se dibuja la raya base apagada.
 */
function Chispa({ valores }: { valores: number[] | null }) {
  const hay = Boolean(valores && valores.length >= 3)
  const v = hay ? valores! : [1, 1, 1]
  const tope = Math.max(...v, 0.0001)
  const paso = 100 / (v.length - 1)
  const d = `M${v.map((x, i) => `${i * paso},${32 - (x / tope) * 26}`).join(" L")}`
  return (
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="mt-3 block h-[34px] w-full" aria-hidden>
      {hay && <path d={`${d} L100,34 L0,34 Z`} fill="url(#chispa-relleno)" />}
      <path
        d={d}
        fill="none"
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        className={hay ? "stroke-brand" : "stroke-muted-foreground/25"}
      />
    </svg>
  )
}

/**
 * Cuanto cambio respecto al periodo anterior. En un coste, bajar es buena noticia; en el
 * resto, subir. Sin esa distincion el panel pinta de verde una subida del coste por lead.
 */
function Cambio({
  porcentaje,
  menosEsMejor = false,
}: {
  porcentaje: number | null
  menosEsMejor?: boolean
}) {
  if (porcentaje === null) {
    // "nuevo" no decia nada. Lo que pasa es que el periodo anterior no tuvo actividad.
    return <span className="shrink-0 text-sm text-muted-foreground">sin comparar</span>
  }
  const plano = Math.abs(porcentaje) < 0.5
  const sube = porcentaje > 0
  const bueno = menosEsMejor ? !sube : sube
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-sm font-semibold tabular-nums",
        plano
          ? "bg-muted/60 text-muted-foreground"
          : bueno
            ? "bg-brand/15 text-brand"
            : "bg-destructive/15 text-destructive"
      )}
    >
      {plano ? "igual" : `${sube ? "+" : "-"}${Math.abs(porcentaje).toFixed(0)}%`}
    </span>
  )
}

/**
 * Los avisos dicen QUE paso y QUE hacer, nunca un codigo de error.
 */
function Aviso({ error, sinPermiso }: { error: string; sinPermiso: boolean }) {
  const faltaLlave = sinPermiso || /permission|ads_read|access_token|capability/i.test(error)
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-4 md:p-5">
      <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold text-foreground">
          {faltaLlave ? "Falta la llave para leer tus campañas" : "Meta no responde ahora mismo"}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {faltaLlave ? (
            <>
              La llave que hay sirve para mandar conversiones, no para leer lo que gastan las
              campañas. Son permisos distintos. Se pega la buena en la pestaña Ajustes, arriba
              del todo. La medición de los funnels sigue funcionando igual.
            </>
          ) : (
            <>
              No se pudo traer el gasto. Vuelve a intentarlo en unos minutos. Meta responde: {error}
            </>
          )}
        </p>
      </div>
    </div>
  )
}
