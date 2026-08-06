"use client"

import Link from "next/link"
import {
  ArrowLeft, ArrowRight, ArrowDown, Check, Eye, Globe, MessageCircle,
  Megaphone, Minus, Server, ShieldCheck, Target, ToggleLeft, X,
} from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { cn } from "@/lib/utils"

/**
 * Board visual de la MEDICIÓN de Facebook Ads (/sistemas/medicion-ads).
 *
 * Explica el sistema entero de un vistazo: qué pasa desde que alguien ve el anuncio hasta
 * que Meta cuenta la conversión, por qué cada acción manda DOS etiquetas, por dónde viaja
 * el dato (navegador y servidor), y hacia qué evento optimiza cada campaña.
 *
 * Los datos son REALES: llegan por props desde el servidor (catálogo de funnels + tabla
 * `webs` + registro de envíos). Lo que se ve aquí es lo que está pasando de verdad.
 *
 * Es una pagina de LECTURA: el cuerpo va a 16 puntos con interlineado holgado, y ni un
 * color escrito a mano. Antes esta pantalla tenia su propia paleta en constantes (VERDE,
 * AMBAR, PANEL, LINEA...) y su propia familia tipografica, asi que no escuchaba al tema.
 */

export type EventoVivo = {
  name: string
  when: string
  kind: "estandar" | "nuestro"
  sent: number
  neverSeen: boolean
  failed: number
}

export type FunnelVivo = {
  slug: string
  name: string
  path: string
  optimizeFor: string | null
  trackingEnabled: boolean
  published: boolean
  events: EventoVivo[]
}

