"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Calendar, Mail, Phone, Clock, ExternalLink, Filter, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { ListaPaginada } from "@/components/ui/lista-paginada"
import {
  loadAllCalls,
  subscribeAllCalls,
  updateCallStatus,
  STATUS_META,
  type CallRow,
  type CallStatus,
} from "../services/calls-admin-service"
import { GoogleCalendarCard } from "./google-calendar-card"
import { MeetingUrlCard } from "./meeting-url-card"

const ALL_STATUSES: CallStatus[] = ["booked", "attended", "no_show", "cancelled", "rescheduled"]

/**
 * Pinta la ventana en el `body`, nunca anidada donde vive la lista.
 *
 * Por que: si un padre tiene desenfoque o `transform`, por norma de CSS pasa a ser
 * el marco de referencia de todo lo que es `fixed`, y la ventana deja de cubrir la
 * pantalla: se encoge, se descoloca y se solapa con lo de detras. Es lo que le
 * pasaba a Marco en el iPhone el 2026-08-08.
 */
function enElBody(nodo: React.ReactNode) {
  if (typeof document === "undefined") return null
  return createPortal(nodo, document.body)
}

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

  /** Cambia cuando cambian los filtros: la lista vuelve a la pagina 1. */
  const claveDeFiltros = useMemo(
    () => ALL_STATUSES.filter((s) => statusFilter.has(s)).join(","),
    [statusFilter]
  )

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

      {/* Link Zoom (PMI de Adrián) */}
      <MeetingUrlCard />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Próximas" value={stats.upcoming} accent="marca" />
        <StatCard label="Agendadas" value={stats.booked} />
        <StatCard label="Atendidas" value={stats.attended} accent="marca" />
        <StatCard label="No-show" value={stats.no_show} accent="aviso" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Filter className="h-4 w-4" aria-hidden />
          Estado:
        </span>
        {ALL_STATUSES.map((s) => {
          const meta = STATUS_META[s]
          const active = statusFilter.has(s)
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors md:min-h-9",
                active ? meta.color : "border-border bg-card text-muted-foreground"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", active ? meta.dot : "bg-muted-foreground")} />
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Sections */}
      {loading ? (
        <div className="relative min-h-[200px]">
          <LoadingScreen fullscreen={false} className="absolute inset-0 rounded-lg" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      ) : (
        <>
          <CallsSection
            title="Próximas"
            calls={upcoming}
            emptyText="No hay llamadas próximas."
            onSelect={setSelectedCall}
            claveDeFiltros={`proximas:${claveDeFiltros}`}
          />
          <CallsSection
            title="Pasadas"
            calls={past}
            emptyText="Aún no hay llamadas pasadas."
            onSelect={setSelectedCall}
            claveDeFiltros={`pasadas:${claveDeFiltros}`}
          />
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

function StatCard({ label, value, accent }: { label: string; value: number; accent?: "marca" | "aviso" }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="mb-1 text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-heading text-2xl font-semibold tabular-nums",
          accent === "marca" && "text-primary",
          accent === "aviso" && "text-warn",
          !accent && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  )
}

function EstadoChip({ status }: { status: CallStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-sm",
        meta.color
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  )
}

function CallsSection({
  title,
  calls,
  emptyText,
  onSelect,
  claveDeFiltros,
}: {
  title: string
  calls: CallRow[]
  emptyText: string
  onSelect: (c: CallRow) => void
  claveDeFiltros: string
}) {
  if (calls.length === 0) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{title}</h3>
        <div className="flex min-h-[120px] flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-8 text-center">
          <p className="text-[15px] text-muted-foreground">{emptyText}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
        {title} <span className="tabular-nums text-muted-foreground">· {calls.length}</span>
      </h3>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <ListaPaginada
          items={calls}
          claveDeFiltros={claveDeFiltros}
          nombreSingular="llamada"
          nombrePlural="llamadas"
        >
          {(pagina) => (
            <div className="divide-y divide-border">
              {pagina.map((call) => (
                <div key={call.id}>
                  <CallRowItem call={call} onSelect={() => onSelect(call)} />
                </div>
              ))}
            </div>
          )}
        </ListaPaginada>
      </div>
    </div>
  )
}

function CallRowItem({ call, onSelect }: { call: CallRow; onSelect: () => void }) {
  const date = new Date(call.slot_start)
  const dateStr = date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }).replace(",", "")
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  const nombre = call.full_name || "Sin nombre"

  return (
    <>
      {/* MOVIL: una tarjeta por llamada. La fila de columnas no cabe en 375 puntos. */}
      <button
        type="button"
        onClick={onSelect}
        className="flex min-h-[56px] w-full flex-col gap-1 px-4 py-3 text-left transition-colors active:bg-secondary md:hidden"
      >
        <span className="truncate text-[15px] font-medium text-foreground">{nombre}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <EstadoChip status={call.status} />
          <span className="tabular-nums">
            {dateStr} · {timeStr}
          </span>
        </span>
        <span className="w-full truncate text-sm text-muted-foreground">{call.email}</span>
      </button>

      {/* ESCRITORIO: la fila de columnas */}
      <button
        type="button"
        onClick={onSelect}
        className="hidden w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/30 md:grid md:grid-cols-12"
      >
        {/* Fecha + hora */}
        <div className="col-span-2 min-w-0">
          <p className="truncate text-sm text-muted-foreground">{dateStr}</p>
          <p className="text-sm tabular-nums text-foreground">{timeStr}</p>
        </div>
        {/* Lead */}
        <div className="col-span-7 min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{nombre}</p>
          <p className="truncate text-sm text-muted-foreground">{call.email}</p>
        </div>
        {/* Status */}
        <div className="col-span-3 flex justify-end">
          <EstadoChip status={call.status} />
        </div>
      </button>
    </>
  )
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-sm font-semibold text-muted-foreground">{children}</p>
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

  return enElBody(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de llamada"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex w-full min-h-0 max-w-lg flex-col overflow-hidden border border-border bg-background",
          // El alto deja fuera la zona del reloj: con `vh` la cabecera se metia
          // debajo del reloj del iPhone y la X no se podia tocar.
          "max-h-[calc(100dvh-env(safe-area-inset-top)-2rem)] rounded-t-xl",
          "md:max-h-[85dvh] md:rounded-xl"
        )}
      >
        {/* Cabecera fija, con la salida SIEMPRE a la vista y a 44 puntos. */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-base font-extrabold text-foreground">Detalle de llamada</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="tap-target -mr-2 inline-flex items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-secondary active:text-foreground"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* UN solo sitio que se desplaza. Antes se desplazaban el fondo y el
            detalle a la vez y se peleaban. El relleno de abajo deja libre la
            franja de gestos del telefono. */}
        <div className="no-overscroll min-h-0 flex-1 space-y-5 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4">
          {/* Status badge */}
          <div className={cn("inline-flex items-center gap-2 rounded-lg border px-3 py-2", meta.color)}>
            <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
            <span className="text-sm font-semibold">{meta.label}</span>
          </div>

          {/* Cuándo */}
          <div>
            <DetailLabel>Cuándo</DetailLabel>
            <p className="font-heading text-lg capitalize text-foreground">{dateStr}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              {timeStr} – {endStr}
            </p>
          </div>

          {/* Lead */}
          <div>
            <DetailLabel>Lead</DetailLabel>
            <p className="font-medium text-foreground">{call.full_name || "Sin nombre"}</p>
            <a
              href={`mailto:${call.email}`}
              className="-ml-1 inline-flex min-h-11 w-full items-center gap-1.5 rounded-lg px-1 text-sm text-muted-foreground transition-colors active:bg-secondary active:text-foreground md:hover:text-foreground"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{call.email}</span>
            </a>
            {call.phone && (
              <a
                href={`tel:${call.phone}`}
                className="-ml-1 inline-flex min-h-11 w-full items-center gap-1.5 rounded-lg px-1 text-sm text-muted-foreground transition-colors active:bg-secondary active:text-foreground md:hover:text-foreground"
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{call.phone}</span>
              </a>
            )}
          </div>

          {/* Notas del lead */}
          {call.notes && (
            <div>
              <DetailLabel>Notas previas del lead</DetailLabel>
              <p className="whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-sm text-foreground">
                {call.notes}
              </p>
            </div>
          )}

          {/* Meeting URL */}
          {call.meeting_url && (
            <div>
              <DetailLabel>Videollamada</DetailLabel>
              <a
                href={call.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="-ml-1 inline-flex min-h-11 items-center gap-1.5 break-all rounded-lg px-1 text-sm text-primary transition-colors active:bg-secondary"
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                {call.meeting_url}
              </a>
            </div>
          )}

          {/* Cambiar status */}
          <div>
            <DetailLabel>Marcar como</DetailLabel>
            <div className="grid grid-cols-2 gap-2">
              {ALL_STATUSES.filter((s) => s !== call.status).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(s)}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors active:opacity-90",
                    STATUS_META[s].color
                  )}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="space-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0" aria-hidden />
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
