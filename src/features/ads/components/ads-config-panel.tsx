"use client"

import { useState } from "react"
import { Eye, EyeOff, Send, Check, AlertTriangle, Loader2, X } from "lucide-react"
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
      {/* Status global. Verde = todo bien; ambar de aviso = falta algo. */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border px-4 py-3",
          allConfigured
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-warn/40 bg-warn/10 text-warn"
        )}
      >
        {allConfigured
          ? <Check className="mt-0.5 h-4 w-4 shrink-0" />
          : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
        <p className="min-w-0 text-[15px] font-semibold">
          {allConfigured
            ? "Conectado · Pixel + CAPI + Ad Account configurados"
            : "Configuración incompleta — falta alguna credencial"}
        </p>
      </div>

      {/* Credenciales */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
      <div className="rounded-xl border border-border bg-card/40 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start md:justify-between md:gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-[15px] font-semibold text-foreground">Test event</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Dispara un evento `mifge_lead` de prueba contra Meta CAPI. Útil para verificar que el Pixel ID + CAPI token están correctos antes de tener tráfico real.
            </p>
          </div>
          <button
            onClick={handleTestEvent}
            disabled={testStatus === "loading" || !allConfigured}
            className="flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:h-8 md:w-auto md:text-sm"
          >
            {testStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar test event
          </button>
        </div>
        {testStatus === "error" && testResult?.error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <X className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0">{testResult.error}</span>
          </div>
        )}

        {testStatus === "ok" && testResult && (
          <div className="mt-3 space-y-3 rounded-lg border border-primary/40 bg-primary/10 p-3">
            <div className="flex items-start gap-2 text-primary">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="min-w-0 text-[15px] font-semibold">
                Meta confirmó · events_received: <span className="tabular-nums">{testResult.eventsReceived ?? "?"}</span>
              </p>
            </div>
            <div className="space-y-1.5 text-sm text-foreground">
              {testResult.eventId && (
                <div><span className="text-muted-foreground">event_id:</span> <span className="break-all">{testResult.eventId}</span></div>
              )}
              {testResult.fbtraceId && (
                <div><span className="text-muted-foreground">fbtrace_id:</span> <span className="break-all">{testResult.fbtraceId}</span></div>
              )}
            </div>
            <div className="border-t border-primary/30 pt-3">
              <p className="mb-1.5 text-sm font-semibold text-primary">Cómo verificarlo en Meta</p>
              <ol className="list-inside list-decimal space-y-1 text-sm text-foreground">
                <li>
                  Abre{" "}
                  <a href={metaTestEventsUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Meta Events Manager → Probar eventos
                  </a>
                </li>
                <li>
                  Si tienes <code className="text-warn">META_TEST_EVENT_CODE</code> en .env, verás el evento ahí en segundos
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
        <p className="mb-2 text-sm font-semibold text-muted-foreground">Eventos custom configurados (7)</p>
        {/* Antes esto era una rejilla de 12 columnas: en 375 puntos salen a 31
            puntos cada una y no cabe ni una palabra. Ahora se apila. */}
        <div className="divide-y divide-border rounded-lg border border-border bg-card/30">
          {KNOWN_EVENTS.map((name) => (
            <div key={name} className="flex flex-col gap-0.5 px-3 py-2.5 md:grid md:grid-cols-12 md:items-center md:gap-2">
              <span className="text-[15px] break-all text-foreground md:col-span-5 md:text-sm">{name}</span>
              <span className="text-sm text-muted-foreground md:col-span-7">{EVENT_LABELS[name] ?? name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CredCard({ label, value, shown, onToggle, help }: { label: string; value: string | null; shown: boolean; onToggle?: () => void; help: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold text-muted-foreground">{label}</p>
        {onToggle && value && (
          <button
            onClick={onToggle}
            aria-label={shown ? "Ocultar" : "Mostrar"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted md:h-6 md:w-6"
          >
            {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      <p className={cn("text-[15px] break-all tabular-nums", value ? "text-foreground" : "text-warn")}>
        {value ? (shown ? value : "•".repeat(Math.min(value.length, 20))) : "Sin configurar"}
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{help}</p>
    </div>
  )
}
