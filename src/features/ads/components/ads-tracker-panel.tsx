"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, Play, AlertCircle, Loader2, Send, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
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

export function AdsTrackerPanel() {
  const [events, setEvents] = useState<MetaEventLog[]>([])
  const [loading, setLoading] = useState(true)
  const [eventFilter, setEventFilter] = useState<Set<string>>(new Set(KNOWN_EVENTS))
  const [statusFilter, setStatusFilter] = useState<Set<EventStatus>>(new Set(ALL_STATUSES))
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showManualModal, setShowManualModal] = useState(false)

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

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatBox label="Total 200 últimos" value={stats.total} />
        <StatBox label="Enviados OK" value={stats.sent} accent="green" />
        <StatBox label="Fallidos" value={stats.failed} accent="red" />
        <StatBox label="Send rate" value={`${stats.matchRate}%`} accent="cyan" />
      </div>

      {/* Filtros + acciones */}
      <div className="flex flex-col gap-3">
        {/* Eventos */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Evento:</span>
          {KNOWN_EVENTS.map((name) => {
            const active = eventFilter.has(name)
            return (
              <button
                key={name}
                onClick={() => toggleEvent(name)}
                className={cn(
                  "rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-wide transition-opacity",
                  "border-border bg-secondary text-foreground",
                  !active && "opacity-30"
                )}
              >
                {EVENT_LABELS[name] ?? name}
              </button>
            )
          })}
        </div>

        {/* Status + acción manual */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Status:</span>
            {ALL_STATUSES.map((s) => {
              const meta = STATUS_META[s]
              const active = statusFilter.has(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={cn("rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-wide transition-opacity", meta.color, !active && "opacity-30")}
                >
                  {meta.label}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-2.5 py-1.5 text-xs hover:bg-secondary/70 font-mono uppercase tracking-wide"
          >
            <Send className="h-3.5 w-3.5" />
            Disparar evento manual
          </button>
        </div>
      </div>

      {/* Lista de eventos */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Cargando eventos…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 font-mono text-xs uppercase tracking-wide text-muted-foreground">Sin eventos para los filtros activos</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground/60">Cuando se dispare un evento desde el funnel aparecerá aquí en tiempo real.</p>
        </div>
      ) : (
        <div className="rounded-sm border border-border bg-card/30 divide-y divide-border">
          {filtered.map((event) => (
            <EventRow key={event.id} event={event} expanded={expanded.has(event.id)} onToggle={() => toggleExpand(event.id)} />
          ))}
        </div>
      )}

      {showManualModal && <ManualEventModal onClose={() => setShowManualModal(false)} />}
    </div>
  )
}

function StatBox({ label, value, accent }: { label: string; value: string | number; accent?: "green" | "red" | "cyan" }) {
  const colors = { green: "text-green-400", red: "text-red-400", cyan: "text-cyan-400" }
  return (
    <div className="rounded-sm border border-border bg-card/40 px-3 py-2.5">
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={cn("font-heading text-xl font-semibold", accent ? colors[accent] : "text-foreground")}>{value}</p>
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
      <button onClick={onToggle} className="w-full grid grid-cols-12 items-center gap-2 px-3 md:px-4 py-2.5 hover:bg-secondary/30 text-left transition-colors">
        <div className="col-span-1 text-muted-foreground">{expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</div>
        <div className="col-span-2 font-mono text-[10px] text-muted-foreground">
          <div>{dateStr}</div>
          <div>{timeStr}</div>
        </div>
        <div className="col-span-4 min-w-0">
          <p className="text-sm text-foreground font-mono truncate">{event.event_name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{event.email ?? "—"}</p>
        </div>
        <div className="col-span-2 text-xs text-muted-foreground font-mono">
          {event.value != null ? `${event.value} ${event.currency ?? ""}` : ""}
        </div>
        <div className="col-span-1 text-[10px] text-muted-foreground font-mono uppercase">{event.source}</div>
        <div className="col-span-2 flex justify-end">
          <span className={cn("rounded-sm border px-2 py-0.5 text-[10px] font-mono uppercase", meta.color)}>{meta.label}</span>
        </div>
      </button>

      {expanded && (
        <div className="bg-card/50 border-t border-border px-4 py-3 space-y-3 text-[11px]">
          <Field label="event_id" value={event.event_id} mono />
          {event.triggered_by && <Field label="Disparado por" value={event.triggered_by} mono />}
          {event.url && <Field label="URL origen" value={event.url} />}
          {event.lead_id && <Field label="lead_id" value={event.lead_id} mono />}
          {event.meta_fbtrace_id && <Field label="Meta fbtrace_id" value={event.meta_fbtrace_id} mono />}
          {event.error && (
            <div className="border border-red-500/40 bg-red-500/5 rounded-sm px-2 py-1.5">
              <p className="font-mono text-[10px] uppercase tracking-wider text-red-400 mb-0.5">Error</p>
              <p className="text-red-300 text-xs whitespace-pre-wrap">{event.error}</p>
            </div>
          )}
          {event.meta_response && (
            <details className="group">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">Meta response (JSON)</summary>
              <pre className="mt-1 text-[10px] bg-zinc-900/60 p-2 rounded-sm overflow-x-auto text-zinc-300 max-h-48">
                {JSON.stringify(event.meta_response, null, 2)}
              </pre>
            </details>
          )}
          {event.request_payload && (
            <details className="group">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">Request payload (JSON)</summary>
              <pre className="mt-1 text-[10px] bg-zinc-900/60 p-2 rounded-sm overflow-x-auto text-zinc-300 max-h-48">
                {JSON.stringify(event.request_payload, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-foreground/90 break-all", mono && "font-mono text-[11px]")}>{value}</span>
    </div>
  )
}

function ManualEventModal({ onClose }: { onClose: () => void }) {
  const [eventName, setEventName] = useState<string>(KNOWN_EVENTS[0])
  const [email, setEmail] = useState("")
  const [value, setValue] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Email inválido")
      return
    }
    setSubmitting(true)
    const result = await triggerManualEvent({
      event_name: eventName,
      email: email.trim().toLowerCase(),
      value: value ? Number(value) : undefined,
      currency: "EUR",
    })
    setSubmitting(false)
    if (result.ok) {
      setSuccess(`Evento disparado: ${result.eventId}`)
      setEmail("")
      setValue("")
    } else {
      setError(result.error ?? "Falló el envío")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md border border-border bg-card rounded-sm shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Disparar evento manual</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Evento</label>
            <select
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              disabled={submitting}
              className="w-full rounded-sm border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              {KNOWN_EVENTS.map((n) => (
                <option key={n} value={n}>{EVENT_LABELS[n] ?? n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Email del lead</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              placeholder="usuario@ejemplo.com"
              className="w-full rounded-sm border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Valor (opcional, EUR)</label>
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={submitting}
              className="w-full rounded-sm border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            />
          </div>
          {error && (
            <div className="border border-red-500/40 bg-red-500/10 rounded-sm p-2.5">
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}
          {success && (
            <div className="border border-green-500/40 bg-green-500/10 rounded-sm p-2.5 flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-green-400" />
              <p className="text-green-300 text-xs font-mono">{success}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-foreground text-background py-2.5 font-mono uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Disparar evento
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
