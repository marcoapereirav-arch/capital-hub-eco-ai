"use client"

import { useState } from "react"
import { Eye, EyeOff, Send, Check, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { triggerManualEvent, KNOWN_EVENTS, EVENT_LABELS } from "../services/ads-events-service"
import { MarketingTokenCard } from "./marketing-token-card"

interface Props {
  pixelIdMasked: string | null
  capiTokenMasked: string | null
  adAccountId: string | null
  hasTestEventCode: boolean
}

export function AdsConfigPanel({ pixelIdMasked, capiTokenMasked, adAccountId, hasTestEventCode }: Props) {
  const [showPixel, setShowPixel] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "ok" | "error">("idle")
  const [testResult, setTestResult] = useState<{
    eventId?: string
    fbtraceId?: string
    eventsReceived?: number
    error?: string
  } | null>(null)

  const allConfigured = !!pixelIdMasked && !!capiTokenMasked && !!adAccountId
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const metaTestEventsUrl = pixelId
    ? `https://business.facebook.com/events_manager2/list/dataset/${pixelId}/test_events`
    : "https://business.facebook.com/events_manager2"

  async function handleTestEvent() {
    setTestStatus("loading")
    setTestResult(null)
    const result = await triggerManualEvent({
      event_name: "mifge_lead",
      email: "test+capi@capitalhub.app",
      value: 0,
      currency: "EUR",
    })
    if (result.ok) {
      setTestStatus("ok")
      setTestResult({
        eventId: result.eventId,
        fbtraceId: result.fbtraceId,
        eventsReceived: result.eventsReceived,
      })
    } else {
      setTestStatus("error")
      setTestResult({ error: result.error ?? "Falló el envío" })
    }
  }

  return (
    <div className="space-y-5">
      {/* Lo primero: dónde se pega la llave que lee las campañas. Es lo único de esta
          pantalla que el equipo necesita tocar de verdad. */}
      <MarketingTokenCard />

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
        {testStatus === "error" && testResult?.error && (
          <div className="mt-3 rounded-sm border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-300">
            ⨯ {testResult.error}
          </div>
        )}

        {testStatus === "ok" && testResult && (
          <div className="mt-3 rounded-sm border border-green-500/40 bg-green-500/5 p-3 space-y-3">
            <div className="flex items-center gap-2 text-green-300">
              <Check className="h-4 w-4" />
              <p className="font-mono text-xs uppercase tracking-wider">
                ✓ Meta confirmó · events_received: {testResult.eventsReceived ?? "?"}
              </p>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono text-foreground/80">
              {testResult.eventId && (
                <div><span className="text-muted-foreground">event_id:</span> <span className="break-all">{testResult.eventId}</span></div>
              )}
              {testResult.fbtraceId && (
                <div><span className="text-muted-foreground">fbtrace_id:</span> <span className="break-all">{testResult.fbtraceId}</span></div>
              )}
            </div>
            <div className="border-t border-green-500/30 pt-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-green-300 mb-1.5">Cómo verificarlo en Meta</p>
              <ol className="text-[11px] text-foreground/80 space-y-1 list-decimal list-inside">
                <li>
                  Abre{" "}
                  <a href={metaTestEventsUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">
                    Meta Events Manager → Probar eventos
                  </a>
                </li>
                <li>
                  Si tienes <code className="text-amber-300">META_TEST_EVENT_CODE</code> en .env, verás el evento ahí en segundos
                </li>
                <li>
                  Si no, va a producción real (tarda ~30 min en aparecer en &quot;Resumen&quot; — pestaña principal del Pixel)
                </li>
              </ol>
            </div>
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
