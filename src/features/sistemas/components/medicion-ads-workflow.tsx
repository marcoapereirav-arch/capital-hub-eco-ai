"use client"

import Link from "next/link"
import {
  ArrowLeft, ArrowRight, ArrowDown, Check, Eye, Megaphone, MessageCircle,
  Minus, ShieldCheck, Target, X,
} from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { cn } from "@/lib/utils"
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
 * Es una pagina de LECTURA: interlineado holgado, el texto nunca baja de 14 puntos y ni un
 * color escrito a mano. Antes esta pantalla tenia su propia paleta en constantes (VERDE,
 * AMBAR, PANEL, LINEA...) y su propia familia tipografica, asi que no escuchaba al tema.
 * El titulo de la seccion lo pone la barra de arriba del shell, no la pagina.
 */

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
      <PageContainer wide>
        <div className="flex flex-col gap-10 md:gap-12">
          {/* Siempre hay salida: boton de volver visible, con texto, a 44 puntos. */}
          <Link
            href="/sistemas"
            className="inline-flex h-11 w-fit items-center gap-1.5 text-[15px] font-semibold text-muted-foreground transition-colors md:h-auto md:hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Sistema visual
          </Link>

          {/* ── Portada ── */}
          <header>
            <p className="text-sm font-semibold text-primary">
              Publicidad · estrategia de medición
            </p>
            <h1 className="mt-2 text-[32px] font-black leading-[1.05] tracking-tight text-foreground md:text-[44px]">
              Cómo medimos Facebook Ads
            </h1>
            <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-muted-foreground">
              El sistema completo: qué le contamos a Meta, en qué momento exacto, por qué esos
              eventos y no otros, y hacia qué tiene que optimizar cada campaña. Todo lo que hay
              montado, sin nada escondido.
            </p>

            {/* En telefono la frase ocupa varias lineas: el punto se alinea arriba para que
                no quede flotando en mitad del bloque de texto. */}
            <div
              className={cn(
                "mt-6 inline-flex items-start gap-2.5 rounded-lg border px-3.5 py-2 md:items-center",
                capiMode === "live"
                  ? "border-primary/30 bg-primary/10"
                  : "border-warn/35 bg-warn/10",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full md:mt-0",
                  capiMode === "live" ? "bg-primary" : "bg-warn",
                )}
              />
              <span className="text-sm font-semibold text-foreground">
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

            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
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
                    className="rounded-lg border border-primary/30 bg-primary/10 p-4 md:p-5"
                  >
                    <p className="text-sm font-semibold text-primary">Campaña de {f.name}</p>
                    <p className="mt-2 text-[15px] text-muted-foreground">
                      Objetivo de conversión:
                    </p>
                    <p className="mt-1 text-[28px] font-black leading-none text-foreground">
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
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Contador n={usamos.length} label="en uso" tono="text-primary" />
              <Contador n={reservados.length} label="reservados" tono="text-warn" />
              <Contador n={descartados.length} label="descartados" tono="text-muted-foreground" />
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
                destacada
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

            <div className="mt-4 rounded-lg border border-border bg-card px-4 py-4 md:px-5">
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">La regla que lo mantiene sano:</strong> una
                acción del usuario dispara UN solo evento estándar. Añadir un segundo estándar a
                la misma acción (por ejemplo Lead y CompleteRegistration juntos) duplica las
                conversiones, deja el coste por resultado a la mitad del real y reparte el
                aprendizaje del algoritmo entre dos señales en vez de concentrarlo en una.
              </p>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-4 md:px-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Y cada evento se manda dos veces: </strong>
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
        <span className="text-sm font-semibold tabular-nums text-primary">{n}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <h2 className="text-[22px] font-extrabold leading-tight tracking-tight text-foreground md:text-[26px]">
        {titulo}
      </h2>
      {intro && (
        <p className="mb-6 mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
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
  const enUso = uso === "usamos"
  const tono = enUso
    ? "text-primary"
    : uso === "reservado"
      ? "text-warn"
      : "text-muted-foreground"

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className={cn("text-[18px] font-extrabold", tono)}>
          {meta.label} · {lista.length}
        </h3>
        <p className="text-sm text-muted-foreground">{meta.explica}</p>
      </div>

      <div className="flex flex-col gap-3">
        {lista.map((e) => (
          <div
            key={e.name}
            className={cn(
              "rounded-lg border p-4 md:p-5",
              enUso ? "border-primary/30 bg-primary/10" : "border-border bg-card",
            )}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-[20px] font-black leading-tight text-foreground">{e.name}</p>
              <p className="text-[15px] text-muted-foreground">{e.significa}</p>
            </div>

            {e.donde && (
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                <strong className="font-bold text-foreground">Dónde salta: </strong>
                {e.donde}
              </p>
            )}
            {e.paraQue && (
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                <strong className="font-bold text-foreground">Para qué sirve: </strong>
                {e.paraQue}
              </p>
            )}
            <p className="mt-3 border-t border-border pt-3 text-[15px] leading-relaxed text-muted-foreground">
              <strong className="font-bold text-foreground">Nuestra decisión: </strong>
              {e.decision}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Contador({ n, label, tono }: { n: number; label: string; tono: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3 md:px-4">
      <p className={cn("text-[30px] font-black leading-none tabular-nums", tono)}>{n}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
    </div>
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
      className={cn(
        "flex-1 rounded-lg border p-4",
        destacado ? "border-primary/30 bg-primary/10" : "border-border bg-card",
      )}
    >
      <Icono className={cn("h-5 w-5", destacado ? "text-primary" : "text-muted-foreground")} />
      <p className="mt-3 text-base font-extrabold leading-tight text-foreground">{titulo}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>

      {eventos.length === 0 ? (
        <span className="mt-3 inline-block text-sm text-muted-foreground">
          Meta todavía no se entera de nada
        </span>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {eventos.map((e) => (
            <span
              key={e.name}
              className={cn(
                "rounded-sm border px-2 py-1 text-sm font-semibold",
                e.auto
                  ? "border-border text-muted-foreground"
                  : "border-primary/30 bg-primary/10 text-primary",
              )}
            >
              {e.name}
              {e.auto && <span className="text-muted-foreground"> · automático</span>}
            </span>
          ))}
        </div>
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
      <p className="mt-1 text-[24px] font-black leading-tight text-foreground">{titulo}</p>
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

function FunnelCard({ funnel: f }: { funnel: FunnelVivo }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:px-5">
        <span
          aria-hidden
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            f.trackingEnabled ? "bg-primary shadow-[0_0_10px_var(--primary)]" : "bg-muted",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-extrabold leading-tight text-foreground">{f.name}</p>
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
                className={cn(
                  "shrink-0 text-right text-sm tabular-nums",
                  e.automatico ? "text-primary" : "text-muted-foreground",
                )}
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
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[15px] font-bold text-foreground">{titulo}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{texto}</p>
    </div>
  )
}
