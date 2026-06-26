"use client"

import { useEffect, useState } from "react"
import { Calendar, Trash2, Plus, AlertTriangle, CheckCircle2, ExternalLink, ExternalLink as ExtLink, XCircle, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageContainer } from "@/components/ui/page-container"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { ShellHeader } from "@/features/shell/components/shell-header"

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

type Owner = {
  id: string
  display_name: string
  email: string
  timezone: string
  slot_minutes: number
  buffer_minutes: number
  meeting_url: string | null
  active: boolean
  google_oauth_email: string | null
  google_oauth_connected_at: string | null
}

type Rule = {
  id: string
  owner_id: string
  weekday: number
  start_time: string
  end_time: string
}

type Booking = {
  id: string
  start_at: string
  end_at: string
  attendee_name: string
  attendee_email: string
  attendee_phone: string | null
  notes: string | null
  meeting_url: string | null
  status: string
}

export function CalendarioAdmin() {
  const [owner, setOwner] = useState<Owner | null>(null)
  const [rules, setRules] = useState<Rule[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"calendly" | "bookings" | "rules" | "settings">("calendly")
  const [newRule, setNewRule] = useState<{ weekday: number; start: string; end: string }>({ weekday: 1, start: "10:00", end: "14:00" })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [oRes, rRes, bRes] = await Promise.all([
        fetch("/api/admin/calendar/owners").then((r) => r.json()),
        fetch("/api/admin/calendar/availability-rules?owner=adrian").then((r) => r.json()),
        fetch("/api/admin/calendar/bookings?owner=adrian").then((r) => r.json()),
      ])
      setOwner(oRes.owners?.[0] ?? null)
      setRules(rRes.rules ?? [])
      setBookings(bRes.bookings ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function addRule() {
    await fetch("/api/admin/calendar/availability-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner_id: "adrian",
        weekday: newRule.weekday,
        start_time: newRule.start + ":00",
        end_time: newRule.end + ":00",
      }),
    })
    load()
  }

  async function deleteRule(id: string) {
    await fetch(`/api/admin/calendar/availability-rules?id=${id}`, { method: "DELETE" })
    load()
  }

  async function updateOwner(patch: Partial<Owner>) {
    if (!owner) return
    await fetch("/api/admin/calendar/owners", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: owner.id, ...patch }),
    })
    load()
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando calendario…</div>
  }

  const now = Date.now()
  const upcoming = bookings.filter((b) => new Date(b.start_at).getTime() >= now && b.status === "booked")
  const past = bookings.filter((b) => new Date(b.start_at).getTime() < now)

  return (
    <>
      <ShellHeader title="Calendario" />
      <PageContainer>
        {/* Subheader info */}
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Owner: {owner?.display_name ?? "Adrián"} · slots de {owner?.slot_minutes ?? 30} min · {owner?.buffer_minutes ?? 10} min buffer
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            URL pública para reservar: <a href="/agenda" className="font-mono underline">/agenda</a>
          </p>
        </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {([
          ["calendly", "Calendly"],
          ["bookings", `Calendar propio (${upcoming.length})`],
          ["rules", `Horarios (${rules.length})`],
          ["settings", "Configuración"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "px-3 py-1.5 text-sm transition-colors border-b-2 -mb-px",
              tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* CALENDLY TAB */}
      {tab === "calendly" && <CalendlyEventsTab />}

      {/* BOOKINGS TAB */}
      {tab === "bookings" && (
        <div className="space-y-4">
          {upcoming.length === 0 && past.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Aún no hay reservas. La URL pública es <a href="/agenda" className="underline">/agenda</a>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section>
                  <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Próximas</h2>
                  <div className="rounded-md border border-border divide-y divide-border">
                    {upcoming.map((b) => <BookingRow key={b.id} booking={b} />)}
                  </div>
                </section>
              )}
              {past.length > 0 && (
                <section>
                  <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 mt-6">Pasadas</h2>
                  <div className="rounded-md border border-border divide-y divide-border opacity-60">
                    {past.slice(0, 30).map((b) => <BookingRow key={b.id} booking={b} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* RULES TAB */}
      {tab === "rules" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Horarios recurrentes en los que estás disponible. Los slots se generan automáticamente dentro de estas ventanas.
          </p>

          <div className="rounded-md border border-border divide-y divide-border">
            {rules.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">Sin reglas todavía.</div>
            ) : (
              rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-xs uppercase w-14 text-muted-foreground">{WEEKDAYS_SHORT[r.weekday]}</span>
                    <span>
                      {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}
                    </span>
                  </div>
                  <button onClick={() => deleteRule(r.id)} className="text-muted-foreground hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add rule */}
          <div className="rounded-md border border-border p-3 space-y-2 bg-card/30">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Añadir horario</label>
            <div className="flex items-center gap-2">
              <select
                value={newRule.weekday}
                onChange={(e) => setNewRule({ ...newRule, weekday: parseInt(e.target.value) })}
                className="rounded-sm border border-border bg-background px-2 py-1 text-xs"
              >
                {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
              <input
                type="time"
                value={newRule.start}
                onChange={(e) => setNewRule({ ...newRule, start: e.target.value })}
                className="rounded-sm border border-border bg-background px-2 py-1 text-xs"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <input
                type="time"
                value={newRule.end}
                onChange={(e) => setNewRule({ ...newRule, end: e.target.value })}
                className="rounded-sm border border-border bg-background px-2 py-1 text-xs"
              />
              <button
                onClick={addRule}
                className="rounded-sm bg-foreground text-background px-3 py-1 text-xs font-mono uppercase tracking-wider hover:opacity-90"
              >
                <Plus className="h-3 w-3 inline -mt-0.5" /> Añadir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {tab === "settings" && owner && (
        <div className="space-y-4">
          <Field
            label="Duración del slot (minutos)"
            value={String(owner.slot_minutes)}
            onChange={(v) => updateOwner({ slot_minutes: parseInt(v, 10) })}
            type="number"
          />
          <Field
            label="Buffer entre llamadas (minutos)"
            value={String(owner.buffer_minutes)}
            onChange={(v) => updateOwner({ buffer_minutes: parseInt(v, 10) })}
            type="number"
          />
          <Field
            label="URL del Zoom (PMI)"
            value={owner.meeting_url ?? ""}
            onChange={(v) => updateOwner({ meeting_url: v || null })}
            placeholder="https://us06web.zoom.us/j/..."
          />

          {/* Google Calendar status */}
          <div className={cn(
            "rounded-md border p-3",
            owner.google_oauth_connected_at ? "border-green-500/30 bg-green-500/5" : "border-amber-500/40 bg-amber-500/5"
          )}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {owner.google_oauth_connected_at ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                )}
                <span className="text-sm">
                  Google Calendar: {owner.google_oauth_connected_at ? `Conectado (${owner.google_oauth_email})` : "Sin conectar"}
                </span>
              </div>

              {owner.google_oauth_connected_at && (
                <button
                  onClick={async () => {
                    if (!confirm("¿Desconectar Google Calendar? Tendrás que volver a conectar después.")) return
                    await fetch("/api/admin/google-calendar/disconnect", { method: "POST" })
                    load()
                  }}
                  className="text-[10px] font-mono uppercase tracking-wider border border-border rounded-sm px-2 py-1 hover:bg-card text-muted-foreground"
                >
                  Desconectar
                </button>
              )}
            </div>

            {!owner.google_oauth_connected_at ? (
              <a
                href="/api/admin/google-calendar/connect"
                className="inline-flex items-center gap-1 mt-1 text-xs font-mono uppercase tracking-wider text-amber-400 hover:underline"
              >
                Conectar ahora <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <a
                href="/api/admin/google-calendar/connect"
                className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:underline"
              >
                Reconectar (emite token nuevo) <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        </div>
      )}
      </PageContainer>
    </>
  )
}

function BookingRow({ booking }: { booking: Booking }) {
  const d = new Date(booking.start_at)
  const date = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  return (
    <div className="px-3 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground w-28 shrink-0">
          {date} · {time}
        </div>
        <div className="text-sm truncate">
          {booking.attendee_name}
          <span className="text-muted-foreground text-xs ml-2">{booking.attendee_email}</span>
        </div>
      </div>
      <span className={cn(
        "text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border",
        booking.status === "booked" && "border-cyan-500/40 text-cyan-400",
        booking.status === "attended" && "border-green-500/40 text-green-400",
        booking.status === "no_show" && "border-orange-500/40 text-orange-400",
        booking.status === "cancelled" && "border-border text-muted-foreground",
      )}>
        {booking.status}
      </span>
    </div>
  )
}

type CalendlyEvent = {
  uri: string
  name: string | null
  start_time: string
  end_time: string | null
  status: string | null
  meeting_url: string | null
  invitee_email: string | null
  invitee_name: string | null
  invitee_phone: string | null
  invitee_cancellation_reason: string | null
  event_type_uri: string | null
  event_type_name: string | null
  event_type_duration: number | null
}

type CalendlyKpis = { total: number; active: number; canceled: number; no_show: number }

/**
 * Tab Calendly — reservas sincronizadas vía webhook desde Calendly.
 * Filtrado por rango de fechas via PeriodFilter (mismo componente que el resto del OS).
 * KPIs del header dependen del rango activo.
 */
function CalendlyEventsTab() {
  const [range, setRange] = useState<PeriodRange | undefined>(undefined)
  const [events, setEvents] = useState<CalendlyEvent[]>([])
  const [kpis, setKpis] = useState<CalendlyKpis>({ total: 0, active: 0, canceled: 0, no_show: 0 })
  const [eventTypes, setEventTypes] = useState<{ uri: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "canceled" | "no_show">("all")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")

  useEffect(() => {
    if (!range) return
    setLoading(true)
    const params = new URLSearchParams({
      from: range.from.toISOString().slice(0, 10),
      to: range.to.toISOString().slice(0, 10),
    })
    fetch(`/api/admin/calendly/events?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events ?? [])
        setKpis(d.kpis ?? { total: 0, active: 0, canceled: 0, no_show: 0 })
        setEventTypes(d.event_types ?? [])
      })
      .finally(() => setLoading(false))
  }, [range])

  const filtered = events.filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false
    if (eventTypeFilter !== "all" && e.event_type_uri !== eventTypeFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filtro de período + filtros */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <PeriodFilter value={range} onChange={setRange} defaultPreset="30d" />
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-sm border border-border bg-background px-2 py-1.5 text-xs"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="canceled">Canceladas</option>
            <option value="no_show">No show</option>
          </select>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="rounded-sm border border-border bg-background px-2 py-1.5 text-xs"
          >
            <option value="all">Todos los event types</option>
            {eventTypes.map((et) => <option key={et.uri} value={et.uri}>{et.name}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs del rango */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <KpiCard icon={Calendar} label="Reservas" value={kpis.total} color="text-foreground" />
        <KpiCard icon={CheckCircle2} label="Activas" value={kpis.active} color="text-green-400" />
        <KpiCard icon={XCircle} label="Canceladas" value={kpis.canceled} color="text-red-400" />
        <KpiCard icon={UserX} label="No show" value={kpis.no_show} color="text-amber-400" />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground rounded-md border border-dashed border-border">
          {events.length === 0
            ? "Sin reservas en este período."
            : "Ninguna reserva matchea los filtros."}
        </div>
      ) : (
        <div className="rounded-md border border-border divide-y divide-border">
          {filtered.map((e) => <CalendlyEventRow key={e.uri} event={e} />)}
        </div>
      )}
    </div>
  )
}

function CalendlyEventRow({ event }: { event: CalendlyEvent }) {
  const d = new Date(event.start_time)
  const dateStr = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", year: "2-digit" })
  const timeStr = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  const statusColors: Record<string, string> = {
    active: "border-green-500/40 text-green-400 bg-green-500/[0.05]",
    canceled: "border-red-500/40 text-red-400 bg-red-500/[0.05]",
    no_show: "border-amber-500/40 text-amber-400 bg-amber-500/[0.05]",
  }
  const statusLabels: Record<string, string> = {
    active: "Activa",
    canceled: "Cancelada",
    no_show: "No show",
  }
  return (
    <div className="px-3 py-3 flex items-start justify-between gap-3 hover:bg-card/30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {dateStr} · {timeStr}
          </span>
          {event.event_type_name && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border border-border text-muted-foreground">
              {event.event_type_name} ({event.event_type_duration}min)
            </span>
          )}
          <span className={cn(
            "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border",
            statusColors[event.status ?? ""] ?? "border-border text-muted-foreground"
          )}>
            {statusLabels[event.status ?? ""] ?? event.status}
          </span>
        </div>
        <div className="text-sm">
          {event.invitee_name ?? "(sin nombre)"}
          <span className="text-muted-foreground text-xs ml-2">{event.invitee_email}</span>
          {event.invitee_phone && (
            <span className="text-muted-foreground text-xs ml-2">· {event.invitee_phone}</span>
          )}
        </div>
        {event.invitee_cancellation_reason && (
          <div className="text-xs text-red-400/80 mt-1 italic">
            Razón cancelación: {event.invitee_cancellation_reason}
          </div>
        )}
      </div>
      {event.meeting_url && (
        <a
          href={event.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          title="Abrir meeting"
        >
          <ExtLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: typeof Calendar; label: string; value: number; color: string }) {
  return (
    <div className="rounded-md border border-border bg-card/30 px-3 py-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <div className={cn("text-xl font-semibold leading-none", color)}>{value}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => { setDraft(value) }, [value])
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-sm border border-border bg-background px-2 py-1.5 text-sm font-mono"
        />
        <button
          onClick={() => onChange(draft)}
          disabled={draft === value}
          className="rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-30"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}
