"use client"

import Link from "next/link"
import { Camera, MessageSquare, Calendar, Video, ShoppingBag, Mail, GraduationCap, Users, FileText, ArrowRight } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { cn } from "@/lib/utils"

/**
 * Sistema end-to-end · vista visual estilo Miro.
 * Cada step linkea a la sección del OS que lo gestiona.
 */

type StepStatus = "live" | "wip" | "todo"

type Step = {
  id: string
  title: string
  subtitle: string
  icon: typeof Camera
  status: StepStatus
  href?: string
  description: string
}

const STEPS: Step[] = [
  {
    id: "reel",
    title: "Reels + Follow Me Ads",
    subtitle: "Adrián publica · Meta amplifica",
    icon: Camera,
    status: "wip",
    description: "Adrián publica reels en su IG. Marco activa follow-me ads para amplificar el alcance al avatar Andrés v3.",
  },
  {
    id: "outreach",
    title: "Outreach IG",
    subtitle: "Closer junior escribe DMs",
    icon: MessageSquare,
    status: "live",
    href: "/outreach-ig",
    description: "El setter abre su bandeja y va contactando seguidores nuevos. Estados: por contactar → DM enviado → respondió → teléfono obtenido → handoff a Adrián.",
  },
  {
    id: "agenda",
    title: "Agenda pública /agenda",
    subtitle: "Lead reserva slot",
    icon: Calendar,
    status: "live",
    href: "/agenda",
    description: "Lead caliente entra a la página pública, ve disponibilidad de Adrián, rellena nombre/email/teléfono y reserva. Sistema crea contacto + envía email + .ics + crea evento en Google Calendar de Adrián.",
  },
  {
    id: "call",
    title: "Llamada Zoom",
    subtitle: "Adrián / Nagai cierra",
    icon: Video,
    status: "wip",
    description: "Adrián tiene el evento en su Calendar con los datos del lead. Cierra (o no) durante la videollamada.",
  },
  {
    id: "venta",
    title: "Registrar venta",
    subtitle: "Widget flotante en todo el OS",
    icon: ShoppingBag,
    status: "live",
    href: "/contactos",
    description: "Tras cerrar, el closer abre el widget flotante verde de cualquier página. Rellena: tipo cierre, lead, producto, revenue, cash collected, método pago, notas. Submit dispara 4 cosas en cadena.",
  },
  {
    id: "email-alumno",
    title: "Email magic link al alumno",
    subtitle: "Resend + token BYOE",
    icon: Mail,
    status: "live",
    href: "/email-marketing",
    description: "El sistema genera un token único + manda email Resend brandeado al alumno con link app.capitalhubapp.com/accept-invite/<token>. NO usa los emails de Supabase (BYOE pattern), permite escalar sin límite.",
  },
  {
    id: "app-onboarding",
    title: "Alumno entra a la App",
    subtitle: "Configura password + onboarding",
    icon: GraduationCap,
    status: "wip",
    description: "El alumno clica el link → AcceptInvitePage le pide configurar password → auto-login en la App → pantalla onboarding (foto, nombre, profesión, bio). Termina en /home con catálogo de formación.",
  },
  {
    id: "catalogo",
    title: "Catálogo + lecciones",
    subtitle: "Solo su formación, bloqueo progresivo",
    icon: FileText,
    status: "wip",
    description: "Catálogo muestra solo la formación comprada (las otras bloqueadas). Cada formación tiene módulos con lecciones. Lección N+1 se desbloquea al marcar N como completada.",
  },
  {
    id: "comunidad",
    title: "Comunidad estilo Skool",
    subtitle: "Feed + chats privados",
    icon: Users,
    status: "wip",
    description: "Feed donde alumnos postean (título + descripción + adjunto). Categorías: wins / soporte / general. Comunidades separadas por producto. Chats privados 1-a-1 entre alumnos.",
  },
]

const STATUS_META: Record<StepStatus, { label: string; cls: string; bg: string }> = {
  live: { label: "✓ Live", cls: "border-green-500/50 text-green-400", bg: "bg-green-500/[0.04]" },
  wip: { label: "⚙ En construcción", cls: "border-amber-500/50 text-amber-400", bg: "bg-amber-500/[0.04]" },
  todo: { label: "○ Por hacer", cls: "border-border/40 text-muted-foreground", bg: "bg-card/30" },
}

