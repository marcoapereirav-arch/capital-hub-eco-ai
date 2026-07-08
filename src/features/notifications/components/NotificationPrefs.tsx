"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { NOTIFICATION_PREFS } from "@/lib/notifications/prefs-catalog"

/**
 * Toggles de qué tipos de aviso recibe el usuario (campana + push).
 * Vive en /perfil, sección Notificaciones. Apagar un grupo lo apaga en
 * TODOS los dispositivos del usuario (es preferencia de cuenta, no de device).
 */
export function NotificationPrefs() {
  const [prefs, setPrefs] = useState<Record<string, boolean> | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/api/me/notification-prefs")
      .then((r) => r.json())
      .then((d) => setPrefs(d.prefs ?? {}))
      .catch(() => setError(true))
  }, [])

  async function toggle(key: string) {
    if (!prefs) return
    const next = !(prefs[key] ?? true)
    setPrefs({ ...prefs, [key]: next }) // optimista
    const res = await fetch("/api/me/notification-prefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pref: key, enabled: next }),
    }).catch(() => null)
    if (!res?.ok) setPrefs({ ...prefs, [key]: !next }) // revertir si falló
  }

  if (error) {
    return <p className="text-xs text-red-400">No se pudieron cargar tus preferencias. Recarga la página.</p>
  }
  if (!prefs) {
    return <p className="text-xs text-muted-foreground">Cargando preferencias…</p>
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground pb-1">
        Qué avisos recibes
      </p>
      {NOTIFICATION_PREFS.map((p) => {
        const on = prefs[p.key] ?? true
        return (
          <div key={p.key} className="flex items-start justify-between gap-3 py-2 border-t border-border first:border-t-0">
            <div className="min-w-0">
              <div className="text-sm text-foreground">{p.label}</div>
              <div className="text-[11px] text-muted-foreground">{p.description}</div>
            </div>
            <button
              role="switch"
              aria-checked={on}
              aria-label={`${p.label}: ${on ? "activado" : "desactivado"}`}
              onClick={() => toggle(p.key)}
              className={cn(
                "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
                on ? "bg-green-500" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                  on ? "left-[18px]" : "left-0.5"
                )}
              />
            </button>
          </div>
        )
      })}
      <p className="pt-1 text-[10px] text-muted-foreground">
        Lo que apagues no te llega ni a la campana ni al móvil. Se aplica a tu cuenta en todos tus dispositivos.
      </p>
    </div>
  )
}
