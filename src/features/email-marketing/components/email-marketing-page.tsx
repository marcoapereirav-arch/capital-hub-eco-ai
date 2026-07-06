"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Mail, Send, FileText, Settings, BarChart3, Search, Filter, CheckCircle2, XCircle, Eye, MousePointerClick } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { cn } from "@/lib/utils"

type Stats = {
  range: { from: string; to: string }
  metrics: {
    total: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    failed: number
    deliveryRate: number
    openRate: number
    clickRate: number
    bounceRate: number
    failureRate: number
  }
  topTemplates: { template: string; total: number; failed: number; opened: number; clicked: number }[]
}

type EmailLog = {
  id: string
  template: string
  to_email: string
  to_name: string | null
  subject: string
  status: string
  error: string | null
  sent_at: string
  opened_at: string | null
  clicked_at: string | null
}

type Template = {
  key: string
  label: string
  description: string
  category: string
  group?: string
  group_label?: string
  group_color?: string
  group_order?: number
  trigger?: string
  frequency?: "alta" | "media" | "baja"
  variables?: string[]
  defaultSubject?: string
  defaultHtml?: string
  currentSubject?: string
  currentHtml?: string
  hasOverride?: boolean
  paused?: boolean
  updatedAt?: string | null
}

const FREQ_META: Record<string, { label: string; color: string }> = {
  alta: { label: "ALTA", color: "border-red-500/40 text-red-400 bg-red-500/[0.04]" },
  media: { label: "MEDIA", color: "border-amber-500/40 text-amber-400 bg-amber-500/[0.04]" },
  baja: { label: "BAJA", color: "border-zinc-500/40 text-zinc-400 bg-zinc-500/[0.04]" },
}

const CATEGORY_COLORS: Record<string, string> = {
  lifecycle: "text-cyan-400 border-cyan-500/40",
  calendar: "text-amber-400 border-amber-500/40",
  transactional: "text-green-400 border-green-500/40",
  retargeting: "text-purple-400 border-purple-500/40",
  auth: "text-blue-400 border-blue-500/40",
  internal: "text-muted-foreground border-border",
}

