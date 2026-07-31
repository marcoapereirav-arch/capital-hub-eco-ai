"use client"

import Link from "next/link"
import {
  ArrowLeft, ArrowRight, ArrowDown, Check, Eye, Globe, Megaphone, MessageCircle,
  Minus, Server, ShieldCheck, Target, X,
} from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { EVENTOS_META, USO_META, type UsoEvento } from "../lib/eventos-meta"

/**
 * Board visual de la ESTRATEGIA de medición de Facebook Ads (/sistemas/medicion-ads).
 *
 * Es la explicación completa del sistema, escrita para que la lea un profesional de
 * marketing y lo entienda entero sin preguntar nada: cómo viaja el dato, el catálogo
 * COMPLETO de eventos de Meta con la decisión sobre cada uno, por qué cada acción manda dos
 * etiquetas, qué mide cada funnel y cómo se configura la campaña.
 *
 * Aquí NO van pendientes ni tareas: esto es la estrategia. Lo que falte se ve en Ads.
 *
 * Los datos de la sección "qué mide cada funnel" son REALES: salen del mismo cálculo que
 * la pantalla de Eventos de Ads (`lib/meta/funnels-status`).
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
}: {
  funnels: FunnelVivo[]
  capiMode: "test" | "live"
}) {
  const usamos = EVENTOS_META.filter((e) => e.uso === "usamos")
  const reservados = EVENTOS_META.filter((e) => e.uso === "reservado")
  const descartados = EVENTOS_META.filter((e) => e.uso === "descartado")

  return (
    <>
      <ShellHeader title="Sistema visual" />
      <PageContainer wide>
        <div style={{ fontFamily: TIPO }} className="flex flex-col gap-12 pb-24">
          <Link
            href="/sistemas"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#9CA3AF] transition-colors hover:text-[#F5F6F7]"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Sistema visual
          </Link>

          {/* ── Portada ── */}
          <header>
            <p className="text-[13px] font-semibold" style={{ color: VERDE_CLARO }}>
              Publicidad · estrategia de medición
            </p>
            <h1
              className="mt-2 text-[32px] leading-[1.05] tracking-tight md:text-[46px]"
              style={{ fontWeight: 900, color: "#F5F6F7" }}
            >
              Cómo medimos Facebook Ads
            </h1>
            <p className="mt-4 max-w-3xl text-[17px] leading-relaxed" style={{ color: "#A6AAB2" }}>
              El sistema completo: qué le contamos a Meta, en qué momento exacto, por qué esos
              eventos y no otros, y hacia qué tiene que optimizar cada campaña. Todo lo que hay
              montado, sin nada escondido.
            </p>

            <div
              className="mt-6 inline-flex items-center gap-2.5 rounded border px-3.5 py-2"
              style={{
                borderColor: capiMode === "live" ? "#24462F" : "rgba(229,181,103,0.35)",
                background: capiMode === "live" ? "#101710" : "rgba(229,181,103,0.06)",
              }}
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ background: capiMode === "live" ? VERDE : AMBAR }}
              />
              <span className="text-[14px]" style={{ fontWeight: 600, color: "#F5F6F7" }}>
                {capiMode === "live"
                  ? "Enviando en real: cada conversión cuenta y entrena las campañas"
                  : "En modo prueba: Meta recibe los eventos y los descarta"}
              </span>
            </div>
          </header>

          {/* ── 01 · el recorrido ── */}
          <Bloque
            n="01"
            titulo="El recorrido de una persona"
            intro="Cada paso del embudo avisa a Meta con un evento distinto. Si un paso no avisa, para Meta no ha ocurrido, y no puede aprender de él ni construir audiencia con él."
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <Paso
                icono={Megaphone}
                titulo="Ve el anuncio"
                sub="Facebook o Instagram"
                evento={null}
                nota="Todavía no es terreno nuestro"
              />
              <Flecha />
              <Paso
                icono={Eye}
                titulo="Abre la landing"
                sub="Nuestra página"
                evento="ViewContent"
                nota="Audiencia de intención: vio la oferta"
              />
              <Flecha />
              <Paso
                icono={Check}
                titulo="Deja sus datos"
                sub="Nombre, correo, teléfono"
                evento="Lead"
                nota="Objetivo de conversión de la campaña"
                destacado
              />
              <Flecha />
              <Paso
                icono={MessageCircle}
                titulo="Nos escribe"
                sub="Botón de WhatsApp"
                evento="Contact"
                nota="La señal de intención más alta que capturamos"
              />
            </div>
          </Bloque>

          {/* ── 02 · los dos caminos ── */}
          <Bloque
            n="02"
            titulo="Por dónde viaja cada evento"
            intro="Todo evento sale por dos caminos a la vez. No es redundancia: es lo que evita perder entre un 20 y un 40 por ciento de las conversiones que el navegador bloquea."
          >
            <div className="rounded-lg border p-5 md:p-7" style={{ borderColor: LINEA, background: PANEL }}>
              <div className="flex flex-col items-stretch gap-4 lg:flex-row">
                <Camino
                  icono={Globe}
                  titulo="Píxel, por el navegador"
                  sub="El código de Meta en la página"
                  bueno="Llega al instante y arrastra las cookies de Meta, que son las que mejor identifican a la persona"
                  malo="Se pierde entero si rechaza cookies, usa bloqueador o navega desde un iPhone con protección de seguimiento"
                  color={AMBAR}
                />
                <Camino
                  icono={Server}
                  titulo="API de conversiones, por el servidor"
                  sub="De nuestro servidor al de Meta"
                  bueno="No lo bloquea ningún navegador ni ninguna extensión. Manda el correo y el teléfono cifrados, que mejoran el emparejamiento"
                  malo="Por sí solo le faltan algunas señales del navegador"
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
                  <p className="text-[18px]" style={{ fontWeight: 800, color: "#F5F6F7" }}>
                    Los dos llevan el mismo identificador de evento
                  </p>
                </div>
                <p className="mx-auto mt-2 max-w-2xl text-[15px] leading-relaxed" style={{ color: "#A6AAB2" }}>
                  Meta los reconoce como el mismo hecho y los fusiona: cuenta una sola
                  conversión y se queda con los datos de los dos. Si el navegador se pierde, el
                  del servidor la salva. Si llegan los dos, el emparejamiento sale más fino.
                </p>
              </div>
            </div>
          </Bloque>

          {/* ── 03 · el catálogo completo ── */}
          <Bloque
            n="03"
            titulo="Los 18 eventos de Meta, uno por uno"
            intro="Meta define 17 eventos estándar más PageView. Estos son todos, con lo que significa cada uno para Meta y la decisión que hemos tomado. Ninguno queda sin explicar."
          >
            <div className="mb-5 grid grid-cols-3 gap-3">
              <Contador n={usamos.length} label="en uso" color={VERDE_CLARO} />
              <Contador n={reservados.length} label="reservados" color={AMBAR} />
              <Contador n={descartados.length} label="descartados" color="#7C818A" />
            </div>

            <GrupoEventos uso="usamos" />
            <GrupoEventos uso="reservado" />
            <GrupoEventos uso="descartado" />
          </Bloque>

          {/* ── 04 · dos etiquetas ── */}
          <Bloque
            n="04"
            titulo="Por qué cada acción manda DOS eventos"
            intro="Además del evento estándar, cada acción dispara uno con nombre nuestro. No son dos conversiones: es la misma, con dos nombres, en el mismo milisegundo y con el mismo identificador. Meta cuenta una."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Tarjeta
                borde={VERDE}
                fondo="#101710"
                titulo="Lead"
                etiqueta="Evento estándar de Meta"
                puntos={[
                  "Meta tiene un modelo entrenado con este evento a escala global, de millones de anunciantes.",
                  "Sabe qué perfil deja sus datos antes de que tú traigas un solo lead, así que la campaña sale de la fase de aprendizaje mucho antes.",
                  "Es el que se elige como objetivo de conversión en el gestor de anuncios.",
                ]}
                cierre="Sin el estándar, el algoritmo arranca de cero y con el volumen de un negocio de high ticket puede no salir nunca del aprendizaje."
              />
              <Tarjeta
                borde={LINEA}
                fondo={PANEL}
                titulo="webinar_lead"
                etiqueta="Evento nuestro"
                puntos={[
                  "Meta no sabe qué significa, así que no le sirve para optimizar. Y no pasa nada: no es su trabajo.",
                  "Nos sirve para separar ESTE funnel de cualquier otro que use Lead, hoy o dentro de un año.",
                  "Es con el que se crean públicos personalizados quirúrgicos y se mide el retorno funnel por funnel.",
                ]}
                cierre="Sin el nuestro, el día que haya dos funnels disparando Lead será imposible distinguirlos ni en audiencias ni en informes."
              />
            </div>

            <div
              className="mt-4 rounded border px-5 py-4"
              style={{ borderColor: LINEA, background: PANEL }}
            >
              <p className="text-[15px] leading-relaxed" style={{ color: "#A6AAB2" }}>
                <strong style={{ color: "#F5F6F7" }}>La regla que lo mantiene sano:</strong> una
                acción del usuario dispara UN solo evento estándar. Añadir un segundo estándar a
                la misma acción (por ejemplo Lead y CompleteRegistration juntos) duplica las
                conversiones, deja el coste por resultado a la mitad del real y reparte el
                aprendizaje del algoritmo entre dos señales en vez de concentrarlo en una.
              </p>
            </div>
          </Bloque>

          {/* ── 05 · qué mide cada funnel ── */}
          <Bloque
            n="05"
            titulo="Qué mide cada funnel ahora mismo"
            intro="Datos en vivo, no un dibujo. Esta tabla se lee del sistema cada vez que abres esta página."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {funnels.map((f) => (
                <FunnelCard key={f.slug} funnel={f} />
              ))}
            </div>
          </Bloque>

          {/* ── 06 · configurar la campaña ── */}
          <Bloque
            n="06"
            titulo="Cómo se configura la campaña en el gestor de anuncios"
            intro="La medición no sirve de nada si la campaña optimiza hacia otra cosa. Meta no elige el evento por ti: hay que decírselo al crear el conjunto de anuncios."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {funnels
                .filter((f) => f.trackingEnabled && f.optimizeFor)
                .map((f) => (
                  <div
                    key={f.slug}
                    className="rounded-lg border p-5"
                    style={{ borderColor: "#24462F", background: "#101710" }}
                  >
                    <p className="text-[13px] font-semibold" style={{ color: VERDE_CLARO }}>
                      Campaña de {f.name}
                    </p>
                    <p className="mt-2 text-[15px]" style={{ color: "#A6AAB2" }}>
                      Objetivo de conversión:
                    </p>
                    <p className="mt-1 text-[26px] leading-none" style={{ fontWeight: 900, color: "#F5F6F7" }}>
                      {f.optimizeFor}
                    </p>
                    <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "#7C818A" }}>
                      Si eliges otro evento, Meta buscará otra cosa y el presupuesto se va a
                      perfiles que no hacen lo que a ti te importa.
                    </p>
                  </div>
                ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Nota
                titulo="Fase de aprendizaje"
                texto="Meta necesita unas cuantas conversiones del evento elegido antes de afinar. Los primeros días reparte casi a ciegas. Es normal y le pasa a todo el mundo: no se toca la campaña durante ese periodo."
              />
              <Nota
                titulo="Públicos que salen de aquí"
                texto="Con ViewContent se hace el retargeting bueno (vieron la oferta y no dejaron datos). Con el evento nuestro se hacen los públicos similares de cada funnel por separado."
              />
              <Nota
                titulo="Medir la calidad, no solo el volumen"
                texto="Contact marca a quien decide escribir. Es la señal más cercana a la venta que capturamos hoy, y sirve para juzgar creativos que traen leads baratos pero que no contestan."
              />
            </div>
          </Bloque>
        </div>
      </PageContainer>
    </>
  )
}

