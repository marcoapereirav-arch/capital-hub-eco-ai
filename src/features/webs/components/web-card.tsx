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

type StepLocal = WebWithSteps["steps"][0]

export function WebCard({ web, publicBaseUrl }: WebCardProps) {
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null)
  const [status, setStatus] = useState(web.status)
  const [saving, setSaving] = useState(false)
  const [steps, setSteps] = useState<StepLocal[]>(web.steps)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editingStepField, setEditingStepField] = useState<"slug" | "name">("slug")
  const [stepDraft, setStepDraft] = useState<string>("")
  const [stepError, setStepError] = useState<string | null>(null)

  // Editar nombre del funnel
  const [webName, setWebName] = useState(web.name)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(web.name)
  const [nameError, setNameError] = useState<string | null>(null)

  async function saveWebName() {
    const cleaned = nameDraft.trim()
    if (!cleaned) { setNameError("El nombre no puede estar vacío"); return }
    if (cleaned === webName) { setEditingName(false); return }
    setSaving(true)
    setNameError(null)
    try {
      const res = await fetch(`/api/admin/webs/${web.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleaned }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setNameError(data?.error ?? "No se pudo guardar")
        return
      }
      setWebName(cleaned)
      setEditingName(false)
    } finally {
      setSaving(false)
    }
  }

  async function saveStepField(step: StepLocal, field: "name" | "slug") {
    const cleaned = field === "slug"
      ? stepDraft.trim().toLowerCase().replace(/^\/+|\/+$/g, "")
      : stepDraft.trim()
    if (field === "slug" && cleaned && !/^[a-z0-9][a-z0-9-/_]*$/.test(cleaned)) {
      setStepError("Solo letras, números, guion y barra. Sin espacios.")
      return
    }
    if (field === "name" && !cleaned) {
      setStepError("El nombre no puede estar vacío")
      return
    }
    if (cleaned === (field === "slug" ? step.slug : step.name)) {
      setEditingStepId(null)
      return
    }
    setSaving(true)
    setStepError(null)
    try {
      const body = field === "slug" ? { slug: cleaned } : { name: cleaned }
      const res = await fetch(`/api/admin/webs/${web.id}/steps/${step.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStepError(data?.error ?? "No se pudo guardar")
        return
      }
      const updated = await res.json()
      setSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, [field]: updated[field] } : s)))
      setEditingStepId(null)
    } finally {
      setSaving(false)
    }
  }

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

  // step.slug es ahora un PATH ABSOLUTO desde la raíz del dominio.
  // Decisión Marco 2026-06-17 para eliminar el bug de doble-concatenacion
  // (que generaba /login/login, /test-personalidad/thanks → 404).
  function urlForStep(stepSlug: string | undefined): string {
    if (!stepSlug) return publicBaseUrl
    // Permite slug con o sin barra inicial
    const clean = stepSlug.startsWith("/") ? stepSlug.slice(1) : stepSlug
    return `${publicBaseUrl}/${clean}`
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
            {editingName ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  autoFocus
                  disabled={saving}
                  className="h-7 flex-1 min-w-0 rounded-sm border border-foreground/40 bg-background px-2 text-sm font-semibold focus:border-foreground focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveWebName()
                    if (e.key === "Escape") { setEditingName(false); setNameDraft(webName); setNameError(null) }
                  }}
                />
                <button onClick={saveWebName} disabled={saving} className="p-1 rounded-sm hover:bg-secondary text-green-400" title="Guardar">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </button>
                <button onClick={() => { setEditingName(false); setNameDraft(webName); setNameError(null) }} className="p-1 rounded-sm hover:bg-secondary text-muted-foreground" title="Cancelar">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingName(true); setNameDraft(webName); setNameError(null) }}
                className="truncate flex items-center gap-1.5 text-left font-heading text-sm font-semibold text-foreground hover:text-foreground group/wn"
                title="Click para editar el nombre del funnel"
              >
                <span className="truncate">{webName}</span>
                <Pencil className="h-3 w-3 text-muted-foreground/60 group-hover/wn:text-foreground shrink-0" />
              </button>
            )}
            {!editingName && (
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
            )}
          </div>
          {nameError && <p className="text-[10px] text-red-400 mt-1">{nameError}</p>}
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
          {steps.length} {steps.length === 1 ? "step" : "steps"} · click ✎ para editar nombre o path de cada landing
        </p>
        <ul className="space-y-1.5">
          {steps.map((step) => {
            const url = urlForStep(step.slug)
            const isCopied = copiedStepId === step.id
            const isEditingThis = editingStepId === step.id
            const isEditingName = isEditingThis && editingStepField === "name"
            const isEditingSlug = isEditingThis && editingStepField === "slug"
            return (
              <li key={step.id} className="rounded-sm border border-border/50 bg-secondary/30 px-2.5 py-2 space-y-1.5">
                {/* Nombre del step: clickeable para editar */}
                <div className="flex items-center justify-between gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <input
                        value={stepDraft}
                        onChange={(e) => setStepDraft(e.target.value)}
                        autoFocus
                        disabled={saving}
                        className="h-6 flex-1 min-w-0 rounded-sm border border-foreground/40 bg-background px-2 text-xs font-medium focus:border-foreground focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveStepField(step, "name")
                          if (e.key === "Escape") { setEditingStepId(null); setStepError(null) }
                        }}
                      />
                      <button onClick={() => saveStepField(step, "name")} disabled={saving} className="p-1 rounded-sm hover:bg-secondary text-green-400" title="Guardar">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </button>
                      <button onClick={() => { setEditingStepId(null); setStepError(null) }} className="p-1 rounded-sm hover:bg-secondary text-muted-foreground" title="Cancelar">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingStepId(step.id); setEditingStepField("name"); setStepDraft(step.name); setStepError(null) }}
                      className="flex items-center gap-1.5 text-left text-xs text-foreground font-medium group/sn truncate flex-1 min-w-0"
                      title="Click para editar el nombre de esta landing"
                    >
                      <span className="truncate">{step.name}</span>
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground/60 group-hover/sn:text-foreground shrink-0" />
                    </button>
                  )}
                  {!isEditingThis && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => copyToClipboard(url, step.id)} className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Copiar link">
                        {isCopied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                      <button type="button" onClick={() => window.open(url, "_blank", "noopener,noreferrer")} className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Abrir landing">
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Path / slug del step: clickeable para editar */}
                {isEditingSlug ? (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] text-muted-foreground">/</span>
                    <input
                      value={stepDraft}
                      onChange={(e) => setStepDraft(e.target.value)}
                      autoFocus
                      disabled={saving}
                      className="h-6 flex-1 min-w-0 rounded-sm border border-foreground/40 bg-background px-1.5 font-mono text-[10px] focus:border-foreground focus:outline-none"
                      placeholder="nuevo-path"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveStepField(step, "slug")
                        if (e.key === "Escape") { setEditingStepId(null); setStepError(null) }
                      }}
                    />
                    <button onClick={() => saveStepField(step, "slug")} disabled={saving} className="p-1 rounded-sm hover:bg-secondary text-green-400" title="Guardar">
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    </button>
                    <button onClick={() => { setEditingStepId(null); setStepError(null) }} className="p-1 rounded-sm hover:bg-secondary text-muted-foreground" title="Cancelar">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  !isEditingName && (
                    <button
                      onClick={() => { setEditingStepId(step.id); setEditingStepField("slug"); setStepDraft(step.slug); setStepError(null) }}
                      className="flex w-full items-center gap-1.5 rounded-sm border border-border/30 bg-background/40 px-2 py-1 text-left hover:border-foreground/40 hover:bg-background/70 transition-colors group/spath"
                      title="Click para editar el path"
                    >
                      <p className="truncate font-mono text-[10px] text-foreground/70 group-hover/spath:text-foreground flex-1">
                        {url.replace(/^https?:\/\//, "")}
                      </p>
                      <Pencil className="h-3 w-3 text-muted-foreground group-hover/spath:text-foreground shrink-0" />
                      <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60 shrink-0">Path</span>
                    </button>
                  )
                )}
                {isEditingThis && stepError && (
                  <p className="text-[10px] text-red-400">{stepError}</p>
                )}
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
