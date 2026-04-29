"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink, Globe, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WebWithSteps } from "../types/web"

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

export function WebCard({ web, publicBaseUrl }: WebCardProps) {
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null)
  const Icon = TYPE_ICONS[web.type]

  const entryStep = web.steps.find((s) => s.isEntry) ?? web.steps[0]
  const baseUrl = `${publicBaseUrl}/${web.slug}`

  function urlForStep(stepSlug: string | undefined): string {
    if (!stepSlug || stepSlug === "landing") return baseUrl
    return `${baseUrl}/${stepSlug}`
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
      {/* Header */}
      <header className="flex items-start gap-3">
        <div className="rounded-sm border border-border bg-secondary/40 p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-heading text-sm font-semibold text-foreground">
              {web.name}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
                STATUS_STYLES[web.status]
              )}
            >
              {web.status}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">
            /{web.slug}
          </p>
        </div>
      </header>

      {/* Description */}
      {web.description && (
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {web.description}
        </p>
      )}

      {/* Steps */}
      <div className="space-y-1.5">
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
          {web.steps.length} {web.steps.length === 1 ? "step" : "steps"}
        </p>
        <ul className="space-y-1">
          {web.steps.map((step) => {
            const url = urlForStep(step.slug)
            const isCopied = copiedStepId === step.id
            return (
              <li
                key={step.id}
                className="group flex items-center justify-between gap-2 rounded-sm border border-border/50 bg-secondary/30 px-2.5 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground">{step.name}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground/60">
                    {url.replace(/^https?:\/\//, "")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(url, step.id)}
                    className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    title="Copiar link"
                  >
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    title="Abrir en nueva pestaña"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Footer actions */}
      <footer className="flex items-center gap-2 border-t border-border/50 pt-3">
        <Button asChild size="sm" variant="secondary" className="flex-1 font-mono text-xs">
          <a href={urlForStep(entryStep?.slug)} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Abrir funnel
          </a>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled
          className="font-mono text-xs"
          title="Métricas — próximamente (Fase 2)"
        >
          Métricas
        </Button>
      </footer>
    </article>
  )
}
