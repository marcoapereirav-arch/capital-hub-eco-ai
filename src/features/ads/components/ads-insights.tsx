"use client"

import { useEffect, useState } from "react"
import { Eye, MousePointer, DollarSign, Users, AlertCircle, Loader2 } from "lucide-react"
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
            ? [
                "La llave que tenemos sirve para MANDAR conversiones, pero no para LEER lo que gastan tus campañas. Son dos permisos distintos y solo tenemos el primero.",
                "",
                "Para arreglarlo, el dueño de la cuenta de anuncios tiene que dar permiso de lectura y generar una llave nueva. Estos son los datos exactos:",
                "",
                "  Cuenta de anuncios:  2550903125083729",
                "  Aplicación:          1304166178499280",
                "  Usuario del sistema: 122108163171278108",
                "  Permiso que falta:   ads_read",
                "",
                "Cuando llegue la llave nueva, se guarda como META_MARKETING_API_TOKEN y esta pantalla se llena sola. No hay que programar nada más.",
                "",
                "Mientras tanto la medición de los funnels funciona igual: lo único que no se ve aquí es el gasto.",
              ].join("\n")
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
      {/* Filtro periodo: tira deslizable de una linea, a 44 puntos de alto */}
      <div className="-mx-4 flex snap-x items-center gap-1 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={cn(
              "h-11 shrink-0 snap-start rounded-lg border px-3 text-[15px] whitespace-nowrap md:h-8 md:text-sm",
              preset === p.value
                ? "border-primary bg-primary/10 font-semibold text-foreground"
                : "border-border text-muted-foreground md:hover:bg-card/50 md:hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando insights…
        </div>
      )}

      {row && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card label="Gasto" value={eur(row.spend)} icon={DollarSign} destacado />
          <Card
            label="Impresiones"
            value={num(row.impressions)}
            sublabel={`Reach ${num(row.reach)}`}
            icon={Eye}
          />
          <Card
            label="Clicks"
            value={num(row.clicks)}
            sublabel={`CTR ${num(row.ctr, 2)}% · CPC ${eur(row.cpc)}`}
            icon={MousePointer}
          />
          <Card
            label="Leads"
            value={num(leads ?? "0")}
            sublabel={`${num(purchases ?? "0")} compras`}
            icon={Users}
          />
        </div>
      )}

      {row && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
  destacado = false,
}: {
  label: string
  value: string
  sublabel?: string
  icon: typeof DollarSign
  /** La cifra de dinero es la que manda: va en verde de marca, el resto en carbon. */
  destacado?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        destacado ? "border-primary/30 bg-primary/10" : "border-border bg-card"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <div
        className={cn(
          "text-2xl leading-none font-semibold tabular-nums",
          destacado ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </div>
      {sublabel && (
        <div className="mt-1.5 text-sm tabular-nums text-muted-foreground">
          {sublabel}
        </div>
      )}
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card/30 px-3 py-2.5">
      <span className="text-sm font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="text-[15px] tabular-nums text-foreground">{value}</span>
    </div>
  )
}

/**
 * Aviso con el ámbar de marca del tema (`warn`), que es el color oficial para lo que pide
 * atención sin ser un error. `whitespace-pre-line` para que el mensaje pueda traer los
 * datos exactos en su renglón.
 */
function ErrorBanner({ title, message, hint }: { title: string; message: string; hint?: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-warn/40 bg-warn/10 p-4 md:p-5">
      <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-warn" />
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-extrabold text-warn">
          {title}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">
          {message}
        </p>
        {hint && (
          <p className="mt-2 text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
