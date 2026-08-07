"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Mail, Send, FileText, Settings, BarChart3, Search, CheckCircle2, XCircle, Eye, MousePointerClick, X } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { LoadingScreen } from "@/components/ui/loading-screen"
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

// La marca es carbon + verde. Lo bueno va en verde (primary), lo que falla en
// rojo del tema (destructive) y lo que pide atencion en ambar de aviso (warn).
// Ninguna otra familia de color entra en la pantalla.
const FREQ_META: Record<string, { label: string; className: string }> = {
  alta: { label: "ALTA", className: "border-destructive/40 bg-destructive/10 text-destructive" },
  media: { label: "MEDIA", className: "border-warn/40 bg-warn/10 text-warn" },
  baja: { label: "BAJA", className: "border-border bg-muted text-muted-foreground" },
}

// Clase compartida de los desplegables nativos. No hay componente Select en el
// kit todavia, asi que al menos miden 44 puntos y llevan los colores del tema.
const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground md:h-8 md:w-auto md:text-sm"

const TABS = [
  ["dashboard", "Dashboard", BarChart3],
  ["templates", "Plantillas", FileText],
  ["logs", "Envíos", Send],
  ["broadcasts", "Broadcasts", Mail],
  ["config", "Configuración", Settings],
] as const

