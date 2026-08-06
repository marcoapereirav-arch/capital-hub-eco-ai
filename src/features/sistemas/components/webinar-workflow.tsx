"use client"

import Link from "next/link"
import {
  ArrowLeft, ChevronRight, Megaphone, MessagesSquare, Radio, Play, BadgeCheck,
  Check, type LucideIcon,
} from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { cn } from "@/lib/utils"

/**
 * Board visual del Funnel del Webinar (/sistemas/webinar).
 *
 * No son cuadritos de texto: cada paso lleva un MOCK-UP de la pantalla real (la landing,
 * la página de gracias, el correo, el WhatsApp) para ver exactamente cómo es y cómo se
 * envía. Flujo ordenado, sin solapes: en móvil va en vertical, en escritorio en horizontal.
 * La fecha, el tag y los ajustes llegan por props desde el server (getWebinarSettings), así
 * lo que se ve coincide con lo que pasa de verdad.
 *
 * Sobre el tamaño de letra de los mock-ups: en el telefono la ficha ocupa el ancho entero,
 * asi que el texto va a 14 puntos y SE LEE. En escritorio baja a 13, que es el suelo, y ni
 * un punto menos: 8 puntos en un monitor tampoco se leen. Como la letra no cambia el ancho
 * de la ficha (224 puntos fijos), lo unico que crece es el alto, y la fila ya se desplaza
 * de lado dentro de su propia caja. Antes iba a 6,5 puntos en TODAS partes.
 */

// Glifo de WhatsApp (hereda color con currentColor).
function WhatsappGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
    </svg>
  )
}

type Actor = "sistema" | "equipo" | "adrian"
const ACTOR: Record<Actor, { label: string; punto: string }> = {
  sistema: { label: "Sistema · automático", punto: "bg-primary" },
  equipo: { label: "Equipo", punto: "bg-muted-foreground" },
  adrian: { label: "Adrián", punto: "bg-foreground" },
}

/** El punto verde que late. Con clases del tema, sin CSS ni color a mano. */
function PuntoVivo() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
    </span>
  )
}

