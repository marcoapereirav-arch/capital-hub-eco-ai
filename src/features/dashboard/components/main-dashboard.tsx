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
} from "lucide-react"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { createBrowserClient } from "@supabase/ssr"
import { cn } from "@/lib/utils"

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
  invited_by_name: string | null
}

type CalendarBookingRow = {
  id: string
  start_at: string
  status: string | null
}

const STAGE_LABELS: Record<string, string> = {
  nuevo_seguidor: "Nuevo seguidor",
  conversacion: "Conversación",
  llamada_agendada: "Llamada agendada",
  no_show: "No show",
  ganado: "Ganado",
  perdido: "Perdido",
  pausado: "Pausado",
}

const STAGE_COLORS: Record<string, string> = {
  nuevo_seguidor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  conversacion: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  llamada_agendada: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  no_show: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  ganado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  perdido: "bg-red-500/15 text-red-400 border-red-500/30",
  pausado: "bg-zinc-500/15 text-muted-foreground border-zinc-500/30",
}

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

export function MainDashboard() {
  const [range, setRange] = useState<PeriodRange | null>(null)
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [allContacts, setAllContacts] = useState<ContactRow[]>([])
  const [invites, setInvites] = useState<StudentInviteRow[]>([])
  const [bookings, setBookings] = useState<CalendarBookingRow[]>([])
  const [loading, setLoading] = useState(true)

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

      const [contactsRes, allContactsRes, invitesRes, bookingsRes] = await Promise.all([
        supabase
          .from("contacts")
          .select("id, full_name, stage, origin, total_revenue, total_cash_collected, created_at, last_call_at, products")
          .gte("created_at", fromIso)
          .lte("created_at", toIso),
        supabase
          .from("contacts")
          .select("id, stage, total_revenue, total_cash_collected"),
        supabase
          .from("student_invites")
          .select("id, email, full_name, products, accepted_at, created_at, invited_by_name")
          .gte("created_at", fromIso)
          .lte("created_at", toIso)
          .order("created_at", { ascending: false }),
        supabase
          .from("calendar_bookings")
          .select("id, start_at, status")
          .gte("start_at", fromIso)
          .lte("start_at", toIso),
      ])

      if (cancelled) return
      setContacts((contactsRes.data ?? []) as ContactRow[])
      setAllContacts((allContactsRes.data ?? []) as ContactRow[])
      setInvites((invitesRes.data ?? []) as StudentInviteRow[])
      setBookings((bookingsRes.data ?? []) as CalendarBookingRow[])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [range])

  const kpis = useMemo(() => {
    // REVENUE REAL: suma de contacts.total_revenue del periodo (los contactos
    // que efectivamente generaron ingreso). NO inventamos precio - si el campo
    // total_revenue está null el contacto no aporta al total.
    const revenue = contacts.reduce(
      (sum, c) => sum + (c.total_revenue ?? 0),
      0,
    )

    const cashCollected = contacts.reduce(
      (sum, c) => sum + (c.total_cash_collected ?? 0),
      0,
    )

    const ventas = invites.length
    const llamadas = bookings.length
    const llamadasCompletadas = bookings.filter((b) => b.status === "completed").length
    const noShows = bookings.filter((b) => b.status === "no_show").length
    const contactosNuevos = contacts.length

    const ganados = allContacts.filter((c) => c.stage === "ganado").length
    const llamadasAgendadasTotal = allContacts.filter(
      (c) => c.stage === "llamada_agendada" || c.stage === "ganado",
    ).length
    const conversionTotal = pct(ganados, llamadasAgendadasTotal)

    return {
      revenue,
      cashCollected,
      ventas,
      llamadas,
      llamadasCompletadas,
      noShows,
      contactosNuevos,
      conversionTotal,
      ganados,
      llamadasAgendadasTotal,
    }
  }, [contacts, allContacts, invites, bookings])

  const stageBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    allContacts.forEach((c) => {
      map.set(c.stage, (map.get(c.stage) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count)
  }, [allContacts])

  const topInvites = useMemo(() => invites.slice(0, 8), [invites])

  return (
    <div className="space-y-6">
      {/* Filtro periodo */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          Capital Hub · Estado del negocio
        </h1>
        <PeriodFilter onChange={setRange} defaultPreset="30d" />
      </div>

      {/* KPI cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Revenue"
          value={loading ? "…" : eur(kpis.revenue)}
          sublabel={`${kpis.ventas} ventas`}
          icon={DollarSign}
          accent="emerald"
        />
        <KpiCard
          label="Cash collected"
          value={loading ? "…" : eur(kpis.cashCollected)}
          sublabel="cobrado en cuenta"
          icon={CheckCircle2}
          accent="cyan"
        />
        <KpiCard
          label="Contactos nuevos"
          value={loading ? "…" : String(kpis.contactosNuevos)}
          sublabel="entraron al CRM"
          icon={Users}
          accent="blue"
        />
        <KpiCard
          label="Llamadas"
          value={loading ? "…" : String(kpis.llamadas)}
          sublabel={`${kpis.llamadasCompletadas} hechas · ${kpis.noShows} no-show`}
          icon={Phone}
          accent="amber"
        />
      </div>

      {/* Pipeline breakdown */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          Pipeline · contactos por stage (total acumulado)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {stageBreakdown.map((s) => (
            <div
              key={s.stage}
              className={cn(
                "rounded-md border px-3 py-2.5",
                STAGE_COLORS[s.stage] ?? "bg-card border-border",
              )}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                {STAGE_LABELS[s.stage] ?? s.stage}
              </div>
              <div className="text-xl font-semibold mt-1">{s.count}</div>
            </div>
          ))}
          {stageBreakdown.length === 0 && (
            <div className="col-span-full text-xs text-muted-foreground p-4 border border-dashed border-border rounded-md">
              Sin contactos todavía.
            </div>
          )}
        </div>
      </section>

      {/* Conversion */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ConversionCard
          label="Conversión llamada → cerrada"
          numerator={kpis.ganados}
          denominator={kpis.llamadasAgendadasTotal}
          ratio={kpis.conversionTotal}
        />
        <ConversionCard
          label="No-shows del periodo"
          numerator={kpis.noShows}
          denominator={kpis.llamadas}
          ratio={pct(kpis.noShows, kpis.llamadas)}
          warning
        />
        <ConversionCard
          label="Llamadas completadas"
          numerator={kpis.llamadasCompletadas}
          denominator={kpis.llamadas}
          ratio={pct(kpis.llamadasCompletadas, kpis.llamadas)}
        />
      </section>

      {/* Invitaciones a la App (= ventas cerradas que provisionaron acceso) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Invitaciones App · {topInvites.length}
          </h2>
          <a
            href="/crm/contactos?stage=ganado"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Ver todas <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
        <div className="rounded-md border border-border bg-card/30">
          {topInvites.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground">
              {loading ? "Cargando…" : "Sin invitaciones en este periodo."}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {topInvites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{inv.full_name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {inv.email}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hidden md:block">
                    {inv.products.join(", ")}
                  </div>
                  <div className="text-xs text-muted-foreground hidden md:block">
                    {new Date(inv.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border",
                      inv.accepted_at
                        ? "border-emerald-500/40 text-emerald-400"
                        : "border-amber-500/40 text-amber-400",
                    )}
                  >
                    {inv.accepted_at ? "Activado" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sublabel?: string
  icon: typeof DollarSign
  accent: "emerald" | "cyan" | "blue" | "amber"
}) {
  const colors = {
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/[0.05]",
    cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-500/[0.05]",
    blue: "text-blue-400 border-blue-500/30 bg-blue-500/[0.05]",
    amber: "text-amber-400 border-amber-500/30 bg-amber-500/[0.05]",
  }
  return (
    <div className={cn("rounded-md border p-3", colors[accent])}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 opacity-70" />
      </div>
      <div className="text-2xl font-semibold leading-none">{value}</div>
      {sublabel && (
        <div className="text-[10px] font-mono uppercase tracking-wider opacity-60 mt-1.5">
          {sublabel}
        </div>
      )}
    </div>
  )
}

function ConversionCard({
  label,
  numerator,
  denominator,
  ratio,
  warning,
}: {
  label: string
  numerator: number
  denominator: number
  ratio: string
  warning?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        warning ? "border-orange-500/30 bg-orange-500/[0.04]" : "border-border bg-card/30",
      )}
    >
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold">{ratio}</div>
        <div className="text-xs text-muted-foreground">
          {numerator} / {denominator}
        </div>
      </div>
    </div>
  )
}
