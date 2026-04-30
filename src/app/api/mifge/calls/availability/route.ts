import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type AvailabilityConfig = {
  weekday_start: number
  weekday_end: number
  hour_start: number
  hour_end: number
  slot_minutes: number
  buffer_minutes: number
  timezone: string
}

type Slot = {
  start: string // ISO
  end: string // ISO
  available: boolean
}

/**
 * GET /api/mifge/calls/availability?from=2026-04-30&days=14
 * Devuelve los slots de los próximos N días (default 14) marcando cuáles están libres.
 * Excluye slots ya bookeados (status=booked) y slots en el pasado.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const fromParam = url.searchParams.get("from")
    const daysParam = url.searchParams.get("days")

    const days = Math.min(Math.max(parseInt(daysParam ?? "14", 10), 1), 60)
    const from = fromParam ? new Date(fromParam) : new Date()
    from.setUTCHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setUTCDate(to.getUTCDate() + days)

    const supabase = getAdminClient()

    const { data: configRow, error: configError } = await supabase
      .from("calls_availability")
      .select("weekday_start, weekday_end, hour_start, hour_end, slot_minutes, buffer_minutes, timezone")
      .eq("id", 1)
      .single()

    if (configError || !configRow) {
      return NextResponse.json({ error: "Configuración no disponible" }, { status: 500 })
    }
    const config: AvailabilityConfig = configRow

    const { data: bookings, error: bookingsError } = await supabase
      .from("calls")
      .select("slot_start, slot_end")
      .eq("status", "booked")
      .gte("slot_start", from.toISOString())
      .lt("slot_start", to.toISOString())

    if (bookingsError) {
      return NextResponse.json({ error: "Error consultando bookings" }, { status: 500 })
    }

    const bookedKeys = new Set(
      (bookings ?? []).map((b) => new Date(b.slot_start).toISOString())
    )

    const now = new Date()
    const slots: Slot[] = []
    const cursor = new Date(from)

    while (cursor < to) {
      // El config asume días/horas en TZ Europe/Madrid; aquí calculamos en local del server.
      // Para MVP funcional: trabajamos en UTC asumiendo que el TZ del servidor está alineado.
      // (refinamiento futuro: convertir con Intl.DateTimeFormat por cada día)
      const weekday = cursor.getUTCDay() // 0=Sun..6=Sat
      const isWorkday =
        config.weekday_start <= config.weekday_end
          ? weekday >= config.weekday_start && weekday <= config.weekday_end
          : weekday >= config.weekday_start || weekday <= config.weekday_end

      if (isWorkday) {
        for (let h = config.hour_start; h < config.hour_end; h++) {
          for (let m = 0; m < 60; m += config.slot_minutes) {
            const slotStart = new Date(cursor)
            slotStart.setUTCHours(h, m, 0, 0)
            const slotEnd = new Date(slotStart.getTime() + config.slot_minutes * 60_000)

            if (slotEnd <= new Date(slotStart.getTime() + 1)) continue
            if (slotStart < now) continue // pasado

            const isoStart = slotStart.toISOString()
            slots.push({
              start: isoStart,
              end: slotEnd.toISOString(),
              available: !bookedKeys.has(isoStart),
            })
          }
        }
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }

    return NextResponse.json({
      from: from.toISOString(),
      to: to.toISOString(),
      timezone: config.timezone,
      slot_minutes: config.slot_minutes,
      slots,
    })
  } catch (e) {
    console.error("[mifge/calls/availability]", e)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
