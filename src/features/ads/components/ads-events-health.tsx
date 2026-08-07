"use client"

import { useEffect, useState } from "react"
import { Check, ChevronDown, Minus, RefreshCw, Target, X } from "lucide-react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { cn } from "@/lib/utils"

/**
 * "¿Está midiendo o no?". La pantalla que faltaba.
 *
 * Un funnel por tarjeta y, dentro, cada evento que DEBERÍA estar disparando con la última
 * vez que llegó a Meta. Un evento que se espera y nunca llegó sale en rojo: antes eso era
 * invisible y solo se notaba cuando las campañas no optimizaban.
 *
 * Todo el color sale de los tokens del tema (verde de marca, rojo de error, carbón). Antes
 * esta pantalla llevaba la paleta grabada a mano en atributos `style`, asi que no escuchaba
 * al tema: el dia que cambiara la marca se quedaba con los colores viejos. Los tokens del
 * OS YA son el brandkit (`--primary` es el verde #22C55E y `--font-sans` es Inter Tight).
 */

type EventRow = {
  name: string
  when: string
  /** `automatico` es PageView: lo dispara el píxel solo, sin pasar por nuestro servidor. */
  kind: "estandar" | "nuestro" | "automatico"
  lastAt: string | null
  sent: number
  failed: number
  neverSeen: boolean
  automatico: boolean
}

type FunnelRow = {
  slug: string
  label: string
  path: string
  name: string
  optimizeFor: string | null
  published: boolean
  status: string
  trackingEnabled: boolean
  healthy: boolean
  events: EventRow[]
}

function hace(iso: string | null): string {
  if (!iso) return "nunca"
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return "ahora mismo"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? "ayer" : `hace ${d} días`
}

