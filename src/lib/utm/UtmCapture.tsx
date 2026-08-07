"use client"

import { useEffect } from "react"
import { captureUtmsIfPresent } from "./utm-capture"

/**
 * Se monta en el layout publico y hace dos cosas, sin pintar nada:
 *
 * 1. Guarda las UTMs del primer aterrizaje (first touch, 30 dias).
 * 2. Si la URL trae `utm_source`, avisa de la visita para que el link del afiliado quede
 *    contado.
 *
 * El punto 2 esta AQUI a proposito, y no dentro de cada funnel: al vivir en el layout
 * comun, un funnel nuevo queda medido el dia que se crea, sin que nadie se acuerde de
 * enchufarlo. Ver SOP marketing/10 (afiliados).
 */

const CLAVE_VISITANTE = "ch_visitor_v1"

function claveDeVisitante(): string | null {
  try {
    const guardada = localStorage.getItem(CLAVE_VISITANTE)
    if (guardada) return guardada
    const nueva = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(CLAVE_VISITANTE, nueva)
    return nueva
  } catch {
    // Navegador con almacenamiento bloqueado: la visita se cuenta igual, sin deduplicar.
    return null
  }
}

export function UtmCapture() {
  useEffect(() => {
    captureUtmsIfPresent()

    const source = new URLSearchParams(window.location.search).get("utm_source")
    if (!source) return

    // Aviso y olvido: si falla, la landing no se entera. Nunca bloquea al usuario.
    void fetch("/api/afiliados/visita", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        path: window.location.pathname,
        visitor: claveDeVisitante(),
      }),
      keepalive: true,
    }).catch(() => null)
  }, [])

  return null
}
