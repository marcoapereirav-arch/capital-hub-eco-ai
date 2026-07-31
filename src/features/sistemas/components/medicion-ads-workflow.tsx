"use client"

import Link from "next/link"
import {
  ArrowLeft, ArrowRight, ArrowDown, Check, Eye, Megaphone, MessageCircle,
  Minus, ShieldCheck, Target, X,
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
  /** `automatico` es PageView: lo dispara el píxel solo y no pasa por nuestro servidor. */
  kind: "estandar" | "nuestro" | "automatico"
  sent: number
  neverSeen: boolean
  failed: number
  automatico: boolean
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
                eventos={[]}
                nota="Todavía está dentro de Facebook, no en nuestra web"
              />
              <Flecha />
              <Paso
                icono={Eye}
                titulo="Abre la landing"
                sub="Nuestra página"
                eventos={[{ name: "PageView", auto: true }, { name: "ViewContent" }]}
                nota="PageView dice que entró alguien. ViewContent dice que vio LA OFERTA. El segundo es el que hace buenas las audiencias"
              />
              <Flecha />
              <Paso
                icono={Check}
                titulo="Deja sus datos"
                sub="Nombre, correo, teléfono"
                eventos={[{ name: "Lead" }, { name: "webinar_lead" }]}
                nota="Objetivo de conversión de la campaña"
                destacado
              />
              <Flecha />
              <Paso
                icono={MessageCircle}
                titulo="Nos escribe"
                sub="Botón de WhatsApp"
                eventos={[{ name: "Contact" }]}
                nota="La señal de intención más alta que capturamos"
              />
            </div>

            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed" style={{ color: "#7C818A" }}>
              PageView va marcado como automático porque lo dispara el píxel solo, en todas las
              páginas, sin que nosotros programemos nada. Los demás los disparamos a mano en el
              momento exacto.
            </p>
          </Bloque>

          {/* ── 02 · qué mide cada funnel ── */}
          <Bloque
            n="02"
            titulo="Qué está midiendo cada funnel ahora mismo"
            intro="Datos en vivo, se leen del sistema cada vez que abres esta página. Verde es confirmado: ese evento ya llegó a Meta y sabemos cuántas veces."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {funnels.map((f) => (
                <FunnelCard key={f.slug} funnel={f} />
              ))}
            </div>
          </Bloque>

          {/* ── 03 · hacia qué optimiza ── */}
          <Bloque
            n="03"
            titulo="Hacia qué evento optimiza cada campaña"
            intro="Meta no lo adivina: hay que elegirlo al crear el conjunto de anuncios. Si eliges otro, el presupuesto se va a gente que hace otra cosa."
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
                    <p className="mt-1 text-[28px] leading-none" style={{ fontWeight: 900, color: "#F5F6F7" }}>
                      {f.optimizeFor}
                    </p>
                  </div>
                ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Nota
                titulo="Fase de aprendizaje"
                texto="Meta necesita unas cuantas conversiones del evento elegido antes de afinar. Los primeros días reparte casi a ciegas. Es normal: no se toca la campaña durante ese periodo."
              />
              <Nota
                titulo="Públicos que salen de esto"
                texto="Con ViewContent se hace el retargeting bueno: vieron la oferta y no dejaron datos. Con el evento nuestro se hacen los públicos similares de cada funnel por separado."
              />
              <Nota
                titulo="Calidad, no solo volumen"
                texto="Contact marca a quien decide escribir. Sirve para descartar creativos que traen leads baratos que luego no contestan."
              />
            </div>
          </Bloque>

          {/* ── 04 · el catálogo completo ── */}
          <Bloque
            n="04"
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

          {/* ── 05 · dos etiquetas ── */}
          <Bloque
            n="05"
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

            <div
              className="mt-4 flex items-start gap-3 rounded border px-5 py-4"
              style={{ borderColor: LINEA, background: PANEL }}
            >
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: VERDE_CLARO }} />
              <p className="text-[15px] leading-relaxed" style={{ color: "#A6AAB2" }}>
                <strong style={{ color: "#F5F6F7" }}>Y cada evento se manda dos veces: </strong>
                una desde el navegador de la persona y otra desde nuestro servidor. Es contra el
                bloqueo de cookies: si el navegador no deja pasar el píxel, el del servidor llega
                igual y la conversión no se pierde. Las dos llevan el mismo identificador, así
                que Meta las junta y cuenta una.
              </p>
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

/**
 * Un paso del recorrido con TODOS los eventos que saltan en él, no solo el principal.
 * En la landing saltan dos a la vez (PageView y ViewContent) y hay que verlo: si solo se
 * enseña uno, parece que el otro no existe.
 */
function Paso({
  icono: Icono, titulo, sub, eventos, nota, destacado = false,
}: {
  icono: typeof Eye
  titulo: string
  sub: string
  eventos: { name: string; auto?: boolean }[]
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

      {eventos.length === 0 ? (
        <span className="mt-3 inline-block text-[13px]" style={{ color: "#7C818A" }}>
          Meta todavía no se entera de nada
        </span>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {eventos.map((e) => (
            <span
              key={e.name}
              className="rounded-[3px] border px-2 py-1 text-[13px]"
              style={{
                fontWeight: 600,
                borderColor: e.auto ? LINEA : "#24462F",
                background: e.auto ? "transparent" : "#101710",
                color: e.auto ? "#A6AAB2" : VERDE_CLARO,
              }}
            >
              {e.name}
              {e.auto && <span style={{ color: "#7C818A" }}> · automático</span>}
            </span>
          ))}
        </div>
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
                  {e.name} ·{" "}
                  {e.kind === "automatico"
                    ? "automático del píxel"
                    : e.kind === "estandar"
                      ? "estándar de Meta"
                      : "nuestro"}
                </p>
              </div>
              {/* PageView no pasa por nuestro servidor, así que no hay número de envíos que
                  enseñar. Decir "sin estrenar" ahí sería falso: va con el píxel siempre. */}
              <span
                className="shrink-0 text-right text-[14px]"
                style={{ color: e.automatico ? VERDE_CLARO : e.neverSeen ? "#7C818A" : "#A6AAB2" }}
              >
                {e.automatico ? "activo" : e.neverSeen ? "sin estrenar" : `${e.sent} envíos`}
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
