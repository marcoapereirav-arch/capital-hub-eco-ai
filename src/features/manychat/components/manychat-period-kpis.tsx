"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { KpiCard } from "./kpi-card"

/**
 * KPIs de ManyChat por período, usando el filtro de fechas GLOBAL del OS
 * (mismo componente que el resto de dashboards). Reemplaza las tarjetas
 * "Nuevos Hoy / 7d / 30d / DMs 7d" que tenían ventanas de fecha hardcodeadas.
 * Regla: si hay filtro global, no se inventan ventanas por widget (SOP sistemas/05).
 */
export function ManychatPeriodKpis() {
  const [range, setRange] = useState<PeriodRange | null>(null)
  const [loading, setLoading] = useState(true)
  const [nuevos, setNuevos] = useState(0)
  const [dms, setDms] = useState(0)

  useEffect(() => {
    if (!range) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const fromIso = range.from.toISOString()
      const toIso = range.to.toISOString()
      const [nuevosRes, dmsRes] = await Promise.all([
        supabase
          .from("manychat_subscribers_cache")
          .select("id", { count: "exact", head: true })
          .gte("subscribed_at", fromIso)
          .lte("subscribed_at", toIso),
        supabase
          .from("manychat_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "message_received")
          .gte("received_at", fromIso)
          .lte("received_at", toIso),
      ])
      if (cancelled) return
      setNuevos(nuevosRes.count ?? 0)
      setDms(dmsRes.count ?? 0)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [range])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
        <h3 className="font-heading text-[15px] font-semibold text-foreground">
          Actividad del período
        </h3>
        <PeriodFilter onChange={setRange} defaultPreset="30d" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <KpiCard title="Nuevos suscriptores" value={loading ? "…" : nuevos} hint={range?.label} source="manychat" />
        <KpiCard title="DMs recibidos" value={loading ? "…" : dms} hint={range?.label} source="eventos" />
      </div>
    </div>
  )
}
