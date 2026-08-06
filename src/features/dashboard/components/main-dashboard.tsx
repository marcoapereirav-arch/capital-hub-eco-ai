"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Trash2, Loader2, ShoppingBag, ArrowUpRight } from "lucide-react"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { createBrowserClient } from "@supabase/ssr"
import { cn } from "@/lib/utils"
import { usePipelines, useActivePipelineId } from "@/features/pipelines/hooks/use-pipelines"
import { RegistrarVentaModal } from "@/features/sales/components/registrar-venta-modal"
import { DashboardFunnel } from "./dashboard-funnel"
import { DashboardRevenueChart } from "./dashboard-revenue-chart"

// =============================================================================
// Tipos (datos REALES de Capital Hub)
// =============================================================================

type ContactRow = {
  id: string
  full_name: string | null
  stage: string
  origin: string | null
  total_revenue: number | null
  total_cash_collected: number | null
  created_at: string
  last_call_at: string | null
  products: string[] | null
}

type PendingSaleRow = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  products: string[] | null
  sale_pending_since: string | null
}

type StudentInviteRow = {
  id: string
  email: string
  full_name: string
  products: string[]
  accepted_at: string | null
  created_at: string
}

type CalendarBookingRow = {
  id: string
  start_at: string
  status: string | null
}

// =============================================================================
// Helpers
// =============================================================================

function eur(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n || 0)
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Calcula el rango ANTERIOR de la misma longitud (para comparar deltas). */
function previousRange(from: Date, to: Date): { from: Date; to: Date } {
  const lengthMs = to.getTime() - from.getTime()
  const prevTo = new Date(from.getTime())
  const prevFrom = new Date(from.getTime() - lengthMs)
  return { from: prevFrom, to: prevTo }
}

