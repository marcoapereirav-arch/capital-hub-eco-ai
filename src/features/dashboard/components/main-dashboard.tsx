"use client"

import { useEffect, useMemo, useState } from "react"
import {
  DollarSign,
  Users,
  Phone,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Trash2,
  PercentSquare,
  Trophy,
  Banknote,
  Loader2,
} from "lucide-react"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { createBrowserClient } from "@supabase/ssr"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts"

// =============================================================================
// Tipos
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
// Constantes
// =============================================================================

// SOURCE OF TRUTH: estos stages deben coincidir EXACTAMENTE con los del CRM
// (src/features/contactos/components/contactos-page.tsx PIPELINE_STAGES).
// NO inventar valores nuevos aqui — si se cambia un stage, cambiarlo en ambos sitios.
const STAGE_LABELS: Record<string, string> = {
  nuevo_seguidor: "Nuevo seguidor",
  conversacion: "Conversación",
  agendado: "Agendado",
  atendio: "Atendió llamada",
  seguimiento: "Seguimiento",
  cliente: "Cliente",
  no_show: "No show",
  perdido: "Perdido",
}

const STAGE_COLORS: Record<string, string> = {
  nuevo_seguidor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  conversacion: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  agendado: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  atendio: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  seguimiento: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  cliente: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  no_show: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  perdido: "bg-red-500/15 text-red-400 border-red-500/30",
}

// Embudo lineal (camino "feliz"): entrada → caliente → llamada → cliente
const FUNNEL_ORDER: string[] = [
  "nuevo_seguidor",
  "conversacion",
  "agendado",
  "atendio",
  "cliente",
]

// Estados terminales / salidas del embudo (mostrados aparte como ramas)
const FUNNEL_BRANCHES: string[] = [
  "seguimiento",
  "no_show",
  "perdido",
]

