"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Trash2, Loader2, ShoppingBag, ArrowUpRight } from "lucide-react"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { createBrowserClient } from "@supabase/ssr"
import { cn } from "@/lib/utils"
import { usePipelines, useActivePipelineId } from "@/features/pipelines/hooks/use-pipelines"
import { RegistrarVentaModal } from "@/features/sales/components/registrar-venta-modal"

// =============================================================================
// Paleta minimalista (carbon + verde de marca como acento minimo)
// =============================================================================

const SURFACE = "#131318" // tarjetas
const TXT = "#F5F6F7" // texto primario
const MUT = "#A6AAB2" // texto de apoyo
const MUT2 = "#7C818A" // texto terciario / labels
const LINE = "rgba(245,246,247,0.08)" // reglas de 1px
const GREENSOFT = "#4ADE80" // verde acento sobre carbon

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
// Card base (minimalista: carbon-2, borde fino, radio suave, sin sombras duras)
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
      className={cn(
        "hud-in relative rounded-xl border transition-colors duration-300",
        className,
      )}
      style={{ animationDelay: `${delay}ms`, background: SURFACE, borderColor: LINE }}
    >
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          {title ? (
            <span className="dash-eyebrow">
              {title}
              {count != null && <span style={{ color: MUT2 }}> · {count}</span>}
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
// KPI Card (count-up + delta REAL). Minimalista: sin barras, halos ni pulsos.
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
    <Card delay={80 + i * 35} className="p-5">
      <span className="dash-eyebrow">{label}</span>
      <div className="dash-ff mt-2.5 text-[24px] font-bold leading-none tabular-nums sm:text-[27px]" style={{ color: TXT }}>
        {fmt(v)}
      </div>
      {delta && (
        <div
          className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold"
          style={{ color: delta.up ? GREENSOFT : MUT2 }}
        >
          <span className="text-[9px]">{delta.up ? "▲" : "▾"}</span> {delta.text}
        </div>
      )}
    </Card>
  )
}

// =============================================================================
// Embudo REAL — pasos del pipeline activo (stages reales + sus colores de config).
// =============================================================================

