"use client"

import { useEffect, useMemo, useState } from "react"
import { Gift, Phone, AlertCircle, Mail, Magnet, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"
import {
  loadMifgeLeads,
  subscribeMifgeLeads,
  STAGES,
  type MifgeLead,
} from "../services/mifge-pipeline-service"

export function MifgeKanban() {
  const [leads, setLeads] = useState<MifgeLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [columnaActiva, setColumnaActiva] = useState<string>(STAGES[0]?.id ?? "")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await loadMifgeLeads()
        if (cancelled) return
        setLeads(data)
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Error cargando leads")
        setLoading(false)
      }
    }

    load()
    const unsub = subscribeMifgeLeads(load)

    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  const groups = useMemo(() => {
    const map = new Map<string, MifgeLead[]>()
    for (const stage of STAGES) {
      map.set(stage.id, [])
    }
    for (const lead of leads) {
      const arr = map.get(lead.pipeline_stage)
      if (arr) arr.push(lead)
    }
    return map
  }, [leads])

  const total = leads.length
  const totalWon = leads.filter((l) => l.pipeline_stage === "won_mes" || l.pipeline_stage === "won_ano").length
  const conversionRate = total > 0 ? Math.round((totalWon / total) * 100) : 0
  const listaActiva = groups.get(columnaActiva) ?? []

  return (
    <div className="flex h-mobile-content flex-col md:h-[calc(100dvh-3.5rem)]">
      {/* Barra de numeros */}
      <div className="flex flex-col items-start justify-between gap-2 border-b border-border bg-card px-4 py-2 md:flex-row md:items-center md:gap-4 md:px-6 md:py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{total}</span> leads totales
          </span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-primary tabular-nums">{totalWon}</span> WON ({conversionRate}%)
          </span>
          {error && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Pipeline MIFGE · realtime · ver knowledge → 02-pipeline-mifge
        </p>
      </div>

      {/* TELEFONO: una columna cada vez */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <div className="flex shrink-0 snap-x gap-1 overflow-x-auto px-4 py-2">
          {STAGES.map((stage) => {
            const n = (groups.get(stage.id) ?? []).length
            return (
              <button
                key={stage.id}
                onClick={() => setColumnaActiva(stage.id)}
                className={cn(
                  "h-11 shrink-0 snap-start rounded-lg px-3 text-[15px] whitespace-nowrap",
                  columnaActiva === stage.id
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "bg-card text-muted-foreground"
                )}
              >
                {stage.label} <span className="tabular-nums">{n}</span>
              </button>
            )
          })}
        </div>
        <div className="no-overscroll min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {loading ? (
            <LoadingScreen fullscreen={false} className="min-h-[200px]" />
          ) : listaActiva.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
              <h3 className="text-[17px] font-semibold text-foreground">Esta etapa está vacía</h3>
              <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                Los leads que lleguen a esta etapa aparecen aquí en cuanto pasen.
              </p>
            </div>
          ) : (
            listaActiva.map((lead) => <LeadCard key={lead.id} lead={lead} />)
          )}
        </div>
      </div>

      {/* ORDENADOR: el tablero en fila */}
      <div className="no-overscroll hidden min-h-0 flex-1 overflow-x-auto overflow-y-hidden md:block">
        <div className="flex h-full min-w-max gap-3 p-3">
          {STAGES.map((stage) => {
            const stageLeads = groups.get(stage.id) ?? []
            return (
              <div key={stage.id} className="flex w-72 shrink-0 flex-col">
                {/* Cabecera de columna. El color de la etapa es dato del pipeline. */}
                <div className={cn("flex items-center justify-between rounded-t-lg border border-b-0 px-3 py-2", stage.color)}>
                  <span className="font-heading text-sm font-semibold">{stage.label}</span>
                  <span className="text-sm font-bold tabular-nums">{stageLeads.length}</span>
                </div>

                <div className={cn("flex-1 space-y-2 overflow-y-auto rounded-b-lg border border-t-0 bg-card/30 p-2", stage.color.split(" ")[1])}>
                  {loading ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Cargando…</p>
                  ) : stageLeads.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Sin leads</p>
                  ) : (
                    stageLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LeadCard({ lead }: { lead: MifgeLead }) {
  const updated = new Date(lead.pipeline_stage_updated_at)
  const ago = formatTimeAgo(updated)
  // Si el email es placeholder de ManyChat (todavía no recogido), mostrar @ig en su lugar
  const isPlaceholderEmail = lead.email.endsWith("@lead.capitalhubapp.local")

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm transition-colors md:hover:border-foreground/40">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground md:text-sm">
          {lead.full_name || "Sin nombre"}
        </p>
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{ago}</span>
      </div>
      <p className="mb-1.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
        {isPlaceholderEmail ? (
          <>
            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
            <span>email pendiente · ManyChat</span>
          </>
        ) : (
          <>
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 truncate">{lead.email}</span>
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {lead.lead_magnet && (
          <span
            className="flex items-center gap-1 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-sm text-muted-foreground"
            title={`Lead magnet de origen: ${lead.lead_magnet.name}`}
          >
            <Magnet className="h-3.5 w-3.5 shrink-0" />
            {lead.lead_magnet.slug}
          </span>
        )}
        {lead.bump_purchased && (
          <span className="flex items-center gap-1 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-sm text-primary">
            <Gift className="h-3.5 w-3.5 shrink-0" /> Bump
          </span>
        )}
        {lead.converted_post_call && (
          <span className="flex items-center gap-1 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-sm text-primary">
            <Phone className="h-3.5 w-3.5 shrink-0" /> Post-call
          </span>
        )}
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "ahora"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}
