"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { SISTEMAS, STATUS_META, type SistemaCard } from "../lib/systems"

/**
 * Hub "Sistema visual". Sección propia (fuera de Webs).
 *
 * Portada de todos los sistemas / estrategias / workflows que montamos. Cada tarjeta
 * abre su vista visual por dentro (/sistemas/<slug>). Pensado para crecer: cada cosa
 * nueva que creemos entra aquí como una tarjeta más.
 */
export function SistemasHub() {
  return (
    <>
      <ShellHeader title="Sistema visual" />
      <PageContainer>
        <div className="sv-wrap relative">
          {/* Glow de marca de fondo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-10 h-64"
            style={{ background: "radial-gradient(600px 220px at 50% 0%, rgba(34,197,94,0.10), transparent 70%)" }}
          />

          {/* Encabezado */}
          <header className="sv-rise relative mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
              <span className="sv-dot" /> Centro de sistemas
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
              Sistema visual
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Cada sistema, estrategia y workflow que montamos, explicado paso a paso. Clica uno
              para verlo por dentro.
            </p>
          </header>

          {/* Rejilla de sistemas */}
          <div className="relative mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SISTEMAS.map((s, i) => (
              <SistemaTile key={s.slug} sistema={s} index={i} />
            ))}
          </div>
        </div>

        <style>{`
          .sv-rise { opacity: 0; transform: translateY(14px); animation: sv-rise .6s cubic-bezier(.22,.61,.36,1) forwards; }
          .sv-tile { opacity: 0; transform: translateY(18px); animation: sv-rise .6s cubic-bezier(.22,.61,.36,1) forwards; }
          @keyframes sv-rise { to { opacity: 1; transform: translateY(0); } }
          .sv-dot { width: 7px; height: 7px; border-radius: 9999px; background: #22C55E; box-shadow: 0 0 0 0 rgba(34,197,94,.55); animation: sv-pulse 2.4s ease-out infinite; }
          @keyframes sv-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 70%{box-shadow:0 0 0 7px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
          .sv-tile { transition: transform .25s cubic-bezier(.22,.61,.36,1), border-color .25s ease, box-shadow .25s ease; }
          .sv-tile:hover { transform: translateY(-3px); }
          .sv-arrow { transition: transform .25s ease; }
          .sv-tile:hover .sv-arrow { transform: translateX(3px); }
          @media (prefers-reduced-motion: reduce) {
            .sv-rise, .sv-tile { animation: none !important; opacity: 1 !important; transform: none !important; }
            .sv-dot { animation: none !important; }
          }
        `}</style>
      </PageContainer>
    </>
  )
}

function SistemaTile({ sistema, index }: { sistema: SistemaCard; index: number }) {
  const Icon = sistema.icon
  const isActive = sistema.status === "activo"
  return (
    <Link
      href={`/sistemas/${sistema.slug}`}
      className="sv-tile group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 hover:border-[color:var(--sv-accent)]"
      style={{
        // @ts-expect-error CSS var
        "--sv-accent": sistema.accent,
        animationDelay: `${index * 90}ms`,
        boxShadow: isActive ? "0 0 0 1px rgba(34,197,94,0.14)" : undefined,
      }}
    >
      {/* Glow de acento en la esquina */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-60 blur-2xl transition-opacity group-hover:opacity-90"
        style={{ background: `radial-gradient(circle, ${sistema.accent}22, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-lg border"
          style={{ borderColor: `${sistema.accent}55`, background: `${sistema.accent}12` }}
        >
          <Icon className="h-5 w-5" style={{ color: sistema.accent }} />
        </div>
        <StatusPill status={sistema.status} accent={sistema.accent} />
      </div>

      <h2 className="relative mt-4 text-base font-semibold text-foreground md:text-lg">{sistema.title}</h2>
      <p className="relative mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{sistema.tagline}</p>

      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">{sistema.meta}</span>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: sistema.accent }}>
          Ver el sistema
          <ArrowRight className="sv-arrow h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}

function StatusPill({ status, accent }: { status: SistemaCard["status"]; accent: string }) {
  const label = STATUS_META[status].label
  if (status === "activo") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
        style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}44` }}
      >
        <span className="sv-dot" /> {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      {label}
    </span>
  )
}
