"use client"

import Link from "next/link"
import {
  ArrowLeft, ArrowRight, ArrowDown, Check, Eye, Globe, MessageCircle,
  Megaphone, Minus, Server, ShieldCheck, Target, ToggleLeft, X,
} from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"

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
 * Brandkit explícito: en el OS el token `accent` vale gris y `font-heading` cae en la
 * fuente del sistema. Ver SOP producto/47.
 */

const VERDE = "#22C55E"
const VERDE_CLARO = "#4ADE80"
const AMBAR = "#E5B567"
const ROJO = "#E5675B"
const LINEA = "rgba(245,246,247,0.1)"
const PANEL = "#131318"
const TIPO = "'Inter Tight', sans-serif"

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
      <ShellHeader title="Sistema visual" />
      <PageContainer wide>
        <div style={{ fontFamily: TIPO }} className="flex flex-col gap-10 pb-16">
          <Link
            href="/sistemas"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#9CA3AF] transition-colors hover:text-[#F5F6F7]"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Sistema visual
          </Link>

          {/* ── Portada ── */}
          <header>
            <p className="text-[13px] font-semibold" style={{ color: VERDE_CLARO }}>
              Publicidad
            </p>
            <h1
              className="mt-2 text-[32px] leading-[1.05] tracking-tight md:text-[44px]"
              style={{ fontWeight: 900, color: "#F5F6F7" }}
            >
              Cómo medimos Facebook Ads
            </h1>
            <p
              className="mt-3 max-w-2xl text-[16px] leading-relaxed"
              style={{ color: "#A6AAB2" }}
            >
              Desde que alguien ve el anuncio hasta que Meta cuenta la conversión. Qué se
              dispara en cada paso, por qué van dos etiquetas, y hacia qué tiene que optimizar
              cada campaña.
            </p>
          </header>

          {/* ── 1. El recorrido ── */}
          <Bloque n="01" titulo="El recorrido de una persona">
            <p className="mb-6 max-w-2xl text-[15px] leading-relaxed" style={{ color: "#A6AAB2" }}>
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
            <p className="mb-6 max-w-2xl text-[15px] leading-relaxed" style={{ color: "#A6AAB2" }}>
              No son dos conversiones. Es la misma, con dos nombres, en el mismo milisegundo y
              con el mismo identificador. Meta cuenta <strong style={{ color: "#F5F6F7" }}>una</strong>.
              Cada nombre alimenta un motor distinto de Meta.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Tarjeta
                borde={VERDE}
                fondo="#101710"
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
                borde={LINEA}
                fondo={PANEL}
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
            <div className="rounded-lg border p-5 md:p-7" style={{ borderColor: LINEA, background: PANEL }}>
              <div className="flex flex-col items-stretch gap-4 lg:flex-row">
                <Camino
                  icono={Globe}
                  titulo="Por el navegador"
                  sub="El píxel de Meta"
                  bueno="Instantáneo"
                  malo="Se pierde si rechaza cookies o usa un navegador con protección"
                  color={AMBAR}
                />
                <Camino
                  icono={Server}
                  titulo="Por el servidor"
                  sub="La API de conversiones"
                  bueno="No lo bloquea nadie, nunca"
                  malo="Le faltan algunas señales del navegador"
                  color={VERDE}
                />
              </div>

              <div className="my-6 flex justify-center">
                <ArrowDown className="h-6 w-6" style={{ color: "#7C818A" }} />
              </div>

              <div
                className="rounded border px-5 py-4 text-center"
                style={{ borderColor: "#24462F", background: "#101710" }}
              >
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="h-5 w-5" style={{ color: VERDE_CLARO }} />
                  <p className="text-[17px]" style={{ fontWeight: 800, color: "#F5F6F7" }}>
                    Los dos llevan el mismo identificador
                  </p>
                </div>
                <p className="mt-2 text-[15px]" style={{ color: "#A6AAB2" }}>
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
              <div
                className="flex items-start gap-3 rounded-lg border p-5"
                style={{ borderColor: "#24462F", background: "#101710" }}
              >
                <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: VERDE_CLARO }} />
                <div>
                  <p className="text-[17px]" style={{ fontWeight: 800, color: "#F5F6F7" }}>
                    Nada. El sistema está completo
                  </p>
                  <p className="mt-1.5 text-[15px]" style={{ color: "#A6AAB2" }}>
                    Los funnels miden y las campañas se leen desde el OS.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="rounded-lg border p-5 md:p-6"
                style={{ borderColor: "rgba(229,181,103,0.35)", background: "rgba(229,181,103,0.06)" }}
              >
                <p className="text-[19px]" style={{ fontWeight: 800, color: AMBAR }}>
                  Ver el gasto de las campañas dentro del OS
                </p>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed" style={{ color: "#A6AAB2" }}>
                  La medición funciona entera. Lo único que no se puede hacer todavía es LEER
                  desde aquí lo que gastan tus campañas: la llave que tenemos sirve para
                  escribir conversiones, no para leer rendimiento. Son dos permisos distintos.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <DatoTecnico k="Cuenta de anuncios" v="2550903125083729" />
                  <DatoTecnico k="Aplicación" v="1304166178499280" />
                  <DatoTecnico k="Usuario del sistema" v="122108163171278108" />
                  <DatoTecnico k="Permiso que falta" v="ads_read" destacado />
                </div>
                <p className="mt-4 text-[15px]" style={{ color: "#A6AAB2" }}>
                  Cuando llegue la llave nueva se guarda como{" "}
                  <strong style={{ color: "#F5F6F7" }}>META_MARKETING_API_TOKEN</strong> y la
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
        <span className="text-[13px] font-semibold" style={{ color: VERDE_CLARO }}>
          {n}
        </span>
        <span className="h-px flex-1" style={{ background: LINEA }} />
      </div>
      <h2
        className="mb-4 text-[22px] leading-tight tracking-tight md:text-[26px]"
        style={{ fontWeight: 800, color: "#F5F6F7" }}
      >
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function Flecha() {
  return (
    <div className="flex items-center justify-center lg:px-1">
      <ArrowRight className="hidden h-5 w-5 lg:block" style={{ color: "#7C818A" }} />
      <ArrowDown className="h-5 w-5 lg:hidden" style={{ color: "#7C818A" }} />
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
      className="flex-1 rounded-lg border p-4"
      style={{
        borderColor: destacado ? "#24462F" : LINEA,
        background: destacado ? "#101710" : PANEL,
      }}
    >
      <Icono className="h-5 w-5" style={{ color: destacado ? VERDE_CLARO : "#7C818A" }} />
      <p className="mt-3 text-[16px] leading-tight" style={{ fontWeight: 800, color: "#F5F6F7" }}>
        {titulo}
      </p>
      <p className="mt-1 text-[13px]" style={{ color: "#7C818A" }}>
        {sub}
      </p>

      {evento ? (
        <span
          className="mt-3 inline-block rounded-[3px] border px-2 py-1 text-[13px]"
          style={{ fontWeight: 600, borderColor: "#24462F", background: "#101710", color: VERDE_CLARO }}
        >
          {evento}
        </span>
      ) : (
        <span className="mt-3 inline-block text-[13px]" style={{ color: "#7C818A" }}>
          sin evento
        </span>
      )}

      <p className="mt-2.5 text-[13px] leading-snug" style={{ color: "#A6AAB2" }}>
        {nota}
      </p>
    </div>
  )
}

