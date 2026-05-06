"use client"

import { useEffect, useState } from "react"
import { Video, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Card para que Adrian configure su URL de Zoom (PMI).
 * El URL se inyecta en cada call nueva como meeting_url + va embebido
 * en el evento de Google Calendar y en el .ics que recibe el cliente.
 */
export function MeetingUrlCard() {
  const [url, setUrl] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/calls-config/meeting-url")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return
        setUrl(d.meeting_url)
        setDraft(d.meeting_url ?? "")
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const next = draft.trim() === "" ? null : draft.trim()
      const res = await fetch("/api/admin/calls-config/meeting-url", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_url: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error guardando")
      } else {
        setUrl(next)
        setSavedAt(Date.now())
        setTimeout(() => setSavedAt(null), 3000)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red")
    } finally {
      setSaving(false)
    }
  }

  function handleClear() {
    setDraft("")
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando link de la videollamada…
      </div>
    )
  }

  const dirty = draft.trim() !== (url ?? "")
  const configured = (url ?? "").length > 0

  return (
    <div
      className={cn(
        "rounded-sm border p-3 space-y-2",
        configured ? "border-green-500/30 bg-green-500/5" : "border-amber-500/40 bg-amber-500/5"
      )}
    >
      <div className="flex items-center gap-2">
        {configured ? (
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        )}
        <Video className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="text-sm">
            Link Zoom (PMI Adrián){configured ? "" : " — sin configurar"}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Se inyecta en cada llamada · embed en Calendar event · embed en .ics del cliente
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="url"
          inputMode="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://us05web.zoom.us/j/8765432109?pwd=..."
          className="flex-1 rounded-sm border border-border/40 bg-background px-2 py-1.5 text-xs font-mono"
        />
        {draft && (
          <button
            onClick={handleClear}
            disabled={saving}
            className="rounded-sm border border-border/40 px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider hover:bg-card disabled:opacity-50"
          >
            Limpiar
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={cn(
            "rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          {saving ? "…" : "Guardar"}
        </button>
      </div>

      {error && (
        <p className="text-[10px] text-red-400 font-mono">{error}</p>
      )}
      {savedAt && (
        <p className="text-[10px] text-green-400 font-mono">Guardado ✓</p>
      )}
    </div>
  )
}
