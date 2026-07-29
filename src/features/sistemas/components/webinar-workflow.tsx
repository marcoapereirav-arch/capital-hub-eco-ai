"use client"

import Link from "next/link"
import {
  ArrowLeft, ChevronRight, Megaphone, MessagesSquare, Radio, Play, BadgeCheck,
  Check, type LucideIcon,
} from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"

/**
 * Board visual del Funnel del Webinar (/sistemas/webinar).
 *
 * No son cuadritos de texto: cada paso lleva un MOCK-UP de la pantalla real (la landing,
 * la página de gracias, el correo, el WhatsApp) para ver exactamente cómo es y cómo se
 * envía. Flujo ordenado, sin solapes: en móvil va en vertical, en escritorio en horizontal.
 * La fecha, el tag y los ajustes llegan por props desde el server (getWebinarSettings), así
 * lo que se ve coincide con lo que pasa de verdad. Colores del brandkit (verde #22C55E);
 * el mock de WhatsApp usa los colores propios de WhatsApp solo para que se reconozca.
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
const ACTOR: Record<Actor, { label: string; dot: string }> = {
  sistema: { label: "Sistema · automático", dot: "#22C55E" },
  equipo: { label: "Equipo", dot: "#9CA3AF" },
  adrian: { label: "Adrián", dot: "#F5F6F7" },
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
      <ShellHeader title="Sistema visual" />
      <PageContainer wide>
        {/* Volver */}
        <Link
          href="/sistemas"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9CA3AF] transition-colors hover:text-[#F5F6F7]"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a Sistema visual
        </Link>

        {/* Encabezado */}
        <header className="ww-rise relative mt-4 overflow-hidden rounded-2xl border border-[#2A2D34] bg-[#141418] p-5 md:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-70 blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(34,197,94,0.18), transparent 70%)" }}
          />
          <span className="relative inline-flex items-center gap-2 rounded-full border border-[#22C55E]/40 bg-[#22C55E]/10 px-3 py-1 text-[11px] font-medium text-[#4ADE80]">
            <span className="ww-dot" /> Activo ahora
          </span>
          <h1 className="relative mt-3 text-xl font-semibold tracking-tight text-[#F5F6F7] md:text-2xl" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            Funnel del Webinar
          </h1>
          <p className="relative mt-1.5 max-w-2xl text-sm leading-relaxed text-[#9CA3AF]">
            Así se ve la película completa: del anuncio hasta que la persona te escribe por WhatsApp.
            Ese mensaje es el punto de éxito; a partir de ahí se le nutre dentro del chat.
          </p>
          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            {(["sistema", "equipo", "adrian"] as Actor[]).map((a) => (
              <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2D34] bg-[#0F0F12] px-2.5 py-1 text-[11px] font-medium text-[#C7CBD1]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACTOR[a].dot }} />
                {ACTOR[a].label}
              </span>
            ))}
          </div>
        </header>

        {/* Flujo: vertical en móvil, horizontal en escritorio. Cada paso lleva su mock-up. */}
        <div className="ww-rise relative mt-4 overflow-x-auto rounded-2xl border border-[#2A2D34] bg-[#0F0F12] p-4 md:p-6" style={{ animationDelay: "80ms" }}>
          <div className="flex flex-col items-stretch gap-0 md:flex-row md:items-center">

            <Step n={1} title="Tráfico" actor="equipo" icon={Megaphone}
              desc="Anuncios, historias y bio llevan a la landing." />

            <Connector />

            <Step n={2} title="Landing · /webinar" actor="sistema" mock={<MockLanding />}
              foot="Al enviar el formulario se crea el contacto en el CRM y entra al pipeline del webinar." />

            <Connector label="al dejar sus datos" />

            {/* Lo que recibe al instante: dos cosas a la vez */}
            <div className="flex shrink-0 flex-col">
              <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">Al instante recibe</p>
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

        <style>{`
          .ww-rise { opacity: 0; transform: translateY(14px); animation: ww-rise .6s cubic-bezier(.22,.61,.36,1) forwards; }
          @keyframes ww-rise { to { opacity: 1; transform: translateY(0); } }
          .ww-dot { width: 7px; height: 7px; border-radius: 9999px; background: #22C55E; box-shadow: 0 0 0 0 rgba(34,197,94,.55); animation: ww-pulse 2.4s ease-out infinite; }
          @keyframes ww-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 70%{box-shadow:0 0 0 8px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
          @media (prefers-reduced-motion: reduce) { .ww-rise { animation: none !important; opacity: 1 !important; transform: none !important; } .ww-dot { animation: none !important; } }
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
      className={`flex shrink-0 flex-col rounded-xl border p-3 ${
        success ? "border-[#22C55E]/55 bg-[#22C55E]/[0.06]" : "border-[#2A2D34] bg-[#141418]"
      } w-full md:w-[224px] ${compact ? "" : "md:self-stretch"}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#2A2D34] bg-[#0F0F12] text-[11px] font-semibold text-[#F5F6F7]">{n}</span>
          <h3 className="text-[12px] font-semibold leading-tight text-[#F5F6F7]">{title}</h3>
        </div>
        {success && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#22C55E] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#08130C]">
            <Check className="h-2.5 w-2.5" /> Éxito
          </span>
        )}
      </div>

      {mock}
      {desc && <p className="text-[12px] leading-snug text-[#9CA3AF]">{desc}</p>}

      <div className="mt-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.dot }} />
        <span className="text-[10.5px] font-medium text-[#7B818C]">{a.label}</span>
      </div>

      {foot && (
        <p className={`mt-2 border-t pt-2 text-[10.5px] leading-snug ${success ? "border-[#22C55E]/25 text-[#8fe6ab]" : "border-[#2A2D34] text-[#7B818C]"}`}>
          {foot}
        </p>
      )}
    </div>
  )
}