export function EmailMarketingPage() {
  const [tab, setTab] = useState<"dashboard" | "templates" | "logs" | "broadcasts" | "config">("dashboard")

  return (
    <>

      <PageContainer>
        <div className="flex flex-wrap items-center gap-2">
          <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">Email Marketing</h1>
          <span className="text-sm text-muted-foreground">· Resend + React Email</span>
        </div>

        {/* Tira de pestanas: se sale del margen del contenedor para que la
            primera y la ultima toquen el borde y se vea que hay mas. */}
        <div className="-mx-4 flex snap-x gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
          {TABS.map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "-mb-px flex h-11 shrink-0 snap-start items-center gap-1.5 border-b-2 px-3 text-[15px] whitespace-nowrap transition-colors md:h-9 md:text-sm",
                tab === k
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground md:hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" /> {label}
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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Métricas {stats?.range ? `· ${new Date(stats.range.from).toLocaleDateString("es-ES")} – ${new Date(stats.range.to).toLocaleDateString("es-ES")}` : ""}
        </p>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {loading || !stats ? (
        <LoadingScreen fullscreen={false} className="min-h-[200px] rounded-lg" />
      ) : (
        <>
          {/* Fila de numeros: dos columnas en telefono, seis en monitor */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Enviados" value={stats.metrics.total} />
            <StatCard label="Entregados" value={stats.metrics.delivered} sublabel={`${stats.metrics.deliveryRate}%`} tone="positive" />
            <StatCard label="Abiertos" value={stats.metrics.opened} sublabel={`${stats.metrics.openRate}%`} />
            <StatCard label="Clicados" value={stats.metrics.clicked} sublabel={`${stats.metrics.clickRate}%`} />
            <StatCard label="Bounces" value={stats.metrics.bounced} sublabel={`${stats.metrics.bounceRate}%`} tone={stats.metrics.bounced > 0 ? "negative" : "neutral"} />
            <StatCard label="Fallidos" value={stats.metrics.failed} sublabel={`${stats.metrics.failureRate}%`} tone={stats.metrics.failed > 0 ? "negative" : "neutral"} />
          </div>

          <section className="space-y-2">
            <h2 className="text-[15px] font-semibold">Top templates en el período</h2>
            {stats.topTemplates.length === 0 ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-8 text-center">
                <h3 className="text-[17px] font-semibold text-foreground">Sin envíos en este rango</h3>
                <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                  Cambia el filtro de período para ver otras fechas.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {stats.topTemplates.map((t) => {
                  const openR = t.total > 0 ? Math.round((t.opened / t.total) * 100) : 0
                  const clickR = t.total > 0 ? Math.round((t.clicked / t.total) * 100) : 0
                  return (
                    <div key={t.template} className="flex flex-col gap-1 px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-3">
                      <span className="min-w-0 truncate text-[15px] text-foreground">{t.template}</span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="tabular-nums">{t.total} envíos</span>
                        <span className="tabular-nums">{openR}% open</span>
                        <span className="tabular-nums">{clickR}% click</span>
                        {t.failed > 0 && <span className="tabular-nums text-destructive">{t.failed} fallos</span>}
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

  if (loading) return <LoadingScreen fullscreen={false} className="min-h-[200px] rounded-lg" />

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
  const groups = new Map<string, { label: string; order: number; items: Template[] }>()
  for (const t of filtered) {
    const groupKey = t.group ?? t.category ?? "otros"
    const existing = groups.get(groupKey)
    if (existing) {
      existing.items.push(t)
    } else {
      groups.set(groupKey, {
        label: t.group_label ?? t.category ?? "Otros",
        order: t.group_order ?? 99,
        items: [t],
      })
    }
  }
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => a[1].order - b[1].order)

  return (
    <div className="space-y-4">
      {/* La busqueda ocupa su propia linea en telefono */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
        <p className="text-sm text-muted-foreground md:min-w-0 md:flex-1">
          {templates.length} plantillas editables · click para editar asunto + HTML visualmente · cambios sin redeploy
        </p>
        <div className="relative w-full md:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar plantilla…"
            type="search"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
          {/* La frase de abajo es del dueno y se conserva literal: el titulo se
              anade encima, no la sustituye. */}
          <h3 className="text-[17px] font-semibold text-foreground">Sin resultados</h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            Ninguna plantilla matchea &quot;{search}&quot;.
          </p>
        </div>
      )}

      {sortedGroups.map(([groupKey, group]) => (
        <section key={groupKey} className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{group.label}</h2>
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {group.items.length} {group.items.length === 1 ? "plantilla" : "plantillas"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {group.items.map((t) => {
              const freq = FREQ_META[t.frequency ?? "baja"]
              return (
              <button
                key={t.key}
                onClick={() => setEditing(t)}
                className="rounded-lg border border-border bg-background p-3 text-left transition-colors active:bg-muted md:hover:border-primary/40"
              >
                <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 text-[15px] leading-tight font-medium">{t.label}</div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    {t.paused && (
                      <span
                        className="rounded-sm border border-warn/40 bg-warn/10 px-1.5 py-0.5 text-sm font-semibold text-warn"
                        title="Esta plantilla esta pausada. NO se envia."
                      >
                        pausado
                      </span>
                    )}
                    {t.hasOverride && (
                      <span className="rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-sm font-semibold text-primary">
                        editado
                      </span>
                    )}
                    {freq && (
                      <span
                        className={cn("rounded-sm border px-1.5 py-0.5 text-sm font-semibold", freq.className)}
                        title={`Frecuencia de envio: ${freq.label}`}
                      >
                        {freq.label}
                      </span>
                    )}
                  </div>
                </div>
                {/* TRIGGER - lo más visual: cuándo se dispara este email */}
                {t.trigger && (
                  <div className="mb-2 rounded-sm border-l-2 border-primary/50 bg-muted/60 py-1 pl-2">
                    <div className="mb-0.5 text-sm font-semibold text-muted-foreground">Se envía cuando</div>
                    <p className="text-sm leading-snug text-foreground">{t.trigger}</p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{t.key}</div>
                  <div className="shrink-0 text-sm font-semibold text-primary">Editar →</div>
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
    // Dentro del iframe no llegan ni las clases ni las variables del tema: es otro
    // documento. Por eso las pistas de edicion se dibujan SIN color propio
    // (currentColor y un brillo), que es lo unico que funciona sobre cualquier
    // plantilla sin meter un color de marca equivocado.
    const editorScript = `
      <style>
        body { outline: none !important; cursor: text; }
        body:focus, *:focus { outline: 1px dashed currentColor !important; outline-offset: 2px; }
        a { pointer-events: none !important; }
        [contenteditable=true]:hover { filter: brightness(1.08); }
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
    <Sheet open onOpenChange={(abierto) => { if (!abierto) onClose() }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          // TELEFONO: hoja inferior que se desplaza entera
          "gap-0 rounded-t-xl p-0",
          // MONITOR: cajon ancho por la derecha, decidido con clases y cero JavaScript
          "md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:w-[min(72rem,92vw)] md:max-w-none md:rounded-l-xl md:border-l",
          "md:data-[side=bottom]:max-h-none md:data-[side=bottom]:overflow-hidden md:data-[side=bottom]:pb-0"
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />

        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-[17px] font-semibold">{template.label}</SheetTitle>
            <p className="truncate text-sm text-muted-foreground">
              Haz click sobre cualquier texto del email y escribe directamente.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted md:h-8 md:w-8"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 space-y-3 border-b border-border px-4 py-3">
          <label className="block">
            <span className="text-sm font-semibold text-muted-foreground">
              Asunto del email <span className="text-destructive">*</span>
            </span>
            <Input
              type="text"
              value={subject}
              enterKeyHint="done"
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toolbar formato */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => applyCommand("bold")}
                className="h-11 w-11 rounded-lg border border-border text-[15px] font-bold text-foreground active:bg-muted md:h-8 md:w-8 md:text-sm"
                title="Negrita (Ctrl+B)"
              >B</button>
              <button
                onClick={() => applyCommand("italic")}
                className="h-11 w-11 rounded-lg border border-border text-[15px] text-foreground italic active:bg-muted md:h-8 md:w-8 md:text-sm"
                title="Itálica (Ctrl+I)"
              >I</button>
              <button
                onClick={() => applyCommand("underline")}
                className="h-11 w-11 rounded-lg border border-border text-[15px] text-foreground underline active:bg-muted md:h-8 md:w-8 md:text-sm"
                title="Subrayado (Ctrl+U)"
              >U</button>
            </div>
            {/* Variables */}
            {template.variables && template.variables.length > 0 && (
              <>
                <span className="text-sm font-semibold text-muted-foreground">
                  Insertar variable:
                </span>
                {template.variables.map((v) => (
                  <button
                    key={v}
                    onClick={() => insertText(`{{${v}}}`)}
                    className="h-11 rounded-lg border border-border bg-muted px-2.5 text-sm text-foreground active:bg-secondary md:h-8"
                    title="Insertar en la posición del cursor"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* En telefono la hoja entera se desplaza, asi que el lienzo lleva alto
            propio; en monitor ocupa lo que sobra del cajon.
            Lleva shrink-0 porque la hoja es flex-col con tope de alto: sin el, era
            el UNICO hijo encogible y toda la presion de desbordamiento caia aqui,
            asi que el 52dvh se quedaba en una franja de 70 puntos y la hoja
            tampoco se desplazaba, porque tras encogerse ya "cabia". */}
        <div className="h-[52dvh] shrink-0 bg-muted md:h-auto md:min-h-0 md:flex-1 md:shrink">
          <iframe
            ref={iframeRef}
            title="editor"
            srcDoc={initialSrcDoc}
            className="h-full w-full"
          />
        </div>

        {err && (
          <div className="shrink-0 border-t border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {err}
          </div>
        )}

        {/* La accion principal va anclada abajo con sticky (no fixed): el
            desplazamiento real lo hace la hoja, y fixed se queda pegado a la
            ventana, que es justo lo que tapa el teclado. */}
        <div className="sticky bottom-0 z-10 flex shrink-0 flex-col gap-2 border-t border-border bg-popover px-4 py-3 pb-safe-4 md:flex-row md:items-center md:justify-end md:pb-3">
          <button
            onClick={save}
            disabled={saving || !subject.trim()}
            className="h-11 w-full rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-40 md:order-last md:h-8 md:w-auto md:text-sm"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
            <button
              onClick={togglePause}
              disabled={togglingPause}
              className={cn(
                "h-11 rounded-lg border px-3 text-[15px] font-semibold disabled:opacity-40 md:h-8 md:text-sm",
                paused
                  ? "border-primary/50 text-primary active:bg-primary/10"
                  : "border-warn/50 text-warn active:bg-warn/10"
              )}
              title={paused ? "Reactivar envio" : "Pausar envio (no se enviara aunque exista cron)"}
            >
              {togglingPause ? "..." : paused ? "Reactivar envio" : "Pausar envio"}
            </button>
            {template.hasOverride && (
              <button
                onClick={deleteOverride}
                disabled={reset}
                className="h-11 rounded-lg border border-destructive/40 px-3 text-[15px] font-semibold text-destructive active:bg-destructive/10 disabled:opacity-40 md:h-8 md:text-sm"
                title="Borrar tu version y volver al texto original del codigo"
              >
                {reset ? "Restaurando..." : "Volver al original"}
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
      {/* La busqueda ocupa su propia linea; los dos desplegables van debajo
          repartidos a mitades, cada uno a 44 puntos. */}
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <div className="relative w-full md:max-w-md md:min-w-0 md:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load() }}
            placeholder="Buscar email, asunto, nombre…"
            type="search"
            enterKeyHint="search"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={SELECT_CLASS}>
            <option value="all">Todos los estados</option>
            <option value="sent">Enviados OK</option>
            <option value="failed">Fallidos</option>
          </select>
          <select value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)} className={SELECT_CLASS}>
            <option value="all">Todos los templates</option>
            {uniqueTemplates.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingScreen fullscreen={false} className="min-h-[200px] rounded-lg" />
      ) : logs.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
          <h3 className="text-[17px] font-semibold text-foreground">Sin envíos con esos filtros</h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            Cambia el estado o la plantilla para ver otros envíos.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {logs.map((l) => (
            <div key={l.id} className="flex flex-col gap-1 px-3 py-3 md:grid md:grid-cols-[1fr_auto_auto] md:items-center md:gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[15px]">
                  {l.status === "sent"
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    : <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
                  <span className="min-w-0 truncate">{l.subject}</span>
                </div>
                <div className="truncate text-sm text-muted-foreground">
                  {l.template} · {l.to_email}{l.to_name ? ` (${l.to_name})` : ""}
                </div>
                {l.error && <div className="mt-0.5 truncate text-sm text-destructive">{l.error}</div>}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {l.opened_at && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-primary" /> Abierto
                  </span>
                )}
                {l.clicked_at && (
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="h-4 w-4 text-primary" /> Click
                  </span>
                )}
              </div>
              <div className="text-sm tabular-nums text-muted-foreground">
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
      <div className="rounded-xl border border-warn/40 bg-warn/10 p-4">
        <h3 className="mb-1 text-[15px] font-semibold">Próximamente</h3>
        <p className="text-sm text-muted-foreground">
          Enviar emails a segmentos de contactos (ej: todos los stage=won con producto IA Integrator).
          Requiere:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
          <li>Selector de segmento (filtros sobre tabla contacts)</li>
          <li>Editor de copy con template base + variables (nombre, producto, etc)</li>
          <li>Vista previa antes de enviar</li>
          <li>Programar envío (now / fecha futura)</li>
          <li>Log de qué contactos lo recibieron</li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          Cuando lo necesites, dímelo y lo construyo. Estimo ~6h.
        </p>
      </div>
    </div>
  )
}

function ConfigTab() {
  return (
    <div className="space-y-3">
      <section className="space-y-2 rounded-xl border border-border bg-card p-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Resend</h3>
        <div className="space-y-1 text-[15px]">
          <div className="break-words"><span className="text-muted-foreground">From email:</span> adrian@mail.capitalhubapp.com</div>
          <div className="break-words"><span className="text-muted-foreground">From name:</span> Adrián Villanueva</div>
          <div className="break-words"><span className="text-muted-foreground">Dominio verificado:</span> mail.capitalhubapp.com</div>
        </div>
        <p className="text-sm text-muted-foreground">Editar via env vars: RESEND_FROM_EMAIL, RESEND_FROM_NAME</p>
      </section>

      <section className="space-y-2 rounded-xl border border-primary/40 bg-primary/10 p-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <CheckCircle2 className="h-4 w-4" /> Webhooks Resend activos
        </h3>
        <p className="text-sm text-muted-foreground">
          Tracking automático de aperturas, clicks, bounces, entregas y quejas. Las métricas del Dashboard se
          actualizan en tiempo real cuando los destinatarios interactúan con los emails.
        </p>
        <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
          <li className="break-words">Endpoint: os.capitalhubapp.com/api/email/webhooks/resend</li>
          <li>Estado: enabled en Resend dashboard</li>
          <li>Eventos suscritos: sent, delivered, opened, clicked, bounced, complained, failed</li>
        </ul>
      </section>

      <section className="space-y-2 rounded-xl border border-border bg-card p-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Brand y layout</h3>
        <p className="text-sm break-words text-muted-foreground">
          Todos los templates usan src/lib/email/templates/_layout.tsx como base.
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
  tone = "neutral",
}: {
  label: string
  value: number
  sublabel?: string
  tone?: "neutral" | "positive" | "negative"
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "positive" && "text-primary",
          tone === "negative" && "text-destructive"
        )}
      >
        {value}
      </div>
      {sublabel && <div className="mt-0.5 text-sm tabular-nums text-muted-foreground">{sublabel}</div>}
    </div>
  )
}
