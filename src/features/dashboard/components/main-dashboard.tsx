"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Trash2, Loader2, ShoppingBag, ArrowUpRight } from "lucide-react"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { createBrowserClient } from "@supabase/ssr"
import { cn } from "@/lib/utils"
import { usePipelines, useActivePipelineId } from "@/features/pipelines/hooks/use-pipelines"
import { PipelineSelector } from "@/features/pipelines/components/pipeline-selector"
import { RegistrarVentaModal } from "@/features/sales/components/registrar-venta-modal"

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

const DPR = () => Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.5)

// =============================================================================
// Hooks de la cara (animacion — no tocan datos)
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

function useNow() {
  const [d, setD] = useState<Date | null>(null)
  useEffect(() => {
    const f = () => setD(new Date())
    f()
    const id = setInterval(f, 1000)
    return () => clearInterval(id)
  }, [])
  return d
}

// =============================================================================
// Bola de energia (nucleo IA) — canvas, throttle 30fps. Lee var(--brand).
// Puro decorado, cero datos.
// =============================================================================

function EnergyOrb() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext("2d")!
    const brand = getComputedStyle(cv).getPropertyValue("--brand").trim() || "34 197 94"
    let w = 0
    let h = 0
    let raf = 0
    let t = 0
    let run = true
    let last = 0
    const dpr = DPR()
    const parts = Array.from({ length: 20 }, () => ({
      a: Math.random() * 7,
      r: 0.5 + Math.random() * 0.55,
      sp: 0.006 + Math.random() * 0.01,
      z: Math.random(),
      s: Math.random() * 1.4 + 0.5,
    }))
    const resize = () => {
      w = cv.clientWidth
      h = cv.clientHeight
      cv.width = w * dpr
      cv.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    const vis = () => {
      run = !document.hidden
    }
    document.addEventListener("visibilitychange", vis)
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!run || now - last < 33) return
      last = now
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) * 0.26
      t += 0.045
      let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.3)
      g.addColorStop(0, `rgb(${brand} / 0.22)`)
      g.addColorStop(0.4, `rgb(${brand} / 0.06)`)
      g.addColorStop(1, `rgb(${brand} / 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, R * 2.3, 0, 7)
      ctx.fill()
      for (let k = 0; k < 3; k++) {
        const pr = (t * 0.12 + k / 3) % 1
        ctx.strokeStyle = `rgb(${brand} / ${(1 - pr) * 0.25})`
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.arc(cx, cy, R * (1.15 + pr * 1.25), 0, 7)
        ctx.stroke()
      }
      for (let layer = 0; layer < 2; layer++) {
        ctx.beginPath()
        const amp = R * 0.14
        const segs = 64
        for (let i = 0; i <= segs; i++) {
          const ang = (i / segs) * Math.PI * 2
          const wv =
            Math.sin(ang * 3 + t + layer * 1.7) * amp * 0.5 +
            Math.sin(ang * 6 - t * 1.4 + layer) * amp * 0.35
          const rr = R + wv
          const x = cx + Math.cos(ang) * rr
          const y = cy + Math.sin(ang) * rr
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.fillStyle = `rgb(${brand} / ${layer === 0 ? 0.1 : 0.05})`
        ctx.fill()
        ctx.strokeStyle = `rgb(${brand} / ${layer === 0 ? 0.6 : 0.28})`
        ctx.lineWidth = layer === 0 ? 1.6 : 1
        ctx.stroke()
      }
      const pulse = 1 + Math.sin(t * 1.6) * 0.09
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.7 * pulse)
      g.addColorStop(0, "rgb(255 255 255 / 0.95)")
      g.addColorStop(0.28, `rgb(${brand} / 0.85)`)
      g.addColorStop(1, `rgb(${brand} / 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.6 * pulse, 0, 7)
      ctx.fill()
      for (const p of parts) {
        p.a += p.sp
        const rr = R * (1.05 + p.r * 0.7)
        const x = cx + Math.cos(p.a) * rr
        const y = cy + Math.sin(p.a) * rr * 0.55
        ctx.fillStyle = `rgb(${brand} / ${0.35 + p.z * 0.5})`
        ctx.beginPath()
        ctx.arc(x, y, p.s, 0, 7)
        ctx.fill()
      }
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener("visibilitychange", vis)
    }
  }, [])
  return <canvas ref={ref} className="h-full w-full" />
}

