"use client"

import Link from "next/link"
import {
  ArrowLeft, Megaphone, MonitorPlay, PartyPopper, Mail, MessageCircle,
  MessagesSquare, Radio, Check, MousePointer2, type LucideIcon,
} from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"

/**
 * Board visual (estilo Miro) del Funnel del Webinar. Vive en /sistemas/webinar.
 *
 * Cajas conectadas con flechas que muestran, al detalle, qué pasa en la landing, a dónde
 * va, cómo se conecta con el correo, y el camino hasta el WhatsApp (punto de éxito) y el
 * directo. La fecha, el tag y los ajustes llegan por props desde el server
 * (getWebinarSettings) → lo que se ve coincide siempre con lo que pasa de verdad.
 */

type Actor = "sistema" | "equipo" | "adrian"

const ACTOR: Record<Actor, { label: string; dot: string; chipText: string; chipBorder: string; chipBg: string }> = {
  sistema: { label: "Sistema · automático", dot: "#22C55E", chipText: "text-[#4ADE80]", chipBorder: "border-[#22C55E]/40", chipBg: "bg-[#22C55E]/10" },
  equipo: { label: "Equipo", dot: "#9CA3AF", chipText: "text-muted-foreground", chipBorder: "border-border", chipBg: "bg-secondary/60" },
  adrian: { label: "Adrián", dot: "#F5F6F7", chipText: "text-foreground", chipBorder: "border-foreground/30", chipBg: "bg-foreground/5" },
}

type NodeDef = {
  id: string
  x: number; y: number; w: number; h: number
  actor: Actor
  icon: LucideIcon
  title: string
  lines: string[]
  footnote?: string
  success?: boolean
  mono?: boolean // resalta la última línea como dato (tag)
}

type EdgeDef = {
  x1: number; y1: number; x2: number; y2: number
  label?: string
  variant?: "normal" | "success"
  dashed?: boolean
}

