"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, Play, AlertCircle, Loader2, Send, Check, X, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { LoadingScreen } from "@/components/ui/loading-screen"
import {
  loadMetaEvents,
  subscribeMetaEvents,
  triggerManualEvent,
  KNOWN_EVENTS,
  EVENT_LABELS,
  STATUS_META,
  type MetaEventLog,
  type EventStatus,
} from "../services/ads-events-service"

const ALL_STATUSES: EventStatus[] = ["sent", "pending", "failed", "dedup"]

// Desplegable nativo con los 44 puntos del dedo y los colores del tema: en el kit
// todavia no hay componente Select propio.
const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-border bg-secondary px-3 text-base text-foreground md:h-8 md:text-sm"
const INPUT_CLASS =
  "h-11 w-full rounded-lg border border-border bg-secondary px-3 text-base text-foreground placeholder:text-muted-foreground md:h-8 md:text-sm"

/**
 * Toggle Test/Live del envío a Meta CAPI (tabla app_settings · key meta_capi_mode).
 * - TEST: los eventos van a "Eventos de prueba" de Meta (NO optimizan ads). Para probar.
 * - LIVE: data real que optimiza campañas. Activar antes de encender anuncios.
 */
function MetaModeToggle() {
  const [mode, setMode] = useState<"test" | "live" | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/settings/meta_capi_mode")
      .then((r) => r.json())
      .then((d) => setMode(d?.value?.mode === "live" ? "live" : "test"))
      .catch(() => setMode("test"))
  }, [])

  async function setTo(next: "test" | "live") {
    if (saving || mode === next) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings/meta_capi_mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: { mode: next } }),
      })
      if (res.ok) setMode(next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">Envío a Meta:</span>
        {mode === null ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex items-center gap-1">
            {(["test", "live"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTo(m)}
                disabled={saving}
                className={cn(
                  "h-11 rounded-lg border px-3 text-[15px] font-semibold transition-colors disabled:opacity-50 md:h-8 md:text-sm",
                  mode === m
                    ? m === "live"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/50 bg-secondary text-foreground"
                    : "border-border bg-secondary text-muted-foreground"
                )}
              >
                {m === "live" ? "Live (real)" : "Test"}
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="text-sm text-muted-foreground">
        {mode === "live"
          ? "Los eventos cuentan para optimizar anuncios."
          : "Modo prueba: los eventos NO optimizan anuncios."}
      </span>
    </div>
  )
}

export function AdsTrackerPanel() {
  const [events, setEvents] = useState<MetaEventLog[]>([])
  const [loading, setLoading] = useState(true)
  const [eventFilter, setEventFilter] = useState<Set<string>>(new Set(KNOWN_EVENTS))
  const [statusFilter, setStatusFilter] = useState<Set<EventStatus>>(new Set(ALL_STATUSES))
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showManualModal, setShowManualModal] = useState(false)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const data = await loadMetaEvents(200)
      if (!cancelled) {
        setEvents(data)
        setLoading(false)
      }
    }
    load()
    const unsub = subscribeMetaEvents(load)
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  const filtered = useMemo(
    () => events.filter((e) => eventFilter.has(e.event_name) && statusFilter.has(e.status)),
    [events, eventFilter, statusFilter]
  )

  const stats = useMemo(() => {
    const total = events.length
    const sent = events.filter((e) => e.status === "sent").length
    const failed = events.filter((e) => e.status === "failed").length
    const matchRate = total > 0 ? Math.round((sent / total) * 100) : 0
    return { total, sent, failed, matchRate }
  }, [events])

  // Cuantos filtros estan quitando cosas de la lista: es el numero que se enseña
  // en el boton "Filtros" del telefono.
  const filtrosActivos =
    (KNOWN_EVENTS.length - eventFilter.size) + (ALL_STATUSES.length - statusFilter.size)

  function toggleEvent(name: string) {
    setEventFilter((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }
  function toggleStatus(s: EventStatus) {
    setStatusFilter((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const cuerpoFiltros = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-muted-foreground">Evento</span>
        <div className="flex flex-wrap gap-2">
          {KNOWN_EVENTS.map((name) => {
            const active = eventFilter.has(name)
            return (
              <button
                key={name}
                onClick={() => toggleEvent(name)}
                aria-pressed={active}
                className={cn(
                  "h-11 rounded-lg border px-3 text-[15px] transition-colors md:h-8 md:text-sm",
                  active
                    ? "border-primary/50 bg-primary/10 font-semibold text-foreground"
                    : "border-border bg-secondary text-muted-foreground"
                )}
              >
                {EVENT_LABELS[name] ?? name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-muted-foreground">Status</span>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => {
            const meta = STATUS_META[s]
            const active = statusFilter.has(s)
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                aria-pressed={active}
                className={cn(
                  "h-11 rounded-lg border px-3 text-[15px] transition-colors md:h-8 md:text-sm",
                  meta.color,
                  // El encendido se marca con anillo verde y negrita, no solo con el
                  // relleno: el estado Dedup se pinta en gris y el apagado tambien,
                  // asi que sin esto ese boton se veia igual encendido y apagado.
                  active
                    ? "ring-2 ring-primary/40 font-semibold"
                    : "border-border bg-secondary text-muted-foreground"
                )}
              >
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Toggle Test/Live del envío a Meta */}
      <MetaModeToggle />

      {/* Fila de numeros */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatBox label="Total 200 últimos" value={stats.total} />
        <StatBox label="Enviados OK" value={stats.sent} tono="bien" />
        <StatBox label="Fallidos" value={stats.failed} tono="mal" />
        <StatBox label="Send rate" value={`${stats.matchRate}%`} />
      </div>

      {/* TELEFONO: la accion principal y un solo boton de Filtros que abre una
          hoja inferior. Once chips apilados no parecian una aplicacion. */}
      <div className="flex gap-2 md:hidden">
        <button
          onClick={() => setShowManualModal(true)}
          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[15px] font-semibold text-primary-foreground active:opacity-90"
        >
          <Send className="h-4 w-4" />
          Disparar evento
        </button>
        <button
          onClick={() => setFiltrosAbiertos(true)}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border px-4 text-[15px] text-foreground active:bg-muted"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {filtrosActivos > 0 && <span className="tabular-nums">({filtrosActivos})</span>}
        </button>
      </div>

      {/* MONITOR: los filtros a la vista, en fila */}
      <div className="hidden md:flex md:flex-col md:gap-3">
        {cuerpoFiltros}
        <div className="flex justify-end">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-[15px] font-semibold text-primary-foreground hover:opacity-90 md:h-8 md:text-sm"
          >
            <Send className="h-4 w-4" />
            Disparar evento manual
          </button>
        </div>
      </div>

      <Sheet open={filtrosAbiertos} onOpenChange={setFiltrosAbiertos}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" />
          <SheetTitle className="px-4 pt-2 text-[17px] font-semibold">Filtros</SheetTitle>
          <div className="px-4 pb-4">{cuerpoFiltros}</div>
          <div className="sticky bottom-0 border-t border-border bg-popover px-4 pt-3 pb-safe-4">
            <button
              onClick={() => setFiltrosAbiertos(false)}
              className="h-11 w-full rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90"
            >
              Ver resultados
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Lista de eventos */}
      {loading ? (
        <LoadingScreen fullscreen={false} className="min-h-[200px] rounded-lg" />
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-[17px] font-semibold text-foreground">Sin eventos para los filtros activos</h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            Cuando se dispare un evento desde el funnel aparecerá aquí en tiempo real.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card/30">
          {filtered.map((event) => (
            <EventRow key={event.id} event={event} expanded={expanded.has(event.id)} onToggle={() => toggleExpand(event.id)} />
          ))}
        </div>
      )}

      {showManualModal && <ManualEventModal onClose={() => setShowManualModal(false)} />}
    </div>
  )
}

function StatBox({ label, value, tono = "normal" }: { label: string; value: string | number; tono?: "normal" | "bien" | "mal" }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 px-3 py-2.5">
      <p className="mb-1 text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-heading text-xl font-semibold tabular-nums",
          tono === "bien" ? "text-primary" : tono === "mal" ? "text-destructive" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  )
}

function EventRow({ event, expanded, onToggle }: { event: MetaEventLog; expanded: boolean; onToggle: () => void }) {
  const meta = STATUS_META[event.status]
  const date = new Date(event.created_at)
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const dateStr = date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })

  return (
    <div>
      {/* TELEFONO: ficha apilada. MONITOR: la rejilla de doce columnas de siempre. */}
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full min-h-[56px] flex-col gap-1 px-3 py-3 text-left transition-colors active:bg-secondary/30 md:grid md:grid-cols-12 md:items-center md:gap-2 md:px-4 md:py-2.5 md:hover:bg-secondary/30"
      >
        <div className="flex items-center gap-2 md:col-span-1">
          <span className="text-muted-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          <span className="text-sm tabular-nums text-muted-foreground md:hidden">
            {dateStr} · {timeStr}
          </span>
        </div>
        <div className="hidden text-sm tabular-nums text-muted-foreground md:col-span-2 md:block">
          <div>{dateStr}</div>
          <div>{timeStr}</div>
        </div>
        <div className="min-w-0 md:col-span-4">
          <p className="truncate text-[15px] text-foreground md:text-sm">{event.event_name}</p>
          <p className="truncate text-sm text-muted-foreground">{event.email ?? "—"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:contents">
          <span className="text-sm tabular-nums text-muted-foreground md:col-span-2">
            {event.value != null ? `${event.value} ${event.currency ?? ""}` : ""}
          </span>
          <span className="text-sm text-muted-foreground md:col-span-1">{event.source}</span>
          <span className="md:col-span-2 md:flex md:justify-end">
            <span className={cn("inline-block rounded-sm border px-2 py-0.5 text-sm", meta.color)}>{meta.label}</span>
          </span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border bg-card/50 px-4 py-3 text-sm">
          <Field label="event_id" value={event.event_id} />
          {event.triggered_by && <Field label="Disparado por" value={event.triggered_by} />}
          {event.url && <Field label="URL origen" value={event.url} />}
          {event.lead_id && <Field label="lead_id" value={event.lead_id} />}
          {event.meta_fbtrace_id && <Field label="Meta fbtrace_id" value={event.meta_fbtrace_id} />}
          {event.error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1.5">
              <p className="mb-0.5 text-sm font-semibold text-destructive">Error</p>
              <p className="text-sm whitespace-pre-wrap text-destructive">{event.error}</p>
            </div>
          )}
          {event.meta_response && (
            <details className="group">
              <summary className="cursor-pointer py-2 text-sm font-semibold text-muted-foreground md:py-0 md:hover:text-foreground">Meta response (JSON)</summary>
              {/* JSON literal: aqui la fuente de maquina de escribir SI es correcta
                  (la pone el navegador para <pre>), porque es codigo, no interfaz. */}
              <pre className="mt-1 max-h-48 overflow-x-auto rounded-lg bg-background p-2 text-sm text-muted-foreground">
                {JSON.stringify(event.meta_response, null, 2)}
              </pre>
            </details>
          )}
          {event.request_payload && (
            <details className="group">
              <summary className="cursor-pointer py-2 text-sm font-semibold text-muted-foreground md:py-0 md:hover:text-foreground">Request payload (JSON)</summary>
              <pre className="mt-1 max-h-48 overflow-x-auto rounded-lg bg-background p-2 text-sm text-muted-foreground">
                {JSON.stringify(event.request_payload, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="shrink-0 text-sm font-semibold text-muted-foreground">{label}</span>
      <span className="min-w-0 text-sm break-all text-foreground">{value}</span>
    </div>
  )
}

function ManualEventModal({ onClose }: { onClose: () => void }) {
  const [eventName, setEventName] = useState<string>(KNOWN_EVENTS[0])
  const [email, setEmail] = useState("")
  const [value, setValue] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    ok: boolean
    eventId?: string
    fbtraceId?: string
    eventsReceived?: number
    metaMessages?: unknown[]
    error?: string
  } | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)
    setResult(null)
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setValidationError("Email inválido")
      return
    }
    setSubmitting(true)
    const r = await triggerManualEvent({
      event_name: eventName,
      email: email.trim().toLowerCase(),
      value: value ? Number(value) : undefined,
      currency: "EUR",
    })
    setSubmitting(false)
    setResult(r)
  }

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const metaTestEventsUrl = pixelId
    ? `https://business.facebook.com/events_manager2/list/dataset/${pixelId}/test_events`
    : "https://business.facebook.com/events_manager2"

  return (
    // Hoja inferior en telefono y cajon por la derecha en monitor, decidido con
    // clases: `useIsMobile()` miente en el primer pintado y la ventana saltaba.
    <Sheet open onOpenChange={(abierto) => { if (!abierto) onClose() }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          "gap-0 rounded-t-xl p-0",
          "md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:w-full md:max-w-lg md:rounded-l-xl md:border-l",
          "md:data-[side=bottom]:max-h-none md:data-[side=bottom]:overflow-y-auto md:data-[side=bottom]:pb-0"
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-popover px-4 py-3">
          <SheetTitle className="min-w-0 flex-1 text-[17px] font-semibold">Disparar evento manual a Meta CAPI</SheetTitle>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted md:h-8 md:w-8"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4" noValidate>
          <div>
            <label className="mb-1.5 block text-[15px] font-semibold text-muted-foreground">Evento</label>
            <select
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              disabled={submitting}
              className={SELECT_CLASS}
            >
              {KNOWN_EVENTS.map((n) => (
                <option key={n} value={n}>{EVENT_LABELS[n] ?? n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[15px] font-semibold text-muted-foreground">Email del lead</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="next"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              placeholder="usuario@ejemplo.com"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[15px] font-semibold text-muted-foreground">Valor (opcional, EUR)</label>
            <input
              type="number"
              inputMode="decimal"
              enterKeyHint="done"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
            />
          </div>

          {validationError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2.5">
              <p className="text-sm text-destructive">{validationError}</p>
            </div>
          )}

          {result && !result.ok && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                <X className="h-4 w-4" /> Falló el envío
              </p>
              <p className="text-sm text-destructive">{result.error}</p>
            </div>
          )}

          {result && result.ok && (
            <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/10 p-3">
              <div className="flex items-start gap-2 text-primary">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="min-w-0 text-[15px] font-semibold">
                  Meta confirmó recepción · events_received: <span className="tabular-nums">{result.eventsReceived ?? "?"}</span>
                </p>
              </div>
              <div className="space-y-1.5 text-sm text-foreground">
                <div>
                  <span className="text-muted-foreground">event_id:</span> <span className="break-all">{result.eventId}</span>
                </div>
                {result.fbtraceId && (
                  <div>
                    <span className="text-muted-foreground">meta fbtrace_id:</span> <span className="break-all">{result.fbtraceId}</span>
                  </div>
                )}
                {result.metaMessages && result.metaMessages.length > 0 && (
                  <div className="mt-2 border-l-2 border-warn pl-2">
                    <span className="text-warn">Meta messages:</span>
                    <pre className="mt-1 text-sm whitespace-pre-wrap text-warn">{JSON.stringify(result.metaMessages, null, 2)}</pre>
                  </div>
                )}
              </div>
              <div className="space-y-2 border-t border-primary/30 pt-3">
                <p className="text-sm font-semibold text-primary">Cómo verificar en Meta</p>
                <ol className="list-inside list-decimal space-y-1 text-sm text-foreground">
                  <li>Abre <a href={metaTestEventsUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta Events Manager → Probar eventos</a></li>
                  <li>Si tienes un test event code activo, verás el evento llegar en segundos</li>
                  <li>Sin test code: el evento va a producción real (tarda ~30 min en aparecer en Resumen)</li>
                </ol>
                <p className="pt-2 text-sm font-semibold text-primary">Cómo verificar en el OS</p>
                <p className="text-sm text-foreground">
                  Cierra este modal → la fila aparece arriba en el Tracker con badge verde &quot;Enviado&quot; · click para expandir y ver request/response completo.
                </p>
              </div>
            </div>
          )}

          {/* sticky, no fixed: lo que se desplaza es la hoja, y fixed se queda
              pegado a la ventana, que es justo lo que tapa el teclado. */}
          <div className="sticky bottom-0 -mx-4 border-t border-border bg-popover px-4 pt-3 pb-safe-4 md:pb-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Disparar evento
                </>
              )}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
