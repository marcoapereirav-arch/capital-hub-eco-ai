"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink, Globe, FileDown, Loader2, Pencil, X } from "lucide-react"
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
  const [status, setStatus] = useState(web.status)
  const [saving, setSaving] = useState(false)
  const [slug, setSlug] = useState(web.slug)
  const [editingSlug, setEditingSlug] = useState(false)
  const [slugDraft, setSlugDraft] = useState(web.slug)
  const [slugError, setSlugError] = useState<string | null>(null)
  const Icon = TYPE_ICONS[web.type]

  const entryStep = web.steps.find((s) => s.isEntry) ?? web.steps[0]
  const baseUrl = `${publicBaseUrl}/${slug}`

  async function saveSlug() {
    const cleaned = slugDraft.trim().toLowerCase().replace(/^\/+|\/+$/g, "")
    if (!cleaned || !/^[a-z0-9][a-z0-9-/_]*$/.test(cleaned)) {
      setSlugError("Solo letras, números, guion y barra. Sin espacios.")
      return
    }
    if (cleaned === slug) { setEditingSlug(false); return }
    setSaving(true)
    setSlugError(null)
    try {
      const res = await fetch(`/api/admin/webs/${web.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: cleaned }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSlugError(data?.error ?? "No se pudo guardar")
        setSaving(false)
        return
      }
      setSlug(cleaned)
      setEditingSlug(false)
    } finally {
      setSaving(false)
    }
  }

  async function togglePublished() {
    const next = status === "published" ? "draft" : "published"
    setSaving(true)
    const previous = status
    setStatus(next) // optimista
    try {
      const res = await fetch(`/api/admin/webs/${web.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error("PATCH failed")
    } catch {
      setStatus(previous) // rollback
      alert("No se pudo cambiar el estado. Reintenta.")
    } finally {
      setSaving(false)
    }
  }

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
            <button
              onClick={togglePublished}
              disabled={saving}
              className={cn(
                "shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide transition-colors hover:opacity-80 disabled:opacity-50",
                STATUS_STYLES[status]
              )}
              title={
                status === "published"
                  ? "Click para pasar a Draft (link público dejará de funcionar)"
                  : "Click para Publicar (el link será accesible públicamente)"
              }
            >
              {saving && <Loader2 className="inline h-2.5 w-2.5 animate-spin mr-1" />}
              {status === "published" ? "Published" : status === "draft" ? "Draft" : status}
            </button>
          </div>
          {editingSlug ? (
            <div className="mt-1 flex items-center gap-1">
              <span className="font-mono text-[11px] text-muted-foreground/70">/</span>
              <input
                value={slugDraft}
                onChange={(e) => setSlugDraft(e.target.value)}
                disabled={saving}
                autoFocus
                className="h-6 rounded-sm border border-border bg-background px-1.5 font-mono text-[11px] flex-1 min-w-0 focus:border-foreground/40 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveSlug()
                  if (e.key === "Escape") { setEditingSlug(false); setSlugDraft(slug); setSlugError(null) }
                }}
              />
              <button
                onClick={saveSlug}
                disabled={saving}
                className="p-1 rounded-sm hover:bg-secondary text-green-400"
                title="Guardar"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              </button>
              <button
                onClick={() => { setEditingSlug(false); setSlugDraft(slug); setSlugError(null) }}
                className="p-1 rounded-sm hover:bg-secondary text-muted-foreground"
                title="Cancelar"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingSlug(true)}
              className="mt-0.5 inline-flex items-center gap-1.5 rounded-sm border border-border/40 bg-secondary/30 px-2 py-1 text-left hover:border-foreground/40 hover:bg-secondary/60 transition-colors group/edit"
              title="Click para editar el path de esta landing"
            >
              <p className="font-mono text-[11px] text-foreground/80 group-hover/edit:text-foreground">/{slug}</p>
              <Pencil className="h-3 w-3 text-muted-foreground group-hover/edit:text-foreground" />
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60 group-hover/edit:text-muted-foreground">Editar</span>
            </button>
          )}
          {slugError && (
            <p className="mt-1 text-[10px] text-red-400">{slugError}</p>
          )}
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
                  <button
                    type="button"
                    onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                    className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    title="Abrir en navegador (fuera de la app)"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Footer actions */}
      <footer className="flex items-center gap-2 border-t border-border/50 pt-3">
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