// =============================================================================
// Card base (surface-elevated rounded-2xl estilo HUD)
// =============================================================================

function Card({
  children,
  className = "",
  title,
  delay = 0,
  glow = false,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  delay?: number
  glow?: boolean
}) {
  return (
    <div
      className={cn(
        "hud-in relative rounded-2xl border border-white/[0.08] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40",
        className,
      )}
      style={{
        animationDelay: `${delay}ms`,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0) 55%), #16161a",
        boxShadow: glow
          ? "0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), 0 0 70px -22px rgb(var(--brand)/0.5)"
          : "0 12px 32px rgba(0,0,0,0.6)",
      }}
    >
      {title && (
        <div className="flex items-center gap-2.5 px-5 pt-5">
          <span className="h-3.5 w-0.5 rounded bg-brand" />
          <span className="dash-eyebrow">{title}</span>
        </div>
      )}
      {children}
    </div>
  )
}

// =============================================================================
// KPI Card (count-up + delta opcional REAL). Sin sparkline inventada.
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
    <Card delay={80 + i * 35} className="group relative overflow-hidden p-5 sm:p-6">
      <span className="absolute left-0 top-0 h-full w-[3px] bg-brand/70" />
      <span
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle, rgb(var(--brand)/0.18), transparent 70%)" }}
      />
      <div className="flex items-center gap-2">
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-brand" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{label}</span>
      </div>
      <div className="mt-3 text-[26px] font-bold leading-none tabular-nums text-neutral-50 sm:text-[30px]">
        {fmt(v)}
      </div>
      {delta && (
        <div
          className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{
            background: delta.up ? "rgba(52,211,153,0.14)" : "rgba(251,113,133,0.14)",
            color: delta.up ? "#6ee7b7" : "#fda4af",
          }}
        >
          <span className="text-[9px]">{delta.up ? "▲" : "▼"}</span> {delta.text}
        </div>
      )}
    </Card>
  )
}

