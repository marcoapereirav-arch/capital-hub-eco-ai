"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"

type Slot = { start: string; end: string }

/** Campo de escritura. text-base en telefono o el iPhone se acerca solo al tocarlo. */
const CLASES_CAMPO =
  "h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"

export function AgendaPublica() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [activeDay, setActiveDay] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" })
  const [booking, setBooking] = useState(false)
  const [success, setSuccess] = useState<{ start: string; end: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rescheduled, setRescheduled] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch("/api/calendar/availability?owner=adrian&days=21")
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setLoading(false))

    // Prefill desde query string (viene de /api/calendar/reschedule)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const email = params.get("email")
      const name = params.get("name")
      if (params.get("rescheduled") === "1") setRescheduled(true)
      if (email || name) {
        setForm((f) => ({ ...f, email: email ?? f.email, name: name ?? f.name }))
      }
    }
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
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground md:px-6">
        <div className="max-w-md text-center">
          <Check className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="mb-2 text-2xl font-semibold">¡Confirmada tu llamada!</h1>
          <p className="mb-6 text-[15px] text-muted-foreground">
            {d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} a las{" "}
            {d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} (hora España)
          </p>
          <p className="text-[15px] text-muted-foreground">
            Te llegará un email con los detalles y el link de la videollamada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-16">
        {rescheduled && (
          <div className="mb-6 rounded-lg border border-warn/40 bg-warn/10 p-3 text-center text-[15px] text-warn">
            Tu llamada anterior se ha cancelado. Elige un nuevo hueco abajo.
          </div>
        )}
        <div className="mb-8 text-center md:mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-border px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-sm font-semibold text-muted-foreground">
              Reserva tu llamada con Adrián
            </span>
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-tight md:text-4xl">
            Agenda 20 minutos
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">Elige día y hora abajo. Vídeollamada por Zoom.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <LoadingScreen fullscreen={false} className="bg-transparent" />
            <p className="text-[15px] text-muted-foreground">Cargando disponibilidad…</p>
          </div>
        ) : byDay.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center px-6 py-16 text-center">
            <p className="max-w-[42ch] text-[15px] text-muted-foreground">
              No hay slots disponibles en las próximas 3 semanas. Por favor, escribe a Adrián directamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
            {/* Días. En telefono es una tira deslizable de lado (el unico
                deslizamiento lateral permitido, dentro de su propia caja); en
                ordenador vuelve a ser la columna de la izquierda. */}
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:max-h-[60dvh] md:flex-col md:gap-1.5 md:overflow-x-hidden md:overflow-y-auto md:px-0 md:pr-2">
              {byDay.map(([day, list]) => {
                const d = new Date(day + "T00:00:00")
                const isActive = activeDay === day
                return (
                  <button
                    key={day}
                    onClick={() => { setActiveDay(day); setSelectedSlot(null) }}
                    className={cn(
                      "w-[9.5rem] shrink-0 snap-start rounded-lg border px-3 py-2 text-left transition-colors md:w-full",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border md:hover:border-primary/40"
                    )}
                  >
                    <div className="text-sm font-semibold text-muted-foreground">
                      {d.toLocaleDateString("es-ES", { weekday: "long" })}
                    </div>
                    <div className="text-[15px] capitalize text-foreground md:text-sm">
                      {d.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground tabular-nums">
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
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    Horarios disponibles
                  </h2>
                  {/* Dos columnas en telefono: con tres, cada hueco baja de lo que
                      acierta un dedo y la hora se parte. */}
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {slotsForActiveDay.map((s) => {
                      const d = new Date(s.start)
                      return (
                        <button
                          key={s.start}
                          onClick={() => setSelectedSlot(s)}
                          className="h-11 rounded-lg border border-border px-3 text-[15px] text-foreground tabular-nums transition-colors active:bg-muted md:h-9 md:text-sm md:hover:border-primary md:hover:bg-primary/10"
                        >
                          {d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <form onSubmit={handleBook} className="space-y-4">
                  <div className="rounded-lg border border-primary/40 bg-primary/10 p-3">
                    <div className="mb-1 text-sm font-semibold text-primary">
                      Slot seleccionado
                    </div>
                    <div className="text-base text-foreground">
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
                      className="inline-flex h-11 items-center text-[15px] text-muted-foreground underline md:h-8 md:text-sm"
                    >
                      Cambiar
                    </button>
                  </div>

                  <Input label="Nombre completo *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required autoComplete="name" />
                  <Input label="Email *" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                  <Input label="Teléfono (opcional)" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                  <Textarea label="Notas (opcional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="¿Algo que Adrián deba saber antes?" />

                  {error && (
                    <div className="flex items-center gap-2 text-[15px] text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={booking || !form.name || !form.email}
                    className="h-11 w-full rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-30 md:h-10"
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
  inputMode,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  inputMode?: React.ComponentProps<"input">["inputMode"]
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <Etiqueta>{label}</Etiqueta>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        enterKeyHint="next"
        className={CLASES_CAMPO}
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
    <label className="flex flex-col gap-1.5">
      <Etiqueta>{label}</Etiqueta>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
      />
    </label>
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
