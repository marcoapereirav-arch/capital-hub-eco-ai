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
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-sm border border-border bg-card p-4 shadow-lg space-y-3">
      <p className="text-sm font-medium text-foreground">Activar notificaciones?</p>
      <p className="text-xs text-muted-foreground">
        Recibe avisos de leads, agendas y ventas aunque no tengas la app abierta.
        También puedes activarlas después desde Mi perfil.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleEnable}
          className="px-3 py-1.5 text-xs font-medium rounded-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Activar
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}
