"use client"

import { useEffect } from "react"
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
 *
 * `customEvent` añade el gemelo NUESTRO junto al estándar, con el mismo identificador.
 * `ViewContent` a secas te dice "alguien vio algo que nos importa", pero mezcla la landing
 * del test con la de la clase en directo: para hacer audiencias por funnel hace falta un
 * nombre propio. Meta deduplica por (nombre, identificador), así que compartir el
 * identificador entre los dos es correcto: son nombres distintos, un solo hecho.
 */
/**
 * Ya disparado en ESTA carga de página, por página.
 *
 * El candado va a nivel de módulo y no en un `useRef` porque el ref solo protege dentro
 * de una instancia del componente: si React vuelve a montarlo (le pasa a la landing del
 * test, no a las demás), el ref nace de cero y el evento sale dos veces. Y dos
 * `ViewContent` por visita no es un detalle: infla la audiencia, parte el porcentaje de
 * conversión por la mitad y hace que la campaña optimice con números falsos.
 *
 * Se limpia solo: al navegar de verdad, el módulo se recarga con la página.
 */
const yaDisparado = new Set<string>()

/**
 * Y el mismo candado, pero que sobreviva a una recarga de la página.
 *
 * El de arriba se pierde si la pestaña recarga, y recargas hay: el usuario pulsa F5, o
 * la app se actualiza sola. "Vio la oferta" es una cosa que pasa una vez por visita, no
 * una por vez que se pinta la página. Se guarda en la sesión de la pestaña, así que se
 * borra sola cuando el usuario la cierra.
 *
 * Si el navegador no deja usarlo (modo privado de Safari, almacenamiento lleno), se
 * dispara igual: perder una conversión real es peor que contar una de más.
 */
function yaDisparadoEnLaSesion(llave: string): boolean {
  try {
    const k = `ch:vc:${llave}`
    if (window.sessionStorage.getItem(k)) return true
    window.sessionStorage.setItem(k, "1")
    return false
  } catch {
    return false
  }
}

export function useViewContent(
  contentName: string,
  opts: { enabled?: boolean; customEvent?: string } = {},
) {
  const { enabled = true, customEvent } = opts

  useEffect(() => {
    if (!enabled) return
    const llave = `${window.location.pathname}::${customEvent ?? "ViewContent"}`
    if (yaDisparado.has(llave)) return
    yaDisparado.add(llave)
    if (yaDisparadoEnLaSesion(llave)) return
    const payload = { contentName, custom: { funnel_content: contentName } }
    // Si hay gemelo nuestro, el custom manda y `standardEvent` arrastra el ViewContent.
    // Sin gemelo, se dispara el estándar a secas, como hacía antes.
    track(
      customEvent
        ? { ...payload, event: customEvent, standardEvent: "ViewContent" }
        : { ...payload, event: "ViewContent" },
    ).catch(() => {})
  }, [contentName, enabled, customEvent])
}