function Tarjeta({
  borde, fondo, titulo, etiqueta, puntos, cierre,
}: {
  borde: string
  fondo: string
  titulo: string
  etiqueta: string
  puntos: string[]
  cierre: string
}) {
  return (
    <div className="rounded-lg border p-5" style={{ borderColor: borde, background: fondo }}>
      <p className="text-[13px] font-semibold" style={{ color: "#7C818A" }}>
        {etiqueta}
      </p>
      <p className="mt-1 text-[22px] leading-tight" style={{ fontWeight: 900, color: "#F5F6F7" }}>
        {titulo}
      </p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {puntos.map((p) => (
          <li key={p} className="flex gap-2.5 text-[15px] leading-relaxed" style={{ color: "#A6AAB2" }}>
            <span
              aria-hidden
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: "#7C818A" }}
            />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <p
        className="mt-4 border-t pt-3 text-[14px] leading-relaxed"
        style={{ borderColor: LINEA, color: "#7C818A" }}
      >
        {cierre}
      </p>
    </div>
  )
}

function Camino({
  icono: Icono, titulo, sub, bueno, malo, color,
}: {
  icono: typeof Globe
  titulo: string
  sub: string
  bueno: string
  malo: string
  color: string
}) {
  return (
    <div className="flex-1 rounded border p-4" style={{ borderColor: LINEA }}>
      <div className="flex items-center gap-2.5">
        <Icono className="h-5 w-5" style={{ color }} />
        <div>
          <p className="text-[16px] leading-tight" style={{ fontWeight: 800, color: "#F5F6F7" }}>
            {titulo}
          </p>
          <p className="text-[13px]" style={{ color: "#7C818A" }}>
            {sub}
          </p>
        </div>
      </div>
      <p className="mt-3 flex gap-2 text-[14px]" style={{ color: "#A6AAB2" }}>
        <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: VERDE_CLARO }} />
        {bueno}
      </p>
      <p className="mt-1.5 flex gap-2 text-[14px]" style={{ color: "#7C818A" }}>
        <X className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ROJO }} />
        {malo}
      </p>
    </div>
  )
}

