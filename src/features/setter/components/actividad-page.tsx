"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronRight, Plus, AlertCircle } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { ListaPaginada } from "@/components/ui/lista-paginada"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { cn } from "@/lib/utils"
import { CAMPOS_PARTE, type BarraDia, type CampoParte, type DiaHistorial, type RespuestaHistorial } from "../types"
import { fechaCorta, hora, plural } from "../formato"
import { ActividadGrafico } from "./actividad-grafico"
import { ActividadDetalle } from "./actividad-detalle"
import { ParteDiarioModal } from "./parte-diario-modal"

/**
 * Actividad: el historial diario del parte.
 *
 * Marco, 2026-08-28: "necesito tener un registro diario (historial) de las veces que se
 * registra actividad del setter... que ahi se pueda editar y se pueda ver quien registra y
 * quien edito, que hora y TODO lo necesario para tener claridad".
 *
 * Los dias SIN parte salen igual, escritos como "sin registrar" (REGLA #24): un hueco es
 * un dato. Y toda la pantalla obedece al filtro de fechas unico del OS, ninguna pieza trae
 * su propio periodo.
 */

/** Las mismas columnas para la cabecera y para cada fila, o no cuadran. */
const REJILLA =
  "md:grid md:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,3rem))_minmax(0,1.7fr)_1.25rem] md:items-center md:gap-3"

/** El grafico dibuja como mucho un mes: mas barras en una pantalla no se leen. */
const MAX_BARRAS = 31

