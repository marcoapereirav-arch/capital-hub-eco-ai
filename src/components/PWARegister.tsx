'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // CRITICO: usar window.location.origin (iOS rechaza redirects 307)
    const swUrl = `${window.location.origin}/sw.js`

    /* ¿Ya habia un service worker mandando en esta pagina ANTES de registrar?
     *
     * Es la unica forma fiable de distinguir "primera visita" de "hay version nueva", y
     * hay que mirarlo AQUI, antes de registrar. Mirarlo dentro del statechange no vale:
     * para entonces el sw.js ya ha hecho clients.claim() y `controller` existe, asi que
     * la primera visita se disfrazaba de actualizacion y la pagina se recargaba sola al
     * segundo de entrar.
     *
     * Recargar en la primera visita no es solo feo: DUPLICA la medicion. Cada visitante
     * nuevo generaba dos PageView y dos ViewContent, o sea el doble de gente de la que
     * habia, la mitad de coste por resultado del real, y una campaña optimizando con
     * numeros inventados. Lo vimos midiendo la landing del test el 2026-08-11, y afectaba
     * igual a la clase en directo y a la reserva de sesion. */
    const habiaControlador = Boolean(navigator.serviceWorker.controller)

    navigator.serviceWorker
      .register(swUrl, { scope: '/' })
      .then((registration) => {
        // Verificar updates cada 60 minutos
        setInterval(() => registration.update(), 60 * 60 * 1000)

        // Forzar activacion de nueva version
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && habiaControlador) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
              setTimeout(() => window.location.reload(), 1000)
            }
          })
        })
      })
      .catch((err) => console.error('[PWA] Registration failed:', err))
  }, [])

  return null
}