export function EmailMarketingPage() {
  const [tab, setTab] = useState<"dashboard" | "templates" | "logs" | "broadcasts" | "config">("dashboard")

  return (
    <>
      <ShellHeader title="Email Marketing" />

      <PageContainer>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Email Marketing</h1>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            · Resend + React Email
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
          {([
            ["dashboard", "Dashboard", BarChart3],
            ["templates", "Plantillas", FileText],
            ["logs", "Envíos", Send],
            ["broadcasts", "Broadcasts", Mail],
            ["config", "Configuración", Settings],
          ] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "px-3 py-2 text-sm transition-colors border-b-2 -mb-px flex items-center gap-1.5 shrink-0",
                tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && <DashboardTab />}
        {tab === "templates" && <TemplatesTab />}
        {tab === "logs" && <LogsTab />}
        {tab === "broadcasts" && <BroadcastsTab />}
        {tab === "config" && <ConfigTab />}
      </PageContainer>
    </>
  )
}

function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodRange | undefined>(undefined)

  useEffect(() => {
    if (!period) return
    setLoading(true)
    const params = new URLSearchParams({ from: period.from.toISOString(), to: period.to.toISOString() })
    fetch(`/api/admin/email/stats?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false))
  }, [period?.from?.toISOString(), period?.to?.toISOString()])

  return (
    <div className="space-y-4">
      {/* Filtro de periodo (reusable). Si quieres este mismo filtro en otro dashboard,
          importa <PeriodFilter> de @/components/ui/period-filter */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Métricas {stats?.range ? `· ${new Date(stats.range.from).toLocaleDateString("es-ES")} – ${new Date(stats.range.to).toLocaleDateString("es-ES")}` : ""}
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {loading || !stats ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Cargando métricas…</div>
      ) : (
        <>
          {/* 6 KPI cards completas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Enviados" value={stats.metrics.total} accent="cyan" />
            <StatCard label="Entregados" value={stats.metrics.delivered} sublabel={`${stats.metrics.deliveryRate}%`} accent="green" />
            <StatCard label="Abiertos" value={stats.metrics.opened} sublabel={`${stats.metrics.openRate}%`} suffix="" accent="amber" />
            <StatCard label="Clicados" value={stats.metrics.clicked} sublabel={`${stats.metrics.clickRate}%`} accent="purple" />
            <StatCard label="Bounces" value={stats.metrics.bounced} sublabel={`${stats.metrics.bounceRate}%`} accent={stats.metrics.bounced > 0 ? "red" : "cyan"} />
            <StatCard label="Fallidos" value={stats.metrics.failed} sublabel={`${stats.metrics.failureRate}%`} accent={stats.metrics.failed > 0 ? "red" : "cyan"} />
          </div>

          <section>
            <h2 className="text-sm font-semibold mb-2">Top templates en el período</h2>
            {stats.topTemplates.length === 0 ? (
              <div className="text-xs text-muted-foreground p-3 border border-dashed border-border rounded-sm">
                Sin envíos en este rango. Cambia el filtro de período para ver otras fechas.
              </div>
            ) : (
              <div className="rounded-md border border-border divide-y divide-border">
                {stats.topTemplates.map((t) => {
                  const openR = t.total > 0 ? Math.round((t.opened / t.total) * 100) : 0
                  const clickR = t.total > 0 ? Math.round((t.clicked / t.total) * 100) : 0
                  return (
                    <div key={t.template} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="font-mono text-xs truncate">{t.template}</span>
                      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider shrink-0">
                        <span className="text-muted-foreground">{t.total} envíos</span>
                        <span className="text-amber-400">{openR}% open</span>
                        <span className="text-violet-400">{clickR}% click</span>
                        {t.failed > 0 && <span className="text-red-400">{t.failed} fallos</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Template | null>(null)
  const [search, setSearch] = useState("")

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/email-templates")
    const data = await res.json()
    setTemplates(data.templates ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="text-sm text-muted-foreground py-6">Cargando…</div>

  // Filtro búsqueda (label + trigger + key)
  const q = search.trim().toLowerCase()
  const filtered = q
    ? templates.filter((t) =>
        t.label.toLowerCase().includes(q) ||
        (t.trigger ?? "").toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        t.key.toLowerCase().includes(q)
      )
    : templates

  // Agrupar por group (nuevo) con fallback a category (legacy)
  const groups = new Map<string, { label: string; color: string; order: number; items: Template[] }>()
  for (const t of filtered) {
    const groupKey = t.group ?? t.category ?? "otros"
    const existing = groups.get(groupKey)
    if (existing) {
      existing.items.push(t)
    } else {
      groups.set(groupKey, {
        label: t.group_label ?? t.category ?? "Otros",
        color: t.group_color ?? "border-border text-muted-foreground",
        order: t.group_order ?? 99,
        items: [t],
      })
    }
  }
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => a[1].order - b[1].order)

  return (
    <div className="space-y-4">
      {/* Header + buscador */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground flex-1 min-w-[280px]">
          {templates.length} plantillas editables · click para editar asunto + HTML visualmente · cambios sin redeploy
        </p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar plantilla…"
            className="h-8 w-64 rounded-sm border border-border bg-background pl-8 pr-2 text-xs"
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-xs text-muted-foreground py-12 text-center border border-dashed border-border rounded-sm">
          Ninguna plantilla matchea "{search}".
        </div>
      )}

      {sortedGroups.map(([groupKey, group]) => (
        <section key={groupKey} className={cn("rounded-md border p-3 space-y-2", group.color)}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold">{group.label}</h2>
            <span className="text-[9px] font-mono uppercase tracking-wider opacity-70">
              {group.items.length} {group.items.length === 1 ? "plantilla" : "plantillas"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {group.items.map((t) => {
              const freq = FREQ_META[t.frequency ?? "baja"]
              return (
              <button
                key={t.key}
                onClick={() => setEditing(t)}
                className="rounded-md border border-border bg-background/60 p-3 hover:border-foreground/40 hover:bg-card/60 transition-colors text-left"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="text-sm font-medium leading-tight">{t.label}</div>
                  <div className="flex items-center gap-1 shrink-0">
                    {t.paused && (
                      <span
                        className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-300 border border-amber-500/40"
                        title="Esta plantilla esta pausada. NO se envia."
                      >
                        pausado
                      </span>
                    )}
                    {t.hasOverride && (
                      <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-green-500/10 text-green-400 border border-green-500/30">
                        editado
                      </span>
                    )}
                    {freq && (
                      <span
                        className={cn(
                          "text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border",
                          freq.color
                        )}
                        title={`Frecuencia de envio: ${freq.label}`}
                      >
                        {freq.label}
                      </span>
                    )}
                  </div>
                </div>
                {/* TRIGGER - lo más visual: cuándo se dispara este email */}
                {t.trigger && (
                  <div className="mb-2 rounded-sm border-l-2 border-foreground/30 pl-2 py-1 bg-foreground/[0.03]">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-foreground/60 mb-0.5">Se envía cuando</div>
                    <p className="text-xs text-foreground/85 leading-snug">{t.trigger}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono text-muted-foreground/70 truncate">{t.key}</div>
                  <div className="text-[10px] font-mono text-foreground/60 underline shrink-0 ml-2">Editar →</div>
                </div>
              </button>
              )
            })}
          </div>
        </section>
      ))}

      {editing && (
        <TemplateEditor
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function TemplateEditor({ template, onClose, onSaved }: { template: Template; onClose: () => void; onSaved: () => void }) {
  const [subject, setSubject] = useState(template.currentSubject ?? template.defaultSubject ?? "")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [saving, setSaving] = useState(false)
  const [reset, setReset] = useState(false)
  const [togglingPause, setTogglingPause] = useState(false)
  const [paused, setPaused] = useState(!!template.paused)
  const [err, setErr] = useState<string | null>(null)

  // srcDoc inicial - incluye scripts que activan contentEditable.
  // Solo se recalcula al abrir un template distinto (sino el iframe se reset).
  const initialSrcDoc = useMemo(() => {
    const html = template.currentHtml ?? template.defaultHtml ?? ""
    const editorScript = `
      <style>
        body { outline: none !important; cursor: text; }
        body:focus, *:focus { outline: 1px dashed rgba(55, 202, 55, 0.4) !important; outline-offset: 2px; }
        a { pointer-events: none !important; }
        [contenteditable=true]:hover { background: rgba(55, 202, 55, 0.04); }
      </style>
      <script>
        document.body.contentEditable = 'true';
        document.body.style.outline = 'none';
        // Evita que enter haga doble párrafo
        document.execCommand('defaultParagraphSeparator', false, 'br');
      </script>
    `
    if (html.includes("</body>")) {
      return html.replace("</body>", `${editorScript}</body>`)
    }
    return html + editorScript
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.key])

  function readHtml(): string {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return template.currentHtml ?? template.defaultHtml ?? ""
    const clone = doc.documentElement.cloneNode(true) as HTMLElement
    // Limpia los scripts/estilos de edición antes de guardar
    clone.querySelectorAll("script").forEach((s) => {
      if (s.textContent?.includes("contentEditable") || s.textContent?.includes("execCommand")) s.remove()
    })
    clone.querySelectorAll("style").forEach((s) => {
      if (s.textContent?.includes("contenteditable") || s.textContent?.includes("cursor: text")) s.remove()
    })
    const body = clone.querySelector("body")
    if (body) body.removeAttribute("contenteditable")
    return "<!DOCTYPE html>\n" + clone.outerHTML
  }

  async function save() {
    setSaving(true); setErr(null)
    try {
      const html_body = readHtml()
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_key: template.key, subject, html_body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      onSaved()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteOverride() {
    if (!confirm("Borrar tu version y volver al texto original del codigo. No se puede deshacer. Continuar?")) return
    setReset(true); setErr(null)
    try {
      const res = await fetch(`/api/admin/email-templates?key=${encodeURIComponent(template.key)}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      onSaved()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setReset(false)
    }
  }

  async function togglePause() {
    const next = !paused
    const msg = next
      ? "Pausar esta plantilla. Mientras este pausada, NO se enviara nunca (ni manual ni cron). Continuar?"
      : "Reactivar el envio de esta plantilla?"
    if (!confirm(msg)) return
    setTogglingPause(true); setErr(null)
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_key: template.key, paused: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      setPaused(next)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setTogglingPause(false)
    }
  }

  function applyCommand(cmd: string) {
    iframeRef.current?.contentDocument?.execCommand(cmd, false)
    iframeRef.current?.contentWindow?.focus()
  }

  function insertText(text: string) {
    iframeRef.current?.contentWindow?.focus()
    iframeRef.current?.contentDocument?.execCommand("insertText", false, text)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border rounded-lg w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{template.label}</h3>
            <p className="text-[10px] font-mono text-muted-foreground truncate">
              Haz click sobre cualquier texto del email y escribe directamente.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={togglePause}
              disabled={togglingPause}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider disabled:opacity-40",
                paused
                  ? "border-green-500/50 text-green-300 hover:bg-green-500/10"
                  : "border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
              )}
              title={paused ? "Reactivar envio" : "Pausar envio (no se enviara aunque exista cron)"}
            >
              {togglingPause ? "..." : paused ? "Reactivar envio" : "Pausar envio"}
            </button>
            {template.hasOverride && (
              <button
                onClick={deleteOverride}
                disabled={reset}
                className="rounded-sm border border-red-500/40 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                title="Borrar tu version y volver al texto original del codigo"
              >
                {reset ? "Restaurando..." : "Volver al original"}
              </button>
            )}
            <button
              onClick={save}
              disabled={saving || !subject.trim()}
              className="rounded-sm bg-gradient-to-br from-green-500 to-green-600 text-black px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold disabled:opacity-30"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs font-mono uppercase tracking-wider px-2">
              X
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border space-y-2.5">
          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/80">
              Asunto del email <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-sm border border-white/25 bg-white/[0.04] px-3 py-2 text-sm focus:bg-white/[0.08] focus:border-green-500/70 focus:outline-none transition-colors"
            />
          </label>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toolbar formato */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => applyCommand("bold")}
                className="w-7 h-7 rounded-sm border border-border text-foreground hover:bg-white/[0.06] font-bold text-xs"
                title="Negrita (Ctrl+B)"
              >B</button>
              <button
                onClick={() => applyCommand("italic")}
                className="w-7 h-7 rounded-sm border border-border text-foreground hover:bg-white/[0.06] italic text-xs"
                title="Itálica (Ctrl+I)"
              >I</button>
              <button
                onClick={() => applyCommand("underline")}
                className="w-7 h-7 rounded-sm border border-border text-foreground hover:bg-white/[0.06] underline text-xs"
                title="Subrayado (Ctrl+U)"
              >U</button>
            </div>
            {/* Variables */}
            {template.variables && template.variables.length > 0 && (
              <>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-1">
                  Insertar variable:
                </span>
                {template.variables.map((v) => (
                  <button
                    key={v}
                    onClick={() => insertText(`{{${v}}}`)}
                    className="text-[11px] font-mono px-2 py-1 rounded bg-white/[0.05] border border-border text-foreground hover:border-white/35"
                    title="Insertar en la posición del cursor"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-zinc-200">
          <iframe
            ref={iframeRef}
            title="editor"
            srcDoc={initialSrcDoc}
            className="w-full h-full bg-white"
          />
        </div>

        {err && (
          <div className="px-4 py-2 border-t border-red-500/40 bg-red-500/[0.06] text-xs text-red-300">
            {err}
          </div>
        )}
      </div>
    </div>
  )
}

function LogsTab() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [templateFilter, setTemplateFilter] = useState<string>("all")

  useEffect(() => { load() }, [statusFilter, templateFilter])

  async function load() {
    setLoading(true)
    try {
      const url = new URL("/api/admin/email/logs", window.location.origin)
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter)
      if (templateFilter !== "all") url.searchParams.set("template", templateFilter)
      if (search) url.searchParams.set("q", search)
      const d = await fetch(url.pathname + url.search).then((r) => r.json())
      setLogs(d.logs ?? [])
    } finally {
      setLoading(false)
    }
  }

  const uniqueTemplates = Array.from(new Set(logs.map((l) => l.template)))

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load() }}
            placeholder="Buscar email, asunto, nombre…"
            className="w-full h-8 rounded-sm border border-border bg-background pl-8 pr-2 text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 rounded-sm border border-border bg-background px-2 text-xs">
          <option value="all">Todos los estados</option>
          <option value="sent">Enviados OK</option>
          <option value="failed">Fallidos</option>
        </select>
        <select value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)} className="h-8 rounded-sm border border-border bg-background px-2 text-xs">
          <option value="all">Todos los templates</option>
          {uniqueTemplates.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-6 text-center">Cargando…</div>
      ) : logs.length === 0 ? (
        <div className="text-sm text-muted-foreground py-12 text-center rounded-md border border-dashed border-border">
          Sin envíos con esos filtros.
        </div>
      ) : (
        <div className="rounded-md border border-border divide-y divide-border">
          {logs.map((l) => (
            <div key={l.id} className="px-3 py-2 grid grid-cols-[1fr_auto_auto] gap-3 items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  {l.status === "sent" ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
                  <span className="truncate">{l.subject}</span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground truncate">
                  <span className="font-mono">{l.template}</span> · {l.to_email}{l.to_name ? ` (${l.to_name})` : ""}
                </div>
                {l.error && <div className="text-[10px] text-red-400 mt-0.5 truncate">{l.error}</div>}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                {l.opened_at && <Eye className="h-3 w-3 text-amber-400" />}
                {l.clicked_at && <MousePointerClick className="h-3 w-3 text-purple-400" />}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {l.sent_at && new Date(l.sent_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BroadcastsTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-500/40 bg-amber-500/[0.04] p-4">
        <h3 className="text-sm font-semibold mb-1">⚠️ Próximamente</h3>
        <p className="text-xs text-muted-foreground">
          Enviar emails a segmentos de contactos (ej: todos los stage=won con producto IA Integrator).
          Requiere:
        </p>
        <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc pl-4">
          <li>Selector de segmento (filtros sobre tabla contacts)</li>
          <li>Editor de copy con template base + variables (nombre, producto, etc)</li>
          <li>Vista previa antes de enviar</li>
          <li>Programar envío (now / fecha futura)</li>
          <li>Log de qué contactos lo recibieron</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          Cuando lo necesites, dímelo y lo construyo. Estimo ~6h.
        </p>
      </div>
    </div>
  )
}

function ConfigTab() {
  return (
    <div className="space-y-3">
      <section className="rounded-md border border-border p-3 space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Resend</h3>
        <div className="text-sm space-y-1">
          <div><span className="text-muted-foreground">From email:</span> <code className="font-mono text-xs">adrian@mail.capitalhubapp.com</code></div>
          <div><span className="text-muted-foreground">From name:</span> <code className="font-mono text-xs">Adrián Villanueva</code></div>
          <div><span className="text-muted-foreground">Dominio verificado:</span> <code className="font-mono text-xs">mail.capitalhubapp.com</code></div>
        </div>
        <p className="text-[10px] text-muted-foreground">Editar via env vars: <code>RESEND_FROM_EMAIL</code>, <code>RESEND_FROM_NAME</code></p>
      </section>

      <section className="rounded-md border border-green-500/40 bg-green-500/[0.04] p-3 space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-green-400">✓ Webhooks Resend activos</h3>
        <p className="text-xs text-muted-foreground">
          Tracking automático de aperturas, clicks, bounces, entregas y quejas. Las métricas del Dashboard se
          actualizan en tiempo real cuando los destinatarios interactúan con los emails.
        </p>
        <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
          <li>Endpoint: <code className="font-mono">os.capitalhubapp.com/api/email/webhooks/resend</code></li>
          <li>Estado: enabled en Resend dashboard</li>
          <li>Eventos suscritos: sent, delivered, opened, clicked, bounced, complained, failed</li>
        </ul>
      </section>

      <section className="rounded-md border border-border p-3 space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Brand y layout</h3>
        <p className="text-xs text-muted-foreground">
          Todos los templates usan <code className="font-mono">src/lib/email/templates/_layout.tsx</code> como base.
          Colores: verde Capital Hub (#37CA37), fondo oscuro (#0F0F12). Logo y unsubscribe link aplicables a todos
          en el _layout.
        </p>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  sublabel,
  suffix,
  accent,
}: {
  label: string
  value: number
  sublabel?: string
  suffix?: string
  accent?: "cyan" | "green" | "red" | "amber" | "purple"
}) {
  const colorClass = accent ? {
    cyan: "text-cyan-400",
    green: "text-green-400",
    red: "text-red-400",
    amber: "text-amber-400",
    purple: "text-purple-400",
  }[accent] : ""

  return (
    <div className="rounded-md border border-border bg-card/40 p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className={cn("text-2xl font-semibold", colorClass)}>{value}{suffix}</div>
      {sublabel && <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{sublabel}</div>}
    </div>
  )
}
