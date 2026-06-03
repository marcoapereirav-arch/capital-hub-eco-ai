"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, Clock, Check, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Slot = { start: string; end: string }

export function AgendaPublica() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [activeDay, setActiveDay] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" })
  const [booking, setBooking] = useState(false)
  const [success, setSuccess] = useState<{ start: string; end: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch("/api/calendar/availability?owner=adrian&days=21")
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setLoading(false))
  }, [])

  // Agrupar slots por día
  const byDay = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots) {
      const dayKey = s.start.slice(0, 10)
      const arr = map.get(dayKey) ?? []
      arr.push(s)
      map.set(dayKey, arr)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [slots])

  useEffect(() => {
    if (!activeDay && byDay.length > 0) setActiveDay(byDay[0][0])
  }, [byDay, activeDay])

  const slotsForActiveDay = byDay.find(([d]) => d === activeDay)?.[1] ?? []

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return
    setError(null)
    setBooking(true)
    try {
      const res = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: "adrian",
          slot_start: selectedSlot.start,
          attendee_name: form.name,
          attendee_email: form.email,
          attendee_phone: form.phone || undefined,
          notes: form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error reservando")
        return
      }
      setSuccess({ start: data.booking.start_at, end: data.booking.end_at })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red")
    } finally {
      setBooking(false)
    }
  }

  if (success) {
    const d = new Date(success.start)
    return (
      <div className="min-h-screen bg-[#0F0F12] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <Check className="h-12 w-12 mx-auto mb-4 text-[#37CA37]" />
          <h1 className="text-2xl font-semibold mb-2">¡Confirmada tu llamada!</h1>
          <p className="text-white/70 mb-6">
            {d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} a las{" "}
            {d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} (hora España)
          </p>
          <p className="text-white/50 text-xs">
            Te llegará un email con los detalles y el link de la videollamada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 border border-[#2A2D34] px-3 py-1 rounded-sm mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#37CA37] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">
              Reserva tu llamada con Adrián
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">
            Agenda 20 minutos
          </h1>
          <p className="text-white/60 mt-2 text-sm">Elige día y hora abajo. Vídeollamada por Zoom.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/50">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando disponibilidad…
          </div>
        ) : byDay.length === 0 ? (
          <div className="text-center py-20 text-white/60">
            No hay slots disponibles en las próximas 3 semanas. Por favor, escribe a Adrián directamente.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            {/* Días */}
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-2">
              {byDay.map(([day, list]) => {
                const d = new Date(day + "T00:00:00")
                const isActive = activeDay === day
                return (
                  <button
                    key={day}
                    onClick={() => { setActiveDay(day); setSelectedSlot(null) }}
                    className={cn(
                      "w-full text-left rounded-sm border px-3 py-2 transition-all",
                      isActive
                        ? "border-[#37CA37] bg-[#37CA37]/[0.07]"
                        : "border-[#2A2D34] hover:border-white/20"
                    )}
                  >
                    <div className="text-xs font-mono uppercase tracking-wider text-white/50">
                      {d.toLocaleDateString("es-ES", { weekday: "long" })}
                    </div>
                    <div className="text-sm capitalize">
                      {d.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                    </div>
                    <div className="text-[10px] font-mono text-white/40 mt-0.5">
                      {list.length} hueco{list.length === 1 ? "" : "s"}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Slots + form */}
            <div className="space-y-4">
              {!selectedSlot ? (
                <>
                  <h2 className="text-sm font-mono uppercase tracking-wider text-white/50">
                    Horarios disponibles
                  </h2>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {slotsForActiveDay.map((s) => {
                      const d = new Date(s.start)
                      return (
                        <button
                          key={s.start}
                          onClick={() => setSelectedSlot(s)}
                          className="rounded-sm border border-[#2A2D34] hover:border-[#37CA37] hover:bg-[#37CA37]/[0.05] px-3 py-2 text-sm font-mono transition-all"
                        >
                          {d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <form onSubmit={handleBook} className="space-y-4">
                  <div className="rounded-sm border border-[#37CA37]/40 bg-[#37CA37]/[0.05] p-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-[#37CA37] mb-1">
                      Slot seleccionado
                    </div>
                    <div className="text-base">
                      {new Date(selectedSlot.start).toLocaleString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      (hora España)
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSlot(null)}
                      className="text-[10px] font-mono uppercase tracking-wider text-white/50 underline mt-1"
                    >
                      Cambiar
                    </button>
                  </div>

                  <Input label="Nombre completo *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                  <Input label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                  <Input label="Teléfono (opcional)" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                  <Textarea label="Notas (opcional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="¿Algo que Adrián deba saber antes?" />

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                      <AlertCircle className="h-3.5 w-3.5" /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={booking || !form.name || !form.email}
                    className="w-full bg-[#37CA37] text-black font-mono uppercase tracking-wider py-3 rounded-sm hover:opacity-90 disabled:opacity-30"
                  >
                    {booking ? "Reservando…" : "Confirmar reserva"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-sm border border-[#2A2D34] bg-[#16161B] px-3 py-2 text-sm focus:border-[#37CA37] focus:outline-none"
      />
    </label>
  )
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-sm border border-[#2A2D34] bg-[#16161B] px-3 py-2 text-sm focus:border-[#37CA37] focus:outline-none resize-none"
      />
    </label>
  )
}
