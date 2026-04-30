"use client"

import { useEffect, useMemo, useState } from "react"
import { Gift, Phone, AlertCircle, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
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

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Top bar con stats */}
      <div className="flex items-center justify-between gap-4 border-b border-border bg-card/40 px-4 py-2.5">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-mono text-muted-foreground">
            <span className="text-foreground font-semibold">{total}</span> leads totales
          </span>
          <span className="font-mono text-muted-foreground">
            <span className="text-emerald-400 font-semibold">{totalWon}</span> WON ({conversionRate}%)
          </span>
          {error && (
            <span className="flex items-center gap-1 font-mono text-red-400">
              <AlertCircle className="h-3 w-3" />
              {error}
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Pipeline MIFGE · realtime · ver knowledge → 02-pipeline-mifge
        </p>
      </div>

      {/* Kanban scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-3 p-3 min-w-max">
          {STAGES.map((stage) => {
            const stageLeads = groups.get(stage.id) ?? []
            return (
              <div key={stage.id} className="flex w-72 flex-shrink-0 flex-col">
                {/* Header de columna */}
                <div className={cn("flex items-center justify-between rounded-t-md border border-b-0 px-3 py-2", stage.color)}>
                  <span className="font-heading text-xs font-semibold uppercase tracking-wide">{stage.label}</span>
                  <span className="font-mono text-[11px] font-bold">{stageLeads.length}</span>
                </div>

                {/* Cards */}
                <div className={cn("flex-1 space-y-2 overflow-y-auto rounded-b-md border border-t-0 bg-card/30 p-2", stage.color.split(" ")[1])}>
                  {loading ? (
                    <p className="text-center text-[11px] text-muted-foreground py-4 font-mono">Cargando…</p>
                  ) : stageLeads.length === 0 ? (
                    <p className="text-center text-[11px] text-muted-foreground/60 py-4 font-mono italic">Sin leads</p>
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

  return (
    <div className="rounded-sm border border-border bg-card p-2.5 shadow-sm hover:border-foreground/40 transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-medium text-xs text-foreground truncate flex-1">{lead.full_name || "Sin nombre"}</p>
        <span className="font-mono text-[9px] text-muted-foreground shrink-0">{ago}</span>
      </div>
      <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mb-1.5">
        <Mail className="h-2.5 w-2.5 shrink-0" />
        {lead.email}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {lead.bump_purchased && (
          <span className="flex items-center gap-0.5 rounded-sm border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] text-amber-300">
            <Gift className="h-2.5 w-2.5" /> Bump
          </span>
        )}
        {lead.converted_post_call && (
          <span className="flex items-center gap-0.5 rounded-sm border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300">
            <Phone className="h-2.5 w-2.5" /> Post-call
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
