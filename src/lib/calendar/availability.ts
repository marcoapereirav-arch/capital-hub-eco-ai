import "server-only"
import { createClient } from "@supabase/supabase-js"

/**
 * Computa los slots disponibles de un owner en un rango (start..end).
 * Lógica:
 * 1. Para cada día del rango, mira las reglas de availability del weekday
 * 2. Trocea cada ventana en slots de slot_minutes con buffer entre ellos
 * 3. Quita los que solapan con blocked_slots o bookings existentes (status=booked)
 * 4. Solo devuelve slots futuros (>= now)
 */

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type Slot = { start: string; end: string }

export async function getAvailableSlots(input: {
  ownerId: string
  rangeStart: Date
  rangeEnd: Date
}): Promise<Slot[]> {
  const supabase = getAdminClient()

  // Owner config
  const { data: owner } = await supabase
    .from("calendar_owners")
    .select("slot_minutes, buffer_minutes, timezone")
    .eq("id", input.ownerId)
    .single()
  if (!owner) return []

  const slotMin = owner.slot_minutes ?? 30
  const bufferMin = owner.buffer_minutes ?? 0

  // Rules (weekday + horario)
  const { data: rules } = await supabase
    .from("calendar_availability_rules")
    .select("weekday, start_time, end_time")
    .eq("owner_id", input.ownerId)

  // Blocked slots y bookings activos en el rango
  const { data: blocked } = await supabase
    .from("calendar_blocked_slots")
    .select("start_at, end_at")
    .eq("owner_id", input.ownerId)
    .gte("end_at", input.rangeStart.toISOString())
    .lte("start_at", input.rangeEnd.toISOString())

  const { data: bookings } = await supabase
    .from("calendar_bookings")
    .select("start_at, end_at")
    .eq("owner_id", input.ownerId)
    .eq("status", "booked")
    .gte("end_at", input.rangeStart.toISOString())
    .lte("start_at", input.rangeEnd.toISOString())

  const busyRanges = [
    ...(blocked ?? []).map((b) => ({ start: new Date(b.start_at), end: new Date(b.end_at) })),
    ...(bookings ?? []).map((b) => ({ start: new Date(b.start_at), end: new Date(b.end_at) })),
  ]

  // Genera candidatos día a día
  const now = new Date()
  const out: Slot[] = []
  const oneDay = 24 * 60 * 60 * 1000
  const start = new Date(input.rangeStart)
  start.setHours(0, 0, 0, 0)
  const end = new Date(input.rangeEnd)

  for (let cursor = start.getTime(); cursor < end.getTime(); cursor += oneDay) {
    const day = new Date(cursor)
    const weekday = day.getDay() // 0..6 (0=domingo)
    const dayRules = (rules ?? []).filter((r) => r.weekday === weekday)
    if (dayRules.length === 0) continue

    for (const r of dayRules) {
      const [sh, sm] = (r.start_time as string).split(":").map(Number)
      const [eh, em] = (r.end_time as string).split(":").map(Number)
      const winStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), sh, sm, 0)
      const winEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), eh, em, 0)

      for (
        let t = winStart.getTime();
        t + slotMin * 60_000 <= winEnd.getTime();
        t += (slotMin + bufferMin) * 60_000
      ) {
        const slotStart = new Date(t)
        const slotEnd = new Date(t + slotMin * 60_000)
        if (slotStart < now) continue
        // Comprueba solape con busy
        const overlaps = busyRanges.some(
          (b) => !(b.end <= slotStart || b.start >= slotEnd)
        )
        if (overlaps) continue
        out.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() })
      }
    }
  }

  return out
}