export function AdsEventsHealth() {
  const [data, setData] = useState<{ capiMode: string; funnels: FunnelRow[] } | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ads/funnels-status", { cache: "no-store" })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading && !data) {
    return <LoadingScreen fullscreen={false} className="min-h-[200px] rounded-lg border border-border" />
  }

  const funnels = data?.funnels ?? []
  const midiendo = funnels.filter((f) => f.trackingEnabled)
  const enPrueba = data?.capiMode === "test"

  // Roto = un envío que Meta RECHAZÓ. Que un evento no haya saltado todavía NO es un
  // fallo: significa que nadie ha hecho esa acción desde que se conectó. Confundir las
  // dos cosas hace que la pantalla grite "está roto" cuando lo único que pasa es que
  // aún no ha entrado nadie.
  const conFallo = midiendo.filter((f) => f.events.some((e) => e.failed > 0))
  const sinEstrenar = midiendo.reduce((a, f) => a + f.events.filter((e) => e.neverSeen).length, 0)
  const llegando = midiendo.reduce((a, f) => a + f.events.filter((e) => !e.neverSeen).length, 0)
  const todoBien = !enPrueba && midiendo.length > 0 && conFallo.length === 0

  return (
    <div className="flex flex-col gap-4">
      {/* ── El veredicto. Lo primero y lo más grande ── */}
      <section
        className={cn(
          "rounded-xl border p-4 md:p-6",
          todoBien ? "border-primary/40 bg-primary/10" : "border-border bg-card"
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">
              Estado de la medición
            </p>
            <h3 className="mt-2 text-2xl leading-[1.1] font-black tracking-tight text-foreground md:text-[32px]">
              {enPrueba
                ? "Meta está tirando tus conversiones"
                : midiendo.length === 0
                  ? "No hay ningún funnel midiendo"
                  : conFallo.length > 0
                    ? `${conFallo.length} ${conFallo.length === 1 ? "funnel tiene envíos" : "funnels tienen envíos"} que Meta rechazó`
                    : "Todo conectado y mandando en real"}
            </h3>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              {enPrueba
                ? "El envío está en modo prueba: Meta recibe los eventos y los descarta. No optimizan tus campañas ni construyen audiencias. Cámbialo en Ajustes."
                : midiendo.length === 0
                  ? "Enciende la medición de un funnel desde su tarjeta en Webs."
                  : conFallo.length > 0
                    ? "Un envío rechazado sí es un fallo real. Míralo en el registro técnico de abajo."
                    : sinEstrenar > 0
                      ? `${midiendo.length} funnels mandando eventos reales. Hay ${sinEstrenar} ${sinEstrenar === 1 ? "evento que aún no ha saltado" : "eventos que aún no han saltado"} porque nadie ha hecho esa acción todavía. No es un fallo.`
                      : `${midiendo.length} funnels mandando eventos reales a Facebook Ads.`}
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3.5 text-[15px] font-semibold text-muted-foreground transition-opacity active:bg-muted disabled:opacity-50 md:h-8 md:w-auto md:text-sm"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </button>
        </div>

        {/* Tres números, a la vista. En telefono van apilados: tres columnas de
            110 puntos parten las etiquetas en cuatro lineas. */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Dato n={midiendo.length} label="funnels midiendo" />
          <Dato n={llegando} label="eventos ya confirmados" tono="bien" />
          <Dato n={sinEstrenar} label="aún sin estrenar" tono="suave" />
        </div>
      </section>

      {/* ── Una tarjeta por funnel ── */}
      {funnels.map((f) => (
        <section key={f.slug} className="overflow-hidden rounded-xl border border-border bg-card">
          <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-4 md:gap-3 md:px-5">
            <Semaforo ok={f.healthy} apagado={!f.trackingEnabled} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] leading-tight font-extrabold text-foreground">
                {f.name}
              </p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {f.path}
              </p>
            </div>

            <Chip texto={f.published ? "Publicado" : "Borrador"} activo={f.published} />
            <Chip texto={f.trackingEnabled ? "Midiendo" : "Sin medir"} activo={f.trackingEnabled} />
          </header>

          {f.optimizeFor && f.trackingEnabled && (
            <div className="flex items-start gap-2.5 border-b border-border bg-primary/10 px-4 py-3 md:items-center md:px-5">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary md:mt-0" />
              <span className="min-w-0 text-sm text-muted-foreground">
                Su campaña en Facebook Ads debe optimizar hacia{" "}
                <strong className="font-bold text-foreground">{f.optimizeFor}</strong>
              </span>
            </div>
          )}

          {f.events.length === 0 ? (
            <p className="px-4 py-5 text-[15px] text-muted-foreground md:px-5">
              Este funnel no tiene eventos asignados.
            </p>
          ) : (
            <ul>
              {f.events.map((e) => (
                // TELEFONO: el estado y el nombre arriba, el recuento debajo.
                // MONITOR: la fila de siempre con el recuento a la derecha.
                <li
                  key={e.name}
                  className="flex flex-col gap-1.5 border-b border-border px-4 py-3.5 last:border-b-0 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:px-5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <EstadoEvento evento={e} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-foreground">
                        {e.when}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {e.name} ·{" "}
                        {e.kind === "automatico"
                          ? "automático del píxel"
                          : e.kind === "estandar"
                            ? "evento de Meta"
                            : "evento nuestro"}
                      </p>
                    </div>
                  </div>

                  <div className="pl-7 md:pl-0 md:text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        e.automatico ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {e.automatico ? "activo" : e.neverSeen ? "sin estrenar" : hace(e.lastAt)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {e.automatico ? (
                        "va con el píxel, en todas las páginas"
                      ) : e.neverSeen ? (
                        "nadie lo ha hecho aún"
                      ) : (
                        <>
                          <span className="tabular-nums">{e.sent}</span> {e.sent === 1 ? "envío" : "envíos"}
                          {e.failed > 0 && (
                            <span className="text-destructive"> · <span className="tabular-nums">{e.failed}</span> fallaron</span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

function Dato({ n, label, tono = "normal" }: { n: number; label: string; tono?: "normal" | "bien" | "suave" }) {
  return (
    <div className="rounded-lg border border-border px-3.5 py-3">
      <p
        className={cn(
          "text-[28px] leading-none font-black tabular-nums",
          tono === "bien" ? "text-primary" : tono === "suave" ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {n}
      </p>
      <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

function Chip({ texto, activo }: { texto: string; activo: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-sm border px-2.5 py-1 text-sm font-semibold",
        activo
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground"
      )}
    >
      {texto}
    </span>
  )
}

/**
 * Rojo SOLO cuando Meta rechazó un envío. Un evento sin estrenar va en gris: está
 * conectado, lo que pasa es que nadie ha hecho esa acción todavía. Pintarlo de rojo
 * hacía leer "roto" donde no lo había. El automático del píxel nunca está sin estrenar:
 * el servidor ya lo marca como visto, así que cae en el check verde.
 */
function EstadoEvento({ evento }: { evento: EventRow }) {
  if (evento.failed > 0) return <X className="mt-0.5 h-[18px] w-[18px] shrink-0 text-destructive" />
  if (evento.neverSeen)
    return <Minus className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted-foreground" />
  return <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" />
}

function Semaforo({ ok, apagado }: { ok: boolean; apagado: boolean }) {
  if (apagado) {
    return <Minus className="h-4 w-4 shrink-0 text-muted-foreground" />
  }
  // El halo se hace con un anillo del token, no con una sombra de color a mano.
  return (
    <span
      aria-hidden
      className={cn(
        "h-2.5 w-2.5 shrink-0 rounded-full ring-4",
        ok ? "bg-primary ring-primary/25" : "bg-destructive ring-destructive/25"
      )}
    />
  )
}

/**
 * El registro crudo de envíos, plegado. Es una herramienta de depuración: solo hace falta
 * cuando algo falla, así que no puede ser lo primero que se ve al entrar.
 */
export function RegistroTecnico({ children }: { children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex min-h-11 w-full items-center gap-3 px-4 py-4 text-left active:bg-muted md:px-5"
      >
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", abierto && "rotate-180")}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-foreground">
            Registro técnico
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Cada envío con la respuesta exacta de Meta. Solo hace falta si algo falla.
          </p>
        </div>
      </button>

      {abierto && (
        <div className="border-t border-border px-4 py-5 md:px-5">
          {children}
        </div>
      )}
    </section>
  )
}