export function ActividadPage() {
  const [rango, setRango] = useState<PeriodRange | null>(null)
  const [persona, setPersona] = useState("")
  const [campo, setCampo] = useState<CampoParte>("conversaciones")
  const [datos, setDatos] = useState<RespuestaHistorial | null>(null)
  const [cargando, setCargando] = useState(true)
  const [fallo, setFallo] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<DiaHistorial | null>(null)
  const [editando, setEditando] = useState<DiaHistorial | null>(null)

  /* Se depende de los milisegundos, no del objeto: un objeto nuevo en cada pintado
     dispararia el efecto sin parar. */
  const desdeMs = rango?.from.getTime() ?? null
  const hastaMs = rango?.to.getTime() ?? null

  const cargar = useCallback(async () => {
    if (!desdeMs || !hastaMs) return
    setFallo(null)
    const p = new URLSearchParams()
    p.set("from", new Date(desdeMs).toISOString())
    p.set("to", new Date(hastaMs).toISOString())
    if (persona) p.set("profile", persona)
    try {
      const res = await fetch(`/api/setter/historial?${p.toString()}`, { cache: "no-store" })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? "respuesta no válida")
      setDatos(d as RespuestaHistorial)
    } catch {
      setFallo("No se pudo cargar el historial. Vuelve a intentarlo.")
    } finally {
      setCargando(false)
    }
  }, [desdeMs, hastaMs, persona])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const dias = useMemo(() => datos?.dias ?? [], [datos])

  /* El grafico agrupa POR DIA, sumando a la gente que se este mirando. Sin esto, con dos
     personas salian dos barras rotuladas "sáb, 8 ago" una encima de otra y no habia forma
     de saber cual era cual. La lista de abajo sigue teniendo una linea por persona. */
  const barras = useMemo<BarraDia[]>(() => {
    const porFecha = new Map<string, BarraDia>()
    for (const d of dias) {
      const b = porFecha.get(d.fecha) ?? { fecha: d.fecha, valor: 0, registrado: false, partes: [], sinRegistrar: 0 }
      if (d.registrado) {
        b.valor += d[campo]
        b.registrado = true
        b.partes.push(d)
      } else {
        b.sinRegistrar++
      }
      porFecha.set(d.fecha, b)
    }
    /* De mas reciente a mas antigua entra, y al grafico se le da al reves. */
    return Array.from(porFecha.values()).slice(0, MAX_BARRAS).reverse()
  }, [dias, campo])

  /* Quien registro hoy y quien no. Solo de quien tiene el parte como tarea diaria: a un
     administrador que rellena el suyo de vez en cuando no se le reclama nada. */
  const deHoy = useMemo(() => {
    if (!datos) return []
    return datos.personas.filter((p) => p.esSetter).map((p) => {
      const dia = dias.find((d) => d.profileId === p.id && d.fecha === datos.hoy)
      return { ...p, dia: dia ?? null }
    })
  }, [datos, dias])

  function puedeEditar(dia: DiaHistorial) {
    if (!datos) return false
    return datos.esAdmin || dia.profileId === datos.yo.id
  }

  function abrirEdicion(dia: DiaHistorial) {
    setDetalle(null)
    setEditando(dia)
  }

  const varias = (datos?.personas.length ?? 0) > 1

  return (
    <PageContainer>
      {/* Cabecera: el filtro de fechas del OS y, si hay mas de una persona, cual se mira. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground md:text-2xl">Actividad</h1>
          <p className="mt-0.5 text-[15px] text-muted-foreground">
            Cada vez que alguien registra su parte queda aquí, con la hora y quién lo hizo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {datos?.esAdmin && varias && (
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="h-11 min-w-0 max-w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"
              aria-label="Ver la actividad de"
            >
              <option value="">Todo el equipo</option>
              {datos.personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          )}
          <PeriodFilter value={rango ?? undefined} onChange={setRango} defaultPreset="30d" />
        </div>
      </div>

      {fallo && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-[15px] text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {fallo}
        </div>
      )}

      {cargando || !datos ? (
        <div className="relative mt-6 min-h-[320px]">
          <LoadingScreen fullscreen={false} />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* ---------------------------------------------------------------
              Registrado hoy: quien ya lo hizo y quien falta.
              --------------------------------------------------------------- */}
          <section className="rounded-xl border border-border bg-card p-4 md:p-5">
            <h2 className="text-[17px] font-bold text-foreground">Registrado hoy</h2>
            <ul className="mt-3 space-y-2">
              {deHoy.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0 truncate text-[15px] font-semibold text-foreground">{p.nombre}</span>
                  {p.dia?.registrado ? (
                    <span className="text-[15px] text-muted-foreground">
                      registró a las <span className="tabular-nums text-foreground">{hora(p.dia.creadoEl)}</span>
                      {p.dia.correcciones > 0 && (
                        <>
                          {", y lo corrigió "}
                          {p.dia.editadoPor ?? "alguien del equipo"} a las{" "}
                          <span className="tabular-nums text-foreground">{hora(p.dia.editadoEl)}</span>
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="text-[15px] text-muted-foreground">todavía no ha registrado</span>
                  )}
                  {p.dia && !p.dia.registrado && puedeEditar(p.dia) && (
                    <button
                      type="button"
                      onClick={() => abrirEdicion(p.dia as DiaHistorial)}
                      className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted md:h-9"
                    >
                      <Plus className="size-4" />
                      Registrar
                    </button>
                  )}
                </li>
              ))}
              {deHoy.length === 0 && (
                <li className="text-[15px] text-muted-foreground">
                  Nadie del equipo tiene el parte diario asignado todavía.
                </li>
              )}
            </ul>
          </section>

          {/* ---------------------------------------------------------------
              Los totales del periodo. Siempre los cuatro, aunque sean cero.
              --------------------------------------------------------------- */}
          <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {CAMPOS_PARTE.map((c) => (
              <div key={c.clave} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">{c.corto}</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">{datos.totales[c.clave]}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{c.ayuda}</p>
              </div>
            ))}
          </section>

          <p className="text-[15px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{datos.totales.diasRegistrados}</span>{" "}
            {datos.totales.diasRegistrados === 1 ? "día registrado" : "días registrados"} ·{" "}
            <span className="font-semibold tabular-nums text-foreground">{datos.totales.diasSinRegistrar}</span> sin
            registrar ·{" "}
            <span className="font-semibold tabular-nums text-foreground">{datos.totales.correcciones}</span>{" "}
            {datos.totales.correcciones === 1 ? "corrección" : "correcciones"}
          </p>

          {/* --------------------------------------------------------------- */}
          {barras.length > 0 && (
            <ActividadGrafico barras={barras} campo={campo} onCampo={setCampo} onAbrirDia={setDetalle} />
          )}
          {barras.length >= MAX_BARRAS && (
            <p className="text-sm text-muted-foreground">
              El gráfico dibuja los {MAX_BARRAS} días más recientes del periodo. La lista de abajo los tiene todos.
            </p>
          )}

          {/* ---------------------------------------------------------------
              El historial diario.
              --------------------------------------------------------------- */}
          <section className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4 md:p-5">
              <h2 className="text-[17px] font-bold text-foreground">Historial diario</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Un día por línea. Toca cualquiera para ver todo lo que pasó y corregirlo.
              </p>
            </div>

            {dias.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                <h3 className="text-[17px] font-semibold text-foreground">No hay días en este periodo</h3>
                <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                  Cambia el periodo de arriba para ver otros días.
                </p>
              </div>
            ) : (
              <>
                {/* Cabecera de columnas: solo en ordenador. En el telefono nadie lee la
                    cabecera de una tarjeta. */}
                <div className={cn("hidden border-b border-border px-5 py-2", REJILLA)}>
                  <span className="text-sm text-muted-foreground">Día</span>
                  {CAMPOS_PARTE.map((c) => (
                    <span key={c.clave} className="text-right text-sm text-muted-foreground">
                      {c.corto.slice(0, 4)}.
                    </span>
                  ))}
                  <span className="text-sm text-muted-foreground">Quién lo registró</span>
                  <span />
                </div>

                <ListaPaginada
                  items={dias}
                  claveDeFiltros={`${datos.desde}|${datos.hasta}|${persona}`}
                  nombreSingular="día"
                  nombrePlural="días"
                >
                  {(pagina) => (
                    <ul className="divide-y divide-border">
                      {pagina.map((d) => (
                        <li key={d.clave}>
                          <button
                            type="button"
                            onClick={() => setDetalle(d)}
                            className={cn(
                              "w-full px-4 py-3 text-left transition-colors active:bg-muted md:px-5 md:hover:bg-muted",
                              REJILLA,
                            )}
                          >
                            {/* El dia, y de quien es */}
                            <span className="flex min-w-0 flex-col">
                              <span className="text-[15px] font-semibold text-foreground first-letter:uppercase">
                                {fechaCorta(d.fecha)}
                              </span>
                              {varias && <span className="truncate text-sm text-muted-foreground">{d.persona}</span>}
                            </span>

                            {/* TELEFONO: los numeros en una linea, con su nombre delante */}
                            <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 md:hidden">
                              {d.registrado ? (
                                CAMPOS_PARTE.map((c) => (
                                  <span key={c.clave} className="text-sm text-muted-foreground">
                                    {c.corto}{" "}
                                    <span className="font-semibold tabular-nums text-foreground">{d[c.clave]}</span>
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">Sin registrar</span>
                              )}
                            </span>

                            {/* ORDENADOR: una columna por numero */}
                            {CAMPOS_PARTE.map((c) => (
                              <span
                                key={c.clave}
                                className={cn(
                                  "hidden text-right text-[15px] tabular-nums md:block",
                                  d.registrado ? "text-foreground" : "text-muted-foreground",
                                )}
                              >
                                {d.registrado ? d[c.clave] : "-"}
                              </span>
                            ))}

                            {/* Quien y a que hora */}
                            <span
                              className={cn(
                                "mt-1 block text-sm text-muted-foreground md:mt-0",
                                !d.registrado && "hidden md:block",
                              )}
                            >
                              {d.registrado ? (
                                <>
                                  {d.creadoPor ?? "Alguien del equipo"} a las{" "}
                                  <span className="tabular-nums">{hora(d.creadoEl)}</span>
                                  {d.correcciones > 0 && (
                                    <span className="block">
                                      {plural(d.correcciones, "corrección", "correcciones")} de{" "}
                                      {d.editadoPor ?? "alguien del equipo"} a las{" "}
                                      <span className="tabular-nums">{hora(d.editadoEl)}</span>
                                    </span>
                                  )}
                                </>
                              ) : (
                                "Nadie"
                              )}
                            </span>

                            <ChevronRight className="hidden size-5 text-muted-foreground md:block" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </ListaPaginada>
              </>
            )}
          </section>
        </div>
      )}

      <ActividadDetalle
        dia={detalle}
        puedeEditar={detalle ? puedeEditar(detalle) : false}
        onCerrar={() => setDetalle(null)}
        onEditar={abrirEdicion}
      />

      {editando && (
        <ParteDiarioModal
          fechaInicial={editando.fecha}
          profileId={datos?.esAdmin && editando.profileId !== datos.yo.id ? editando.profileId : undefined}
          nombrePersona={editando.profileId !== datos?.yo.id ? editando.persona : undefined}
          onGuardado={() => void cargar()}
          onClose={() => setEditando(null)}
        />
      )}
    </PageContainer>
  )
}
