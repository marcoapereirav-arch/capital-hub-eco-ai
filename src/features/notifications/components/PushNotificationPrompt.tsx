'use client'

import { useState, useEffect } from 'react'
import { usePushSubscription } from '../hooks/usePushSubscription'

interface PushNotificationPromptProps {
  userId?: string
  autoShowDelay?: number
}

// "Ahora no" pausa el aviso unos días, no para siempre. Antes se guardaba un
// flag permanente y quien lo cerraba una vez ya no tenía NINGUNA forma visible
// de activar el push (caso Adrián). Ahora: el aviso reaparece pasados 7 días
// y además existe el interruptor en /perfil.
const DISMISS_KEY = 'push-prompt-dismissed-at'
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000

export function PushNotificationPrompt({
  userId,
  autoShowDelay = 3000,
}: PushNotificationPromptProps) {
  const { isSupported, permission, isSubscribed, subscribe } = usePushSubscription(userId)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isSupported || isSubscribed || permission === 'denied') return

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_MS) return

    const timer = setTimeout(() => setShow(true), autoShowDelay)
    return () => clearTimeout(timer)
  }, [isSupported, isSubscribed, permission, autoShowDelay])

  if (!show) return null

  const handleEnable = async () => {
    setShow(false)
    await subscribe()
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  return (
    // Se ancla POR ENCIMA de la barra de abajo del telefono (56 puntos mas la
    // franja de gestos) y por encima del boton de registrar venta, para no
    // dejar al usuario sin menu mientras el aviso esta abierto.
    <div className="fixed right-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+5rem)] z-50 w-[min(24rem,calc(100vw-2rem))] space-y-3 rounded-xl border border-border bg-card p-4 shadow-lg md:right-6 md:bottom-6">
      <p className="text-[15px] font-medium text-foreground">Activar notificaciones?</p>
      <p className="text-sm text-muted-foreground">
        Recibe avisos de leads, agendas y ventas aunque no tengas la app abierta.
        También puedes activarlas después desde Mi perfil.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleEnable}
          className="h-11 flex-1 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity active:opacity-90 md:h-9 md:flex-none md:px-4 md:text-sm"
        >
          Activar
        </button>
        <button
          onClick={handleDismiss}
          className="h-11 rounded-lg px-3 text-[15px] text-muted-foreground transition-colors active:bg-muted md:h-9 md:text-sm"
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}