function Funnel({
  main,
  branches,
  colorOf,
}: {
  main: { stage: string; label: string; count: number; conversionFromPrev: number | null }[]
  branches: { stage: string; label: string; count: number }[]
  colorOf: (stage: string) => string
}) {
  const max = Math.max(...main.map((s) => s.count), 1)
  const n = main.length
  const widths: number[] = []
  for (let i = 0; i < n; i++) {
    const prop = 28 + 64 * (main[i].count / max)
    const w = i === 0 ? prop : Math.min(prop, widths[i - 1] - 9)
    widths.push(Math.max(12, w))
  }
  return (
    <div className="px-5 pb-5 pt-4">
      {main.length === 0 ? (
        <p className="py-6 text-center text-[12px]" style={{ color: MUT2 }}>
          Sin stages en este funnel.
        </p>
      ) : (
        <div>
          {main.map((s, i) => {
            const col = colorOf(s.stage)
            const topW = widths[i]
            const botW = i < n - 1 ? widths[i + 1] : Math.max(6, widths[i] * 0.5)
            const clip = `polygon(${(50 - topW / 2).toFixed(2)}% 0, ${(50 + topW / 2).toFixed(
              2,
            )}% 0, ${(50 + botW / 2).toFixed(2)}% 100%, ${(50 - botW / 2).toFixed(2)}% 100%)`
            return (
              <div key={s.stage} className="flex items-center gap-4">
                <div className="relative h-[50px] flex-1">
                  <div
                    className="funnel-in absolute inset-0"
                    style={{
                      clipPath: clip,
                      background: `linear-gradient(180deg, ${col} 0%, color-mix(in srgb, ${col} 82%, #000000) 100%)`,
                      animationDelay: `${i * 80}ms`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2">
                    <span className="dash-ff text-[14px] font-bold tabular-nums text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                      {s.count}
                    </span>
                    {s.conversionFromPrev !== null && (
                      <span className="text-[10px] font-semibold tabular-nums text-white/70">
                        {s.conversionFromPrev}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex w-32 shrink-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: col }} />
                  <span className="text-[12px] leading-tight" style={{ color: MUT }}>
                    {s.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {branches.length > 0 && (
        <div className="mt-4 border-t pt-3" style={{ borderColor: LINE }}>
          <p className="mb-2 text-[10px] uppercase" style={{ color: MUT2 }}>
            Salidas del embudo
          </p>
          <div className="grid grid-cols-2 gap-2">
            {branches.map((b) => {
              const col = colorOf(b.stage)
              return (
                <div key={b.stage} className="rounded-lg border px-3 py-2" style={{ borderColor: LINE }}>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: col }} />
                    <span className="text-[10px] uppercase" style={{ color: MUT2 }}>
                      {b.label}
                    </span>
                  </div>
                  <div className="dash-ff mt-1 text-lg font-bold tabular-nums" style={{ color: TXT }}>
                    {b.count}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
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
  return (
    <div className="space-y-2.5 px-5 pb-4 pt-4">
      {items.length === 0 ? (
        <p className="py-6 text-center text-[12px]" style={{ color: MUT2 }}>
          Sin contactos en este periodo.
        </p>
      ) : (
        items.slice(0, 7).map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "rgba(74,222,128,0.55)" }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px]" style={{ color: TXT }}>
                {c.full_name ?? "Contacto"}
              </div>
              <div className="truncate text-[10.5px]" style={{ color: MUT2 }}>
                {stageLabel(c.stage)}
                {c.origin ? ` · ${c.origin}` : ""}
              </div>
            </div>
            <span className="shrink-0 text-[10px]" style={{ color: MUT2 }}>
              {timeAgo(c.created_at)}
            </span>
          </div>
        ))
      )}
    </div>
  )
}

// =============================================================================
// Area chart REAL — revenueTimeSeries (30d). Serie unica Ingresos.
// =============================================================================

function RevenueAreaChart({ data }: { data: { date: string; revenue: number }[] }) {
  const [hi, setHi] = useState<number | null>(null)
  const W = 640
  const H = 220
  const padL = 54
  const padR = 18
  const padT = 18
  const padB = 30
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const vals = data.map((d) => d.revenue)
  const max = Math.max(...vals, 1) * 1.12
  const n = Math.max(1, data.length - 1)
  const x = (i: number) => padL + (i / n) * plotW
  const y = (val: number) => padT + plotH - (val / max) * plotH
  const line = (d: number[]) => d.map((val, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(val).toFixed(1)}`).join(" ")
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t))
  const labelEvery = Math.max(1, Math.ceil(data.length / 6))

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const rel = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(((rel - padL) / plotW) * n)
    setHi(Math.max(0, Math.min(data.length - 1, idx)))
  }

  const fmtLabel = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })

  return (
    <div className="relative w-full" onMouseMove={onMove} onMouseLeave={() => setHi(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }}>
        {ticks.map((gv, i) => {
          const yy = y(gv)
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={yy} y2={yy} className="stroke-white/[0.06]" />
              <text x={padL - 10} y={yy + 3.5} textAnchor="end" fill={MUT2} style={{ fontSize: 11 }}>
                {gv}
                {"€"}
              </text>
            </g>
          )
        })}
        <path d={`${line(vals)} L${x(n)} ${y(0)} L${x(0)} ${y(0)} Z`} className="fill-brand/[0.10]" />
        <path
          d={line(vals)}
          fill="none"
          className="stroke-brand"
          strokeWidth={2.4}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={i} x={x(i)} y={H - 9} textAnchor="middle" fill={hi === i ? GREENSOFT : MUT2} style={{ fontSize: 10 }}>
              {fmtLabel(d.date)}
            </text>
          ) : null,
        )}
        {hi !== null && data[hi] && (
          <g>
            <line x1={x(hi)} x2={x(hi)} y1={padT} y2={padT + plotH} className="stroke-brand/50" strokeWidth={1} />
            <circle cx={x(hi)} cy={y(data[hi].revenue)} r={4} className="fill-brand" stroke="#0F0F12" strokeWidth={1.5} />
          </g>
        )}
      </svg>
      {hi !== null && data[hi] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border px-3.5 py-2.5"
          style={{ left: `${(x(hi) / W) * 100}%`, top: 4, borderColor: LINE, background: "#16161a" }}
        >
          <div className="dash-ff text-[12px] font-bold" style={{ color: TXT }}>
            {new Date(data[hi].date).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" })}
          </div>
          <div className="mt-1.5 flex items-center gap-2 whitespace-nowrap text-[11px] font-semibold text-brand">
            <span className="h-1.5 w-3.5 rounded-full bg-brand" />
            Ingresos {eur(data[hi].revenue)}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Fila de resumen (label + valor) del hero
// =============================================================================

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-[12px]" style={{ color: MUT }}>
        {accent && <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: GREENSOFT }} />}
        {label}
      </span>
      <span className="dash-ff text-[14px] font-semibold tabular-nums" style={{ color: accent ? GREENSOFT : TXT }}>
        {value}
      </span>
    </div>
  )
}

// =============================================================================
// Componente principal — minimalista, DATOS reales de Capital Hub
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

  const colorOf = (stage: string) => STAGE_HEX[stage] ?? "#71717a"
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
  // Render — minimalista
  // ---------------------------------------------------------------------------
  return (
    <div className="relative" style={{ color: TXT }}>
      <style>{`
        @keyframes hud-in{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:none}}.hud-in{opacity:0;animation:hud-in .6s cubic-bezier(.16,1,.3,1) forwards}
        @keyframes funnel-in{from{opacity:0;transform:scaleX(.3)}to{opacity:1;transform:scaleX(1)}}.funnel-in{animation:funnel-in .8s cubic-bezier(.16,1,.3,1) both}
        .dash-ff{font-family:var(--font-inter-tight),"Inter Tight",system-ui,sans-serif}
        .dash-eyebrow{font-family:var(--font-inter-tight),"Inter Tight",sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:normal;color:${MUT2};font-weight:600}
        .dash-h1{font-family:var(--font-inter-tight),"Inter Tight",sans-serif;font-weight:700;letter-spacing:-.02em;color:${TXT}}
        .dash-select{font-family:var(--font-inter-tight),"Inter Tight",sans-serif}
        .dash-select option{background:#16161a;color:${TXT}}
        @media (prefers-reduced-motion:reduce){.hud-in{animation:none;opacity:1}.funnel-in{animation:none}}
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* CABECERA */}
        <header className="hud-in flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="dash-eyebrow">Panel</div>
            <h1 className="dash-h1 mt-1.5 text-[28px] leading-[1.05] sm:text-[36px]">
              Centro de mando <span style={{ color: MUT2 }}>· Capital Hub</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="dash-ff hidden text-[12px] capitalize sm:block" style={{ color: MUT2 }}>
              {dateStr}
            </span>
            <PeriodFilter onChange={setRange} defaultPreset="30d" />
          </div>
        </header>

        {/* mini-lecturas REALES */}
        <div className="hud-in mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "40ms" }}>
          {[
            { l: "Ingresos", v: loading ? "…" : eur(kpis.revenue) },
            { l: "Ventas", v: loading ? "…" : String(kpis.ventas) },
            { l: "Conversión", v: loading ? "…" : `${kpis.conversion}%` },
            { l: "Contactos nuevos", v: loading ? "…" : String(kpis.contactosNuevos) },
          ].map((r) => (
            <div
              key={r.l}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{ borderColor: LINE, background: SURFACE }}
            >
              <span className="text-[10px] uppercase" style={{ color: MUT2 }}>
                {r.l}
              </span>
              <span className="dash-ff text-sm font-bold tabular-nums" style={{ color: TXT }}>
                {r.v}
              </span>
            </div>
          ))}
        </div>

        {/* HERO — facturacion + resumen operativo (limpio, sin adornos) */}
        <Card delay={100} className="mt-4">
          <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,0.9fr)]">
            <div>
              <span className="dash-eyebrow">Facturación del periodo</span>
              <div className="dash-ff mt-3 text-[40px] font-bold leading-none tabular-nums sm:text-[48px]" style={{ color: TXT }}>
                {loading ? "…" : eur(kpis.revenue)}
              </div>
              {kpis.revenuePct !== null && !loading && (
                <div
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold"
                  style={{ color: kpis.revenuePct >= 0 ? GREENSOFT : MUT2 }}
                >
                  <span className="text-[10px]">{kpis.revenuePct >= 0 ? "▲" : "▾"}</span>
                  {kpis.revenuePct > 0 ? "+" : ""}
                  {kpis.revenuePct}% vs periodo anterior
                </div>
              )}
              <div className="mt-7 grid grid-cols-3 gap-4">
                {[
                  { l: "Cash collected", v: loading ? "…" : eur(kpis.cashCollected) },
                  { l: "Ventas", v: loading ? "…" : String(kpis.ventas) },
                  { l: "Ticket medio", v: loading || kpis.ventas === 0 ? "—" : eur(kpis.ticketMedio) },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="dash-ff text-[16px] font-semibold tabular-nums" style={{ color: TXT }}>
                      {s.v}
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase" style={{ color: MUT2 }}>
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden md:block" style={{ background: LINE }} />

            <div>
              <span className="dash-eyebrow">Resumen del periodo</span>
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
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card
            delay={120}
            title="Embudo de conversión"
            right={
              pipelines.length > 1 ? (
                <select
                  value={activePipelineId ?? ""}
                  onChange={(e) => setActivePipelineId(e.target.value)}
                  className="dash-select h-8 rounded-lg border bg-transparent px-2.5 text-[12px] outline-none transition-colors hover:border-white/20 focus:border-white/25"
                  style={{ borderColor: LINE, color: MUT }}
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
            <p className="px-5 pt-2 text-[11px]" style={{ color: MUT2 }}>
              {activePipeline?.name ?? "Pipeline"} {"·"} acumulado total
            </p>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: MUT2 }} />
              </div>
            ) : (
              <Funnel main={funnelData.main} branches={funnelData.branches} colorOf={colorOf} />
            )}
          </Card>

          <Card delay={160} title="Actividad reciente">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: MUT2 }} />
              </div>
            ) : (
              <RecentFeed items={contacts} stageLabel={stageLabel} />
            )}
          </Card>
        </div>

        {/* KPIs REALES (8) */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kpiCards.map((k, i) => (
            <KpiCard key={k.label} label={k.label} value={loading ? 0 : k.value} fmt={k.fmt} delta={loading ? null : k.delta} i={i} />
          ))}
        </div>

        {/* facturacion 30 dias */}
        <Card delay={140} title="Ingresos · últimos 30 días" className="mt-4 pb-5">
          <div className="mt-3 flex items-center gap-4 px-5 text-[11px]">
            <span className="flex items-center gap-1.5 font-semibold text-brand">
              <span className="h-1.5 w-4 rounded-full bg-brand" />
              Ingresos
            </span>
            <span className="ml-auto" style={{ color: MUT2 }}>
              pasa el cursor para ver el detalle
            </span>
          </div>
          <div className="mt-2 px-5">
            {loading ? (
              <div className="flex h-52 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: MUT2 }} />
              </div>
            ) : noRevenue ? (
              <div className="flex h-52 items-center justify-center text-[12px]" style={{ color: MUT2 }}>
                Sin revenue en este periodo
              </div>
            ) : (
              <RevenueAreaChart data={revenueTimeSeries} />
            )}
          </div>
        </Card>

        {/* VENTAS POR COMPLETAR (real, interactivo) */}
        {pendingSales.length > 0 && (
          <Card delay={160} title="Ventas por completar" count={pendingSales.length} className="mt-4">
            <div className="mt-3 px-2 pb-2">
              {pendingSales.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={idx === 0 ? undefined : { borderTop: `1px solid ${LINE}` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm" style={{ color: TXT }}>
                      {p.full_name ?? p.email}
                    </div>
                    <div className="truncate text-[11px]" style={{ color: MUT2 }}>
                      {p.email}
                    </div>
                  </div>
                  <div className="hidden text-xs md:block" style={{ color: MUT2 }}>
                    {p.sale_pending_since
                      ? new Date(p.sale_pending_since).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
                      : ""}
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
                    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:border-white/25"
                    style={{ borderColor: LINE, color: GREENSOFT }}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Registrar venta
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* INVITACIONES APP (real, interactivo) */}
        <Card delay={200} className="mt-4">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <span className="dash-eyebrow">
              Invitaciones App <span style={{ color: MUT2 }}>· {invites.length}</span>
            </span>
            <a
              href="/crm/contactos?stage=alumno"
              className="inline-flex shrink-0 items-center gap-1 text-xs transition-colors"
              style={{ color: MUT }}
            >
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-3 px-2 pb-2">
            {loading ? (
              <div className="p-4 text-xs" style={{ color: MUT2 }}>
                Cargando…
              </div>
            ) : invites.length === 0 ? (
              <div className="p-4 text-xs" style={{ color: MUT2 }}>
                Sin invitaciones en este periodo.
              </div>
            ) : (
              <div>
                {invites.slice(0, 12).map((inv, idx) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                    style={idx === 0 ? undefined : { borderTop: `1px solid ${LINE}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm" style={{ color: TXT }}>
                        {inv.full_name}
                      </div>
                      <div className="truncate text-[11px]" style={{ color: MUT2 }}>
                        {inv.email}
                      </div>
                    </div>
                    <div className="hidden text-[10px] uppercase md:block" style={{ color: MUT2 }}>
                      {inv.products.join(", ")}
                    </div>
                    <div className="hidden text-xs md:block" style={{ color: MUT2 }}>
                      {new Date(inv.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    </div>
                    <span
                      className="rounded-md border px-1.5 py-0.5 text-[10px] uppercase"
                      style={
                        inv.accepted_at
                          ? { borderColor: "rgba(74,222,128,0.35)", color: GREENSOFT }
                          : { borderColor: LINE, color: MUT2 }
                      }
                    >
                      {inv.accepted_at ? "Activado" : "Pendiente"}
                    </span>
                    <button
                      onClick={() => handleDeleteInvite(inv.id)}
                      disabled={deletingInvite === inv.id}
                      className="rounded-md p-1 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      style={{ color: MUT2 }}
                      title="Eliminar invitación (solo super_admin)"
                    >
                      {deletingInvite === inv.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
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