export function WebinarWorkflow({
  dateLabel,
  tagName,
  whatsappMessage,
  emailWhatsappEnabled,
}: {
  dateLabel: string
  tagName: string
  whatsappMessage: string
  emailWhatsappEnabled: boolean
}) {
  return (
    <>
      <PageContainer wide>
        {/* Volver */}
        <Link
          href="/sistemas"
          className="inline-flex h-11 w-fit items-center gap-1.5 text-[15px] font-medium text-muted-foreground transition-colors md:h-auto md:hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a Sistema visual
        </Link>

        {/* Encabezado */}
        <header className="ww-rise relative mt-4 overflow-hidden rounded-xl border border-border bg-card p-4 md:p-6">
          <span className="relative inline-flex items-center gap-2 rounded-sm border border-primary/40 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <PuntoVivo /> Activo ahora
          </span>
          <h1 className="relative mt-3 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Funnel del Webinar
          </h1>
          <p className="relative mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Así se ve la película completa: del anuncio hasta que la persona te escribe por WhatsApp.
            Ese mensaje es el punto de éxito; a partir de ahí se le nutre dentro del chat.
          </p>
          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            {(["sistema", "equipo", "adrian"] as Actor[]).map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1 text-sm font-medium text-foreground"
              >
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ACTOR[a].punto)} />
                {ACTOR[a].label}
              </span>
            ))}
          </div>
        </header>

        {/* Flujo: vertical en móvil, horizontal en escritorio. Cada paso lleva su mock-up.
            El desplazamiento lateral vive DENTRO de esta caja (nunca arrastra la pagina) y
            solo existe en escritorio, donde los siete pasos van en fila. */}
        <div
          className="ww-rise relative mt-4 rounded-xl border border-border bg-background p-4 md:overflow-x-auto md:p-6"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex flex-col items-stretch gap-0 md:flex-row md:items-center">

            <Step n={1} title="Tráfico" actor="equipo" icon={Megaphone}
              desc="Anuncios, historias y bio llevan a la landing." />

            <Connector />

            <Step n={2} title="Landing · /webinar" actor="sistema" mock={<MockLanding />}
              foot="Al enviar el formulario se crea el contacto en el CRM y entra al pipeline del webinar." />

            <Connector label="al dejar sus datos" />

            {/* Lo que recibe al instante: dos cosas a la vez */}
            <div className="flex w-full shrink-0 flex-col md:w-auto">
              <p className="mb-2 text-center text-sm font-medium text-muted-foreground">Al instante recibe</p>
              <div className="flex flex-col gap-3">
                <Step n={3} title="Página de gracias" actor="sistema" compact mock={<MockGracias />} />
                <Step n={4} title="Correo de confirmación" actor="sistema" compact
                  mock={<MockEmail withWhatsapp={emailWhatsappEnabled} />}
                  foot={emailWhatsappEnabled ? "Se envía a la vez. Con botón de WhatsApp." : "Se envía a la vez. Sin botón de WhatsApp."} />
              </div>
            </div>

            <Connector label="escribe por WhatsApp" />

            <Step n={5} title="Escribe por WhatsApp" actor="sistema" success
              mock={<MockWhatsapp message={whatsappMessage} />}
              foot={`Al enviar se le pone el tag ${tagName}. Aquí termina nuestro trabajo.`} />

            <Connector label="al enviar" green />

            <Step n={6} title="Se nutre en el chat" actor="equipo" icon={MessagesSquare}
              desc="El equipo conversa y nutre a la persona dentro del chat." />

            <Connector green />

            <Step n={7} title="Webinar en directo" actor="adrian" icon={Radio}
              desc={`El día ${dateLabel} la persona entra al directo.`} />

          </div>
        </div>

        {/* Solo movimiento: ni un color escrito aqui. */}
        <style>{`
          .ww-rise { opacity: 0; transform: translateY(14px); animation: ww-rise .6s cubic-bezier(.22,.61,.36,1) forwards; }
          @keyframes ww-rise { to { opacity: 1; transform: translateY(0); } }
          @media (prefers-reduced-motion: reduce) { .ww-rise { animation: none !important; opacity: 1 !important; transform: none !important; } }
        `}</style>
      </PageContainer>
    </>
  )
}

/* ── Paso del flujo ────────────────────────────────────────────────────── */
function Step({
  n, title, actor, icon: Icon, desc, mock, foot, success, compact,
}: {
  n: number
  title: string
  actor: Actor
  icon?: LucideIcon
  desc?: string
  mock?: React.ReactNode
  foot?: string
  success?: boolean
  compact?: boolean
}) {
  const a = ACTOR[actor]
  return (
    <div
      className={cn(
        "flex w-full shrink-0 flex-col rounded-lg border p-3 md:w-[224px]",
        success ? "border-primary/55 bg-primary/10" : "border-border bg-card",
        compact ? "" : "md:self-stretch",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold tabular-nums text-foreground">
            {n}
          </span>
          <h3 className="min-w-0 text-[15px] font-semibold leading-tight text-foreground md:text-sm">{title}</h3>
        </div>
        {success && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-primary px-1.5 py-0.5 text-sm font-bold text-primary-foreground md:text-[13px]">
            <Check className="h-3 w-3" /> Éxito
          </span>
        )}
      </div>

      {mock}
      {desc && <p className="text-sm leading-snug text-muted-foreground">{desc}</p>}

      <div className="mt-2 flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", a.punto)} />
        <span className="text-sm font-medium text-muted-foreground md:text-[13px]">{a.label}</span>
      </div>

      {foot && (
        <p
          className={cn(
            "mt-2 border-t pt-2 text-sm leading-snug md:text-[13px]",
            success ? "border-primary/25 text-primary" : "border-border text-muted-foreground",
          )}
        >
          {foot}
        </p>
      )}
    </div>
  )
}