/* ── Conector (flecha + etiqueta). Abajo en móvil, a la derecha en escritorio ── */
function Connector({ label, green }: { label?: string; green?: boolean }) {
  const color = green ? "#22C55E" : "#4B5563"
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-1 py-2 md:w-[92px] md:py-0">
      {label && (
        <span className="max-w-[88px] rounded-full border border-[#2A2D34] bg-[#141418] px-2 py-0.5 text-center text-[10px] font-medium leading-tight text-[#9CA3AF]">
          {label}
        </span>
      )}
      <ChevronRight className="h-5 w-5 rotate-90 md:rotate-0" style={{ color }} strokeWidth={2.5} />
    </div>
  )
}

/* ── Mock-ups de pantalla ──────────────────────────────────────────────── */

function MockLanding() {
  return (
    <div className="mb-2 rounded-lg border border-[#2A2D34] bg-[#0F0F12] p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[6.5px] font-bold tracking-[0.1em] text-[#F5F6F7]">CAPITAL HUB</span>
        <span className="h-1 w-1 rounded-full bg-[#22C55E]" />
      </div>
      <p className="mt-2 text-center text-[8.5px] font-semibold leading-tight text-white" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
        Dejé mi trabajo y gané <span className="text-[#4ADE80]">4.000 €</span>
      </p>
      <div className="mt-2 flex aspect-[16/9] items-center justify-center rounded-md border border-[#2A2D34] bg-[#141418]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22C55E]/15">
          <Play className="ml-0.5 h-3 w-3 text-[#22C55E]" fill="currentColor" />
        </span>
      </div>
      <div className="mt-2 rounded-md bg-white py-1 text-center text-[7.5px] font-semibold text-[#0F0F12]">Reservar mi plaza</div>
    </div>
  )
}

function MockGracias() {
  return (
    <div className="mb-2 rounded-lg border border-[#2A2D34] bg-[#0F0F12] p-2.5 text-center">
      <span className="inline-flex items-center gap-1 rounded-full border border-[#22C55E]/40 bg-[#22C55E]/10 px-1.5 py-0.5 text-[6.5px] font-medium text-[#4ADE80]">
        <BadgeCheck className="h-2 w-2" /> Plaza confirmada
      </span>
      <p className="mt-2 text-[8.5px] font-semibold leading-tight text-white" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
        Último paso: escríbeme por WhatsApp
      </p>
      <div className="mt-2 flex items-center justify-center gap-1 rounded-md bg-[#22C55E] py-1.5 text-[7.5px] font-semibold text-[#08130C]">
        <WhatsappGlyph className="h-2.5 w-2.5" /> Conseguir mi entrada
      </div>
    </div>
  )
}

function MockEmail({ withWhatsapp }: { withWhatsapp: boolean }) {
  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-[#2A2D34] bg-white">
      <div className="border-b border-black/10 px-2.5 py-1.5">
        <span className="text-[6.5px] font-bold tracking-[0.1em] text-[#0F0F12]">CAPITAL HUB</span>
      </div>
      <div className="p-2.5">
        <p className="text-[8.5px] font-bold leading-tight text-[#0F0F12]">Tu plaza está reservada</p>
        <div className="mt-1.5 space-y-1">
          <span className="block h-1 w-full rounded bg-black/10" />
          <span className="block h-1 w-4/5 rounded bg-black/10" />
        </div>
        {withWhatsapp && (
          <div className="mt-2 flex items-center justify-center gap-1 rounded-md bg-[#22C55E] py-1.5 text-[7px] font-semibold text-[#08130C]">
            <WhatsappGlyph className="h-2.5 w-2.5" /> Conseguir mi entrada por WhatsApp
          </div>
        )}
      </div>
    </div>
  )
}

function MockWhatsapp({ message }: { message: string }) {
  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-[#2A2D34]">
      <div className="flex items-center gap-1.5 bg-[#202c33] px-2.5 py-1.5">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#22C55E]">
          <WhatsappGlyph className="h-2.5 w-2.5 text-white" />
        </span>
        <span className="text-[8px] font-medium text-white">Adrián · Capital Hub</span>
      </div>
      <div className="flex min-h-[64px] justify-end bg-[#0b141a] p-2">
        <div className="max-w-[88%] rounded-lg rounded-tr-sm bg-[#005c4b] px-2 py-1.5 text-[8px] leading-snug text-white">
          {message}
          <span className="mt-0.5 block text-right text-[7px] text-white/60">enviado</span>
        </div>
      </div>
    </div>
  )
}
