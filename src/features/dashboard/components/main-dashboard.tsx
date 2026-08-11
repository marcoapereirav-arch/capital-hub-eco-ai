"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { createBrowserClient } from "@supabase/ssr"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { usePipelines, useActivePipelineId } from "@/features/pipelines/hooks/use-pipelines"
import { RegistrarVentaModal } from "@/features/sales/components/registrar-venta-modal"
import { DashboardPendingSales, type VentaPorCompletar } from "./dashboard-pending-sales"
import { DashboardActivity } from "./dashboard-activity"
import { DashboardKpis, type Kpi } from "./dashboard-kpis"
import { DashboardMetricas, type Metrica } from "./dashboard-metricas"
import { DashboardEmbudo, SelectorEmbudo, type OpcionEmbudo } from "./dashboard-embudo"
import { DashboardComoVa } from "./dashboard-como-va"
import {
  MS_DIA,
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
  pipeline_id?: string | null
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

/**
 * Una reserva de Calendly.
 *
 * ANTES esto salia de `calendar_bookings`, la tabla del calendario propio del OS,
 * que tiene CERO filas porque nadie lo usa, y encima se filtraba por el estado
 * "completed", que no existe en su lista de valores. Resultado: llamadas hechas,
 * show rate, no-shows y conversion a venta salian SIEMPRE en cero, pasara lo que
 * pasara. Cuatro de las cinco metricas que pidio Adrian.
 *
 * Las llamadas de verdad estan en Calendly, y solo cuentan las de la agenda de
 * VENTA: en la cuenta hay tambien la de arranque de clientes y una personal, y
 * mezclarlas ensuciaba cualquier numero de ventas.
 */
type ReservaRow = {
  uri: string
  start_time: string
  status: string | null
  invitee_name: string | null
  invitee_email: string | null
}

/**
 * Una VENTA. La fuente de verdad del dinero (SOP ventas/02).
 *
 * ANTES el dinero salia de `contacts.total_revenue` de los contactos CREADOS en
 * el periodo. Eso significa que una venta hecha en agosto a un lead que entro en
 * julio NO contaba en agosto: el dinero se apuntaba al mes en que entro la
 * persona, no al mes en que se cobro. Con una sola venta de prueba no se veia,
 * pero en cuanto haya ventas de verdad los numeros serian falsos.
 * Ahora sale del evento de venta, que lleva SU PROPIA fecha.
 */
type VentaRow = {
  created_at: string
  contact_id: string
  data: { revenue?: number; cash_collected?: number; closer_name?: string; products?: string[] } | null
}

type ReporteSetterRow = {
  profile_id: string
  report_date: string
  conversaciones: number
  followups: number
  ofertas: number
  agendadas: number
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
  const [bookings, setBookings] = useState<ReservaRow[]>([])
  const [previousBookings, setPreviousBookings] = useState<ReservaRow[]>([])
  const [reportesSetter, setReportesSetter] = useState<ReporteSetterRow[]>([])
  const [ventas, setVentas] = useState<VentaRow[]>([])
  const [ventasPrevias, setVentasPrevias] = useState<VentaRow[]>([])
  /* El embudo elegido. Empieza vacio: los nombres los pone el CRM, no este
     fichero. `elegidoAMano` distingue "lo puso el usuario" de "lo puso el
     sistema porque no habia nada elegido". */
  const [embudoElegido, setEmbudoElegido] = useState("")
  const [elegidoAMano, setElegidoAMano] = useState(false)
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

      /* Que agendas cuentan como VENTA. Se pregunta primero y se filtra por esa
         lista: la agenda de arranque de clientes y la personal de Adrian no
         pueden contaminar ni un numero de ventas. Una agenda nueva entra como
         "sin clasificar" y tampoco cuenta hasta que se le diga que es. */
      const { data: tiposVenta } = await supabase
        .from("calendly_event_types")
        .select("uri")
        .eq("purpose", "venta")
      const urisVenta = (tiposVenta ?? []).map((t: { uri: string }) => t.uri)

      /* Hasta donde se miran las reservas.
         Si el periodo llega hasta hoy, se estira 60 dias hacia adelante para
         recoger LAS QUE YA ESTAN PUESTAS y todavia no han ocurrido. Sin esto,
         "agendadas" solo contaba las pasadas, o sea exactamente lo mismo que
         "hechas", y el primer salto del embudo salia siempre 100%: inutil. Y
         peor: Adrian veia 3 aqui y 7 en Calendly. */
      const hoy = Date.now()
      const topeReservas = new Date(
        range.to.getTime() >= hoy - MS_DIA ? Math.max(range.to.getTime(), hoy + 60 * MS_DIA) : range.to.getTime(),
      ).toISOString()

      const [
        contactsRes,
        allContactsRes,
        prevContactsRes,
        invitesRes,
        prevInvitesRes,
        bookingsRes,
        prevBookingsRes,
        reportesRes,
        ventasRes,
        ventasPreviasRes,
        seriesRes,
        pendingSalesRes,
      ] = await Promise.all([
        supabase
          .from("contacts")
          .select("id, full_name, stage, origin, total_revenue, total_cash_collected, created_at, last_call_at, products")
          .gte("created_at", fromIso)
          .lte("created_at", toIso)
          .order("created_at", { ascending: false }),
        supabase.from("contacts").select("id, stage, total_revenue, total_cash_collected, origin, pipeline_id"),
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
          .from("calendly_scheduled_events")
          .select("uri, start_time, status, invitee_name, invitee_email")
          .in("event_type_uri", urisVenta.length > 0 ? urisVenta : ["__ninguna__"])
          .gte("start_time", fromIso)
          .lte("start_time", topeReservas),
        supabase
          .from("calendly_scheduled_events")
          .select("uri, start_time, status, invitee_name, invitee_email")
          .in("event_type_uri", urisVenta.length > 0 ? urisVenta : ["__ninguna__"])
          .gte("start_time", prevFromIso)
          .lte("start_time", prevToIso),
        supabase
          .from("setter_daily_reports")
          .select("profile_id, report_date, conversaciones, followups, ofertas, agendadas")
          .gte("report_date", ymd(range.from))
          .lte("report_date", ymd(range.to)),
        supabase
          .from("contact_journey_events")
          .select("created_at, contact_id, data")
          .eq("type", "sale")
          .gte("created_at", fromIso)
          .lte("created_at", toIso),
        supabase
          .from("contact_journey_events")
          .select("created_at, contact_id, data")
          .eq("type", "sale")
          .gte("created_at", prevFromIso)
          .lte("created_at", prevToIso),
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
      setBookings((bookingsRes.data ?? []) as ReservaRow[])
      setPreviousBookings((prevBookingsRes.data ?? []) as ReservaRow[])
      setReportesSetter((reportesRes.data ?? []) as ReporteSetterRow[])
      setVentas((ventasRes.data ?? []) as VentaRow[])
      setVentasPrevias((ventasPreviasRes.data ?? []) as VentaRow[])
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
    const ahora = Date.now()

    /* Como se cuenta una llamada. Definiciones cerradas con Marco el 2026-08-07:
         agendadas = todas las reservas de venta del periodo, en cualquier estado
         canceladas = la persona la anulo
         no shows   = tenia cita y no aparecio
         hechas     = ya paso su hora y no se cancelo ni se marco no show
       Una llamada que todavia no ha ocurrido NO es una llamada hecha: contarla
       inflaria el show rate cada manana y lo haria bajar solo al pasar el dia. */
    const contarReservas = (filas: ReservaRow[]) => {
      const agendadas = filas.length
      const canceladas = filas.filter((b) => b.status === "canceled").length
      const noShows = filas.filter((b) => b.status === "no_show").length
      const hechas = filas.filter(
        (b) => b.status !== "canceled" && b.status !== "no_show" && new Date(b.start_time).getTime() <= ahora,
      ).length
      const porVenir = filas.filter(
        (b) => b.status !== "canceled" && b.status !== "no_show" && new Date(b.start_time).getTime() > ahora,
      ).length
      return { agendadas, canceladas, noShows, hechas, porVenir }
    }

    const r = contarReservas(bookings)
    const rPrev = contarReservas(previousBookings)

    /* EL DINERO SALE DE LAS VENTAS DEL PERIODO, no de los contactos creados en
       el periodo. Una venta hecha hoy a un lead de julio es dinero de HOY. */
    const sumar = (filas: VentaRow[], campo: "revenue" | "cash_collected") =>
      filas.reduce((acc, v) => acc + (Number(v.data?.[campo]) || 0), 0)

    const revenue = sumar(ventas, "revenue")
    const prevRevenue = sumar(ventasPrevias, "revenue")
    const revenueDelta = revenue - prevRevenue

    const cashCollected = sumar(ventas, "cash_collected")
    const prevCash = sumar(ventasPrevias, "cash_collected")

    const nVentas = ventas.length
    const prevVentas = ventasPrevias.length

    const contactosNuevos = contacts.length
    const prevContactos = previousContacts.length

    /* Un porcentaje sin base NO es cero: es que no se puede calcular. Por eso
       estos tres son null y no 0. Escribir "0%" cuando no hubo ni una llamada
       se lee como "vamos fatal", y es mentira. */
    const baseShow = r.hechas + r.noShows
    const showRate = baseShow > 0 ? Math.round((r.hechas / baseShow) * 100) : null
    const conversion = r.hechas > 0 ? Math.round((nVentas / r.hechas) * 100) : null
    const ticketMedio = nVentas > 0 ? Math.round(revenue / nVentas) : null

    const pct = (actual: number, anterior: number) =>
      anterior > 0 ? Math.round(((actual - anterior) / anterior) * 100) : null

    return {
      revenue,
      prevRevenue,
      revenueDelta,
      revenuePct: pct(revenue, prevRevenue),
      cashCollected,
      cashPct: pct(cashCollected, prevCash),
      ventas: nVentas,
      prevVentas,
      ventasDelta: nVentas - prevVentas,
      contactosNuevos,
      prevContactos,
      contactosDelta: contactosNuevos - prevContactos,
      llamadas: r.agendadas,
      llamadasCompletadas: r.hechas,
      canceladas: r.canceladas,
      noShows: r.noShows,
      llamadasPrev: rPrev.agendadas,
      porVenir: r.porVenir,
      showRate,
      conversion,
      ticketMedio,
    }
  }, [contacts, previousContacts, bookings, previousBookings, ventas, ventasPrevias])

  // ---------------------------------------------------------------------------
  // EL SETTER: sus cuatro numeros del periodo, sumados de sus partes diarias.
  // ---------------------------------------------------------------------------
  const setter = useMemo(() => {
    const suma = (campo: keyof ReporteSetterRow) =>
      reportesSetter.reduce((s, r) => s + (Number(r[campo]) || 0), 0)
    const conversaciones = suma("conversaciones")
    const followups = suma("followups")
    const ofertas = suma("ofertas")
    const agendadas = suma("agendadas")
    const hayDatos = reportesSetter.length > 0

    return {
      hayDatos,
      dias: reportesSetter.length,
      conversaciones,
      followups,
      ofertas,
      agendadas,
      /* Los mismos guiones que arriba: sin base no hay porcentaje. */
      deConversacionAOferta: conversaciones > 0 ? Math.round((ofertas / conversaciones) * 100) : null,
      deOfertaAAgendada: ofertas > 0 ? Math.round((agendadas / ofertas) * 100) : null,
      deConversacionAAgendada: conversaciones > 0 ? Math.round((agendadas / conversaciones) * 100) : null,
      /* La pregunta de Adrian: cuanto trae el setter y cuanto entra por otro lado. */
      cuotaSobreCalendly:
        kpis.llamadas > 0 ? Math.min(100, Math.round((agendadas / kpis.llamadas) * 100)) : null,
    }
  }, [reportesSetter, kpis.llamadas])

  const facturadoAnimado = useCountUp(loading ? 0 : kpis.revenue, 1200, 200)


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
  // LAS 8 METRICAS DEL NEGOCIO. Estaban y se borraron: vuelven con su nombre y su
  // numero propio, y NO se esconde ninguna aunque el periodo venga vacio.
  // ---------------------------------------------------------------------------
  const kpisNegocio: Kpi[] = useMemo(() => {
    const signo = (n: number) => (n > 0 ? `+${n}` : String(n))
    return [
      {
        clave: "revenue",
        etiqueta: "Revenue",
        valor: kpis.revenue,
        formato: "euro",
        delta: kpis.revenuePct !== null ? { texto: `${signo(kpis.revenuePct)}%`, sube: kpis.revenuePct >= 0 } : null,
        ayuda: "Facturado en el periodo",
      },
      {
        clave: "cash",
        etiqueta: "Cash collected",
        valor: kpis.cashCollected,
        formato: "euro",
        delta: kpis.cashPct !== null ? { texto: `${signo(kpis.cashPct)}%`, sube: kpis.cashPct >= 0 } : null,
        ayuda: "Lo que entró de verdad en caja",
      },
      {
        clave: "ventas",
        etiqueta: "Ventas",
        valor: kpis.ventas,
        formato: "numero",
        delta: kpis.ventasDelta !== 0 ? { texto: signo(kpis.ventasDelta), sube: kpis.ventasDelta >= 0 } : null,
        ayuda: "Cierres del periodo",
      },
      {
        clave: "conversion",
        etiqueta: "Conversión llamada a venta",
        valor: kpis.conversion,
        formato: "porcentaje",
        ayuda: kpis.conversion === null ? "Sin llamadas hechas todavía" : `${kpis.ventas} de ${kpis.llamadasCompletadas} llamadas`,
      },
      {
        clave: "contactos",
        etiqueta: "Contactos nuevos",
        valor: kpis.contactosNuevos,
        formato: "numero",
        delta:
          kpis.contactosDelta !== 0
            ? { texto: signo(kpis.contactosDelta), sube: kpis.contactosDelta >= 0 }
            : null,
        ayuda: "Entraron en el periodo",
      },
      {
        clave: "llamadas",
        etiqueta: "Llamadas hechas",
        valor: kpis.llamadasCompletadas,
        formato: "numero",
        ayuda:
          kpis.porVenir > 0
            ? `De ${kpis.llamadas} agendadas · ${kpis.porVenir} por venir`
            : `De ${kpis.llamadas} agendadas`,
      },
      {
        clave: "showrate",
        etiqueta: "Show rate",
        valor: kpis.showRate,
        formato: "porcentaje",
        ayuda: kpis.showRate === null ? "Sin llamadas que contar" : `${kpis.noShows} no vinieron`,
      },
      {
        clave: "ticket",
        etiqueta: "Ticket medio",
        valor: kpis.ticketMedio,
        formato: "euro",
        ayuda: kpis.ticketMedio === null ? "Sin ventas todavía" : "Por venta",
      },
    ]
  }, [kpis])

  // Los cuatro del setter, con la misma gramatica.
  const kpisSetter: Kpi[] = useMemo(
    () => [
      {
        clave: "s-conversaciones",
        etiqueta: "Conversaciones nuevas",
        valor: setter.hayDatos ? setter.conversaciones : null,
        formato: "numero",
        ayuda: setter.hayDatos ? "Primeras conversaciones nuevas" : "Sin partes todavía",
      },
      {
        clave: "s-followups",
        etiqueta: "Follow-ups",
        valor: setter.hayDatos ? setter.followups : null,
        formato: "numero",
        ayuda: setter.hayDatos ? "Conversaciones que retomó" : "Sin partes todavía",
      },
      {
        clave: "s-ofertas",
        etiqueta: "Ofertas de llamada",
        valor: setter.hayDatos ? setter.ofertas : null,
        formato: "numero",
        ayuda: setter.hayDatos ? "Veces que propuso la llamada" : "Sin partes todavía",
      },
      {
        clave: "s-agendadas",
        etiqueta: "Llamadas que consiguió",
        valor: setter.hayDatos ? setter.agendadas : null,
        formato: "numero",
        ayuda: setter.hayDatos ? `De ${kpis.llamadas} reservadas en total` : "Sin partes todavía",
      },
    ],
    [setter, kpis.llamadas],
  )

  // Embudo del setter: conversacion -> oferta -> agendada.
  const embudoSetter = useMemo(
    () => [
      {
        clave: "conversaciones",
        etiqueta: "Conversaciones",
        valor: setter.conversaciones,
        lectura: `${setter.conversaciones} conversaciones nuevas abiertas en el periodo`,
      },
      {
        clave: "ofertas",
        etiqueta: "Ofertas de llamada",
        valor: setter.ofertas,
        lectura: `${setter.ofertas} veces ofreció la llamada`,
      },
      {
        clave: "agendadas",
        etiqueta: "Agendadas",
        valor: setter.agendadas,
        lectura: `${setter.agendadas} llamadas quedaron agendadas`,
      },
    ],
    [setter],
  )

  // Embudo de la venta: agendada -> hecha -> venta.
  const embudoVenta = useMemo(
    () => [
      {
        clave: "agendadas",
        etiqueta: "Agendadas",
        valor: kpis.llamadas,
        lectura:
          kpis.porVenir > 0
            ? `${kpis.llamadas} llamadas reservadas, de las que ${kpis.porVenir} todavía no han ocurrido`
            : `${kpis.llamadas} llamadas se reservaron en el periodo`,
      },
      {
        clave: "hechas",
        etiqueta: "Hechas",
        valor: kpis.llamadasCompletadas,
        lectura: `${kpis.llamadasCompletadas} llamadas se celebraron de verdad${kpis.porVenir > 0 ? `. Quedan ${kpis.porVenir} por delante` : ""}`,
      },
      {
        clave: "ventas",
        etiqueta: "Ventas",
        valor: kpis.ventas,
        lectura: `${kpis.ventas} de esas llamadas acabaron en venta`,
      },
    ],
    [kpis],
  )

  /* La curva del dinero que vive DENTRO de la pieza grande (grafico 1). */
  const curvaDinero = useMemo(() => {
    if (!range) return []
    const dias: Date[] = []
    for (let d = new Date(range.from); d <= range.to; d.setDate(d.getDate() + 1)) dias.push(new Date(d))
    const paso = Math.max(1, Math.ceil(dias.length / 14))
    const salida: { etiqueta: string; etiquetaLarga: string; valor: number }[] = []
    for (let i = 0; i < dias.length; i += paso) {
      const desde = dias[i]
      const hasta = dias[Math.min(i + paso - 1, dias.length - 1)]
      const valor = contacts
        .filter((c) => ymd(new Date(c.created_at)) >= ymd(desde) && ymd(new Date(c.created_at)) <= ymd(hasta))
        .reduce((sum, c) => sum + (c.total_revenue ?? 0), 0)
      salida.push({
        etiqueta: diaMes(desde),
        etiquetaLarga: paso === 1 ? diaMes(desde) : `${diaMes(desde)} al ${diaMes(hasta)}`,
        valor,
      })
    }
    return salida
  }, [range, contacts])

  /* Las piezas pequeñas del mosaico: los conteos. */
  const piezas: Metrica[] = useMemo(() => {
    const signo = (n: number) => (n > 0 ? `+${n}` : String(n))
    return [
      {
        clave: "cash",
        etiqueta: "Cobrado",
        valor: kpis.cashCollected,
        formato: "euro",
        delta: kpis.cashPct !== null ? { texto: `${signo(kpis.cashPct)}%`, sube: kpis.cashPct >= 0 } : null,
        pie: "Dinero que ya entró en la cuenta",
      },
      {
        clave: "ventas",
        etiqueta: "Ventas cerradas",
        valor: kpis.ventas,
        formato: "numero",
        delta: kpis.ventasDelta !== 0 ? { texto: signo(kpis.ventasDelta), sube: kpis.ventasDelta >= 0 } : null,
        pie: "Ventas registradas en el periodo",
      },
      {
        clave: "ticket",
        etiqueta: "Ticket medio",
        valor: kpis.ticketMedio,
        formato: "euro",
        pie: kpis.ticketMedio === null ? "Todavía no hay ninguna venta" : "Lo que deja cada venta de media",
      },
      {
        clave: "contactos",
        etiqueta: "Personas nuevas",
        valor: kpis.contactosNuevos,
        formato: "numero",
        delta:
          kpis.contactosDelta !== 0 ? { texto: signo(kpis.contactosDelta), sube: kpis.contactosDelta >= 0 } : null,
        pie: "Entraron al CRM en el periodo",
      },
      {
        clave: "llamadas",
        etiqueta: "Llamadas celebradas",
        valor: kpis.llamadasCompletadas,
        formato: "numero",
        pie:
          kpis.porVenir > 0
            ? `Se reservaron ${kpis.llamadas}. Quedan ${kpis.porVenir} por celebrar`
            : `Se reservaron ${kpis.llamadas} en total`,
      },
      {
        clave: "noshow",
        etiqueta: "No se presentaron",
        valor: kpis.noShows,
        formato: "numero",
        pie: "Tenían llamada y no aparecieron",
      },
    ]
  }, [kpis])

  // ---------------------------------------------------------------------------
  // GRAFICO 3: COMO VA EL MES. Un solo grafico de tiempo con tres series.
  // Como maximo 14 columnas: mas que eso en un telefono es una raya.
  // ---------------------------------------------------------------------------
  const comoVa = useMemo(() => {
    if (!range) return { tramos: [], series: [] }

    const dias: Date[] = []
    for (let d = new Date(range.from); d <= range.to; d.setDate(d.getDate() + 1)) dias.push(new Date(d))
    const paso = Math.max(1, Math.ceil(dias.length / 14))
    const cortes: { desde: Date; hasta: Date }[] = []
    for (let i = 0; i < dias.length; i += paso) {
      cortes.push({ desde: dias[i], hasta: dias[Math.min(i + paso - 1, dias.length - 1)] })
    }

    const dentro = (iso: string, c: { desde: Date; hasta: Date }) => {
      const k = ymd(new Date(iso))
      return k >= ymd(c.desde) && k <= ymd(c.hasta)
    }

    const tramos = cortes.map((c, i) => ({
      clave: `t-${i}`,
      corta: diaMes(c.desde),
      larga: paso === 1 ? diaMes(c.desde) : `${diaMes(c.desde)} al ${diaMes(c.hasta)}`,
    }))

    /* La hora se saca del dato ya convertido a la zona del negocio. Marco,
       2026-08-07: las horas que se enseñan tienen que ser las horas reales. */
    const hora = (iso: string) =>
      new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

    const porTramo = <T,>(fn: (c: { desde: Date; hasta: Date }) => T[]) => cortes.map(fn)

    const contactosPorTramo = porTramo((c) => contacts.filter((x) => dentro(x.created_at, c)))
    const llamadasPorTramo = porTramo((c) => bookings.filter((b) => dentro(b.start_time, c)))
    const ventasPorTramo = porTramo((c) => invites.filter((x) => dentro(x.created_at, c)))

    const etiquetaEstado = (stage: string) => STAGE_LABELS[stage] ?? stage

    return {
      tramos,
      series: [
        {
          clave: "contactos",
          nombre: "Contactos",
          valores: contactosPorTramo.map((f) => f.length),
          filas: contactosPorTramo.map((f) =>
            f.map((x) => ({
              id: x.id,
              nombre: x.full_name ?? "Contacto sin nombre",
              detalle: `${etiquetaEstado(x.stage)} · entró por ${x.origin ?? "sin origen"} a las ${hora(x.created_at)}`,
            })),
          ),
        },
        {
          clave: "llamadas",
          nombre: "Llamadas",
          valores: llamadasPorTramo.map((f) => f.length),
          filas: llamadasPorTramo.map((f) =>
            f.map((b) => ({
              id: b.uri,
              nombre: b.invitee_name ?? b.invitee_email ?? "Sin nombre",
              detalle: `${diaMes(new Date(b.start_time))} a las ${hora(b.start_time)} · ${
                b.status === "canceled" ? "cancelada" : b.status === "no_show" ? "no vino" : "agendada"
              }`,
            })),
          ),
        },
        {
          clave: "ventas",
          nombre: "Ventas",
          valores: ventasPorTramo.map((f) => f.length),
          filas: ventasPorTramo.map((f) =>
            f.map((x) => ({
              id: x.id,
              nombre: x.full_name || x.email,
              detalle: `${x.products?.join(", ") || "sin producto"} · ${hora(x.created_at)}`,
            })),
          ),
        },
      ],
    }
  }, [range, contacts, bookings, invites, STAGE_LABELS])

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
  // GRAFICO 2: los embudos que se pueden elegir en el desplegable.
  //
  // Todos hablan el mismo idioma: pasos con su numero, y entre paso y paso la
  // gente que se cae. El de la venta va primero porque es el que se mira.
  // ---------------------------------------------------------------------------
  const embudos: OpcionEmbudo[] = useMemo(() => {
    /* SOLO los embudos que existen de verdad en el CRM. Ni uno mas.
       Marco, 2026-08-11: "solo y exclusivamente tienen que estar estos
       pipelines. No pueden estar mas, ya que va directamente conectado."
       Asi que esta lista NO se escribe a mano: sale de los pipelines que hay.
       Si manana se crea uno en el CRM, aparece aqui solo; si se borra,
       desaparece. Antes habia ademas dos embudos inventados aqui dentro
       ("Embudo de la venta" y "De conversacion a llamada") que no existian en el
       CRM: eso es justo lo que rompia la correspondencia. */
    return pipelines
      .map((p) => {
        const delPipeline = allContacts.filter((c) => c.pipeline_id === p.id)
        const cuenta = new Map<string, number>()
        for (const c of delPipeline) cuenta.set(c.stage, (cuenta.get(c.stage) ?? 0) + 1)
        return {
          id: `pipeline-${p.id}`,
          nombre: p.name,
          modo: "reparto" as const,
          total: delPipeline.length,
          pasos: p.stages.map((st) => ({
            clave: st.key,
            etiqueta: st.name,
            valor: cuenta.get(st.key) ?? 0,
          })),
        }
      })
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
  }, [pipelines, allContacts])

  /* Cual se enseña por defecto: el que tiene MAS gente dentro, que es el embudo
     vivo del negocio. Se recalcula mientras el usuario no haya elegido a mano.
     Antes se fijaba en el primero que llegara, y como los contactos tardan un
     instante mas que la lista de embudos, se quedaba clavado en el que tocara
     (salia "General" con 5 personas teniendo el del webinar 34).
     Se depende del ID, no del objeto: `embudos` es nuevo en cada pintado y
     depender de el dispararia el efecto en bucle. */
  const embudoConMasGente = embudos[0]?.id ?? ""
  useEffect(() => {
    if (elegidoAMano) return
    setEmbudoElegido(embudoConMasGente)
  }, [embudoConMasGente, elegidoAMano])

  /* Si el embudo elegido desaparece (se borro ese pipeline), se cae al de mas
     gente en vez de dejar la tarjeta en blanco. */
  const embudoExiste = embudos.some((e) => e.id === embudoElegido)
  useEffect(() => {
    if (!embudoExiste && embudoConMasGente) {
      setEmbudoElegido(embudoConMasGente)
      setElegidoAMano(false)
    }
  }, [embudoExiste, embudoConMasGente])

  function elegirEmbudo(id: string) {
    setElegidoAMano(true)
    setEmbudoElegido(id)
  }

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
          <PeriodFilter value={range ?? undefined} onChange={setRange} defaultPreset="30d" />
        </div>
        {leyenda && (
          <p className="hud-in mt-2 text-sm text-muted-foreground" style={{ animationDelay: "40ms" }}>
            {leyenda}
          </p>
        )}

        {/* BLOQUE 1: LOS 8 NUMEROS DEL NEGOCIO.
            Van los primeros a proposito: es lo que Marco abre a mirar. Y estan
            SIEMPRE los ocho, aunque el periodo venga vacio. */}
        <div className="mt-4">
          <DashboardMetricas
            titular={{
              etiqueta: "Facturado",
              valor: kpis.revenue,
              delta:
                kpis.revenuePct !== null
                  ? { texto: `${kpis.revenuePct > 0 ? "+" : ""}${kpis.revenuePct}%`, sube: kpis.revenuePct >= 0 }
                  : null,
              pie: `De ${kpis.ventas} ${plural(kpis.ventas, "venta cerrada", "ventas cerradas")} en el periodo`,
            }}
            anillos={[
              {
                clave: "showrate",
                etiqueta: "Asistencia a las llamadas",
                pct: kpis.showRate,
                pie:
                  kpis.showRate === null
                    ? "Todavía no ha pasado ninguna llamada"
                    : `${kpis.llamadasCompletadas} se conectaron · ${kpis.noShows} no se presentaron`,
              },
              {
                clave: "conversion",
                etiqueta: "De llamada a venta",
                pct: kpis.conversion,
                pie:
                  kpis.conversion === null
                    ? "Todavía no ha pasado ninguna llamada"
                    : `${kpis.ventas} ${plural(kpis.ventas, "venta", "ventas")} de ${kpis.llamadasCompletadas} ${plural(kpis.llamadasCompletadas, "llamada celebrada", "llamadas celebradas")}`,
              },
            ]}
            piezas={piezas}
            curva={curvaDinero}
            cargando={loading}
            eur={eur}
          />
        </div>

        {/* Los cuatro numeros de la prospeccion. SIN TITULO: Marco lo pidio asi
            el 2026-08-08 ("no le pongas una verga, ponle un separador y ya"). */}
        <div className="mt-6 border-t border-border pt-6">
          <DashboardKpis kpis={kpisSetter} cargando={loading} eur={eur} />
        </div>

        {/* GRAFICO 2: EL EMBUDO, con desplegable para elegir cual se mira.
            Sustituye a los dos embudos sueltos que habia y al del CRM. */}
        <Card
          delay={120}
          title="Los embudos del CRM"
          className="mt-4"
          right={
            <SelectorEmbudo opciones={embudos} valor={embudoElegido} onChange={elegirEmbudo} />
          }
        >
          <DashboardEmbudo
            opciones={embudos}
            seleccionado={embudoElegido}
            onSeleccionar={elegirEmbudo}
            cargando={loading}
          />
        </Card>

        {/* GRAFICO 3: COMO VA EL MES. Sustituye a los cuatro graficos de dias
            que habia sueltos. */}
        <Card delay={160} title="Cómo va el mes" className="mt-4">
          <DashboardComoVa tramos={comoVa.tramos} series={comoVa.series} cargando={loading} />
        </Card>

        {/* BLOQUE 6a: VENTAS POR COMPLETAR (solo si hay algo que cerrar) */}
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
