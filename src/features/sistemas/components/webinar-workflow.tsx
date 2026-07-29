"use client"

import Link from "next/link"
import {
  ArrowLeft, Megaphone, MousePointerClick, Mail, PartyPopper,
  MessageCircle, MessagesSquare, Radio, Check, type LucideIcon,
} from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"

/**
 * Workflow visual del Funnel Webinar (paso a paso). Vive en /sistemas/webinar-08.
 *
 * Muestra CADA punto de lo que sucede y quién lo hace (sistema automático vs. equipo).
 * El tag y la fecha llegan por props desde el server (getWebinarSettings), así lo que se
 * ve aquí SIEMPRE coincide con lo que pasa de verdad (misma fecha, mismo tag).
 */

type Actor = "sistema" | "equipo" | "adrian"

type Auto = { label: string }

interface Step {
  n: number
  icon: LucideIcon
  title: string
  desc: string
  actor: Actor
  autos?: Auto[]
  success?: boolean
}

const ACTOR_META: Record<Actor, { label: string; dot: string; text: string; border: string; bg: string }> = {
  sistema: { label: "Sistema · automático", dot: "#22C55E", text: "text-[#4ADE80]", border: "border-[#22C55E]/40", bg: "bg-[#22C55E]/10" },
  equipo: { label: "Equipo", dot: "#9CA3AF", text: "text-muted-foreground", border: "border-border", bg: "bg-secondary/50" },
  adrian: { label: "Adrián · en directo", dot: "#F5F6F7", text: "text-foreground", border: "border-foreground/30", bg: "bg-foreground/5" },
}

export function WebinarWorkflow({
  dateLabel,
  tagName,
}: {
  dateLabel: string
  tagName: string
}) {
  const steps: Step[] = [
    {
      n: 1,
      icon: Megaphone,
      title: "Tráfico al evento",
      desc: "Se envía tráfico (anuncios, historias, bio) a la landing del webinar.",
      actor: "equipo",
    },
    {
      n: 2,
      icon: MousePointerClick,
      title: "Reserva su plaza en la landing",
      desc: "La persona ve el titular, la mini-VSL y deja sus datos (nombre, email y teléfono) para acceder al directo.",
      actor: "sistema",
      autos: [{ label: "Se crea su contacto en el CRM" }, { label: "Entra en el pipeline del webinar" }],
    },
    {
      n: 3,
      icon: Mail,
      title: "Correo de confirmación",
      desc: "Al instante recibe un correo confirmando su plaza. Puedes incluir o no el botón de WhatsApp desde los ajustes del funnel.",
      actor: "sistema",
      autos: [{ label: "Correo automático" }],
    },
    {
      n: 4,
      icon: PartyPopper,
      title: "Página de gracias",
      desc: "Cae en la página de gracias: «Último paso: escríbenos por WhatsApp para conseguir tu entrada».",
      actor: "sistema",
    },
    {
      n: 5,
      icon: MessageCircle,
      title: "Escribe por WhatsApp",
      desc: "Se abre WhatsApp con el mensaje ya escrito. Cuando lo envía, aquí termina nuestro trabajo: el funnel se considera cumplido.",
      actor: "sistema",
      success: true,
      autos: [{ label: `Se le pone el tag ${tagName}` }, { label: "Queda registrado en su historial" }],
    },
    {
      n: 6,
      icon: MessagesSquare,
      title: "Se nutre en el chat",
      desc: "El equipo conversa y nutre a la persona dentro del chat.",
      actor: "equipo",
    },
    {
      n: 7,
      icon: Radio,
      title: `Webinar en directo · ${dateLabel}`,
      desc: "La persona asiste al directo.",
      actor: "adrian",
    },
  ]

  return (
    <>
      <ShellHeader title="Sistema visual" />
      <PageContainer narrow>
        {/* Volver al hub */}
        <Link
          href="/sistemas"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Sistema visual
        </Link>

        {/* Encabezado */}
        <header className="ww-rise relative mt-4 overflow-hidden rounded-xl border border-border bg-card p-5 md:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-70 blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(34,197,94,0.18), transparent 70%)" }}
          />
          <span className="relative inline-flex items-center gap-2 rounded-full border border-[#22C55E]/40 bg-[#22C55E]/10 px-3 py-1 text-[11px] font-medium text-[#4ADE80]">
            <span className="ww-dot" /> Activo ahora
          </span>
          <h1 className="relative mt-3 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Funnel Webinar · {dateLabel}
          </h1>
          <p className="relative mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            De traer a la persona desde el anuncio hasta que escribe por WhatsApp. Ese envío es el
            punto de éxito; a partir de ahí se nutre a la persona dentro del chat.
          </p>

          {/* Leyenda de quién hace qué */}
          <div className="relative mt-4 flex flex-wrap gap-2">
            {(["sistema", "equipo", "adrian"] as Actor[]).map((a) => (
              <span
                key={a}
                className={`inline-flex items-center gap-1.5 rounded-full border ${ACTOR_META[a].border} ${ACTOR_META[a].bg} px-2.5 py-1 text-[11px] font-medium ${ACTOR_META[a].text}`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACTOR_META[a].dot }} />
                {ACTOR_META[a].label}
              </span>
            ))}
          </div>
        </header>

        {/* Rail de pasos */}
        <div className="relative mt-6">
          <div className="space-y-3">
            {steps.map((s, i) => (
              <StepNode key={s.n} step={s} last={i === steps.length - 1} index={i} />
            ))}
          </div>
        </div>

        <style>{`
          .ww-rise { opacity: 0; transform: translateY(16px); animation: ww-rise .6s cubic-bezier(.22,.61,.36,1) forwards; }
          @keyframes ww-rise { to { opacity: 1; transform: translateY(0); } }
          .ww-dot { width: 7px; height: 7px; border-radius: 9999px; background: #22C55E; box-shadow: 0 0 0 0 rgba(34,197,94,.55); animation: ww-pulse 2.4s ease-out infinite; }
          @keyframes ww-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 70%{box-shadow:0 0 0 7px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
          @media (prefers-reduced-motion: reduce) {
            .ww-rise { animation: none !important; opacity: 1 !important; transform: none !important; }
            .ww-dot { animation: none !important; }
          }
        `}</style>
      </PageContainer>
    </>
  )
}

