"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, Mail, Phone, Clock, ExternalLink, Filter, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  loadAllCalls,
  subscribeAllCalls,
  updateCallStatus,
  STATUS_META,
  type CallRow,
  type CallStatus,
} from "../services/calls-admin-service"
import { GoogleCalendarCard } from "./google-calendar-card"

const ALL_STATUSES: CallStatus[] = ["booked", "attended", "no_show", "cancelled", "rescheduled"]

export function CallsAdminPanel() {
  const [calls, setCalls] = useState<CallRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<Set<CallStatus>>(new Set(ALL_STATUSES))
  const [selectedCall, setSelectedCall] = useState<CallRow | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await loadAllCalls()
        if (cancelled) return
        setCalls(data)
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Error cargando llamadas")
        setLoading(false)
      }
    }
    load()
    const unsub = subscribeAllCalls(load)
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  const filtered = useMemo(
    () => calls.filter((c) => statusFilter.has(c.status)),
    [calls, statusFilter]
  )

  const now = Date.now()
  const upcoming = filtered.filter((c) => new Date(c.slot_start).getTime() >= now)
  const past = filtered.filter((c) => new Date(c.slot_start).getTime() < now).reverse() // más reciente primero

  const stats = useMemo(() => {
    const total = calls.length
    const booked = calls.filter((c) => c.status === "booked").length
    const attended = calls.filter((c) => c.status === "attended").length
    const no_show = calls.filter((c) => c.status === "no_show").length
    const upcomingCount = calls.filter((c) => c.status === "booked" && new Date(c.slot_start).getTime() >= now).length
    return { total, booked, attended, no_show, upcoming: upcomingCount }
  }, [calls, now])

  function toggleStatus(s: CallStatus) {
    setStatusFilter((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Google Calendar connection */}
      <GoogleCalendarCard />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Próximas" value={stats.upcoming} accent="cyan" />
        <StatCard label="Agendadas" value={stats.booked} />
        <StatCard label="Atendidas" value={stats.attended} accent="green" />
        <StatCard label="No-show" value={stats.no_show} accent="orange" />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Estado:</span>
        {ALL_STATUSES.map((s) => {
          const meta = STATUS_META[s]
          const active = statusFilter.has(s)
          return (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={cn(
                "flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-wide transition-opacity",
                meta.color,
                !active && "opacity-30"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Sections */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Cargando llamadas…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : (
        <>
          <CallsSection title="Próximas" calls={upcoming} emptyText="No hay llamadas próximas." onSelect={setSelectedCall} />
          <CallsSection title="Pasadas" calls={past} emptyText="Aún no hay llamadas pasadas." onSelect={setSelectedCall} dimmed />
        </>
      )}

      {selectedCall && (
        <CallDrawer call={selectedCall} onClose={() => setSelectedCall(null)} onStatusChange={(status) => {
          updateCallStatus(selectedCall.id, status)
          setSelectedCall({ ...selectedCall, status })
        }} />
      )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: "cyan" | "green" | "orange" }) {
  const colorMap = { cyan: "text-cyan-400", green: "text-green-400", orange: "text-orange-400" }
  return (
    <div className="rounded-sm border border-border bg-card/40 px-3 py-2.5">
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={cn("font-heading text-xl font-semibold", accent ? colorMap[accent] : "text-foreground")}>{value}</p>
    </div>
  )
}

function CallsSection({
  title,
  calls,
  emptyText,
  onSelect,
  dimmed,
}: {
  title: string
  calls: CallRow[]
  emptyText: string
  onSelect: (c: CallRow) => void
  dimmed?: boolean
}) {
  if (calls.length === 0) {
    return (
      <div>
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground/60 text-sm italic px-3 py-4">{emptyText}</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
        {title} <span className="text-muted-foreground/60">· {calls.length}</span>
      </h3>
      <div className={cn("rounded-sm border border-border bg-card/30 divide-y divide-border", dimmed && "opacity-70")}>
        {calls.map((call) => (
          <CallRowItem key={call.id} call={call} onSelect={() => onSelect(call)} />
        ))}
      </div>
    </div>
  )
}

function CallRowItem({ call, onSelect }: { call: CallRow; onSelect: () => void }) {
  const date = new Date(call.slot_start)
  const dateStr = date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }).replace(",", "")
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  const meta = STATUS_META[call.status]

  return (
    <button
      onClick={onSelect}
      className="w-full grid grid-cols-12 items-center gap-3 px-3 md:px-4 py-3 hover:bg-secondary/30 text-left transition-colors"
    >
      {/* Fecha + hora */}
      <div className="col-span-3 md:col-span-2">
        <p className="font-mono text-[10px] uppercase text-muted-foreground">{dateStr}</p>
        <p className="font-mono text-sm text-foreground">{timeStr}</p>
      </div>
      {/* Lead */}
      <div className="col-span-6 md:col-span-7 min-w-0">
        <p className="text-sm text-foreground truncate font-medium">{call.full_name || "Sin nombre"}</p>
        <p className="text-[11px] text-muted-foreground truncate">{call.email}</p>
      </div>
      {/* Status */}
      <div className="col-span-3 flex justify-end">
        <span className={cn("flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-mono uppercase", meta.color)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
      </div>
    </button>
  )
}

function CallDrawer({
  call,
  onClose,
  onStatusChange,
}: {
  call: CallRow
  onClose: () => void
  onStatusChange: (status: CallStatus) => void
}) {
  const date = new Date(call.slot_start)
  const dateStr = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  const endStr = new Date(call.slot_end).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  const meta = STATUS_META[call.status]

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-md border-l border-border bg-card overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Detalle de llamada</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-sm">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status badge */}
          <div className={cn("border rounded-sm px-3 py-2 inline-flex items-center gap-2", meta.color)}>
            <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
            <span className="font-mono text-xs uppercase tracking-wide">{meta.label}</span>
          </div>

          {/* Cuándo */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Cuándo</p>
            <p className="font-heading text-lg text-foreground capitalize">{dateStr}</p>
            <p className="text-muted-foreground text-sm font-mono mt-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {timeStr} – {endStr}
            </p>
          </div>

          {/* Lead */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Lead</p>
            <p className="font-medium text-foreground">{call.full_name || "Sin nombre"}</p>
            <a href={`mailto:${call.email}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mt-1">
              <Mail className="h-3 w-3" />
              {call.email}
            </a>
            {call.phone && (
              <a href={`tel:${call.phone}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mt-0.5">
                <Phone className="h-3 w-3" />
                {call.phone}
              </a>
            )}
          </div>

          {/* Notas del lead */}
          {call.notes && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Notas previas del lead</p>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap rounded-sm border border-border bg-secondary/30 p-3">{call.notes}</p>
            </div>
          )}

          {/* Meeting URL */}
          {call.meeting_url && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Videollamada</p>
              <a
                href={call.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 break-all"
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                {call.meeting_url}
              </a>
            </div>
          )}

          {/* Cambiar status */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Marcar como</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_STATUSES.filter((s) => s !== call.status).map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={cn("border rounded-sm px-3 py-2 text-xs font-mono uppercase tracking-wide hover:bg-secondary/50 transition-colors", STATUS_META[s].color)}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="border-t border-border pt-4 text-[11px] text-muted-foreground space-y-1 font-mono">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>Reservada el {new Date(call.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</span>
            </div>
            {call.source && <div>Fuente: {call.source}</div>}
            {call.lead_id && <div className="break-all">lead_id: {call.lead_id}</div>}
            <div className="break-all">call_id: {call.id}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
