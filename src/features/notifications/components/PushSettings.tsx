"use client"

import { BellRing, BellOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePushSubscription } from "../hooks/usePushSubscription"

/**
 * Interruptor de notificaciones push del dispositivo actual (vive en /perfil).
 * Es la vía visible para activar el push si se cerró el aviso automático:
 * antes no existía ningún sitio en la UI para hacerlo.
 */
export function PushSettings({ userId }: { userId: string }) {
  const { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe } =
    usePushSubscription(userId)

  if (!isSupported) {
    return (
      <p className="text-xs text-muted-foreground">
        Este navegador no soporta notificaciones push. En iPhone, instala primero la app
        (Compartir → Añadir a pantalla de inicio) y actívalas desde ahí.
      </p>
    )
  }

  if (permission === "denied") {
    return (
      <p className="text-xs text-muted-foreground">
        Las notificaciones están bloqueadas en este navegador. Para activarlas, permite las
        notificaciones de este sitio en los ajustes del navegador y recarga la página.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {isSubscribed ? (
          <BellRing className="h-4 w-4 text-green-400" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={cn("text-sm", isSubscribed ? "text-foreground" : "text-muted-foreground")}>
          {isSubscribed ? "Activadas en este dispositivo" : "Desactivadas en este dispositivo"}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Avisos de leads, agendas y ventas aunque la app esté cerrada. Se activan por dispositivo:
        actívalas también en tu móvil y tu ordenador.
      </p>
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={loading}
        className={cn(
          "rounded-sm px-3 py-1.5 text-xs font-mono uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed",
          isSubscribed
            ? "border border-border text-muted-foreground hover:text-foreground"
            : "bg-foreground text-background hover:opacity-90"
        )}
      >
        {loading ? "Un momento…" : isSubscribed ? "Desactivar" : "Activar notificaciones"}
      </button>
    </div>
  )
}