/* ─────────────────────────── piezas ─────────────────────────── */

function Bloque({
  n, titulo, intro, children,
}: {
  n: string
  titulo: string
  intro?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-[13px] font-semibold" style={{ color: VERDE_CLARO }}>
          {n}
        </span>
        <span className="h-px flex-1" style={{ background: LINEA }} />
      </div>
      <h2
        className="text-[24px] leading-tight tracking-tight md:text-[30px]"
        style={{ fontWeight: 800, color: "#F5F6F7" }}
      >
        {titulo}
      </h2>
      {intro && (
        <p className="mb-6 mt-3 max-w-3xl text-[16px] leading-relaxed" style={{ color: "#A6AAB2" }}>
          {intro}
        </p>
      )}
      {!intro && <div className="mb-6" />}
      {children}
    </section>
  )
}

function GrupoEventos({ uso }: { uso: UsoEvento }) {
  const lista = EVENTOS_META.filter((e) => e.uso === uso)
  const meta = USO_META[uso]
  const color = uso === "usamos" ? VERDE_CLARO : uso === "reservado" ? AMBAR : "#7C818A"

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-[18px]" style={{ fontWeight: 800, color }}>
          {meta.label} · {lista.length}
        </h3>
        <p className="text-[14px]" style={{ color: "#7C818A" }}>
          {meta.explica}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {lista.map((e) => (
          <div
            key={e.name}
            className="rounded-lg border p-5"
            style={{
              borderColor: uso === "usamos" ? "#24462F" : LINEA,
              background: uso === "usamos" ? "#101710" : PANEL,
            }}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-[20px] leading-tight" style={{ fontWeight: 900, color: "#F5F6F7" }}>
                {e.name}
              </p>
              <p className="text-[15px]" style={{ color: "#7C818A" }}>
                {e.significa}
              </p>
            </div>

            {e.donde && (
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "#A6AAB2" }}>
                <strong style={{ color: "#F5F6F7", fontWeight: 700 }}>Dónde salta: </strong>
                {e.donde}
              </p>
            )}
            {e.paraQue && (
              <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: "#A6AAB2" }}>
                <strong style={{ color: "#F5F6F7", fontWeight: 700 }}>Para qué sirve: </strong>
                {e.paraQue}
              </p>
            )}
            <p
              className="mt-3 border-t pt-3 text-[15px] leading-relaxed"
              style={{ borderColor: LINEA, color: uso === "descartado" ? "#7C818A" : "#A6AAB2" }}
            >
              <strong style={{ color: "#F5F6F7", fontWeight: 700 }}>Nuestra decisión: </strong>
              {e.decision}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Contador({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="rounded border px-4 py-3" style={{ borderColor: LINEA, background: PANEL }}>
      <p className="text-[30px] leading-none" style={{ fontWeight: 900, color }}>
        {n}
      </p>
      <p className="mt-1.5 text-[14px]" style={{ color: "#7C818A" }}>
        {label}
      </p>
    </div>
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
      <p className="mt-1 text-[24px] leading-tight" style={{ fontWeight: 900, color: "#F5F6F7" }}>
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
    <div className="flex-1 rounded border p-5" style={{ borderColor: LINEA }}>
      <div className="flex items-center gap-2.5">
        <Icono className="h-5 w-5 shrink-0" style={{ color }} />
        <div>
          <p className="text-[17px] leading-tight" style={{ fontWeight: 800, color: "#F5F6F7" }}>
            {titulo}
          </p>
          <p className="text-[13px]" style={{ color: "#7C818A" }}>
            {sub}
          </p>
        </div>
      </div>
      <p className="mt-3.5 flex gap-2 text-[14px] leading-relaxed" style={{ color: "#A6AAB2" }}>
        <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: VERDE_CLARO }} />
        {bueno}
      </p>
      <p className="mt-2 flex gap-2 text-[14px] leading-relaxed" style={{ color: "#7C818A" }}>
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
                  {e.name} · {e.kind === "estandar" ? "estándar de Meta" : "nuestro"}
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

function Nota({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded border p-4" style={{ borderColor: LINEA, background: PANEL }}>
      <p className="text-[15px]" style={{ fontWeight: 700, color: "#F5F6F7" }}>
        {titulo}
      </p>
      <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "#A6AAB2" }}>
        {texto}
      </p>
    </div>
  )
}