// =============================================================================
// Embudo REAL — pasos del pipeline activo (stages reales + sus colores).
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
  return (
    <div className="px-5 pb-5 pt-4">
      {main.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-neutral-500">Sin stages en este funnel.</p>
      ) : (
        <div className="space-y-2">
          {main.map((s, i) => {
            const col = colorOf(s.stage)
            const wid = 24 + 76 * (s.count / max)
            return (
              <div key={s.stage} className="flex items-center gap-3">
                <div className="relative mx-auto h-9" style={{ width: `${wid}%` }}>
                  <div
                    className="funnel-in absolute inset-0"
                    style={{
                      clipPath: "polygon(6% 0,94% 0,82% 100%,18% 100%)",
                      background: `linear-gradient(180deg, ${col}, ${col}22)`,
                      border: `1px solid ${col}`,
                      boxShadow: `0 0 18px -5px ${col}`,
                      animationDelay: `${i * 110}ms`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5">
                    <span className="text-[12px] font-bold text-white tabular-nums">{s.count}</span>
                    {s.conversionFromPrev !== null && (
                      <span className="text-[10px] font-semibold text-white/70 tabular-nums">
                        {s.conversionFromPrev}%
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: col }}
                >
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
      {branches.length > 0 && (
        <div className="mt-4 border-t border-white/[0.08] pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            Salidas del embudo
          </p>
          <div className="grid grid-cols-2 gap-2">
            {branches.map((b) => {
              const col = colorOf(b.stage)
              return (
                <div
                  key={b.stage}
                  className="rounded-lg border px-3 py-2"
                  style={{ backgroundColor: `${col}14`, borderColor: `${col}44` }}
                >
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: col }}>
                    {b.label}
                  </div>
                  <div className="mt-0.5 text-lg font-bold tabular-nums text-neutral-100">{b.count}</div>
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
        <p className="py-6 text-center text-[12px] text-neutral-500">Sin contactos en este periodo.</p>
      ) : (
        items.slice(0, 7).map((c, i) => (
          <div key={c.id} className="flex items-center gap-3">
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                i === 0 ? "pulse-dot bg-emerald-400" : "bg-brand",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] text-neutral-200">{c.full_name ?? "Contacto"}</div>
              <div className="truncate text-[10px] text-neutral-500">
                {stageLabel(c.stage)}
                {c.origin ? ` · ${c.origin}` : ""}
              </div>
            </div>
            <span className="shrink-0 text-[10px] text-neutral-600">{timeAgo(c.created_at)}</span>
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
              <text x={padL - 10} y={yy + 3.5} textAnchor="end" className="fill-neutral-500" style={{ fontSize: 11 }}>
                {gv}
                {"€"}
              </text>
            </g>
          )
        })}
        <path
          d={`${line(vals)} L${x(n)} ${y(0)} L${x(0)} ${y(0)} Z`}
          className="fill-brand/[0.12]"
        />
        <path
          d={line(vals)}
          fill="none"
          className="stroke-brand"
          strokeWidth={2.6}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text
              key={i}
              x={x(i)}
              y={H - 9}
              textAnchor="middle"
              className={hi === i ? "fill-brand" : "fill-neutral-500"}
              style={{ fontSize: 10 }}
            >
              {fmtLabel(d.date)}
            </text>
          ) : null,
        )}
        {hi !== null && data[hi] && (
          <g>
            <line x1={x(hi)} x2={x(hi)} y1={padT} y2={padT + plotH} className="stroke-brand/50" strokeWidth={1} />
            <circle cx={x(hi)} cy={y(data[hi].revenue)} r={4.5} className="fill-brand" stroke="#0d0b18" strokeWidth={1.5} />
          </g>
        )}
      </svg>
      {hi !== null && data[hi] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-white/12 bg-neutral-900/95 px-3.5 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          style={{ left: `${(x(hi) / W) * 100}%`, top: 4 }}
        >
          <div className="text-[12px] font-bold text-neutral-100">
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
// Fila de resumen (label + valor) para el HERO
// =============================================================================

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-l-2 border-brand/40 pl-3">
      <div>
        <div className="text-base font-bold text-neutral-100 tabular-nums">{value}</div>
        <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
      </div>
    </div>
  )
}

// =============================================================================
// Componente principal — CARA nueva, DATOS reales de Capital Hub
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

  const now = useNow()
  const clock = now ? now.toLocaleTimeString("es-ES", { hour12: false }) : "--:--:--"
  const dateStr = now ? now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) : ""

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
  // Render — CARA HUD
  // ---------------------------------------------------------------------------
  return (
    <div className="relative overflow-hidden text-neutral-100">
      <style>{`
        @keyframes hud-in{0%{opacity:0;transform:translateY(14px)}100%{opacity:1;transform:none}}.hud-in{opacity:0;animation:hud-in .7s cubic-bezier(.16,1,.3,1) forwards}
        @keyframes spin{to{transform:rotate(360deg)}}.spin-slow{animation:spin 60s linear infinite}.spin-rev{animation:spin 26s linear infinite reverse}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.35}}.pulse-dot{animation:pulse-dot 1.8s ease-in-out infinite}
        @keyframes barw{from{width:0}}.barw{animation:barw 1.2s cubic-bezier(.16,1,.3,1) forwards}
        @keyframes funnel-in{from{opacity:0;transform:scaleX(.3)}to{opacity:1;transform:scaleX(1)}}.funnel-in{animation:funnel-in .8s cubic-bezier(.16,1,.3,1) both}
        .dash-eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:rgb(var(--brand));font-weight:600}
        .dash-tgold{background:linear-gradient(180deg,#fff 0%,rgb(var(--brand)) 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
      `}</style>

      {/* motifs decorativos (glow verde + rejilla de puntos) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 0%, rgb(var(--brand)/0.13) 0%, transparent 55%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgb(var(--brand)/0.4) 1px, transparent 1.5px)",
          backgroundSize: "30px 30px",
          opacity: 0.18,
          maskImage: "radial-gradient(ellipse at 50% 18%, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 18%, black, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* TELEMETRIA */}
        <div className="hud-in flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="dash-eyebrow flex items-center gap-2">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-brand" /> Centro de operaciones {"·"} en vivo
            </div>
            <h1 className="dash-tgold mt-1.5 text-3xl font-bold leading-none tracking-tight sm:text-[38px]">
              Centro de mando {"·"} Capital Hub
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end justify-center">
              <div className="text-3xl font-bold tabular-nums leading-none text-neutral-100 sm:text-[34px]">{clock}</div>
              <div className="mt-1 text-[11px] capitalize text-neutral-400">{dateStr}</div>
            </div>
            <div className="h-9 w-px bg-white/10" />
            <PeriodFilter onChange={setRange} defaultPreset="30d" />
          </div>
        </div>

        {/* mini-lecturas REALES */}
        <div className="hud-in mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4" style={{ animationDelay: "40ms" }}>
          {[
            { l: "Ingresos", v: loading ? "…" : eur(kpis.revenue) },
            { l: "Ventas", v: loading ? "…" : String(kpis.ventas) },
            { l: "Conversión", v: loading ? "…" : `${kpis.conversion}%` },
            { l: "Contactos nuevos", v: loading ? "…" : String(kpis.contactosNuevos) },
          ].map((r) => (
            <div
              key={r.l}
              className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3"
            >
              <span className="text-[10px] uppercase tracking-wider text-neutral-400">{r.l}</span>
              <span className="text-sm font-bold tabular-nums text-neutral-50">{r.v}</span>
            </div>
          ))}
        </div>

        {/* HEROE — facturacion real + orbe */}
        <Card delay={100} glow className="mt-5 overflow-hidden">
          <div className="relative grid items-center gap-2 md:grid-cols-[1fr_1.1fr_1fr]" style={{ minHeight: 360 }}>
            <div className="z-10 px-6 py-6">
              <div className="dash-eyebrow">Facturación del periodo</div>
              <div className="mt-2 text-[36px] font-extrabold leading-none tabular-nums text-neutral-100 sm:text-[44px]">
                {loading ? "…" : eur(kpis.revenue)}
              </div>
              {kpis.revenuePct !== null && !loading && (
                <div
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{
                    background: kpis.revenuePct >= 0 ? "rgba(52,211,153,0.14)" : "rgba(251,113,133,0.14)",
                    color: kpis.revenuePct >= 0 ? "#6ee7b7" : "#fda4af",
                  }}
                >
                  <span className="text-[9px]">{kpis.revenuePct >= 0 ? "▲" : "▼"}</span>
                  {kpis.revenuePct > 0 ? "+" : ""}
                  {kpis.revenuePct}% vs periodo anterior
                </div>
              )}
              <div className="mt-5 space-y-3">
                <StatRow label="Cash collected" value={loading ? "…" : eur(kpis.cashCollected)} />
                <StatRow label="Ventas" value={loading ? "…" : String(kpis.ventas)} />
                <StatRow label="Ticket medio" value={loading || kpis.ventas === 0 ? "—" : eur(kpis.ticketMedio)} />
              </div>
            </div>
            <div className="relative h-[360px]">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 340 340" className="h-[320px] w-[320px] opacity-60">
                  <g className="spin-slow" style={{ transformOrigin: "center" }}>
                    <circle cx="170" cy="170" r="162" fill="none" stroke="rgb(var(--brand)/0.15)" strokeWidth="1" strokeDasharray="2 10" />
                  </g>
                  <g className="spin-rev" style={{ transformOrigin: "center" }}>
                    <circle cx="170" cy="170" r="146" fill="none" stroke="rgb(var(--brand)/0.18)" strokeWidth="1.5" strokeDasharray="40 24" />
                  </g>
                </svg>
              </div>
              <EnergyOrb />
            </div>
            <div className="z-10 px-6 py-6">
              <div className="dash-eyebrow">Resumen del periodo</div>
              <div className="mt-3 space-y-3">
                {[
                  { l: "Llamadas hechas", v: loading ? "…" : `${kpis.llamadasCompletadas} / ${kpis.llamadas}` },
                  { l: "Show rate", v: loading ? "…" : `${kpis.showRate}%` },
                  { l: "No-shows", v: loading ? "…" : String(kpis.noShows) },
                  { l: "Conversión llamada → venta", v: loading ? "…" : `${kpis.conversion}%` },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-neutral-300">{s.l}</span>
                      <span className="font-bold tabular-nums text-brand">{s.v}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* embudo + feed */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Card delay={120}>
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
              <div className="flex items-center gap-2.5">
                <span className="h-3.5 w-0.5 rounded bg-brand" />
                <span className="dash-eyebrow">Embudo de conversión</span>
              </div>
              <PipelineSelector pipelines={pipelines} activeId={activePipelineId} onChange={setActivePipelineId} />
            </div>
            <p className="px-5 pt-2 text-[11px] text-neutral-500">
              {activePipeline?.name ?? "Pipeline"} {"·"} acumulado total
            </p>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
              </div>
            ) : (
              <Funnel main={funnelData.main} branches={funnelData.branches} colorOf={colorOf} />
            )}
          </Card>

          <Card delay={160} title="Actividad reciente">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
              </div>
            ) : (
              <RecentFeed items={contacts} stageLabel={stageLabel} />
            )}
          </Card>
        </div>

        {/* KPIs REALES (8) */}
        <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {kpiCards.map((k, i) => (
            <KpiCard key={k.label} label={k.label} value={loading ? 0 : k.value} fmt={k.fmt} delta={loading ? null : k.delta} i={i} />
          ))}
        </div>

        {/* facturacion total (area chart REAL) */}
        <Card delay={140} title="Facturación · últimos 30 días" className="mt-5 pb-5">
          <div className="mt-3 flex items-center gap-4 px-5 text-[11px]">
            <span className="flex items-center gap-1.5 font-semibold text-brand">
              <span className="h-1.5 w-4 rounded-full bg-brand" />
              Ingresos
            </span>
            <span className="ml-auto text-neutral-500">pasa el cursor para ver el detalle</span>
          </div>
          <div className="mt-2 px-5">
            {loading ? (
              <div className="flex h-52 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
              </div>
            ) : noRevenue ? (
              <div className="flex h-52 items-center justify-center text-[12px] text-neutral-500">
                Sin revenue en este periodo
              </div>
            ) : (
              <RevenueAreaChart data={revenueTimeSeries} />
            )}
          </div>
        </Card>

        {/* VENTAS POR COMPLETAR (real, interactivo) */}
        {pendingSales.length > 0 && (
          <Card delay={160} className="mt-5">
            <div className="flex items-center gap-2.5 px-5 pt-5">
              <span className="h-3.5 w-0.5 rounded bg-brand" />
              <span className="dash-eyebrow">
                Ventas por completar {"·"} {pendingSales.length}
              </span>
            </div>
            <div className="mt-3 divide-y divide-white/[0.06] px-2 pb-2">
              {pendingSales.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-neutral-100">{p.full_name ?? p.email}</div>
                    <div className="truncate text-[11px] text-neutral-500">{p.email}</div>
                  </div>
                  <div className="hidden text-xs text-neutral-500 md:block">
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
                    className="inline-flex items-center gap-1 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1 text-[11px] font-medium text-brand transition-colors hover:bg-brand/20"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Registrar venta
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* INVITACIONES APP (real, interactivo) */}
        <Card delay={200} className="mt-5">
          <div className="flex items-center justify-between px-5 pt-5">
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-0.5 rounded bg-brand" />
              <span className="dash-eyebrow">
                Invitaciones App {"·"} {invites.length}
              </span>
            </div>
            <a
              href="/crm/contactos?stage=alumno"
              className="inline-flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-neutral-100"
            >
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-3 px-2 pb-2">
            {loading ? (
              <div className="p-4 text-xs text-neutral-500">Cargando…</div>
            ) : invites.length === 0 ? (
              <div className="p-4 text-xs text-neutral-500">Sin invitaciones en este periodo.</div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {invites.slice(0, 12).map((inv) => (
                  <div key={inv.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-neutral-100">{inv.full_name}</div>
                      <div className="truncate text-[11px] text-neutral-500">{inv.email}</div>
                    </div>
                    <div className="hidden text-[10px] uppercase tracking-wider text-neutral-500 md:block">
                      {inv.products.join(", ")}
                    </div>
                    <div className="hidden text-xs text-neutral-500 md:block">
                      {new Date(inv.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    </div>
                    <span
                      className={cn(
                        "rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                        inv.accepted_at
                          ? "border-emerald-500/40 text-emerald-400"
                          : "border-amber-500/40 text-amber-400",
                      )}
                    >
                      {inv.accepted_at ? "Activado" : "Pendiente"}
                    </span>
                    <button
                      onClick={() => handleDeleteInvite(inv.id)}
                      disabled={deletingInvite === inv.id}
                      className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
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

        <div className="h-6" />
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