/* ── Conector (flecha + etiqueta). Abajo en móvil, a la derecha en escritorio ── */
function Connector({ label, green }: { label?: string; green?: boolean }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-1 py-2 md:w-[92px] md:py-0">
      {label && (
        <span className="rounded-sm border border-border bg-card px-2 py-0.5 text-center text-sm font-medium leading-tight text-muted-foreground md:max-w-[88px] md:text-[13px]">
          {label}
        </span>
      )}
      <ChevronRight
        className={cn("h-5 w-5 rotate-90 md:rotate-0", green ? "text-primary" : "text-muted-foreground")}
        strokeWidth={2.5}
      />
    </div>
  )
}

/* ── Mock-ups de pantalla ──────────────────────────────────────────────── */

function MockLanding() {
  return (
    <div className="mb-2 rounded-lg border border-border bg-background p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold tracking-[0.1em] text-foreground md:text-[13px]">CAPITAL HUB</span>
        <span className="h-1 w-1 rounded-full bg-primary" />
      </div>
      <p className="mt-2 text-center text-sm font-semibold leading-tight text-foreground md:text-[13px]">
        Dejé mi trabajo y gané <span className="text-primary">4.000 €</span>
      </p>
      <div className="mt-2 flex aspect-[16/9] items-center justify-center rounded-lg border border-border bg-card">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
          <Play className="ml-0.5 h-3.5 w-3.5 text-primary" fill="currentColor" />
        </span>
      </div>
      <div className="mt-2 rounded-lg bg-primary py-1.5 text-center text-sm font-semibold text-primary-foreground md:text-[13px]">
        Reservar mi plaza
      </div>
    </div>
  )
}

function MockGracias() {
  return (
    <div className="mb-2 rounded-lg border border-border bg-background p-2.5 text-center">
      <span className="inline-flex items-center gap-1 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-sm font-medium text-primary md:text-[13px]">
        <BadgeCheck className="h-3 w-3" /> Plaza confirmada
      </span>
      <p className="mt-2 text-sm font-semibold leading-tight text-foreground md:text-[13px]">
        Último paso: escríbeme por WhatsApp
      </p>
      <div className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-sm font-semibold text-primary-foreground md:text-[13px]">
        <WhatsappGlyph className="h-3 w-3" /> Conseguir mi entrada
      </div>
    </div>
  )
}

function MockEmail({ withWhatsapp }: { withWhatsapp: boolean }) {
  return (
    // Un correo se ve sobre superficie clara con tinta oscura: por eso el mock invierte
    // el par de tokens (fondo `foreground`, texto `background`) en vez de escribir blanco.
    <div className="mb-2 overflow-hidden rounded-lg border border-border bg-foreground">
      <div className="border-b border-background/10 px-2.5 py-1.5">
        <span className="text-sm font-bold tracking-[0.1em] text-background md:text-[13px]">CAPITAL HUB</span>
      </div>
      <div className="p-2.5">
        <p className="text-sm font-bold leading-tight text-background md:text-[13px]">Tu plaza está reservada</p>
        <div className="mt-1.5 space-y-1">
          <span className="block h-1 w-full rounded-sm bg-background/10" />
          <span className="block h-1 w-4/5 rounded-sm bg-background/10" />
        </div>
        {withWhatsapp && (
          <div className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-sm font-semibold text-primary-foreground md:text-[13px]">
            <WhatsappGlyph className="h-3 w-3" /> Conseguir mi entrada por WhatsApp
          </div>
        )}
      </div>
    </div>
  )
}

function MockWhatsapp({ message }: { message: string }) {
  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-1.5 bg-secondary px-2.5 py-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <WhatsappGlyph className="h-3 w-3 text-primary-foreground" />
        </span>
        <span className="text-sm font-medium text-foreground md:text-[13px]">Adrián · Capital Hub</span>
      </div>
      <div className="flex min-h-[64px] justify-end bg-background p-2">
        <div className="max-w-[88%] rounded-lg rounded-tr-sm bg-primary px-2 py-1.5 text-sm leading-snug text-primary-foreground md:text-[13px]">
          {message}
          <span className="mt-0.5 block text-right text-sm text-primary-foreground md:text-[13px]">enviado</span>
        </div>
      </div>
    </div>
  )
}
