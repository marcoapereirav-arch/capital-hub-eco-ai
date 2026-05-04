"use client"

import { useState } from "react"
import { Eye, EyeOff, Send, Check, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { triggerManualEvent, KNOWN_EVENTS, EVENT_LABELS } from "../services/ads-events-service"

interface Props {
  pixelIdMasked: string | null
  capiTokenMasked: string | null
  adAccountId: string | null
  hasTestEventCode: boolean
}

export function AdsConfigPanel({ pixelIdMasked, capiTokenMasked, adAccountId, hasTestEventCode }: Props) {
  const [showPixel, setShowPixel] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "ok" | "error">("idle")
  const [testMessage, setTestMessage] = useState<string | null>(null)

  const allConfigured = !!pixelIdMasked && !!capiTokenMasked && !!adAccountId

  async function handleTestEvent() {
    setTestStatus("loading")
    setTestMessage(null)
    const result = await triggerManualEvent({
      event_name: "mifge_lead",
      email: "test+capi@capitalhub.app",
      value: 0,
      currency: "EUR",
    })
    if (result.ok) {
      setTestStatus("ok")
      setTestMessage(`Evento de prueba enviado. event_id: ${result.eventId}. Revisa Meta Events Manager → Test Events.`)
    } else {
      setTestStatus("error")
      setTestMessage(result.error ?? "Falló el envío")
    }
  }

  return (
    <div className="space-y-5">
      {/* Status global */}
      <div
        className={cn(
          "rounded-sm border px-4 py-3 flex items-center gap-3",
          allConfigured
            ? "border-green-500/40 bg-green-500/5 text-green-300"
            : "border-amber-500/40 bg-amber-500/5 text-amber-300"
        )}
      >
        {allConfigured ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        <p className="text-xs font-mono uppercase tracking-wide">
          {allConfigured
            ? "Conectado · Pixel + CAPI + Ad Account configurados"
            : "Configuración incompleta — falta alguna credencial"}
        </p>
      </div>

      {/* Credenciales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CredCard
          label="Pixel ID"
          value={pixelIdMasked}
          shown={showPixel}
          onToggle={() => setShowPixel((v) => !v)}
          help="ID del Pixel de Meta para tracking browser-side."
        />
        <CredCard
          label="CAPI Access Token"
          value={capiTokenMasked}
          shown={false}
          help="Token de Conversions API. Server-side only — nunca expuesto al cliente."
        />
        <CredCard
          label="Ad Account ID"
          value={adAccountId}
          shown={true}
          help="Cuenta publicitaria desde la que se leen las métricas (Insights API)."
        />
        <CredCard
          label="Test Event Code"
          value={hasTestEventCode ? "configurado" : null}
          shown={true}
          help="Opcional. Si está, los eventos van a la zona de testing en Events Manager (no afectan producción)."
        />
      </div>

      {/* Test event */}
      <div className="rounded-sm border border-border bg-card/40 p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-foreground mb-1">Test event</p>
            <p className="text-xs text-muted-foreground max-w-md">
              Dispara un evento `mifge_lead` de prueba contra Meta CAPI. Útil para verificar que el Pixel ID + CAPI token están correctos antes de tener tráfico real.
            </p>
          </div>
          <button
            onClick={handleTestEvent}
            disabled={testStatus === "loading" || !allConfigured}
            className="flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1.5 text-xs hover:bg-secondary/70 font-mono uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testStatus === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Enviar test event
          </button>
        </div>
        {testMessage && (
          <div
            className={cn(
              "mt-3 rounded-sm border px-3 py-2 text-xs font-mono",
              testStatus === "ok"
                ? "border-green-500/40 bg-green-500/5 text-green-300"
                : "border-red-500/40 bg-red-500/5 text-red-300"
            )}
          >
            {testMessage}
          </div>
        )}
      </div>

      {/* Eventos custom configurados */}
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">Eventos custom configurados (7)</p>
        <div className="rounded-sm border border-border bg-card/30 divide-y divide-border">
          {KNOWN_EVENTS.map((name) => (
            <div key={name} className="grid grid-cols-12 items-center gap-2 px-3 py-2 text-xs">
              <span className="col-span-5 font-mono text-foreground">{name}</span>
              <span className="col-span-7 text-muted-foreground">{EVENT_LABELS[name] ?? name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CredCard({ label, value, shown, onToggle, help }: { label: string; value: string | null; shown: boolean; onToggle?: () => void; help: string }) {
  return (
    <div className="rounded-sm border border-border bg-card/40 p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        {onToggle && value && (
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
            {shown ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        )}
      </div>
      <p className={cn("font-mono text-sm break-all", value ? "text-foreground" : "text-amber-400")}>
        {value ? (shown ? value : "•".repeat(Math.min(value.length, 20))) : "Sin configurar"}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1.5">{help}</p>
    </div>
  )
}
