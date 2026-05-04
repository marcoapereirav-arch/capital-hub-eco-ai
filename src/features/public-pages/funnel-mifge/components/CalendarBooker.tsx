"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Loader2, Check, X, Calendar } from "lucide-react"

type Slot = { start: string; end: string; available: boolean }
type AvailabilityResponse = { from: string; to: string; timezone: string; slot_minutes: number; slots: Slot[] }

interface Props {
  /** Si viene del checkout, pasamos el lead_id por query string para asociar el booking. */
  leadId?: string
  /** A dónde mandar al usuario tras booking exitoso. */
  successUrl?: string
}

export function CalendarBooker({ leadId, successUrl = "/mifge/llamada-confirmada" }: Props) {
  const [allSlots, setAllSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null) // "YYYY-MM-DD"
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/mifge/calls/availability?days=21")
        if (!res.ok) throw new Error("No se pudo cargar disponibilidad")
        const json = (await res.json()) as AvailabilityResponse
        if (cancelled) return
        setAllSlots(json.slots)
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setLoadError(e instanceof Error ? e.message : "Error cargando")
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Construir días con slots disponibles
  const daysWithSlots = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const slot of allSlots) {
      if (!slot.available) continue
      const day = slot.start.slice(0, 10) // YYYY-MM-DD
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(slot)
    }
    return map
  }, [allSlots])

  // Genera la semana visible según weekOffset
  const visibleDays = useMemo(() => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const days: { key: string; date: Date }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setUTCDate(today.getUTCDate() + weekOffset * 7 + i)
      days.push({ key: d.toISOString().slice(0, 10), date: d })
    }
    return days
  }, [weekOffset])

  // Auto-seleccionar primer día con slots de la semana visible
  useEffect(() => {
    if (loading) return
    const firstWithSlots = visibleDays.find((d) => (daysWithSlots.get(d.key)?.length ?? 0) > 0)
    if (firstWithSlots) setSelectedDay(firstWithSlots.key)
    else setSelectedDay(null)
  }, [visibleDays, daysWithSlots, loading])

  const slotsForSelectedDay = selectedDay ? daysWithSlots.get(selectedDay) ?? [] : []

  if (loading) {
    return (
      <div className="border border-[#2A2D34] bg-[#18181B] rounded-[4px] p-12 flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#6B7280]">
          Cargando horarios disponibles…
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="border border-red-500/40 bg-red-500/5 rounded-[4px] p-6 text-center">
        <p className="text-red-300 text-sm">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 font-mono text-[10px] uppercase tracking-wide text-red-300 underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="border border-[#2A2D34] bg-[#18181B] rounded-[4px] overflow-hidden">
        {/* Header con título + nav semanas */}
        <div className="flex items-center justify-between border-b border-[#2A2D34] px-4 md:px-5 py-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#37ca37]" />
            <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-[#9CA3AF]">
              Elige un día y hora
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset((v) => Math.max(0, v - 1))}
              disabled={weekOffset === 0}
              className="rounded-sm p-1.5 text-[#9CA3AF] hover:bg-[#2A2D34] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Semana anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono text-[10px] text-[#6B7280] px-2 min-w-[80px] text-center">
              {weekOffset === 0 ? "ESTA SEMANA" : `+${weekOffset} sem`}
            </span>
            <button
              onClick={() => setWeekOffset((v) => Math.min(2, v + 1))}
              disabled={weekOffset >= 2}
              className="rounded-sm p-1.5 text-[#9CA3AF] hover:bg-[#2A2D34] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Semana siguiente"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Grid de días (7) */}
        <div className="grid grid-cols-7 border-b border-[#2A2D34]">
          {visibleDays.map((d) => {
            const slots = daysWithSlots.get(d.key) ?? []
            const isSelected = d.key === selectedDay
            const hasSlots = slots.length > 0
            const dow = d.date.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase().replace(".", "")
            const day = d.date.getUTCDate()
            return (
              <button
                key={d.key}
                onClick={() => hasSlots && setSelectedDay(d.key)}
                disabled={!hasSlots}
                className={`flex flex-col items-center justify-center py-3 md:py-4 transition-colors border-r border-[#2A2D34] last:border-r-0 ${
                  isSelected
                    ? "bg-[#37ca37]/10 border-b-2 border-b-[#37ca37]"
                    : hasSlots
                      ? "hover:bg-[#2A2D34]/40 cursor-pointer"
                      : "opacity-25 cursor-not-allowed"
                }`}
              >
                <span className={`font-mono text-[9px] md:text-[10px] tracking-wider ${isSelected ? "text-[#37ca37]" : "text-[#6B7280]"}`}>
                  {dow}
                </span>
                <span className={`font-serif text-base md:text-lg mt-0.5 ${isSelected ? "text-white" : "text-[#9CA3AF]"}`}>
                  {day}
                </span>
                {hasSlots && (
                  <span className="font-mono text-[8px] text-[#37ca37] mt-0.5">{slots.length}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Grid de slots del día seleccionado */}
        <div className="p-4 md:p-5 min-h-[200px]">
          {selectedDay && slotsForSelectedDay.length > 0 ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6B7280] mb-3">
                Horarios disponibles
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {slotsForSelectedDay.map((slot) => {
                  const time = new Date(slot.start).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                  return (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot)}
                      className="border border-[#2A2D34] hover:border-[#37ca37] hover:bg-[#37ca37]/10 transition-colors py-2.5 rounded-sm font-mono text-sm text-white"
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-center text-[#6B7280] text-sm py-8">
              {selectedDay ? "Sin horarios disponibles este día" : "Selecciona un día con horarios"}
            </p>
          )}
        </div>
      </div>

      <p className="text-center text-[#6B7280] font-mono text-[10px] mt-3 uppercase tracking-wider">
        20 minutos · Vía videollamada · Hora España (UTC+1)
      </p>

      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          leadId={leadId}
          successUrl={successUrl}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </>
  )
}

interface BookingModalProps {
  slot: Slot
  leadId?: string
  successUrl: string
  onClose: () => void
}

function BookingModal({ slot, leadId, successUrl, onClose }: BookingModalProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const date = new Date(slot.start)
  const dateStr = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (fullName.trim().length < 2) return setError("Introduce tu nombre completo")
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Email inválido")

    setSubmitting(true)
    try {
      const res = await fetch("/api/mifge/calls/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          slot_start: slot.start,
          notes: notes.trim() || undefined,
          lead_id: leadId,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? "No se pudo reservar el slot")
        setSubmitting(false)
        return
      }

      window.location.href = `${successUrl}?call_id=${json.call?.id ?? ""}&slot=${encodeURIComponent(slot.start)}`
    } catch (e) {
      console.error(e)
      setError("Error de red. Inténtalo de nuevo.")
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md border border-[#2A2D34] bg-[#0F0F12] rounded-[4px] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2A2D34] px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#37ca37]">
            Confirmar reserva
          </p>
          <button onClick={onClose} disabled={submitting} className="text-[#6B7280] hover:text-white transition-colors disabled:opacity-50">
            <X size={16} />
          </button>
        </div>

        <div className="border-l-2 border-[#37ca37] bg-[#37ca37]/5 mx-5 mt-5 px-4 py-3">
          <p className="font-serif text-lg text-white capitalize leading-tight mb-0.5">{dateStr}</p>
          <p className="text-[#9CA3AF] text-sm font-mono">{timeStr} · 20 min</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3" noValidate>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#6B7280] mb-1.5">Nombre completo *</label>
            <input
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#6B7280] mb-1.5">Email *</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#6B7280] mb-1.5">Teléfono (opcional)</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#6B7280] mb-1.5">Algo que quieras contarnos antes de la llamada (opcional)</label>
            <textarea
              className="form-input resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              maxLength={500}
            />
          </div>

          {error && (
            <div className="border border-red-500/40 bg-red-500/10 rounded-[2px] p-2.5">
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-green mt-2 w-full py-3.5 font-mono uppercase text-xs tracking-wider rounded-[2px] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                RESERVANDO…
              </>
            ) : (
              <>
                <Check size={14} />
                CONFIRMAR MI LLAMADA
              </>
            )}
          </button>

          <p className="text-[10px] text-[#4B5563] font-mono text-center mt-1">
            Recibirás un email de confirmación al instante.
          </p>
        </form>
      </div>
    </div>
  )
}
