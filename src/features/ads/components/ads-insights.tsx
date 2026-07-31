"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Eye, MousePointer, DollarSign, Users, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const PRESETS = [
  { value: "today", label: "Hoy" },
  { value: "yesterday", label: "Ayer" },
  { value: "last_7d", label: "7 días" },
  { value: "last_14d", label: "14 días" },
  { value: "last_30d", label: "30 días" },
  { value: "this_month", label: "Este mes" },
  { value: "last_month", label: "Mes pasado" },
] as const

type Insight = {
  spend?: string
  impressions?: string
  clicks?: string
  cpc?: string
  ctr?: string
  cpm?: string
  reach?: string
  frequency?: string
  actions?: Array<{ action_type: string; value: string }>
}

type ApiResponse = {
  configured: boolean
  data?: Insight[]
  error?: string
}

function num(s: string | undefined, decimals = 0): string {
  if (!s) return "0"
  const n = parseFloat(s)
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: decimals }).format(n)
}

function eur(s: string | undefined): string {
  if (!s) return "0 €"
  const n = parseFloat(s)
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
}

export function AdsInsights() {
  const [preset, setPreset] = useState<string>("last_30d")
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/admin/ads/insights?preset=${preset}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setResponse(data as ApiResponse)
      })
      .catch(() => {
        if (!cancelled) setResponse({ configured: true, error: "Error de red" })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [preset])

  // Los mensajes de error van en lenguaje normal y dicen QUÉ HAY QUE HACER. Antes ponía
  // "Token Meta sin permiso ads_read", que no le dice nada a quien no es técnico.
  if (!response?.configured && response) {
    return (
      <ErrorBanner
        title="Falta la cuenta publicitaria"
        message="No está guardado el número de la cuenta de anuncios ni la llave para leerla. Sin eso no se pueden traer las campañas."
      />
    )
  }

  if (response?.error) {
    const sinPermiso = /permission|ads_read|access_token|capability/i.test(response.error)
    return (
      <ErrorBanner
        title={sinPermiso ? "La llave de Meta no puede leer las campañas" : "Meta no responde"}
        message={
          sinPermiso
            ? "La llave que tenemos sirve para MANDAR conversiones, pero no para LEER lo que gastan tus campañas. Son dos permisos distintos. El dueño de la cuenta de anuncios tiene que autorizar la lectura y generar una llave nueva. Mientras tanto, la medición de los funnels funciona igual: lo único que no se ve aquí es el gasto."
            : "No se pudo conectar con Meta ahora mismo. Vuelve a intentarlo en unos minutos."
        }
      />
    )
  }

  const row = response?.data?.[0]
  const leads = row?.actions?.find(
    (a) => a.action_type === "lead" || a.action_type === "complete_registration",
  )?.value
  const purchases = row?.actions?.find((a) => a.action_type === "purchase")?.value

  return (
    <div className="space-y-4">
      {/* Filtro periodo */}
      <div className="flex items-center gap-1 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm border",
              preset === p.value
                ? "border-foreground/40 bg-card text-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-card/50",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Cargando insights…
        </div>
      )}

      {row && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card label="Gasto" value={eur(row.spend)} icon={DollarSign} accent="emerald" />
          <Card
            label="Impresiones"
            value={num(row.impressions)}
            sublabel={`Reach ${num(row.reach)}`}
            icon={Eye}
            accent="cyan"
          />
          <Card
            label="Clicks"
            value={num(row.clicks)}
            sublabel={`CTR ${num(row.ctr, 2)}% · CPC ${eur(row.cpc)}`}
            icon={MousePointer}
            accent="blue"
          />
          <Card
            label="Leads"
            value={num(leads ?? "0")}
            sublabel={`${num(purchases ?? "0")} compras`}
            icon={Users}
            accent="amber"
          />
        </div>
      )}

      {row && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <Mini label="CPM" value={eur(row.cpm)} />
          <Mini label="Frecuencia" value={num(row.frequency, 2)} />
          <Mini label="ROAS" value="—" />
        </div>
      )}
    </div>
  )
}

function Card({
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

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card/30 px-3 py-2 flex items-center justify-between">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  )
}

function ErrorBanner({ title, message, hint }: { title: string; message: string; hint?: string }) {
  return (
    <div className="rounded-md border border-orange-500/30 bg-orange-500/[0.05] p-3 flex gap-3">
      <AlertCircle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-orange-300">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{message}</div>
        {hint && <div className="text-[10px] text-muted-foreground/70 mt-1">{hint}</div>}
      </div>
    </div>
  )
}