function timeAgo(iso: string | null): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "ahora"
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h`
  const d = Math.floor(h / 24)
  return `${d} d`
}

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
}

// =============================================================================
// Hook de count-up (animacion — no toca datos)
// =============================================================================

function useCountUp(target: number, duration = 1400, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf = 0
    let start: number | null = null
    const t0 = setTimeout(() => {
      const tick = (t: number) => {
        if (start === null) start = t
        const p = Math.min(1, (t - start) / duration)
        setVal(target * (1 - Math.pow(1 - p, 3)))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(t0)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay])
  return val
}

// =============================================================================
// Card base — superficie del tema, esquina de panel (6px)
// =============================================================================

function Card({
  children,
  className = "",
  title,
  count,
  right,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  count?: number
  right?: React.ReactNode
  delay?: number
}) {
  return (
    <div
      className={cn("hud-in relative rounded-xl border border-border bg-card", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {(title || right) && (
        // flex-wrap y min-w-0: en el telefono el titulo manda y lo de la
        // derecha baja de linea en vez de empujar la fila fuera de pantalla.
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 md:px-5 md:pt-5">
          {title ? (
            <span className="min-w-0 flex-1 text-sm font-semibold text-muted-foreground">
              {title}
              {count != null && <span className="tabular-nums"> · {count}</span>}
            </span>
          ) : (
            <span />
          )}
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

// =============================================================================
// KPI Card (count-up + delta REAL)
// =============================================================================

function KpiCard({
  label,
  value,
  fmt,
  delta,
  i,
}: {
  label: string
  value: number
  fmt: (n: number) => string
  delta?: { text: string; up: boolean } | null
  i: number
}) {
  const v = useCountUp(value, 1400, 300 + i * 45)
  return (
    <Card delay={80 + i * 35} className="p-4 md:p-5">
      <span className="block text-sm text-muted-foreground">{label}</span>
      <div className="mt-2 text-2xl font-bold leading-none tabular-nums text-foreground">
        {fmt(v)}
      </div>
      {delta && (
        <div
          className={cn(
            "mt-2.5 inline-flex items-center gap-1 text-sm font-semibold",
            delta.up ? "text-primary" : "text-muted-foreground",
          )}
        >
          <span aria-hidden>{delta.up ? "▲" : "▾"}</span> {delta.text}
        </div>
      )}
    </Card>
  )
}

// =============================================================================
// Actividad reciente REAL — contactos ordenados por created_at.
// =============================================================================

function RecentFeed({
  items,
  stageLabel,
}: {
  items: ContactRow[]
  stageLabel: (stage: string) => string
}) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center px-6 py-8 text-center">
        <p className="text-[15px] text-muted-foreground">Sin contactos en este periodo.</p>
      </div>
    )
  }
  return (
    <ul className="space-y-3 px-4 pt-4 pb-4 md:px-5">
      {items.slice(0, 7).map((c) => (
        <li key={c.id} className="flex items-center gap-3">
          <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] text-foreground">{c.full_name ?? "Contacto"}</div>
            <div className="truncate text-sm text-muted-foreground">
              {stageLabel(c.stage)}
              {c.origin ? ` · ${c.origin}` : ""}
            </div>
          </div>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {timeAgo(c.created_at)}
          </span>
        </li>
      ))}
    </ul>
  )
}

// =============================================================================
// Fila de resumen (label + valor) del hero
// =============================================================================

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2 text-[15px] text-muted-foreground">
        {accent && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />}
        <span className="min-w-0 truncate">{label}</span>
      </span>
      <span
        className={cn(
          "shrink-0 text-[15px] font-semibold tabular-nums",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  )
}

// =============================================================================
// Componente principal — DATOS reales de Capital Hub
// =============================================================================

export function MainDashboard() {
  const [range, setRange] = useState<PeriodRange | null>(null)
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [allContacts, setAllContacts] = useState<ContactRow[]>([])
  const [previousContacts, setPreviousContacts] = useState<ContactRow[]>([])
  const [invites, setInvites] = useState<StudentInviteRow[]>([])
  const [previousInvites, setPreviousInvites] = useState<StudentInviteRow[]>([])
  const [bookings, setBookings] = useState<CalendarBookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingInvite, setDeletingInvite] = useState<string | null>(null)
  const [revenueTimeSeries, setRevenueTimeSeries] = useState<{ date: string; revenue: number }[]>([])
  const [pendingSales, setPendingSales] = useState<PendingSaleRow[]>([])
  const [salePrefill, setSalePrefill] =
    useState<React.ComponentProps<typeof RegistrarVentaModal>["prefill"]>(undefined)

  const dateStr = useMemo(
    () => new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }),
    [],
  )

  // Pipeline activo: el embudo se adapta a sus stages dinamicamente.
  const { pipelines } = usePipelines()
  const { activeId: activePipelineId, setActiveId: setActivePipelineId } = useActivePipelineId(pipelines)
  const activePipeline = pipelines.find((p) => p.id === activePipelineId) ?? null

  const STAGE_LABELS = useMemo(() => {
    const out: Record<string, string> = {}
    activePipeline?.stages.forEach((s) => {
      out[s.key] = s.name
    })
    return out
  }, [activePipeline])

  const STAGE_HEX = useMemo(() => {
    const out: Record<string, string> = {}
    activePipeline?.stages.forEach((s) => {
      out[s.key] = s.color
    })
    return out
  }, [activePipeline])

  /* El color de la etapa es un dato del usuario (lo elige en su pipeline), no
     una decision de diseno: se respeta tal cual y solo se usa como punto de
     identificacion dentro del embudo. */
  const colorOf = (stage: string) => STAGE_HEX[stage] ?? "currentColor"
  const stageLabel = (stage: string) => STAGE_LABELS[stage] ?? stage

  const FUNNEL_ORDER = useMemo(
    () =>
      activePipeline?.stages.filter((s) => s.kind === "active" || s.kind === "won").map((s) => s.key) ?? [],
    [activePipeline],
  )

  const FUNNEL_BRANCHES = useMemo(
    () => activePipeline?.stages.filter((s) => s.kind === "lost" || s.kind === "branch").map((s) => s.key) ?? [],
    [activePipeline],
  )

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
      const prev = previousRange(range.from, range.to)
      const prevFromIso = prev.from.toISOString()
      const prevToIso = prev.to.toISOString()

      const series30dStart = new Date(range.to.getTime() - 30 * 24 * 60 * 60 * 1000)
      const series30dStartIso = series30dStart.toISOString()

      const [
        contactsRes,
        allContactsRes,
        prevContactsRes,
        invitesRes,
        prevInvitesRes,
        bookingsRes,
        seriesRes,
        pendingSalesRes,
      ] = await Promise.all([
        supabase
          .from("contacts")
          .select("id, full_name, stage, origin, total_revenue, total_cash_collected, created_at, last_call_at, products")
          .gte("created_at", fromIso)
          .lte("created_at", toIso)
          .order("created_at", { ascending: false }),
        supabase.from("contacts").select("id, stage, total_revenue, total_cash_collected, origin"),
        supabase
          .from("contacts")
          .select("id, total_revenue, total_cash_collected")
          .gte("created_at", prevFromIso)
          .lte("created_at", prevToIso),
        supabase
          .from("student_invites")
          .select("id, email, full_name, products, accepted_at, created_at, contact_id")
          .gte("created_at", fromIso)
          .lte("created_at", toIso)
          .not("contact_id", "is", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("student_invites")
          .select("id, created_at, accepted_at, contact_id")
          .gte("created_at", prevFromIso)
          .lte("created_at", prevToIso)
          .not("contact_id", "is", null),
        supabase
          .from("calendar_bookings")
          .select("id, start_at, status")
          .gte("start_at", fromIso)
          .lte("start_at", toIso),
        supabase
          .from("contacts")
          .select("created_at, total_revenue")
          .gte("created_at", series30dStartIso)
          .lte("created_at", toIso)
          .not("total_revenue", "is", null),
        supabase
          .from("contacts")
          .select("id, full_name, email, phone, products, sale_pending_since")
          .eq("sale_pending", true)
          .order("sale_pending_since", { ascending: true }),
      ])

      if (cancelled) return
      setContacts((contactsRes.data ?? []) as ContactRow[])
      setAllContacts((allContactsRes.data ?? []) as ContactRow[])
      setPreviousContacts((prevContactsRes.data ?? []) as ContactRow[])
      setInvites((invitesRes.data ?? []) as StudentInviteRow[])
      setPreviousInvites((prevInvitesRes.data ?? []) as unknown as StudentInviteRow[])
      setBookings((bookingsRes.data ?? []) as CalendarBookingRow[])
      setPendingSales((pendingSalesRes.data ?? []) as PendingSaleRow[])

      const seriesMap = new Map<string, number>()
      for (let d = new Date(series30dStart); d <= range.to; d.setDate(d.getDate() + 1)) {
        seriesMap.set(ymd(d), 0)
      }
      for (const c of (seriesRes.data ?? []) as { created_at: string; total_revenue: number | null }[]) {
        const k = ymd(new Date(c.created_at))
        if (seriesMap.has(k)) {
          seriesMap.set(k, (seriesMap.get(k) ?? 0) + (c.total_revenue ?? 0))
        }
      }
      setRevenueTimeSeries(Array.from(seriesMap.entries()).map(([date, revenue]) => ({ date, revenue })))

      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [range])

  // ---------------------------------------------------------------------------
  // KPIs REALES (negocio completo del periodo, sin sesgo de pipeline)
  // ---------------------------------------------------------------------------
  const kpis = useMemo(() => {
    const revenue = contacts.reduce((s, c) => s + (c.total_revenue ?? 0), 0)
    const prevRevenue = previousContacts.reduce((s, c) => s + (c.total_revenue ?? 0), 0)
    const revenueDelta = revenue - prevRevenue
    const revenuePct = prevRevenue > 0 ? Math.round((revenueDelta / prevRevenue) * 100) : null

    const cashCollected = contacts.reduce((s, c) => s + (c.total_cash_collected ?? 0), 0)
    const prevCash = previousContacts.reduce((s, c) => s + (c.total_cash_collected ?? 0), 0)
    const cashDelta = cashCollected - prevCash
    const cashPct = prevCash > 0 ? Math.round((cashDelta / prevCash) * 100) : null

    const ventas = invites.length
    const prevVentas = previousInvites.length
    const ventasDelta = ventas - prevVentas

    const llamadasCompletadas = bookings.filter((b) => b.status === "completed").length
    const conversion = llamadasCompletadas > 0 ? Math.round((ventas / llamadasCompletadas) * 100) : 0

    const contactosNuevos = contacts.length
    const llamadas = bookings.length
    const noShows = bookings.filter((b) => b.status === "no_show").length
    const showRate = llamadas > 0 ? Math.round(((llamadas - noShows) / llamadas) * 100) : 0

    const ticketMedio = ventas > 0 ? Math.round(revenue / ventas) : 0

    return {
      revenue,
      revenueDelta,
      revenuePct,
      cashCollected,
      cashDelta,
      cashPct,
      ventas,
      ventasDelta,
      conversion,
      contactosNuevos,
      llamadas,
      llamadasCompletadas,
      noShows,
      showRate,
      ticketMedio,
    }
  }, [contacts, previousContacts, invites, previousInvites, bookings])

  // ---------------------------------------------------------------------------
  // Embudo REAL (acumulado total, pipeline activo)
  // ---------------------------------------------------------------------------
  const funnelData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of allContacts) {
      counts.set(c.stage, (counts.get(c.stage) ?? 0) + 1)
    }
    const main = FUNNEL_ORDER.map((stage: string, i: number) => {
      const count = counts.get(stage) ?? 0
      const prevCount = i > 0 ? counts.get(FUNNEL_ORDER[i - 1]) ?? 0 : count
      const conversionFromPrev = prevCount > 0 && i > 0 ? Math.round((count / prevCount) * 100) : null
      return { stage, label: STAGE_LABELS[stage] ?? stage, count, conversionFromPrev }
    })
    const branches = FUNNEL_BRANCHES.map((stage: string) => ({
      stage,
      label: STAGE_LABELS[stage] ?? stage,
      count: counts.get(stage) ?? 0,
    }))
    return { main, branches }
  }, [allContacts, FUNNEL_ORDER, FUNNEL_BRANCHES, STAGE_LABELS])

  async function handleDeleteInvite(id: string) {
    if (!confirm("¿Borrar esta invitación? No se puede deshacer.")) return
    setDeletingInvite(id)
    try {
      const res = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" })
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== id))
      } else {
        alert("Error al borrar. Solo super_admin puede borrar invitaciones.")
      }
    } finally {
      setDeletingInvite(null)
    }
  }

  // 8 KPIs REALES para el grid (delta solo cuando existe dato del periodo anterior)
  const kpiCards: {
    label: string
    value: number
    fmt: (n: number) => string
    delta?: { text: string; up: boolean } | null
  }[] = [
    {
      label: "Revenue",
      value: kpis.revenue,
      fmt: (n) => eur(n),
      delta: kpis.revenuePct !== null ? { text: `${kpis.revenuePct > 0 ? "+" : ""}${kpis.revenuePct}%`, up: kpis.revenuePct >= 0 } : null,
    },
    {
      label: "Cash collected",
      value: kpis.cashCollected,
      fmt: (n) => eur(n),
      delta: kpis.cashPct !== null ? { text: `${kpis.cashPct > 0 ? "+" : ""}${kpis.cashPct}%`, up: kpis.cashPct >= 0 } : null,
    },
    {
      label: "Ventas",
      value: kpis.ventas,
      fmt: (n) => String(Math.round(n)),
      delta: kpis.ventasDelta !== 0 ? { text: `${kpis.ventasDelta > 0 ? "+" : ""}${kpis.ventasDelta}`, up: kpis.ventasDelta >= 0 } : null,
    },
    { label: "Conversión llamada → venta", value: kpis.conversion, fmt: (n) => `${Math.round(n)}%` },
    { label: "Contactos nuevos", value: kpis.contactosNuevos, fmt: (n) => String(Math.round(n)) },
    { label: "Llamadas hechas", value: kpis.llamadasCompletadas, fmt: (n) => String(Math.round(n)) },
    { label: "Show rate", value: kpis.showRate, fmt: (n) => `${Math.round(n)}%` },
    { label: "Ticket medio", value: kpis.ticketMedio, fmt: (n) => (kpis.ventas > 0 ? eur(n) : "—") },
  ]

  const noRevenue = revenueTimeSeries.every((p) => p.revenue === 0)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative">
      {/* Solo las animaciones. El color y la fuente los pone el tema: cuando
          estaban escritos aqui dentro, cambiar la marca no repintaba nada. */}
      <style>{`
        @keyframes hud-in{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:none}}
        .hud-in{opacity:0;animation:hud-in .6s cubic-bezier(.16,1,.3,1) forwards}
        @keyframes funnel-in{from{transform:scaleX(.3);transform-origin:left}to{transform:scaleX(1);transform-origin:left}}
        .funnel-in{animation:funnel-in .8s cubic-bezier(.16,1,.3,1) both;transform-origin:left}
        @media (prefers-reduced-motion:reduce){.hud-in{animation:none;opacity:1}.funnel-in{animation:none}}
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* CABECERA */}
        <header className="hud-in flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-muted-foreground">Panel</div>
            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              Centro de mando <span className="text-muted-foreground">· Capital Hub</span>
            </h1>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <span className="hidden text-sm capitalize text-muted-foreground md:block">
              {dateStr}
            </span>
            <PeriodFilter onChange={setRange} defaultPreset="30d" />
          </div>
        </header>

        {/* mini-lecturas REALES */}
        <div className="hud-in mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" style={{ animationDelay: "40ms" }}>
          {[
            { l: "Ingresos", v: loading ? "…" : eur(kpis.revenue) },
            { l: "Ventas", v: loading ? "…" : String(kpis.ventas) },
            { l: "Conversión", v: loading ? "…" : `${kpis.conversion}%` },
            { l: "Contactos nuevos", v: loading ? "…" : String(kpis.contactosNuevos) },
          ].map((r) => (
            <div
              key={r.l}
              className="flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-3 md:flex-row md:items-center md:justify-between md:px-4"
            >
              <span className="min-w-0 truncate text-sm text-muted-foreground">{r.l}</span>
              <span className="text-[15px] font-bold tabular-nums text-foreground">{r.v}</span>
            </div>
          ))}
        </div>

        {/* HERO — facturacion + resumen operativo */}
        <Card delay={100} className="mt-4">
          <div className="grid gap-6 p-4 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,0.9fr)] md:gap-8 md:p-6">
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-muted-foreground">
                Facturación del periodo
              </span>
              <div className="mt-3 text-4xl font-bold leading-none tabular-nums text-foreground md:text-5xl">
                {loading ? "…" : eur(kpis.revenue)}
              </div>
              {kpis.revenuePct !== null && !loading && (
                <div
                  className={cn(
                    "mt-3 inline-flex flex-wrap items-center gap-1 text-sm font-semibold",
                    kpis.revenuePct >= 0 ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span aria-hidden>{kpis.revenuePct >= 0 ? "▲" : "▾"}</span>
                  {kpis.revenuePct > 0 ? "+" : ""}
                  {kpis.revenuePct}% vs periodo anterior
                </div>
              )}
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                {[
                  { l: "Cash collected", v: loading ? "…" : eur(kpis.cashCollected) },
                  { l: "Ventas", v: loading ? "…" : String(kpis.ventas) },
                  { l: "Ticket medio", v: loading || kpis.ventas === 0 ? "—" : eur(kpis.ticketMedio) },
                ].map((s) => (
                  <div key={s.l} className="min-w-0">
                    <div className="text-lg font-semibold tabular-nums text-foreground">{s.v}</div>
                    <div className="mt-0.5 truncate text-sm text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden bg-border md:block" />

            <div className="min-w-0">
              <span className="block text-sm font-semibold text-muted-foreground">
                Resumen del periodo
              </span>
              <div className="mt-4 space-y-3.5">
                <Stat label="Llamadas hechas" value={loading ? "…" : `${kpis.llamadasCompletadas} / ${kpis.llamadas}`} />
                <Stat label="Show rate" value={loading ? "…" : `${kpis.showRate}%`} />
                <Stat label="No-shows" value={loading ? "…" : String(kpis.noShows)} />
                <Stat label="Conversión llamada → venta" value={loading ? "…" : `${kpis.conversion}%`} accent />
              </div>
            </div>
          </div>
        </Card>

        {/* embudo + actividad */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card
            delay={120}
            title="Embudo de conversión"
            right={
              pipelines.length > 1 ? (
                <select
                  value={activePipelineId ?? ""}
                  onChange={(e) => setActivePipelineId(e.target.value)}
                  className="h-11 max-w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-8 md:px-2.5 md:text-sm"
                  aria-label="Cambiar de embudo"
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : undefined
            }
          >
            <p className="px-4 pt-2 text-sm text-muted-foreground md:px-5">
              {activePipeline?.name ?? "Pipeline"} {"·"} acumulado total
            </p>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DashboardFunnel main={funnelData.main} branches={funnelData.branches} colorOf={colorOf} />
            )}
          </Card>

          <Card delay={160} title="Actividad reciente">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <RecentFeed items={contacts} stageLabel={stageLabel} />
            )}
          </Card>
        </div>

        {/* KPIs REALES (8) */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {kpiCards.map((k, i) => (
            <KpiCard key={k.label} label={k.label} value={loading ? 0 : k.value} fmt={k.fmt} delta={loading ? null : k.delta} i={i} />
          ))}
        </div>

        {/* facturacion 30 dias */}
        <Card delay={140} title="Ingresos · últimos 30 días" className="mt-4 pb-5">
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 text-sm md:px-5">
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <span className="h-1.5 w-4 rounded-full bg-primary" />
              Ingresos
            </span>
            <span className="text-muted-foreground md:ml-auto">
              pasa el cursor para ver el detalle
            </span>
          </div>
          <div className="mt-2 px-4 md:px-5">
            {loading ? (
              <div className="flex h-52 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : noRevenue ? (
              <div className="flex h-52 items-center justify-center text-[15px] text-muted-foreground">
                Sin revenue en este periodo
              </div>
            ) : (
              <DashboardRevenueChart data={revenueTimeSeries} formatoEuro={eur} />
            )}
          </div>
        </Card>

        {/* VENTAS POR COMPLETAR (real, interactivo) */}
        {pendingSales.length > 0 && (
          <Card delay={160} title="Ventas por completar" count={pendingSales.length} className="mt-4">
            <ul className="mt-3 divide-y divide-border pb-2">
              {pendingSales.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-3 md:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] text-foreground">{p.full_name ?? p.email}</div>
                    <div className="truncate text-sm text-muted-foreground">{p.email}</div>
                  </div>
                  <div className="hidden text-sm tabular-nums text-muted-foreground md:block">
                    {p.sale_pending_since ? fechaCorta(p.sale_pending_since) : ""}
                  </div>
                  <button
                    onClick={() =>
                      setSalePrefill({
                        contact_id: p.id,
                        full_name: p.full_name ?? "",
                        email: p.email,
                        phone: p.phone ?? "",
                        products: p.products ?? [],
                        close_type: "direct",
                      })
                    }
                    className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[15px] font-semibold text-primary-foreground active:opacity-90 md:h-8 md:w-auto md:text-sm"
                  >
                    <ShoppingBag className="size-4" /> Registrar venta
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* INVITACIONES APP (real, interactivo) */}
        <Card delay={200} className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 md:px-5 md:pt-5">
            <span className="min-w-0 flex-1 text-sm font-semibold text-muted-foreground">
              Invitaciones App <span className="tabular-nums">· {invites.length}</span>
            </span>
            <a
              href="/crm/contactos?stage=alumno"
              className="inline-flex h-11 shrink-0 items-center gap-1 text-sm text-foreground md:h-8"
            >
              Ver todas <ArrowUpRight className="size-4" />
            </a>
          </div>
          <div className="mt-3 pb-2">
            {loading ? (
              <div className="px-4 py-4 text-[15px] text-muted-foreground md:px-5">Cargando…</div>
            ) : invites.length === 0 ? (
              <div className="px-4 py-4 text-[15px] text-muted-foreground md:px-5">
                Sin invitaciones en este periodo.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {invites.slice(0, 12).map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-start gap-3 px-4 py-3 md:items-center md:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] text-foreground">{inv.full_name}</div>
                      <div className="truncate text-sm text-muted-foreground">{inv.email}</div>
                      {/* En el telefono no hay sitio para columnas: producto y
                          fecha bajan debajo del nombre en vez de desaparecer
                          por el borde derecho. */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground md:hidden">
                        <span className="min-w-0 truncate">{inv.products.join(", ")}</span>
                        <span className="tabular-nums">{fechaCorta(inv.created_at)}</span>
                      </div>
                    </div>
                    <div className="hidden min-w-0 max-w-[12rem] truncate text-sm text-muted-foreground md:block">
                      {inv.products.join(", ")}
                    </div>
                    <div className="hidden text-sm tabular-nums text-muted-foreground md:block">
                      {fechaCorta(inv.created_at)}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-lg border px-2 py-0.5 text-sm",
                        inv.accepted_at
                          ? "border-primary/40 text-primary"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {inv.accepted_at ? "Activado" : "Pendiente"}
                    </span>
                    <button
                      onClick={() => handleDeleteInvite(inv.id)}
                      disabled={deletingInvite === inv.id}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted disabled:opacity-50 md:size-8"
                      title="Eliminar invitación (solo super_admin)"
                    >
                      {deletingInvite === inv.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="h-8" />
      </div>

      {salePrefill && (
        <RegistrarVentaModal
          prefill={salePrefill}
          onClose={() => setSalePrefill(undefined)}
          onRegistered={() => setRange((r) => (r ? { ...r } : r))}
        />
      )}
    </div>
  )
}