// Lienzo de coordenadas fijas. En pantallas estrechas el board se desplaza (pan), como Miro.
const CANVAS_W = 1500
const CANVAS_H = 470

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
  const nodes: NodeDef[] = [
    {
      id: "traf", x: 20, y: 205, w: 160, h: 100, actor: "equipo", icon: Megaphone,
      title: "Tráfico",
      lines: ["Anuncios, historias y bio llevan a la landing."],
    },
    {
      id: "land", x: 220, y: 80, w: 280, h: 310, actor: "sistema", icon: MonitorPlay,
      title: "Landing  ·  /webinar",
      lines: [
        "Titular con la promesa del directo.",
        "Mini-VSL (vídeo de presentación).",
        "Formulario: nombre, email y teléfono.",
        "Botón: «Reservar mi plaza».",
      ],
      footnote: "Al enviar se crea el contacto en el CRM y entra al pipeline del webinar.",
    },
    {
      id: "grac", x: 540, y: 80, w: 235, h: 150, actor: "sistema", icon: PartyPopper,
      title: "Página de gracias",
      lines: [
        "«Último paso: escríbeme por WhatsApp para tu entrada.»",
        "Botón verde de WhatsApp.",
      ],
    },
    {
      id: "mail", x: 540, y: 300, w: 235, h: 150, actor: "sistema", icon: Mail,
      title: "Correo de confirmación",
      lines: [
        "Se envía al instante y confirma la plaza.",
        emailWhatsappEnabled
          ? "Incluye el botón de WhatsApp."
          : "Sin botón de WhatsApp (desactivado en ajustes).",
      ],
    },
    {
      id: "wa", x: 820, y: 155, w: 250, h: 220, actor: "sistema", icon: MessageCircle,
      title: "Escribe por WhatsApp",
      success: true,
      lines: [
        "Se abre WhatsApp con el mensaje listo:",
        `«${whatsappMessage}»`,
        `Al enviar → tag ${tagName}`,
      ],
      mono: true,
      footnote: "Aquí termina nuestro trabajo: el funnel se considera cumplido.",
    },
    {
      id: "nutrir", x: 1110, y: 205, w: 190, h: 120, actor: "equipo", icon: MessagesSquare,
      title: "Se nutre en el chat",
      lines: ["El equipo conversa y nutre a la persona dentro del chat."],
    },
    {
      id: "directo", x: 1330, y: 210, w: 150, h: 110, actor: "adrian", icon: Radio,
      title: "Webinar en directo",
      lines: [dateLabel],
    },
  ]

  const edges: EdgeDef[] = [
    { x1: 180, y1: 255, x2: 220, y2: 235 },
    { x1: 500, y1: 175, x2: 540, y2: 150, label: "al reservar → redirige" },
    { x1: 500, y1: 320, x2: 540, y2: 370, label: "dispara el correo", dashed: true },
    { x1: 775, y1: 150, x2: 820, y2: 205, label: "botón WhatsApp" },
    { x1: 775, y1: 370, x2: 820, y2: 325, label: "botón (opcional)" },
    { x1: 1070, y1: 265, x2: 1110, y2: 265, label: "al enviar ✓", variant: "success" },
    { x1: 1300, y1: 265, x2: 1330, y2: 265, variant: "success" },
  ]

  return (
    <>
      <ShellHeader title="Sistema visual" />
      <PageContainer wide>
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
            Funnel del Webinar
          </h1>
          <p className="relative mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            De traer a la persona desde el anuncio hasta que escribe por WhatsApp. Ese envío es el
            punto de éxito; a partir de ahí se nutre a la persona dentro del chat.
          </p>

          {/* Leyenda */}
          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            {(["sistema", "equipo", "adrian"] as Actor[]).map((a) => (
              <span
                key={a}
                className={`inline-flex items-center gap-1.5 rounded-full border ${ACTOR[a].chipBorder} ${ACTOR[a].chipBg} px-2.5 py-1 text-[11px] font-medium ${ACTOR[a].chipText}`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACTOR[a].dot }} />
                {ACTOR[a].label}
              </span>
            ))}
            <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-muted-foreground/70 md:inline-flex">
              <MousePointer2 className="h-3.5 w-3.5" /> Desliza el tablero para ver todo el flujo
            </span>
          </div>
        </header>

        {/* Board (tablero) */}
        <div className="ww-rise relative mt-4 overflow-x-auto rounded-xl border border-border bg-secondary/20" style={{ animationDelay: "80ms" }}>
          <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
            {/* Capa de conectores (flechas) */}
            <svg className="absolute inset-0" width={CANVAS_W} height={CANVAS_H} style={{ pointerEvents: "none" }}>
              <defs>
                <marker id="ww-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                  <path d="M1,1 L8,4.5 L1,8" fill="none" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
                <marker id="ww-arrow-green" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                  <path d="M1,1 L8,4.5 L1,8" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
              </defs>
              {edges.map((e, i) => {
                const green = e.variant === "success"
                const midX = (e.x1 + e.x2) / 2
                const d = `M ${e.x1} ${e.y1} C ${midX} ${e.y1}, ${midX} ${e.y2}, ${e.x2} ${e.y2}`
                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={green ? "#22C55E" : "#6B7280"}
                    strokeWidth={green ? 2 : 1.6}
                    strokeDasharray={e.dashed ? "5 5" : undefined}
                    markerEnd={green ? "url(#ww-arrow-green)" : "url(#ww-arrow)"}
                    opacity={green ? 0.9 : 0.7}
                  />
                )
              })}
            </svg>

            {/* Etiquetas de las flechas (encima de la línea) */}
            {edges.filter((e) => e.label).map((e, i) => {
              const cx = (e.x1 + e.x2) / 2
              const cy = (e.y1 + e.y2) / 2
              return (
                <span
                  key={i}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-border bg-card px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground"
                  style={{ left: cx, top: cy }}
                >
                  {e.label}
                </span>
              )
            })}

            {/* Nodos (cajas) */}
            {nodes.map((n) => (
              <BoardNode key={n.id} node={n} />
            ))}
          </div>
        </div>

        <style>{`
          .ww-rise { opacity: 0; transform: translateY(14px); animation: ww-rise .6s cubic-bezier(.22,.61,.36,1) forwards; }
          @keyframes ww-rise { to { opacity: 1; transform: translateY(0); } }
          .ww-dot { width: 7px; height: 7px; border-radius: 9999px; background: #22C55E; box-shadow: 0 0 0 0 rgba(34,197,94,.55); animation: ww-pulse 2.4s ease-out infinite; }
          @keyframes ww-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 70%{box-shadow:0 0 0 8px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
          @media (prefers-reduced-motion: reduce) {
            .ww-rise { animation: none !important; opacity: 1 !important; transform: none !important; }
            .ww-dot { animation: none !important; }
          }
        `}</style>
      </PageContainer>
    </>
  )
}

function BoardNode({ node }: { node: NodeDef }) {
  const Icon = node.icon
  const a = ACTOR[node.actor]
  const success = node.success
  return (
    <div
      className={`absolute flex flex-col rounded-xl border p-3.5 ${
        success ? "border-[#22C55E]/60 bg-[#22C55E]/[0.07]" : "border-border bg-card"
      }`}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h, boxShadow: success ? "0 0 0 1px rgba(34,197,94,0.2)" : undefined }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${a.chipBorder} ${a.chipBg}`}>
            <Icon className="h-3.5 w-3.5" style={{ color: a.dot }} />
          </span>
          <h3 className="text-[12.5px] font-semibold leading-tight text-foreground">{node.title}</h3>
        </div>
        {success && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#22C55E] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#08130C]">
            <Check className="h-2.5 w-2.5" /> Éxito
          </span>
        )}
      </div>

      <ul className="mt-2 flex-1 space-y-1">
        {node.lines.map((l, i) => {
          const isTag = node.mono && i === node.lines.length - 1
          return (
            <li key={i} className={`flex gap-1.5 leading-snug ${isTag ? "text-[11px]" : "text-[11.5px]"} text-muted-foreground`}>
              <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full" style={{ background: a.dot }} />
              <span className={isTag ? "font-mono text-[10.5px] text-foreground" : ""}>{l}</span>
            </li>
          )
        })}
      </ul>

      {node.footnote && (
        <p className={`mt-2 border-t pt-2 text-[10.5px] leading-snug ${success ? "border-[#22C55E]/25 text-[#8fe6ab]" : "border-border text-muted-foreground/80"}`}>
          {node.footnote}
        </p>
      )}
    </div>
  )
}
