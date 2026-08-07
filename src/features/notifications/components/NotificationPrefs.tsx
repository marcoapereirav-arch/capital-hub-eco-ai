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
    return <p className="text-sm text-destructive">No se pudieron cargar tus preferencias. Recarga la página.</p>
  }
  if (!prefs) {
    return <p className="text-sm text-muted-foreground">Cargando preferencias…</p>
  }

  return (
    <div className="space-y-1">
      <p className="pb-1 text-sm font-semibold text-muted-foreground">
        Qué avisos recibes
      </p>
      {NOTIFICATION_PREFS.map((p) => {
        const on = prefs[p.key] ?? true
        return (
          <div key={p.key} className="flex items-start justify-between gap-3 border-t border-border py-2 first:border-t-0">
            <div className="min-w-0">
              <div className="text-[15px] text-foreground">{p.label}</div>
              <div className="text-sm text-muted-foreground">{p.description}</div>
            </div>
            {/* El interruptor medía 20 puntos de alto: imposible de acertar con
                el dedo. Ahora la zona que se toca mide 44 y el carril de dentro
                se queda del mismo tamaño de siempre. */}
            <button
              role="switch"
              aria-checked={on}
              aria-label={`${p.label}: ${on ? "activado" : "desactivado"}`}
              onClick={() => toggle(p.key)}
              className="flex h-11 w-11 shrink-0 items-center justify-center md:h-9 md:w-9"
            >
              <span
                className={cn(
                  "relative block h-5 w-9 rounded-full transition-colors",
                  on ? "bg-primary" : "bg-border"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full transition-all",
                    on ? "left-[18px] bg-primary-foreground" : "left-0.5 bg-foreground"
                  )}
                />
              </span>
            </button>
          </div>
        )
      })}
      <p className="pt-1 text-sm text-muted-foreground">
        Lo que apagues no te llega ni a la campana ni al móvil. Se aplica a tu cuenta en todos tus dispositivos.
      </p>
    </div>
  )
}
