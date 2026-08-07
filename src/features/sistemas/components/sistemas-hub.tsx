"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { cn } from "@/lib/utils"
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
      <PageContainer>
        <div className="sv-wrap relative">
          {/* Encabezado */}
          <header className="sv-rise relative mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground">
              <PuntoVivo /> Centro de sistemas
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
              Sistema visual
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
              Cada sistema, estrategia y workflow que montamos, explicado paso a paso. Clica uno
              para verlo por dentro.
            </p>
          </header>

          {/* Rejilla de sistemas — una columna en telefono */}
          <div className="relative mt-8 grid grid-cols-1 gap-4 md:mt-9 md:grid-cols-2">
            {SISTEMAS.map((s, i) => (
              <SistemaTile key={s.slug} sistema={s} index={i} />
            ))}
          </div>
        </div>

        {/* Solo movimiento: ni un color escrito aqui. El color vive en los tokens. */}
        <style>{`
          .sv-rise { opacity: 0; transform: translateY(14px); animation: sv-rise .6s cubic-bezier(.22,.61,.36,1) forwards; }
          .sv-tile { opacity: 0; transform: translateY(18px); animation: sv-rise .6s cubic-bezier(.22,.61,.36,1) forwards; }
          @keyframes sv-rise { to { opacity: 1; transform: translateY(0); } }
          .sv-tile { transition: transform .25s cubic-bezier(.22,.61,.36,1), border-color .25s ease; }
          @media (hover: hover) {
            .sv-tile:hover { transform: translateY(-3px); }
            .sv-tile:hover .sv-arrow { transform: translateX(3px); }
          }
          .sv-arrow { transition: transform .25s ease; }
          @media (prefers-reduced-motion: reduce) {
            .sv-rise, .sv-tile { animation: none !important; opacity: 1 !important; transform: none !important; }
          }
        `}</style>
      </PageContainer>
    </>
  )
}

/** El punto verde que late. Todo con clases del tema, sin CSS a mano. */
function PuntoVivo() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
    </span>
  )
}

function SistemaTile({ sistema, index }: { sistema: SistemaCard; index: number }) {
  const Icon = sistema.icon
  const isActive = sistema.status === "activo"
  return (
    <Link
      href={`/sistemas/${sistema.slug}`}
      className={cn(
        "sv-tile group relative flex flex-col overflow-hidden rounded-lg border bg-card p-4 md:p-5",
        isActive ? "border-primary/30" : "border-border",
        "md:hover:border-primary/60",
      )}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <StatusPill status={sistema.status} />
      </div>

      <h2 className="relative mt-4 text-base font-semibold text-foreground md:text-lg">{sistema.title}</h2>
      <p className="relative mt-1 flex-1 text-[15px] leading-relaxed text-muted-foreground">{sistema.tagline}</p>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 text-sm font-medium text-muted-foreground">{sistema.meta}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary">
          Ver el sistema
          <ArrowRight className="sv-arrow h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}

function StatusPill({ status }: { status: SistemaCard["status"] }) {
  const label = STATUS_META[status].label
  if (status === "activo") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-primary/40 bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
        <PuntoVivo /> {label}
      </span>
    )
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border bg-secondary px-2.5 py-1 text-sm font-medium text-muted-foreground">
      {label}
    </span>
  )
}