export function MedicionAdsWorkflow({
  funnels,
  capiMode,
  marketingTokenListo,
}: {
  funnels: FunnelVivo[]
  capiMode: "test" | "live"
  marketingTokenListo: boolean
}) {
  const activos = funnels.filter((f) => f.trackingEnabled)

  return (
    <>
      <PageContainer wide>
        <div className="flex flex-col gap-10">
          {/* Siempre hay salida: boton de volver visible, con texto, a 44 puntos. */}
          <Link
            href="/sistemas"
            className="inline-flex h-11 w-fit items-center gap-1.5 text-[15px] font-semibold text-muted-foreground transition-colors md:h-auto md:hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Sistema visual
          </Link>

          {/* ── Portada ── */}
          <header>
            <p className="text-sm font-semibold text-primary">Publicidad</p>
            <h1 className="mt-2 text-[32px] font-black leading-[1.05] tracking-tight text-foreground md:text-[44px]">
              Cómo medimos Facebook Ads
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Desde que alguien ve el anuncio hasta que Meta cuenta la conversión. Qué se
              dispara en cada paso, por qué van dos etiquetas, y hacia qué tiene que optimizar
              cada campaña.
            </p>
          </header>

          {/* ── 1. El recorrido ── */}
          <Bloque n="01" titulo="El recorrido de una persona">
            <p className="mb-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Cada paso avisa a Meta. Si un paso no avisa, Meta no sabe que existió y no puede
              aprender de él.
            </p>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <Paso
                icono={Megaphone}
                titulo="Ve el anuncio"
                sub="En Facebook o Instagram"
                evento={null}
                nota="Todavía no es nuestro"
              />
              <Flecha />
              <Paso
                icono={Eye}
                titulo="Abre la landing"
                sub="Nuestra página"
                evento="ViewContent"
                nota="Vio la oferta, no solo una web"
              />
              <Flecha />
              <Paso
                icono={Check}
                titulo="Deja sus datos"
                sub="Nombre, correo, teléfono"
                evento="Lead"
                nota="Aquí optimiza la campaña"
                destacado
              />
              <Flecha />
              <Paso
                icono={MessageCircle}
                titulo="Nos escribe"
                sub="Pulsa el botón de WhatsApp"
                evento="Contact"
                nota="Intención alta"
              />
            </div>
          </Bloque>

          {/* ── 2. Por qué dos etiquetas ── */}
          <Bloque n="02" titulo="Por qué cada acción manda DOS etiquetas">
            <p className="mb-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              No son dos conversiones. Es la misma, con dos nombres, en el mismo milisegundo y
              con el mismo identificador. Meta cuenta <strong className="text-foreground">una</strong>.
              Cada nombre alimenta un motor distinto de Meta.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Tarjeta
                destacada
                titulo="Lead"
                etiqueta="El nombre de Meta"
                puntos={[
                  "Meta ya tiene un modelo entrenado con miles de millones de estos, de todos los anunciantes del mundo.",
                  "Sabe qué pinta tiene alguien que deja sus datos ANTES de que traigas tu primer lead.",
                  "Es el que eliges como objetivo de la campaña.",
                ]}
                cierre="Sin esto, el algoritmo empieza de cero y no sale de la fase de aprendizaje."
              />
              <Tarjeta
                titulo="webinar_lead"
                etiqueta="Nuestro nombre"
                puntos={[
                  "Meta no sabe qué significa, así que no le sirve para optimizar.",
                  "Nos sirve a nosotros: separa ESTE funnel de cualquier otro que montemos.",
                  "Es con el que creas audiencias precisas.",
                ]}
                cierre="Sin esto, el día que haya dos funnels con Lead no podrás distinguirlos."
              />
            </div>
          </Bloque>

          {/* ── 3. Los dos caminos ── */}
          <Bloque n="03" titulo="Por dónde viaja el dato: dos caminos, uno se salva siempre">
            <div className="rounded-xl border border-border bg-card p-4 md:p-7">
              <div className="flex flex-col items-stretch gap-4 lg:flex-row">
                <Camino
                  icono={Globe}
                  titulo="Por el navegador"
                  sub="El píxel de Meta"
                  bueno="Instantáneo"
                  malo="Se pierde si rechaza cookies o usa un navegador con protección"
                  aviso
                />
                <Camino
                  icono={Server}
                  titulo="Por el servidor"
                  sub="La API de conversiones"
                  bueno="No lo bloquea nadie, nunca"
                  malo="Le faltan algunas señales del navegador"
                />
              </div>

              <div className="my-6 flex justify-center">
                <ArrowDown className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-4 text-center md:px-5">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                  <p className="text-[17px] font-extrabold text-foreground">
                    Los dos llevan el mismo identificador
                  </p>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  Meta entiende que es el mismo hecho y lo cuenta una sola vez. Si el navegador
                  se pierde, el del servidor lo salva.
                </p>
              </div>
            </div>
          </Bloque>

          {/* ── 4. Estado real por funnel ── */}
          <Bloque n="04" titulo="Qué mide cada funnel ahora mismo">
            <div className="grid gap-4 lg:grid-cols-2">
              {funnels.map((f) => (
                <FunnelCard key={f.slug} funnel={f} />
              ))}
            </div>
          </Bloque>

          {/* ── 5. Los interruptores ── */}
          <Bloque n="05" titulo="Los dos interruptores que lo controlan todo">
            <div className="grid gap-4 md:grid-cols-2">
              <Interruptor
                titulo="Prueba o real"
                donde="Ads · Ajustes"
                estado={capiMode === "live" ? "Real" : "Prueba"}
                ok={capiMode === "live"}
                explica={
                  capiMode === "live"
                    ? "Cada conversión cuenta de verdad y entrena tus campañas."
                    : "Meta recibe los eventos y los descarta. No optimizan nada."
                }
              />
              <Interruptor
                titulo="Medición por funnel"
                donde="Webs · tarjeta de cada funnel"
                estado={`${activos.length} de ${funnels.length} encendidos`}
                ok={activos.length > 0}
                explica="Publicar y medir son cosas distintas. El acceso al OS está publicado y no debe mandar nada. Los funnels nuevos nacen apagados."
              />
            </div>
          </Bloque>

          {/* ── 6. Lo que falta ── */}
          <Bloque n="06" titulo="Lo único que falta">
            {marketingTokenListo ? (
              <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4 md:p-5">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[17px] font-extrabold text-foreground">
                    Nada. El sistema está completo
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                    Los funnels miden y las campañas se leen desde el OS.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-warn/35 bg-warn/10 p-4 md:p-6">
                <p className="text-[19px] font-extrabold text-warn">
                  Ver el gasto de las campañas dentro del OS
                </p>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                  La medición funciona entera. Lo único que no se puede hacer todavía es LEER
                  desde aquí lo que gastan tus campañas: la llave que tenemos sirve para
                  escribir conversiones, no para leer rendimiento. Son dos permisos distintos.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <DatoTecnico k="Cuenta de anuncios" v="2550903125083729" />
                  <DatoTecnico k="Aplicación" v="1304166178499280" />
                  <DatoTecnico k="Usuario del sistema" v="122108163171278108" />
                  <DatoTecnico k="Permiso que falta" v="ads_read" destacado />
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                  Cuando llegue la llave nueva se guarda como{" "}
                  <strong className="text-foreground">META_MARKETING_API_TOKEN</strong> y la
                  pestaña de Campañas se llena sola. No hay que programar nada más.
                </p>
              </div>
            )}
          </Bloque>
        </div>
      </PageContainer>
    </>
  )
}

/* ─────────────────────────── piezas ─────────────────────────── */

