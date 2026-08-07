"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { createBrowserClient } from "@supabase/ssr"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { usePipelines, useActivePipelineId } from "@/features/pipelines/hooks/use-pipelines"
import { RegistrarVentaModal } from "@/features/sales/components/registrar-venta-modal"
import { DashboardFunnel } from "./dashboard-funnel"
import { DashboardChain } from "./dashboard-chain"
import { DashboardPulse } from "./dashboard-pulse"
import { DashboardPendingSales, type VentaPorCompletar } from "./dashboard-pending-sales"
import { DashboardActivity } from "./dashboard-activity"
import {
  construirCadena,
  construirPulso,
  diaMes,
  eur,
  plural,
  previousRange,
  ymd,
} from "../lib/dashboard-lecturas"

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
// Hook de count-up (animacion, no toca datos)
//
// Respeta prefers-reduced-motion: antes contaba igual aunque el sistema pidiera
// menos movimiento, y el brandkit dice que TODO degrada con esa preferencia.
// =============================================================================

function useCountUp(target: number, duration = 1400, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const quieto =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (quieto) {
      setVal(target)
      return
    }
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
// Card base: superficie del tema, esquina de panel (6px)
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

/** Carga de un bloque, con el alto ya reservado para que la tarjeta no salte. */
function CargandoBloque({ alto }: { alto: string }) {
  return (
    <div className={cn("relative w-full", alto)}>
      <LoadingScreen fullscreen={false} className="absolute inset-0 bg-transparent" />
    </div>
  )
}

// =============================================================================
// Componente principal: DATOS reales de Capital Hub
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
  /* La serie de 30 dias se sigue cargando exactamente igual (la carga de datos no
     se toca), pero el pulso mide el PERIODO elegido en el filtro, asi que sus
     columnas se sacan de `contacts`, que ya viene recortado a ese periodo. */
  const [, setRevenueTimeSeries] = useState<{ date: string; revenue: number }[]>([])
  const [pendingSales, setPendingSales] = useState<VentaPorCompletar[]>([])
  const [salePrefill, setSalePrefill] =
    useState<React.ComponentProps<typeof RegistrarVentaModal>["prefill"]>(undefined)

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
      setPendingSales((pendingSalesRes.data ?? []) as VentaPorCompletar[])

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

    const cashCollected = contacts.reduce((s, c) => s + (c.total_cash_collected ?? 0), 0)

    const ventas = invites.length
    const prevVentas = previousInvites.length

    const llamadasCompletadas = bookings.filter((b) => b.status === "completed").length

    const contactosNuevos = contacts.length
    const prevContactos = previousContacts.length
    const llamadas = bookings.length
    const noShows = bookings.filter((b) => b.status === "no_show").length
    const showRate = llamadas > 0 ? Math.round((llamadasCompletadas / llamadas) * 100) : 0

    const ticketMedio = ventas > 0 ? Math.round(revenue / ventas) : 0

    return {
      revenue,
      prevRevenue,
      revenueDelta,
      cashCollected,
      ventas,
      prevVentas,
      contactosNuevos,
      prevContactos,
      llamadas,
      llamadasCompletadas,
      noShows,
      showRate,
      ticketMedio,
    }
  }, [contacts, previousContacts, invites, previousInvites, bookings])

  const facturadoAnimado = useCountUp(loading ? 0 : kpis.revenue, 1200, 200)

  // ---------------------------------------------------------------------------
  // LA CADENA: contactos -> llamadas -> ventas, con el dinero colgando arriba.
  // Todo sale de datos que ya se cargan hoy.
  // ---------------------------------------------------------------------------
  const cadena = useMemo(
    () =>
      construirCadena({
        contactos: kpis.contactosNuevos,
        contactosAnterior: kpis.prevContactos,
        llamadas: kpis.llamadas,
        llamadasHechas: kpis.llamadasCompletadas,
        noShows: kpis.noShows,
        showRate: kpis.showRate,
        ventas: kpis.ventas,
        ventasAnterior: kpis.prevVentas,
        facturado: kpis.revenue,
        ticketMedio: kpis.ticketMedio,
        ultimoContacto: contacts[0]?.created_at ?? null,
        hayVentasPendientes: pendingSales.length > 0,
      }),
    [kpis, contacts, pendingSales.length],
  )

  const comparacionDinero = useMemo(() => {
    if (loading || kpis.prevRevenue <= 0) return null
    const sube = kpis.revenueDelta >= 0
    return {
      sube,
      texto: `${sube ? "+" : "-"}${eur(Math.abs(kpis.revenueDelta))} vs periodo anterior`,
    }
  }, [loading, kpis.prevRevenue, kpis.revenueDelta])

  const cobro = useMemo(() => {
    if (loading || kpis.revenue <= 0) return null
    const pct = Math.max(0, Math.min(100, Math.round((kpis.cashCollected / kpis.revenue) * 100)))
    return {
      pct,
      cobrado: eur(kpis.cashCollected),
      porCobrar: eur(Math.max(0, kpis.revenue - kpis.cashCollected)),
    }
  }, [loading, kpis.revenue, kpis.cashCollected])

  const pieInvitaciones = useMemo(() => {
    const activadas = invites.filter((i) => i.accepted_at).length
    return {
      href: "/invitaciones",
      texto:
        invites.length === 0
          ? "Sin invitaciones a la App en este periodo"
          : `${invites.length} ${plural(invites.length, "invitación enviada", "invitaciones enviadas")}, ${activadas} ${plural(activadas, "activada", "activadas")}`,
    }
  }, [invites])

  const leyenda = useMemo(() => {
    if (!range) return null
    const prev = previousRange(range.from, range.to)
    return `Comparado con ${diaMes(prev.from)} al ${diaMes(prev.to)}. La marca fina de cada barra es donde llegó entonces.`
  }, [range])

  // ---------------------------------------------------------------------------
  // EL PULSO: tramos del PERIODO elegido, midiendo PERSONAS.
  //
  // Mide personas y no dinero a proposito: es lo unico que se mueve cuando la
  // facturacion esta a cero, que es como se abre el panel hoy. El dinero se
  // marca encima de la columna en la que entro.
  // ---------------------------------------------------------------------------
  const pulso = useMemo(
    () =>
      range
        ? construirPulso(range.from, range.to, contacts)
        : { tramos: [], unidad: "Día", desde: "", hasta: "" },
    [range, contacts],
  )

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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative">
      {/* Solo las animaciones. El color y la fuente los pone el tema: cuando
          estaban escritos aqui dentro, cambiar la marca no repintaba nada.
          Se anima transform y opacity, nunca width ni height. */}
      <style>{`
        @keyframes hud-in{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:none}}
        .hud-in{opacity:0;animation:hud-in .6s cubic-bezier(.16,1,.3,1) forwards}
        @keyframes funnel-in{from{transform:scaleX(.3);transform-origin:left}to{transform:scaleX(1);transform-origin:left}}
        .funnel-in{animation:funnel-in .8s cubic-bezier(.16,1,.3,1) both;transform-origin:left}
        @keyframes cadena-in{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        .cadena-in{animation:cadena-in .6s cubic-bezier(.16,1,.3,1) both;transform-origin:left}
        @keyframes pulso-in{from{transform:scaleY(0)}to{transform:scaleY(1)}}
        .pulso-in{animation:pulso-in .5s cubic-bezier(.16,1,.3,1) both;transform-origin:bottom}
        @media (prefers-reduced-motion:reduce){
          .hud-in{animation:none;opacity:1}
          .funnel-in{animation:none}
          .cadena-in{animation:none}
          .pulso-in{animation:none}
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* El nombre de la seccion ya lo escribe la barra de arriba del OS, en
            telefono y en ordenador. Aqui solo queda el control del periodo y la
            leyenda que explica, una sola vez, que significa lo gris y lo fino
            del resto de la pagina. */}
        <div className="hud-in flex flex-wrap items-center gap-3">
          <PeriodFilter onChange={setRange} defaultPreset="30d" />
        </div>
        {leyenda && (
          <p className="hud-in mt-2 text-sm text-muted-foreground" style={{ animationDelay: "40ms" }}>
            {leyenda}
          </p>
        )}

        {/* BLOQUE 1: LA CADENA */}
        <Card delay={80} className="mt-4">
          {loading ? (
            <CargandoBloque alto="h-[420px]" />
          ) : (
            <DashboardChain
              facturado={eur(Math.round(facturadoAnimado))}
              comparacion={comparacionDinero}
              cobro={cobro}
              eslabones={cadena.eslabones}
              conectores={cadena.conectores}
              lecturaPorDefecto={cadena.lecturaPorDefecto}
              enlacePorDefecto={cadena.enlacePorDefecto}
              botonPrincipal={cadena.botonPrincipal}
              pie={pieInvitaciones}
            />
          )}
        </Card>

        {/* BLOQUE 2: VENTAS POR COMPLETAR (solo si hay algo que cerrar) */}
        {pendingSales.length > 0 && (
          <Card delay={120} title="Ventas por completar" count={pendingSales.length} className="mt-4">
            <DashboardPendingSales
              ventas={pendingSales}
              onRegistrar={(p) =>
                setSalePrefill({
                  contact_id: p.id,
                  full_name: p.full_name ?? "",
                  email: p.email,
                  phone: p.phone ?? "",
                  products: p.products ?? [],
                  close_type: "direct",
                })
              }
            />
          </Card>
        )}

        {/* BLOQUE 3: EL PULSO */}
        <Card
          delay={160}
          title={`Qué pasó cada ${pulso.unidad.toLowerCase()}`}
          className="mt-4"
        >
          {loading ? (
            <CargandoBloque alto="h-[280px]" />
          ) : (
            <DashboardPulse
              tramos={pulso.tramos}
              unidad={pulso.unidad}
              desde={pulso.desde}
              hasta={pulso.hasta}
              formatoEuro={eur}
            />
          )}
        </Card>

        {/* BLOQUE 4: DONDE ESTA LA GENTE AHORA (acumulado, no del periodo) */}
        <Card
          delay={200}
          title="Embudo de conversión"
          className="mt-4"
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
            <CargandoBloque alto="h-[240px]" />
          ) : (
            <DashboardFunnel main={funnelData.main} branches={funnelData.branches} colorOf={colorOf} />
          )}
        </Card>

        {/* Lo que va pasando dentro del sistema. Marco lo quiere de vuelta con la
            hora exacta y por donde entro cada lead (2026-08-07). */}
        <div className="mt-4">
          <DashboardActivity
            contactos={contacts}
            etiquetaDeStage={(stage) => STAGE_LABELS[stage] ?? stage}
            cargando={loading}
          />
        </div>

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