// Colores del pie chart (origin)
const ORIGIN_COLORS: Record<string, string> = {
  instagram: "#ec4899",
  organico: "#3b82f6",
  ads: "#f59e0b",
  manychat: "#a855f7",
  referido: "#10b981",
  otro: "#71717a",
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

function pct(num: number, den: number): string {
  if (den === 0) return "—"
  return Math.round((num / den) * 100) + "%"
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Calcula el rango ANTERIOR de la misma longitud (para comparar). */
function previousRange(from: Date, to: Date): { from: Date; to: Date } {
  const lengthMs = to.getTime() - from.getTime()
  const prevTo = new Date(from.getTime())
  const prevFrom = new Date(from.getTime() - lengthMs)
  return { from: prevFrom, to: prevTo }
}

// =============================================================================
// Componente principal
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

      // Para línea Revenue: 30 días hacia atrás desde 'to'
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
      ] = await Promise.all([
        // Contactos del periodo
        supabase
          .from("contacts")
          .select("id, full_name, stage, origin, total_revenue, total_cash_collected, created_at, last_call_at, products")
          .gte("created_at", fromIso)
          .lte("created_at", toIso),
        // Todos los contactos (para acumulados del embudo)
        supabase
          .from("contacts")
          .select("id, stage, total_revenue, total_cash_collected, origin"),
        // Contactos del periodo ANTERIOR (para comparar)
        supabase
          .from("contacts")
          .select("id, total_revenue, total_cash_collected")
          .gte("created_at", prevFromIso)
          .lte("created_at", prevToIso),
        // Invitaciones del periodo
        supabase
          .from("student_invites")
          .select("id, email, full_name, products, accepted_at, created_at")
          .gte("created_at", fromIso)
          .lte("created_at", toIso)
          .order("created_at", { ascending: false }),
        // Invitaciones del periodo anterior
        supabase
          .from("student_invites")
          .select("id, created_at, accepted_at")
          .gte("created_at", prevFromIso)
          .lte("created_at", prevToIso),
        // Bookings del periodo
        supabase
          .from("calendar_bookings")
          .select("id, start_at, status")
          .gte("start_at", fromIso)
          .lte("start_at", toIso),
        // Serie temporal Revenue 30d
        supabase
          .from("contacts")
          .select("created_at, total_revenue")
          .gte("created_at", series30dStartIso)
          .lte("created_at", toIso)
          .not("total_revenue", "is", null),
      ])

      if (cancelled) return
      setContacts((contactsRes.data ?? []) as ContactRow[])
      setAllContacts((allContactsRes.data ?? []) as ContactRow[])
      setPreviousContacts((prevContactsRes.data ?? []) as ContactRow[])
      setInvites((invitesRes.data ?? []) as StudentInviteRow[])
      setPreviousInvites((prevInvitesRes.data ?? []) as StudentInviteRow[])
      setBookings((bookingsRes.data ?? []) as CalendarBookingRow[])

      // Construir serie temporal Revenue por día
      const seriesMap = new Map<string, number>()
      for (
        let d = new Date(series30dStart);
        d <= range.to;
        d.setDate(d.getDate() + 1)
      ) {
        seriesMap.set(ymd(d), 0)
      }
      for (const c of (seriesRes.data ?? []) as { created_at: string; total_revenue: number | null }[]) {
        const k = ymd(new Date(c.created_at))
        if (seriesMap.has(k)) {
          seriesMap.set(k, (seriesMap.get(k) ?? 0) + (c.total_revenue ?? 0))
        }
      }
      setRevenueTimeSeries(
        Array.from(seriesMap.entries()).map(([date, revenue]) => ({ date, revenue })),
      )

      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [range])

  // =============================================================================
  // KPIs principales con comparación vs periodo anterior
  // =============================================================================
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

    // Conversión: de los que ATENDIERON la llamada, ¿cuántos se convirtieron en CLIENTE?
    // (incluye "cliente" porque ya pasaron por atendio antes de comprar)
    const atendieron = contacts.filter(
      (c) => c.stage === "atendio" || c.stage === "cliente",
    ).length
    const clientes = contacts.filter((c) => c.stage === "cliente").length
    const conversion = atendieron > 0 ? Math.round((clientes / atendieron) * 100) : 0

    // KPIs secundarios
    const contactosNuevos = contacts.length
    const llamadas = bookings.length
    const llamadasCompletadas = bookings.filter((b) => b.status === "completed").length
    const noShows = bookings.filter((b) => b.status === "no_show").length
    const showRate = llamadas > 0 ? Math.round(((llamadas - noShows) / llamadas) * 100) : 0

    // CAC = no podemos calcular sin ad spend real → muestra "—"
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

  // =============================================================================
  // Embudo Pipeline (acumulado total)
  // =============================================================================
  const funnelData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of allContacts) {
      counts.set(c.stage, (counts.get(c.stage) ?? 0) + 1)
    }
    const main = FUNNEL_ORDER.map((stage, i) => {
      const count = counts.get(stage) ?? 0
      const prevCount = i > 0 ? counts.get(FUNNEL_ORDER[i - 1]) ?? 0 : count
      const conversionFromPrev = prevCount > 0 && i > 0 ? Math.round((count / prevCount) * 100) : null
      return { stage, label: STAGE_LABELS[stage] ?? stage, count, conversionFromPrev }
    })
    const branches = FUNNEL_BRANCHES.map((stage) => ({
      stage,
      label: STAGE_LABELS[stage] ?? stage,
      count: counts.get(stage) ?? 0,
    }))
    return { main, branches }
  }, [allContacts])

  // =============================================================================
  // Pie chart: origen contactos
  // =============================================================================
  const originPieData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of allContacts) {
      const key = c.origin?.toLowerCase() || "otro"
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([origin, count]) => ({ origin, count, color: ORIGIN_COLORS[origin] ?? ORIGIN_COLORS.otro }))
      .sort((a, b) => b.count - a.count)
  }, [allContacts])

  // =============================================================================
  // Barras: ventas por día de la semana (del periodo)
  // =============================================================================
  const salesByWeekday = useMemo(() => {
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    const counts = [0, 0, 0, 0, 0, 0, 0]
    for (const inv of invites) {
      const wd = new Date(inv.created_at).getDay()
      counts[wd]++
    }
    // Reordenar a Lunes-primero
    const reordered = [
      { day: dayNames[1], ventas: counts[1] },
      { day: dayNames[2], ventas: counts[2] },
      { day: dayNames[3], ventas: counts[3] },
      { day: dayNames[4], ventas: counts[4] },
      { day: dayNames[5], ventas: counts[5] },
      { day: dayNames[6], ventas: counts[6] },
      { day: dayNames[0], ventas: counts[0] },
    ]
    return reordered
  }, [invites])

  // =============================================================================
  // Eliminar invitación
  // =============================================================================
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

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      {/* Header con filtro periodo */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          Capital Hub · Estado del negocio
        </h1>
        <PeriodFilter onChange={setRange} defaultPreset="30d" />
      </div>

      {/* 4 KPI PRINCIPALES con comparación */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiPrincipal
          label="Revenue"
          value={loading ? "…" : eur(kpis.revenue)}
          deltaPct={kpis.revenuePct}
          icon={DollarSign}
          accent="emerald"
        />
        <KpiPrincipal
          label="Cash collected"
          value={loading ? "…" : eur(kpis.cashCollected)}
          deltaPct={kpis.cashPct}
          icon={Banknote}
          accent="cyan"
        />
        <KpiPrincipal
          label="Ventas"
          value={loading ? "…" : String(kpis.ventas)}
          deltaAbsolute={kpis.ventasDelta}
          icon={Trophy}
          accent="amber"
        />
        <KpiPrincipal
          label="Conversión atendio→cliente"
          value={loading ? "…" : `${kpis.conversion}%`}
          icon={Target}
          accent="purple"
        />
      </section>

      {/* GRÁFICO 1 — Línea Revenue 30 días */}
      <section className="bg-card/30 border border-border rounded-md p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Revenue · últimos 30 días
        </h2>
        <div className="h-56">
          {loading ? (
            <CenterLoader />
          ) : revenueTimeSeries.every((p) => p.revenue === 0) ? (
            <CenterEmpty msg="Sin revenue en este periodo" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(d) => new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(n) => `${n}€`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 4 }}
                  formatter={(v) => [eur(Number(v) || 0), "Revenue"] as [string, string]}
                  labelFormatter={(d) => new Date(String(d)).toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long" })}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* PIPELINE CRM */}
      <section className="bg-card/30 border border-border rounded-md p-4">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-400" />
              Pipeline CRM · todos los contactos
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Camino del lead: nuevo seguidor → conversacion → agendado → atendió llamada → cliente
            </p>
          </div>
        </div>
        {loading ? (
          <CenterLoader />
        ) : (
          <>
            {/* Embudo principal lineal */}
            <div className="space-y-2">
              {(() => {
                const max = Math.max(...funnelData.main.map((s) => s.count), 1)
                return funnelData.main.map((s) => {
                  const widthPct = Math.max(8, (s.count / max) * 100)
                  return (
                    <div key={s.stage}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{s.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums text-foreground">{s.count}</span>
                          {s.conversionFromPrev !== null && (
                            <span className="text-[10px] font-mono text-muted-foreground">({s.conversionFromPrev}%)</span>
                          )}
                        </div>
                      </div>
                      <div className="h-8 bg-secondary/30 rounded-sm overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all rounded-sm border",
                            STAGE_COLORS[s.stage] ?? "bg-card",
                          )}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            {/* Ramas / estados terminales */}
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Salidas del embudo
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {funnelData.branches.map((b) => (
                  <div
                    key={b.stage}
                    className={cn(
                      "rounded-sm border px-3 py-2",
                      STAGE_COLORS[b.stage] ?? "bg-card",
                    )}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">{b.label}</div>
                    <div className="text-lg font-semibold tabular-nums mt-0.5">{b.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* KPIs SECUNDARIOS */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
        <KpiSecundario label="Contactos nuevos" value={kpis.contactosNuevos} icon={Users} />
        <KpiSecundario label="Llamadas hechas" value={kpis.llamadasCompletadas} icon={Phone} sub={`de ${kpis.llamadas} agendadas`} />
        <KpiSecundario label="Show rate" value={`${kpis.showRate}%`} icon={CheckCircle2} />
        <KpiSecundario label="No-shows" value={kpis.noShows} icon={AlertCircle} alert={kpis.noShows > 2} />
        <KpiSecundario label="Ticket medio" value={kpis.ventas > 0 ? eur(kpis.ticketMedio) : "—"} icon={DollarSign} />
        <KpiSecundario label="CAC" value="—" icon={PercentSquare} sub="conecta Meta Marketing API" muted />
        <KpiSecundario label="ROAS" value="—" icon={TrendingUp} sub="conecta Meta Marketing API" muted />
        <KpiSecundario label="LTV" value="—" icon={Trophy} sub="pendiente trackear upsells" muted />
      </section>

      {/* GRÁFICOS 3 y 4 lado a lado */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Pie origen contactos */}
        <div className="bg-card/30 border border-border rounded-md p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-pink-400" />
            Origen de contactos
          </h2>
          <div className="h-56">
            {loading ? (
              <CenterLoader />
            ) : originPieData.length === 0 ? (
              <CenterEmpty msg="Sin contactos con origen registrado" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={originPieData}
                    dataKey="count"
                    nameKey="origin"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={(props) => {
                      const p = props as { origin?: string; count?: number }
                      return `${p.origin ?? ""} · ${p.count ?? 0}`
                    }}
                    labelLine={false}
                    fontSize={10}
                  >
                    {originPieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 4 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Barras ventas por día de la semana */}
        <div className="bg-card/30 border border-border rounded-md p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            Ventas por día de la semana
          </h2>
          <div className="h-56">
            {loading ? (
              <CenterLoader />
            ) : kpis.ventas === 0 ? (
              <CenterEmpty msg="Sin ventas en este periodo" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByWeekday}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 4 }}
                  />
                  <Bar dataKey="ventas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>


      {/* INVITACIONES con botón eliminar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            Invitaciones App · {invites.length}
          </h2>
          <a
            href="/crm/contactos?stage=cliente"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Ver todas <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
        <div className="rounded-md border border-border bg-card/30">
          {loading ? (
            <div className="p-4 text-xs text-muted-foreground">Cargando…</div>
          ) : invites.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground">Sin invitaciones en este periodo.</div>
          ) : (
            <div className="divide-y divide-border">
              {invites.slice(0, 12).map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{inv.full_name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{inv.email}</div>
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hidden md:block">
                    {inv.products.join(", ")}
                  </div>
                  <div className="text-xs text-muted-foreground hidden md:block">
                    {new Date(inv.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border",
                      inv.accepted_at ? "border-emerald-500/40 text-emerald-400" : "border-amber-500/40 text-amber-400",
                    )}
                  >
                    {inv.accepted_at ? "Activado" : "Pendiente"}
                  </span>
                  <button
                    onClick={() => handleDeleteInvite(inv.id)}
                    disabled={deletingInvite === inv.id}
                    className="p-1 rounded-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
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
      </section>
    </div>
  )
}

// =============================================================================
// Subcomponentes
// =============================================================================

function KpiPrincipal({
  label,
  value,
  deltaPct,
  deltaAbsolute,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  deltaPct?: number | null
  deltaAbsolute?: number
  icon: typeof DollarSign
  accent: "emerald" | "cyan" | "amber" | "purple"
}) {
  const colors = {
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/[0.05]",
    cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-500/[0.05]",
    amber: "text-amber-400 border-amber-500/30 bg-amber-500/[0.05]",
    purple: "text-purple-400 border-purple-500/30 bg-purple-500/[0.05]",
  }
  const showDelta = deltaPct !== undefined && deltaPct !== null
  const showDeltaAbs = deltaAbsolute !== undefined
  const isPositive = (deltaPct ?? deltaAbsolute ?? 0) > 0
  const isNegative = (deltaPct ?? deltaAbsolute ?? 0) < 0
  return (
    <div className={cn("rounded-md border p-4", colors[accent])}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">{label}</span>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <div className="text-3xl font-semibold leading-none">{value}</div>
      {(showDelta || showDeltaAbs) && (
        <div
          className={cn(
            "flex items-center gap-1 mt-2 text-[10px] font-mono",
            isPositive && "text-emerald-400",
            isNegative && "text-red-400",
            !isPositive && !isNegative && "text-muted-foreground",
          )}
        >
          {isPositive && <ArrowUpRight className="h-3 w-3" />}
          {isNegative && <ArrowDownRight className="h-3 w-3" />}
          {showDelta && deltaPct !== null && `${deltaPct > 0 ? "+" : ""}${deltaPct}%`}
          {showDeltaAbs && deltaAbsolute !== undefined && (
            <span>{deltaAbsolute > 0 ? "+" : ""}{deltaAbsolute}</span>
          )}
          <span className="opacity-60 ml-1">vs período anterior</span>
        </div>
      )}
    </div>
  )
}

function KpiSecundario({
  label,
  value,
  icon: Icon,
  sub,
  alert,
  muted,
}: {
  label: string
  value: string | number
  icon: typeof DollarSign
  sub?: string
  alert?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        alert ? "border-orange-500/30 bg-orange-500/[0.05]" : "border-border bg-card/30",
        muted && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="text-xl font-semibold">{value}</div>
      {sub && (
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mt-1">
          {sub}
        </div>
      )}
    </div>
  )
}

function CenterLoader() {
  return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  )
}

function CenterEmpty({ msg }: { msg: string }) {
  return (
    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
      {msg}
    </div>
  )
}
