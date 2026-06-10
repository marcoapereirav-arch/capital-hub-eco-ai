"use client"

import { useEffect, useState } from "react"
import { Mail, Send, FileText, Settings, BarChart3, Search, Filter, CheckCircle2, XCircle, Eye, MousePointerClick } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { cn } from "@/lib/utils"

type Stats = {
  last24h: { total: number; failed: number }
  last7d: { total: number; failed: number }
  last30d: { total: number; failed: number; opened: number; clicked: number }
  topTemplates: { template: string; total: number; failed: number }[]
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
}

const CATEGORY_COLORS: Record<string, string> = {
  lifecycle: "text-cyan-400 border-cyan-500/40",
  calendar: "text-amber-400 border-amber-500/40",
  transactional: "text-green-400 border-green-500/40",
  retargeting: "text-purple-400 border-purple-500/40",
  auth: "text-blue-400 border-blue-500/40",
  internal: "text-muted-foreground border-border/40",
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
            · Resend + React Email · 17 templates registrados
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

  useEffect(() => {
    fetch("/api/admin/email/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-muted-foreground py-6">Cargando…</div>
  if (!stats) return <div className="text-sm text-muted-foreground py-6">Sin datos</div>

  const openRate30d = stats.last30d.total > 0 ? (stats.last30d.opened / stats.last30d.total) * 100 : 0
  const clickRate30d = stats.last30d.total > 0 ? (stats.last30d.clicked / stats.last30d.total) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Últimas 24h" value={stats.last24h.total} sublabel={`${stats.last24h.failed} fallidos`} accent={stats.last24h.failed > 0 ? "red" : "cyan"} />
        <StatCard label="Últimos 7 días" value={stats.last7d.total} sublabel={`${stats.last7d.failed} fallidos`} accent={stats.last7d.failed > 0 ? "red" : "green"} />
        <StatCard label="Open rate 30d" value={Math.round(openRate30d)} sublabel={`${stats.last30d.opened} aperturas`} suffix="%" accent="amber" />
        <StatCard label="Click rate 30d" value={Math.round(clickRate30d)} sublabel={`${stats.last30d.clicked} clicks`} suffix="%" accent="purple" />
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">Top templates (últimos 7d)</h2>
        {stats.topTemplates.length === 0 ? (
          <div className="text-xs text-muted-foreground p-3 border border-dashed border-border rounded-sm">
            Sin envíos en los últimos 7 días.
          </div>
        ) : (
          <div className="rounded-md border border-border/40 divide-y divide-border/40">
            {stats.topTemplates.map((t) => (
              <div key={t.template} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-mono text-xs">{t.template}</span>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider">
                  <span className="text-muted-foreground">{t.total} envíos</span>
                  {t.failed > 0 && <span className="text-red-400">{t.failed} fallos</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Tracking en vivo</h2>
        <div className="rounded-md border border-green-500/40 bg-green-500/[0.04] p-3 text-xs text-muted-foreground">
          ✓ <strong className="text-green-400">Webhooks activos:</strong> Resend nos notifica aperturas, clicks,
          bounces, entregas y quejas en tiempo real vía{" "}
          <code className="font-mono text-foreground">/api/email/webhooks/resend</code>.
          Open rate y click rate se actualizan automáticamente cuando los destinatarios interactúan.
        </div>
      </section>
    </div>
  )
}

function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<Template | null>(null)

  useEffect(() => {
    fetch("/api/admin/email/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-muted-foreground py-6">Cargando…</div>

  // Agrupar por category
  const byCategory = new Map<string, Template[]>()
  for (const t of templates) {
    const arr = byCategory.get(t.category) ?? []
    arr.push(t)
    byCategory.set(t.category, arr)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {templates.length} templates registrados. Click en cualquiera para previsualizar con datos demo.
        Para editar el copy modifica el archivo TSX en <code className="font-mono">src/lib/email/templates/</code>.
      </p>

      {Array.from(byCategory.entries()).map(([cat, list]) => (
        <section key={cat}>
          <h2 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">{cat}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {list.map((t) => (
              <button
                key={t.key}
                onClick={() => setPreview(t)}
                className="rounded-md border border-border/40 p-3 hover:border-border hover:bg-card/40 transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="text-sm font-medium">{t.label}</div>
                  <span className={cn(
                    "text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border shrink-0",
                    CATEGORY_COLORS[t.category] ?? "border-border/40"
                  )}>
                    {t.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{t.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono text-muted-foreground">key: {t.key}</div>
                  <div className="text-[10px] font-mono text-foreground/60 underline">Ver preview →</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}

      {preview && <PreviewModal template={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

function PreviewModal({ template, onClose }: { template: Template; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border rounded-lg w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{template.label}</h3>
            <p className="text-[10px] font-mono text-muted-foreground">key: {template.key}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs font-mono uppercase tracking-wider">
            Cerrar ✕
          </button>
        </div>
        <iframe
          src={`/api/admin/email/preview/${template.key}`}
          className="flex-1 w-full bg-white"
          title={`Preview ${template.label}`}
        />
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
        <div className="rounded-md border border-border/40 divide-y divide-border/40">
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
      <section className="rounded-md border border-border/40 p-3 space-y-2">
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
          <li>Endpoint: <code className="font-mono">ecoai.capitalhubapp.com/api/email/webhooks/resend</code></li>
          <li>Estado: enabled en Resend dashboard</li>
          <li>Eventos suscritos: sent, delivered, opened, clicked, bounced, complained, failed</li>
        </ul>
      </section>

      <section className="rounded-md border border-border/40 p-3 space-y-2">
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
    <div className="rounded-md border border-border/40 bg-card/40 p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className={cn("text-2xl font-semibold", colorClass)}>{value}{suffix}</div>
      {sublabel && <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{sublabel}</div>}
    </div>
  )
}
