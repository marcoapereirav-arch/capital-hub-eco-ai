"use client"

import { useEffect, useState } from "react"
import { Calendar, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Status = {
  envConfigured: boolean
  connected: boolean
  email: string | null
  connectedAt: string | null
  calendarId: string
}

export function GoogleCalendarCard() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/google-calendar/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setStatus(d) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Detecta query params del callback (?gcal_connected=1 o ?gcal_error=...) y refresca
  useEffect(() => {
    if (typeof window === "undefined") return
    const u = new URL(window.location.href)
    if (u.searchParams.has("gcal_connected") || u.searchParams.has("gcal_error")) {
      // limpia query para no repetir refresh
      u.searchParams.delete("gcal_connected")
      u.searchParams.delete("gcal_error")
      window.history.replaceState({}, "", u.toString())
      fetch("/api/admin/google-calendar/status").then((r) => r.json()).then(setStatus)
    }
  }, [])

  async function handleDisconnect() {
    if (!confirm("¿Desconectar Google Calendar de Adrián? Las nuevas llamadas no se crearán automáticamente en el calendario.")) return
    setActing(true)
    await fetch("/api/admin/google-calendar/disconnect", { method: "POST" })
    const fresh = await fetch("/api/admin/google-calendar/status").then((r) => r.json())
    setStatus(fresh)
    setActing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando estado de Google Calendar…
      </div>
    )
  }

  if (!status) return null

  if (!status.envConfigured) {
    return (
      <div className="flex items-start gap-2 rounded-sm border border-orange-500/40 bg-orange-500/5 p-3 text-xs">
        <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <div className="font-mono uppercase tracking-wider text-orange-400">Google Calendar no configurado</div>
          <p className="text-muted-foreground">
            Faltan variables: <code className="font-mono">GOOGLE_OAUTH_CLIENT_ID</code>,{" "}
            <code className="font-mono">GOOGLE_OAUTH_CLIENT_SECRET</code>,{" "}
            <code className="font-mono">GOOGLE_OAUTH_REDIRECT_URI</code> en Vercel env vars.
          </p>
        </div>
      </div>
    )
  }

  if (!status.connected) {
    return (
      <div className="flex items-center justify-between rounded-sm border border-border bg-card/40 p-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm">Google Calendar desconectado</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Las llamadas reservadas no aparecen en el calendario de Adrián.
            </div>
          </div>
        </div>
        <a
          href="/api/admin/google-calendar/connect"
          className="rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
        >
          Conectar
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-sm border border-green-500/30 bg-green-500/5 p-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-400" />
        <div>
          <div className="text-sm">
            Conectado: <span className="font-mono">{status.email ?? "(email desconocido)"}</span>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Calendar: {status.calendarId} · Cada reserva crea evento + Meet automáticamente
          </div>
        </div>
      </div>
      <button
        onClick={handleDisconnect}
        disabled={acting}
        className={cn(
          "rounded-sm border border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:bg-card",
          acting && "opacity-50"
        )}
      >
        {acting ? "…" : "Desconectar"}
      </button>
    </div>
  )
}
