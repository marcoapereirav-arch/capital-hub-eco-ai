"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, Trash2, Plus, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [tab, setTab] = useState<"bookings" | "rules" | "settings">("bookings")
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
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Calendario</h1>
        </div>
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
          ["bookings", `Reservas (${upcoming.length})`],
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
                  <div className="rounded-md border border-border/40 divide-y divide-border/40">
                    {upcoming.map((b) => <BookingRow key={b.id} booking={b} />)}
                  </div>
                </section>
              )}
              {past.length > 0 && (
                <section>
                  <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 mt-6">Pasadas</h2>
                  <div className="rounded-md border border-border/40 divide-y divide-border/40 opacity-60">
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

          <div className="rounded-md border border-border/40 divide-y divide-border/40">
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
          <div className="rounded-md border border-border/40 p-3 space-y-2 bg-card/30">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Añadir horario</label>
            <div className="flex items-center gap-2">
              <select
                value={newRule.weekday}
                onChange={(e) => setNewRule({ ...newRule, weekday: parseInt(e.target.value) })}
                className="rounded-sm border border-border/40 bg-background px-2 py-1 text-xs"
              >
                {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
              <input
                type="time"
                value={newRule.start}
                onChange={(e) => setNewRule({ ...newRule, start: e.target.value })}
                className="rounded-sm border border-border/40 bg-background px-2 py-1 text-xs"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <input
                type="time"
                value={newRule.end}
                onChange={(e) => setNewRule({ ...newRule, end: e.target.value })}
                className="rounded-sm border border-border/40 bg-background px-2 py-1 text-xs"
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
            <div className="flex items-center gap-2 mb-1">
              {owner.google_oauth_connected_at ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              )}
              <span className="text-sm">
                Google Calendar: {owner.google_oauth_connected_at ? `Conectado (${owner.google_oauth_email})` : "Sin conectar"}
              </span>
            </div>
            {!owner.google_oauth_connected_at && (
              <a
                href="/api/admin/google-calendar/connect"
                className="inline-flex items-center gap-1 mt-2 text-xs font-mono uppercase tracking-wider text-amber-400 hover:underline"
              >
                Conectar ahora <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
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
        booking.status === "cancelled" && "border-border/40 text-muted-foreground",
      )}>
        {booking.status}
      </span>
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
          className="flex-1 rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm font-mono"
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
