"use client"

import { useEffect, useState } from "react"
import { Sparkles, ArrowUpRight } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { cn } from "@/lib/utils"
import type { PeriodRange } from "@/components/ui/period-filter"

type ContactRow = { id: string; stage: string | null; created_at: string }

const FUNNEL_STAGES = [
  { key: "lead", label: "Lead", color: "#06b6d4", kind: "active" },
  { key: "agendado", label: "Agendado", color: "#f59e0b", kind: "active" },
  { key: "alumno", label: "Alumno", color: "#10b981", kind: "won" },
] as const

const BRANCH_STAGES = [
  { key: "seguimiento", label: "Seguimiento", color: "#8b5cf6" },
  { key: "no_show", label: "No show", color: "#f97316" },
  { key: "perdido", label: "Perdido", color: "#ef4444" },
] as const

/**
 * Seccion del Dashboard que muestra el EMBUDO REAL de los leads que entraron
 * por la landing /test-personalidad. Sin KPIs inventados — solo el embudo del
 * pipeline canonico (6 stages).
 *
 * Respeta el PeriodFilter global del Dashboard (range prop).
 */
export function FunnelTestPersonalidadSection({ range }: { range: PeriodRange | null }) {
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!range) return
    ;(async () => {
      setLoading(true)
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data } = await supabase
        .from("contacts")
        .select("id, stage, created_at")
        .eq("origin", "landing_test_personalidad")
        .gte("created_at", range.from.toISOString())
        .lte("created_at", range.to.toISOString())
      setContacts((data ?? []) as ContactRow[])
      setLoading(false)
    })()
  }, [range])

  function countOf(stage: string) {
    return contacts.filter((c) => c.stage === stage).length
  }

  const max = Math.max(...FUNNEL_STAGES.map((s) => countOf(s.key)), 1)

  return (
    <section className="bg-card/30 border border-violet-500/30 rounded-md p-4">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            Funnel Test Personalidad
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Embudo de los leads que entraron por la landing en el periodo seleccionado
          </p>
        </div>
        <a
          href="/test-personalidad"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono uppercase tracking-wider inline-flex items-center gap-1 border border-border px-2 py-1 rounded-sm hover:bg-card"
        >
          Ver landing <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-muted-foreground">Cargando…</div>
      ) : (
        <>
          {/* Embudo lineal */}
          <div className="space-y-2">
            {FUNNEL_STAGES.map((s, i) => {
              const count = countOf(s.key)
              const widthPct = Math.max(8, (count / max) * 100)
              const prevCount = i > 0 ? countOf(FUNNEL_STAGES[i - 1].key) : count
              const conv = prevCount > 0 && i > 0 ? Math.round((count / prevCount) * 100) : null
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-foreground">{count}</span>
                      {conv !== null && (
                        <span className="text-[10px] font-mono text-muted-foreground">({conv}%)</span>
                      )}
                    </div>
                  </div>
                  <div className="h-7 bg-secondary/30 rounded-sm overflow-hidden">
                    <div
                      className="h-full transition-all rounded-sm border"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: `${s.color}22`,
                        borderColor: `${s.color}55`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Salidas */}
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Salidas del embudo
            </p>
            <div className="grid grid-cols-3 gap-2">
              {BRANCH_STAGES.map((b) => (
                <div
                  key={b.key}
                  className={cn("rounded-sm border px-3 py-2")}
                  style={{
                    backgroundColor: `${b.color}1a`,
                    color: b.color,
                    borderColor: `${b.color}44`,
                  }}
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">{b.label}</div>
                  <div className="text-lg font-semibold tabular-nums mt-0.5">{countOf(b.key)}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