export function SistemaPage() {
  return (
    <>
      <ShellHeader title="Sistema end-to-end" />

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 border border-border/40 px-3 py-1 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Foco: Webinar 8/8/2026
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold">Flujo del negocio · Captación → Cierre → Alumno</h1>
          <p className="text-sm text-muted-foreground">
            Cada bloque es una pieza del sistema. Click para ir a la sección del OS que lo gestiona. Los estados Live ya funcionan, los WIP están en construcción.
          </p>
        </div>

        {/* Status legend */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {(Object.entries(STATUS_META) as [StepStatus, typeof STATUS_META.live][]).map(([k, m]) => (
            <span key={k} className={cn("inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider border px-2 py-1 rounded-sm", m.cls, m.bg)}>
              {m.label}
            </span>
          ))}
        </div>

        {/* Phase 1: Captación */}
        <PhaseHeader number={1} title="CAPTACIÓN" color="blue" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StepCard step={STEPS[0]} />
          <StepCard step={STEPS[1]} />
        </div>
        <Arrow />

        {/* Phase 2: Cierre */}
        <PhaseHeader number={2} title="CIERRE" color="amber" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StepCard step={STEPS[2]} />
          <StepCard step={STEPS[3]} />
          <StepCard step={STEPS[4]} />
        </div>
        <Arrow />

        {/* Phase 3: Alumno */}
        <PhaseHeader number={3} title="ALUMNO" color="green" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StepCard step={STEPS[5]} />
          <StepCard step={STEPS[6]} />
        </div>
        <Arrow />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StepCard step={STEPS[7]} />
          <StepCard step={STEPS[8]} />
        </div>

        {/* Cierre */}
        <section className="mt-8 rounded-md border border-border/40 bg-gradient-to-br from-amber-500/[0.04] to-red-500/[0.04] p-6 text-center">
          <h2 className="text-lg font-semibold mb-1">Día D · 8 de agosto 2026</h2>
          <p className="text-sm text-muted-foreground">
            Webinar en directo. El sistema completo ejecuta una compra real cada vez que alguien atraviese este flujo.
          </p>
        </section>
      </div>
    </>
  )
}

function PhaseHeader({ number, title, color }: { number: number; title: string; color: "blue" | "amber" | "green" }) {
  const colors = {
    blue: "border-blue-500/40 text-blue-400 bg-blue-500/[0.04]",
    amber: "border-amber-500/40 text-amber-400 bg-amber-500/[0.04]",
    green: "border-green-500/40 text-green-400 bg-green-500/[0.04]",
  }[color]
  return (
    <div className={cn("flex items-center gap-3 rounded-md border px-4 py-2", colors)}>
      <span className="font-mono text-2xl font-bold opacity-50">{String(number).padStart(2, "0")}</span>
      <span className="font-mono uppercase tracking-widest text-sm">{title}</span>
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center text-muted-foreground/40">
        <ArrowRight className="h-5 w-5 rotate-90" />
      </div>
    </div>
  )
}

function StepCard({ step }: { step: Step }) {
  const meta = STATUS_META[step.status]
  const Icon = step.icon
  const content = (
    <>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="h-9 w-9 rounded-md bg-card/60 border border-border/40 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <span className={cn("text-[9px] font-mono uppercase tracking-wider border px-1.5 py-0.5 rounded-sm shrink-0", meta.cls)}>
          {meta.label}
        </span>
      </div>
      <h3 className="text-sm font-semibold mb-0.5">{step.title}</h3>
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">{step.subtitle}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
      {step.href && (
        <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-foreground/70 hover:text-foreground">
          Ir a la sección <ArrowRight className="h-2.5 w-2.5" />
        </div>
      )}
    </>
  )
  const className = cn(
    "rounded-md border p-4 transition-all",
    step.status === "live" && "border-green-500/30 hover:border-green-500/60",
    step.status === "wip" && "border-amber-500/30 hover:border-amber-500/60",
    step.status === "todo" && "border-border/40 hover:border-border",
    meta.bg,
    step.href && "cursor-pointer"
  )
  return step.href ? (
    <Link href={step.href} className={className}>{content}</Link>
  ) : (
    <div className={className}>{content}</div>
  )
}