function StepNode({ step, last, index }: { step: Step; last: boolean; index: number }) {
  const Icon = step.icon
  const meta = ACTOR_META[step.actor]
  const success = step.success
  return (
    <div className="ww-rise relative flex gap-3 md:gap-4" style={{ animationDelay: `${index * 70}ms` }}>
      {/* Columna del rail: número + línea */}
      <div className="relative flex flex-col items-center">
        <div
          className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold ${
            success ? "border-[#22C55E] bg-[#22C55E] text-[#08130C]" : "border-border bg-card text-foreground"
          }`}
        >
          {step.n}
        </div>
        {!last && <div className="w-px flex-1 bg-border" style={{ minHeight: 18 }} />}
      </div>

      {/* Tarjeta del paso */}
      <div
        className={`mb-1 flex-1 rounded-xl border p-4 ${
          success ? "border-[#22C55E]/50 bg-[#22C55E]/[0.06]" : "border-border bg-card"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${meta.border} ${meta.bg}`}>
              <Icon className="h-4 w-4" style={{ color: meta.dot }} />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground">{step.title}</h3>
          </div>
          {success && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#22C55E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#08130C]">
              <Check className="h-3 w-3" /> Éxito
            </span>
          )}
        </div>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>

        {/* Quién lo hace */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border ${meta.border} ${meta.bg} px-2.5 py-0.5 text-[11px] font-medium ${meta.text}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
            {meta.label}
          </span>
        </div>

        {/* Cosas automáticas que se disparan */}
        {step.autos && step.autos.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
            {step.autos.map((a) => (
              <li key={a.label} className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E]" />
                <span className={a.label.startsWith("Se le pone el tag") ? "font-mono text-[12px] text-foreground" : ""}>{a.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
