"use client"

import { useEffect, useRef } from "react"
import { track } from "./pixel-client"

/**
 * Dispara `ViewContent` una sola vez al abrir una página que nos importa.
 *
 * La diferencia con `PageView`: `PageView` lo dispara el píxel solo, en TODAS las
 * páginas (incluidas cookies y aviso legal), y solo dice "alguien pasó por aquí".
 * `ViewContent` lo ponemos nosotros a mano y únicamente donde está la oferta, así que
 * significa "esta persona vio de verdad lo que vendemos". Sin esa separación, las
 * audiencias mezclan al que leyó la política de privacidad con el que vio la landing.
 *
 * Sale por píxel y por servidor con el mismo identificador (ver SOP marketing/09).
 *
 * `enabled` viene del interruptor de medición del funnel: si está apagado, no se
 * dispara nada, aunque el funnel esté publicado.
 */
export function useViewContent(contentName: string, enabled = true) {
  const fired = useRef(false)

  useEffect(() => {
    if (!enabled || fired.current) return
    fired.current = true
    track({ event: "ViewContent", contentName, custom: { funnel_content: contentName } }).catch(
      () => {}
    )
  }, [contentName, enabled])
}
