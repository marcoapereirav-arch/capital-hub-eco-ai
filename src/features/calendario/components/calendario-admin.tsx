"use client"

import { useEffect, useState } from "react"
import { Calendar, Trash2, Plus, AlertTriangle, CheckCircle2, ExternalLink, XCircle, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageContainer } from "@/components/ui/page-container"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { LoadingScreen } from "@/components/ui/loading-screen"

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

/** Campo o desplegable del tema: 44 puntos en telefono, letra de 16. */
const CLASES_CAMPO =
  "h-11 w-full min-w-0 rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"

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
    return (
      <>
        <PageContainer>
          <LoadingScreen fullscreen={false} className="min-h-[240px]" />
        </PageContainer>
      </>
    )
  }

  const now = Date.now()
  const upcoming = bookings.filter((b) => new Date(b.start_at).getTime() >= now && b.status === "booked")
  const past = bookings.filter((b) => new Date(b.start_at).getTime() < now)

  const pestanas = [
    ["calendly", "Calendly"],
    ["bookings", `Calendar propio (${upcoming.length})`],
    ["rules", `Horarios (${rules.length})`],
    ["settings", "Configuración"],
  ] as const

  return (
    <>
      <PageContainer>
        {/* Subheader info */}
        <div>
          <p className="text-[15px] text-muted-foreground md:text-sm">
            Owner: {owner?.display_name ?? "Adrián"} · slots de {owner?.slot_minutes ?? 30} min · {owner?.buffer_minutes ?? 10} min buffer
          </p>
          <p className="mt-2 text-[15px] text-muted-foreground md:text-sm">
            URL pública para reservar: <a href="/agenda" className="text-primary underline">/agenda</a>
          </p>
        </div>

        {/* Pestañas: tira deslizable de 44 puntos, sale de los margenes del shell
            para que se entienda que hay mas a la derecha */}
        <div className="-mx-4 flex snap-x gap-1 overflow-x-auto border-b border-border px-4 md:-mx-6 md:px-6">
          {pestanas.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                // Sin `-mb-px`: al declarar overflow-x el navegador calcula overflow-y
                // como auto, y ese margen negativo dejaba la tira con 1 punto de
                // desplazamiento vertical.
                "h-11 shrink-0 snap-start border-b-2 px-3 text-[15px] whitespace-nowrap transition-colors md:h-10 md:text-sm",
                tab === k
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground md:hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CALENDLY */}
        {tab === "calendly" && <CalendlyEventsTab />}

        {/* RESERVAS PROPIAS */}
        {tab === "bookings" && (
          <div className="space-y-4">
            {upcoming.length === 0 && past.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground" />
                <h3 className="text-[17px] font-semibold text-foreground">Todavía no hay reservas</h3>
                <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                  Las llamadas que reserven desde la página pública aparecen aquí.
                </p>
                <a
                  href="/agenda"
                  className="inline-flex h-11 items-center rounded-lg border border-border px-4 text-[15px] text-foreground"
                >
                  Ver la página pública
                </a>
              </div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <section>
                    <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Próximas</h2>
                    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                      {upcoming.map((b) => <BookingRow key={b.id} booking={b} />)}
                    </div>
                  </section>
                )}
                {past.length > 0 && (
                  <section>
                    <h2 className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">Pasadas</h2>
                    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border opacity-60">
                      {past.slice(0, 30).map((b) => <BookingRow key={b.id} booking={b} />)}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* HORARIOS */}
        {tab === "rules" && (
          <div className="space-y-4">
            <p className="text-[15px] text-muted-foreground md:text-sm">
              Horarios recurrentes en los que estás disponible. Los slots se generan automáticamente dentro de estas ventanas.
            </p>

            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {rules.length === 0 ? (
                <div className="px-4 py-4 text-[15px] text-muted-foreground">Sin reglas todavía.</div>
              ) : (
                rules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3 text-[15px] text-foreground">
                      <span className="w-14 shrink-0 text-sm text-muted-foreground">{WEEKDAYS_SHORT[r.weekday]}</span>
                      <span className="tabular-nums">
                        {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteRule(r.id)}
                      aria-label="Borrar horario"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground md:h-9 md:w-9 md:hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Añadir horario: una columna en telefono, fila en ordenador */}
            <div className="space-y-3 rounded-xl border border-border bg-card p-3">
              <span className="text-sm font-semibold text-muted-foreground">Añadir horario</span>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
                <label className="flex min-w-0 flex-col gap-1.5">
                  <Etiqueta>Día</Etiqueta>
                  <select
                    value={newRule.weekday}
                    onChange={(e) => setNewRule({ ...newRule, weekday: parseInt(e.target.value) })}
                    className={CLASES_CAMPO}
                  >
                    {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </label>
                <label className="flex min-w-0 flex-col gap-1.5">
                  <Etiqueta>Desde</Etiqueta>
                  <input
                    type="time"
                    value={newRule.start}
                    onChange={(e) => setNewRule({ ...newRule, start: e.target.value })}
                    className={`${CLASES_CAMPO} tabular-nums`}
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5">
                  <Etiqueta>Hasta</Etiqueta>
                  <input
                    type="time"
                    value={newRule.end}
                    onChange={(e) => setNewRule({ ...newRule, end: e.target.value })}
                    className={`${CLASES_CAMPO} tabular-nums`}
                  />
                </label>
                <button
                  onClick={addRule}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 md:h-9 md:text-sm"
                >
                  <Plus className="h-4 w-4" /> Añadir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURACION */}
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

            {/* Estado de Google Calendar */}
            <div className={cn(
              "rounded-xl border p-3",
              owner.google_oauth_connected_at ? "border-primary/30 bg-primary/5" : "border-warn/40 bg-warn/5"
            )}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {owner.google_oauth_connected_at ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-warn" />
                  )}
                  <span className="min-w-0 text-[15px] text-foreground md:text-sm">
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
                    className="inline-flex h-11 shrink-0 items-center rounded-lg border border-border px-3 text-[15px] text-muted-foreground md:h-8 md:text-sm"
                  >
                    Desconectar
                  </button>
                )}
              </div>

              {!owner.google_oauth_connected_at ? (
                <a
                  href="/api/admin/google-calendar/connect"
                  className="mt-1 inline-flex h-11 items-center gap-1.5 text-[15px] text-warn underline md:h-8 md:text-sm"
                >
                  Conectar ahora <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <a
                  href="/api/admin/google-calendar/connect"
                  className="mt-1 inline-flex h-11 items-center gap-1.5 text-[15px] text-muted-foreground underline md:h-8 md:text-sm"
                >
                  Reconectar (emite token nuevo) <ExternalLink className="h-4 w-4" />
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
    // En telefono la fila se apila: la fecha arriba, quien viene debajo y el
    // estado al lado. Ninguna pieza de texto lleva shrink-0.
    <div className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-row md:items-center md:gap-3">
        <div className="shrink-0 text-sm text-muted-foreground tabular-nums md:w-32">
          {date} · {time}
        </div>
        {/* El recorte va en la caja, no en el <span>: sobre una caja en linea
            `truncate` solo deja el "no partir lineas", asi que un nombre largo se
            salia de la fila sin puntos suspensivos. */}
        <div className="min-w-0 truncate text-[15px] text-foreground md:text-sm">
          <span>{booking.attendee_name}</span>
          <span className="ml-2 text-sm text-muted-foreground">{booking.attendee_email}</span>
        </div>
      </div>
      <span className={cn(
        "w-fit shrink-0 rounded-sm border px-2 py-0.5 text-sm",
        booking.status === "booked" && "border-border bg-muted text-muted-foreground",
        booking.status === "attended" && "border-primary/40 bg-primary/10 text-primary",
        booking.status === "no_show" && "border-warn/40 bg-warn/10 text-warn",
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
      {/* Periodo + filtros. En telefono cada uno en su linea. */}
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <PeriodFilter value={range} onChange={setRange} defaultPreset="30d" />
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            aria-label="Estado de la reserva"
            className={CLASES_CAMPO}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="canceled">Canceladas</option>
            <option value="no_show">No show</option>
          </select>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            aria-label="Tipo de evento"
            className={CLASES_CAMPO}
          >
            <option value="all">Todos los event types</option>
            {eventTypes.map((et) => <option key={et.uri} value={et.uri}>{et.name}</option>)}
          </select>
        </div>
      </div>

      {/* Numeros del rango */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <KpiCard icon={Calendar} label="Reservas" value={kpis.total} tono="normal" />
        <KpiCard icon={CheckCircle2} label="Activas" value={kpis.active} tono="bueno" />
        <KpiCard icon={XCircle} label="Canceladas" value={kpis.canceled} tono="error" />
        <KpiCard icon={UserX} label="No show" value={kpis.no_show} tono="aviso" />
      </div>

      {/* Lista */}
      {loading ? (
        <LoadingScreen fullscreen={false} className="min-h-[200px]" />
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <h3 className="text-[17px] font-semibold text-foreground">
            {events.length === 0 ? "Sin reservas en este período" : "Ninguna reserva coincide"}
          </h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            {events.length === 0
              ? "Cambia el período de arriba para ver otras fechas."
              : "Quita algún filtro para ver más resultados."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
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
    active: "border-primary/40 bg-primary/10 text-primary",
    canceled: "border-destructive/40 bg-destructive/10 text-destructive",
    no_show: "border-warn/40 bg-warn/10 text-warn",
  }
  const statusLabels: Record<string, string> = {
    active: "Activa",
    canceled: "Cancelada",
    no_show: "No show",
  }
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground tabular-nums">
            {dateStr} · {timeStr}
          </span>
          {event.event_type_name && (
            <span className="rounded-sm border border-border px-1.5 py-0.5 text-sm text-muted-foreground">
              {event.event_type_name} ({event.event_type_duration}min)
            </span>
          )}
          <span className={cn(
            "rounded-sm border px-1.5 py-0.5 text-sm",
            statusColors[event.status ?? ""] ?? "border-border text-muted-foreground"
          )}>
            {statusLabels[event.status ?? ""] ?? event.status}
          </span>
        </div>
        <div className="text-[15px] text-foreground md:text-sm">
          {event.invitee_name ?? "(sin nombre)"}
          <span className="ml-2 text-sm text-muted-foreground">{event.invitee_email}</span>
          {event.invitee_phone && (
            <span className="ml-2 text-sm text-muted-foreground tabular-nums">· {event.invitee_phone}</span>
          )}
        </div>
        {event.invitee_cancellation_reason && (
          <div className="mt-1 text-sm text-destructive">
            Razón cancelación: {event.invitee_cancellation_reason}
          </div>
        )}
      </div>
      {event.meeting_url && (
        <a
          href={event.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground md:h-8 md:w-8 md:hover:text-foreground"
          title="Abrir meeting"
          aria-label="Abrir meeting"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tono,
}: {
  icon: typeof Calendar
  label: string
  value: number
  tono: "normal" | "bueno" | "error" | "aviso"
}) {
  const color =
    tono === "bueno" ? "text-primary"
      : tono === "error" ? "text-destructive"
        : tono === "aviso" ? "text-warn"
          : "text-foreground"
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4 shrink-0", color)} />
      </div>
      <div className={cn("text-2xl leading-none font-semibold tabular-nums", color)}>{value}</div>
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
      <label className="mb-1.5 block">
        <Etiqueta>{label}</Etiqueta>
      </label>
      <div className="flex gap-2">
        <input
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          inputMode={type === "number" ? "numeric" : undefined}
          enterKeyHint="done"
          className={`${CLASES_CAMPO} flex-1`}
        />
        <button
          onClick={() => onChange(draft)}
          disabled={draft === value}
          className="h-11 shrink-0 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-30 md:h-9 md:text-sm"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}

/**
 * Etiqueta de un campo. Va en su propio componente a proposito: escrita pegada
 * al <input> el candado la confunde con la letra DEL campo (mira dos lineas
 * arriba y dos abajo) y bloquea el guardado. Aqui la clase no toca ningun campo.
 */
function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-muted-foreground">{children}</span>
}