function FunnelCard({ funnel: f }: { funnel: FunnelVivo }) {
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: LINEA, background: PANEL }}>
      <div className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: LINEA }}>
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            background: f.trackingEnabled ? VERDE : "#3A3D44",
            boxShadow: f.trackingEnabled ? "0 0 10px rgba(34,197,94,0.8)" : "none",
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] leading-tight" style={{ fontWeight: 800, color: "#F5F6F7" }}>
            {f.name}
          </p>
          <p className="mt-0.5 text-[13px]" style={{ color: "#7C818A" }}>
            {f.path}
          </p>
        </div>
        {!f.trackingEnabled && (
          <span className="shrink-0 text-[13px]" style={{ color: "#7C818A" }}>
            sin medir
          </span>
        )}
      </div>

      {f.optimizeFor && f.trackingEnabled && (
        <div
          className="flex items-center gap-2.5 border-b px-5 py-3"
          style={{ borderColor: LINEA, background: "#101710" }}
        >
          <Target className="h-4 w-4 shrink-0" style={{ color: VERDE_CLARO }} />
          <span className="text-[14px]" style={{ color: "#A6AAB2" }}>
            Su campaña optimiza hacia{" "}
            <strong style={{ fontWeight: 700, color: "#F5F6F7" }}>{f.optimizeFor}</strong>
          </span>
        </div>
      )}

      {f.events.length === 0 ? (
        <p className="px-5 py-4 text-[14px]" style={{ color: "#7C818A" }}>
          Sin eventos asignados.
        </p>
      ) : (
        <ul>
          {f.events.map((e) => (
            <li
              key={e.name}
              className="flex items-center gap-3 border-b px-5 py-3 last:border-b-0"
              style={{ borderColor: LINEA }}
            >
              {e.failed > 0 ? (
                <X className="h-4 w-4 shrink-0" style={{ color: ROJO }} />
              ) : e.neverSeen ? (
                <Minus className="h-4 w-4 shrink-0" style={{ color: "#7C818A" }} />
              ) : (
                <Check className="h-4 w-4 shrink-0" style={{ color: VERDE_CLARO }} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[14px]" style={{ fontWeight: 600, color: "#F5F6F7" }}>
                  {e.when}
                </p>
                <p className="mt-0.5 text-[13px]" style={{ color: "#7C818A" }}>
                  {e.name} · {e.kind === "estandar" ? "de Meta" : "nuestro"}
                </p>
              </div>
              <span className="shrink-0 text-[14px]" style={{ color: e.neverSeen ? "#7C818A" : "#A6AAB2" }}>
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
      className="rounded-lg border p-5"
      style={{ borderColor: ok ? "#24462F" : "rgba(229,181,103,0.35)", background: ok ? "#101710" : PANEL }}
    >
      <div className="flex items-center gap-2.5">
        <ToggleLeft className="h-5 w-5" style={{ color: ok ? VERDE_CLARO : AMBAR }} />
        <p className="text-[17px] leading-tight" style={{ fontWeight: 800, color: "#F5F6F7" }}>
          {titulo}
        </p>
      </div>
      <p className="mt-3 text-[24px] leading-none" style={{ fontWeight: 900, color: ok ? VERDE_CLARO : AMBAR }}>
        {estado}
      </p>
      <p className="mt-2.5 text-[14px] leading-relaxed" style={{ color: "#A6AAB2" }}>
        {explica}
      </p>
      <p className="mt-3 text-[13px]" style={{ color: "#7C818A" }}>
        Se toca en: {donde}
      </p>
    </div>
  )
}

function DatoTecnico({ k, v, destacado = false }: { k: string; v: string; destacado?: boolean }) {
  return (
    <div className="rounded border px-3 py-2" style={{ borderColor: LINEA }}>
      <p className="text-[13px]" style={{ color: "#7C818A" }}>
        {k}
      </p>
      <p className="mt-0.5 text-[15px]" style={{ fontWeight: 700, color: destacado ? AMBAR : "#F5F6F7" }}>
        {v}
      </p>
    </div>
  )
}
