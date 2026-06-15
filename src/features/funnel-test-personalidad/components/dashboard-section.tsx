"use client"

import { useEffect, useState } from "react"
import { Sparkles, Mail, MessageCircle, Calendar, Trophy, ArrowUpRight } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

type Metrics = {
  totalOptins: number
  optins7d: number
  conConversacion: number
  conLlamadaAgendada: number
  conAlumno: number
}

/** Seccion del Dashboard que mide el funnel test personalidad end-to-end. */
export function FunnelTestPersonalidadSection() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [{ data: totalContacts }, { data: recentContacts }] = await Promise.all([
        supabase.from("contacts").select("id, stage").eq("origin", "landing_test_personalidad"),
        supabase
          .from("contacts")
          .select("id")
          .eq("origin", "landing_test_personalidad")
          .gte("created_at", sevenDaysAgo),
      ])

      const all = (totalContacts ?? []) as Array<{ stage: string | null }>
      setMetrics({
        totalOptins: all.length,
        optins7d: (recentContacts ?? []).length,
        conConversacion: all.filter((c) => c.stage === "conversacion").length,
        conLlamadaAgendada: all.filter((c) => c.stage === "agendado").length,
        conAlumno: all.filter((c) => c.stage === "alumno").length,
      })
      setLoading(false)
    })()
  }, [])

  return (
    <section className="bg-card/30 border border-violet-500/30 rounded-md p-4">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            Funnel Test Personalidad
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Leads que entraron por la landing /test-personalidad — opt-in nombre + email
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <FunnelKpi label="Opt-ins totales" value={metrics?.totalOptins ?? 0} icon={Mail} loading={loading} accent="violet" />
        <FunnelKpi label="Opt-ins últimos 7d" value={metrics?.optins7d ?? 0} icon={Mail} loading={loading} accent="violet" />
        <FunnelKpi label="En Conversación" value={metrics?.conConversacion ?? 0} icon={MessageCircle} loading={loading} accent="blue" />
        <FunnelKpi label="Agendados" value={metrics?.conLlamadaAgendada ?? 0} icon={Calendar} loading={loading} accent="amber" />
        <FunnelKpi label="Alumnos" value={metrics?.conAlumno ?? 0} icon={Trophy} loading={loading} accent="emerald" />
      </div>
    </section>
  )
}

function FunnelKpi({
  label,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  label: string
  value: number
  icon: typeof Mail
  loading: boolean
  accent: "violet" | "blue" | "amber" | "emerald"
}) {
  const colors = {
    violet: "text-violet-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
  }
  return (
    <div className="rounded-sm border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className={`h-3 w-3 ${colors[accent]}`} />
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${colors[accent]}`}>
        {loading ? "…" : value}
      </div>
    </div>
  )
}