function Bloque({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-semibold tabular-nums text-primary">{n}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <h2 className="mb-4 text-[22px] font-extrabold leading-tight tracking-tight text-foreground md:text-[26px]">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function Flecha() {
  return (
    <div className="flex items-center justify-center lg:px-1">
      <ArrowRight className="hidden h-5 w-5 text-muted-foreground lg:block" />
      <ArrowDown className="h-5 w-5 text-muted-foreground lg:hidden" />
    </div>
  )
}

function Paso({
  icono: Icono, titulo, sub, evento, nota, destacado = false,
}: {
  icono: typeof Eye
  titulo: string
  sub: string
  evento: string | null
  nota: string
  destacado?: boolean
}) {
  return (
    <div
      className={cn(
        "flex-1 rounded-lg border p-4",
        destacado ? "border-primary/30 bg-primary/10" : "border-border bg-card",
      )}
    >
      <Icono className={cn("h-5 w-5", destacado ? "text-primary" : "text-muted-foreground")} />
      <p className="mt-3 text-base font-extrabold leading-tight text-foreground">{titulo}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>

      {evento ? (
        <span className="mt-3 inline-block rounded-sm border border-primary/30 bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
          {evento}
        </span>
      ) : (
        <span className="mt-3 inline-block text-sm text-muted-foreground">sin evento</span>
      )}

      <p className="mt-2.5 text-sm leading-snug text-muted-foreground">{nota}</p>
    </div>
  )
}

function Tarjeta({
  destacada = false, titulo, etiqueta, puntos, cierre,
}: {
  destacada?: boolean
  titulo: string
  etiqueta: string
  puntos: string[]
  cierre: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 md:p-5",
        destacada ? "border-primary/40 bg-primary/10" : "border-border bg-card",
      )}
    >
      <p className="text-sm font-semibold text-muted-foreground">{etiqueta}</p>
      <p className="mt-1 text-[22px] font-black leading-tight text-foreground">{titulo}</p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {puntos.map((p) => (
          <li key={p} className="flex gap-2.5 text-[15px] leading-relaxed text-muted-foreground">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
        {cierre}
      </p>
    </div>
  )
}

function Camino({
  icono: Icono, titulo, sub, bueno, malo, aviso = false,
}: {
  icono: typeof Globe
  titulo: string
  sub: string
  bueno: string
  malo: string
  /** El camino que se puede perder va en ambar de aviso; el seguro, en verde. */
  aviso?: boolean
}) {
  return (
    <div className="flex-1 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2.5">
        <Icono className={cn("h-5 w-5 shrink-0", aviso ? "text-warn" : "text-primary")} />
        <div className="min-w-0">
          <p className="text-base font-extrabold leading-tight text-foreground">{titulo}</p>
          <p className="text-sm text-muted-foreground">{sub}</p>
        </div>
      </div>
      <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        {bueno}
      </p>
      <p className="mt-1.5 flex gap-2 text-sm text-muted-foreground">
        <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        {malo}
      </p>
    </div>
  )
}

function FunnelCard({ funnel: f }: { funnel: FunnelVivo }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:px-5">
        <span
          aria-hidden
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            f.trackingEnabled ? "bg-primary" : "bg-muted",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-extrabold leading-tight text-foreground">{f.name}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{f.path}</p>
        </div>
        {!f.trackingEnabled && (
          <span className="shrink-0 text-sm text-muted-foreground">sin medir</span>
        )}
      </div>

      {f.optimizeFor && f.trackingEnabled && (
        <div className="flex items-center gap-2.5 border-b border-border bg-primary/10 px-4 py-3 md:px-5">
          <Target className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 text-sm text-muted-foreground">
            Su campaña optimiza hacia{" "}
            <strong className="font-bold text-foreground">{f.optimizeFor}</strong>
          </span>
        </div>
      )}

      {f.events.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground md:px-5">Sin eventos asignados.</p>
      ) : (
        <ul>
          {f.events.map((e) => (
            <li
              key={e.name}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 md:px-5"
            >
              {e.failed > 0 ? (
                <X className="h-4 w-4 shrink-0 text-destructive" />
              ) : e.neverSeen ? (
                <Minus className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{e.when}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {e.name} · {e.kind === "estandar" ? "de Meta" : "nuestro"}
                </p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {e.neverSeen ? "sin estrenar" : `${e.sent}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Interruptor({
  titulo, donde, estado, ok, explica,
}: {
  titulo: string
  donde: string
  estado: string
  ok: boolean
  explica: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 md:p-5",
        ok ? "border-primary/30 bg-primary/10" : "border-warn/35 bg-card",
      )}
    >
      <div className="flex items-center gap-2.5">
        <ToggleLeft className={cn("h-5 w-5 shrink-0", ok ? "text-primary" : "text-warn")} />
        <p className="min-w-0 text-[17px] font-extrabold leading-tight text-foreground">{titulo}</p>
      </div>
      <p className={cn("mt-3 text-2xl font-black leading-none tabular-nums", ok ? "text-primary" : "text-warn")}>
        {estado}
      </p>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{explica}</p>
      <p className="mt-3 text-sm text-muted-foreground">Se toca en: {donde}</p>
    </div>
  )
}

function DatoTecnico({ k, v, destacado = false }: { k: string; v: string; destacado?: boolean }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className="text-sm text-muted-foreground">{k}</p>
      <p className={cn("mt-0.5 text-[15px] font-bold tabular-nums", destacado ? "text-warn" : "text-foreground")}>
        {v}
      </p>
    </div>
  )
}
