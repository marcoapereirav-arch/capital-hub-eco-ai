import { NextRequest, NextResponse } from "next/server"
import { getAvailableSlots } from "@/lib/calendar/availability"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/calendar/availability?owner=adrian&days=14
 * Devuelve slots disponibles del owner en los próximos N días (default 14).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const ownerId = url.searchParams.get("owner") ?? "adrian"
  const days = Math.min(60, Math.max(1, parseInt(url.searchParams.get("days") ?? "14", 10)))

  const rangeStart = new Date()
  const rangeEnd = new Date(rangeStart.getTime() + days * 24 * 60 * 60 * 1000)

  try {
    const slots = await getAvailableSlots({ ownerId, rangeStart, rangeEnd })
    return NextResponse.json({ slots, ownerId, days })
  } catch (e) {
    console.error("[calendar/availability] error", e)
    return NextResponse.json({ error: "Error computando disponibilidad" }, { status: 500 })
  }
}
