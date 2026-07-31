"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink, Globe, FileDown, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WebWithSteps, WebHostname } from "../types/web"
import { WebEditModal, type WebEditResult } from "./web-edit-modal"

interface WebCardProps {
  web: WebWithSteps
  publicBaseUrl: string
}

const TYPE_ICONS = {
  funnel: Globe,
  lead_magnet: FileDown,
  presentation: Globe,
  other: Globe,
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  published: "bg-green-500/10 text-green-400 border-green-500/30",
  archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
}

type StepLocal = WebWithSteps["steps"][0]

/** Base URLs por subdominio publico. En dev/preview usa el host actual. */
function baseUrlForHostname(hostname: WebHostname, fallbackBase: string): string {
  try {
    const u = new URL(fallbackBase)
    if (u.hostname.includes("localhost") || u.hostname.endsWith(".vercel.app")) {
      return fallbackBase
    }
  } catch {
    // ignore
  }
  return hostname === "ch"
    ? "https://ch.capitalhubapp.com"
    : "https://os.capitalhubapp.com"
}

export function WebCard({ web, publicBaseUrl }: WebCardProps) {
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null)
  // Estado local de SOLO LECTURA: refleja lo último guardado desde el modal.
  const [status, setStatus] = useState(web.status)
  const [hostname, setHostname] = useState<WebHostname>(web.hostname)
  const [webName, setWebName] = useState(web.name)
  const [slug, setSlug] = useState(web.slug)
  const [steps, setSteps] = useState<StepLocal[]>(web.steps)
  const [showEdit, setShowEdit] = useState(false)
  const [tracking, setTracking] = useState(web.trackingEnabled)
  const [savingTracking, setSavingTracking] = useState(false)

  // Enciende o apaga la medición de ESTE funnel. Es independiente de Draft/Published:
  // un funnel puede estar publicado y no medir (el acceso al OS, por ejemplo).
  // Optimista: se pinta al instante y se revierte si el guardado falla.
  async function toggleTracking() {
    const next = !tracking
    setTracking(next)
    setSavingTracking(true)
    try {
      const res = await fetch(`/api/admin/webs/${web.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingEnabled: next }),
      })
      if (!res.ok) setTracking(!next)
    } catch {
      setTracking(!next)
    } finally {
      setSavingTracking(false)
    }
  }

  const effectiveBaseUrl = baseUrlForHostname(hostname, publicBaseUrl)
  const Icon = TYPE_ICONS[web.type]
  const entryStep = steps.find((s) => s.isEntry) ?? steps[0]

  // Cuando el modal guarda, refresca el estado local para que la tarjeta muestre lo nuevo.
  function handleSaved(result: WebEditResult) {
    setWebName(result.name)
    setSlug(result.slug)
    setStatus(result.status)
    setHostname(result.hostname)
    setSteps((prev) =>
      prev.map((s) => {
        const updated = result.steps.find((r) => r.id === s.id)
        return updated ? { ...s, name: updated.name, slug: updated.slug } : s
      }),
    )
  }

  // step.slug es un PATH ABSOLUTO desde la raíz del dominio.
  // Decisión Marco 2026-06-17 para eliminar el bug de doble-concatenacion
  // (que generaba /login/login, /test-personalidad/thanks → 404).
  function urlForStep(stepSlug: string | undefined): string {
    if (!stepSlug) return effectiveBaseUrl
    const clean = stepSlug.startsWith("/") ? stepSlug.slice(1) : stepSlug
    return `${effectiveBaseUrl}/${clean}`
  }

  async function copyToClipboard(url: string, stepId: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedStepId(stepId)
      setTimeout(() => setCopiedStepId(null), 1500)
    } catch {
      // Fallback silencioso
    }
  }

  return (
    <article className="flex flex-col gap-4 rounded-sm border border-border bg-card p-5 transition-colors hover:border-foreground/30">
      {/* Header — SOLO LECTURA */}
      <header className="flex items-start gap-3">
        <div className="rounded-sm border border-border bg-secondary p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 font-heading text-sm font-semibold leading-snug text-foreground line-clamp-2">
              {webName}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
                STATUS_STYLES[status],
              )}
            >
              {STATUS_LABEL[status] ?? status}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="font-mono text-[11px] text-foreground/70">/{slug}</p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
              {hostname === "ch" ? "ch. público" : "os. interno"}
            </span>
          </div>
        </div>
      </header>

      {/* Medición Meta — interruptor propio, aparte de Draft/Published.
          Publicado no obliga a medir: el acceso al OS está publicado y no manda nada. */}
      <div className="flex items-center justify-between gap-3 rounded-sm border border-border bg-secondary/30 px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">Medición Meta</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {tracking
              ? "Manda los eventos a Facebook Ads"
              : "No manda nada, aunque esté publicado"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={tracking}
          aria-label="Medición Meta"
          disabled={savingTracking}
          onClick={toggleTracking}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-50",
            tracking
              ? "border-[#22C55E]/50 bg-[#22C55E]"
              : "border-border bg-secondary",
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-all",
              tracking ? "left-[24px]" : "left-[3px]",
            )}
          />
        </button>
      </div>

      {/* Description */}
      {web.description && (
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {web.description}
        </p>
      )}

      {/* Steps — SOLO LECTURA (solo copiar / abrir) */}
      <div className="space-y-1.5">
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
          {steps.length} {steps.length === 1 ? "step" : "steps"}
        </p>
        <ul className="space-y-1.5">
          {steps.map((step) => {
            const url = urlForStep(step.slug)
            const isCopied = copiedStepId === step.id
            return (
              <li
                key={step.id}
                className="space-y-1.5 rounded-sm border border-border bg-secondary/30 px-2.5 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                    {step.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(url, step.id)}
                      className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      title="Copiar link"
                    >
                      {isCopied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                      className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      title="Abrir landing"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p className="truncate rounded-sm border border-border bg-background/40 px-2 py-1 font-mono text-[10px] text-foreground/70">
                  {url.replace(/^https?:\/\//, "")}
                </p>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Footer actions */}
      <footer className="flex items-center gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 font-mono text-xs"
          onClick={() => window.open(urlForStep(entryStep?.slug), "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          Abrir funnel
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="font-mono text-xs"
          onClick={() => setShowEdit(true)}
          title="Editar todo el funnel: nombre, path, pasos y links"
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Editar
        </Button>
      </footer>

      {showEdit && (
        <WebEditModal
          web={{ ...web, name: webName, slug, status, hostname, steps }}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}
    </article>
  )
}
