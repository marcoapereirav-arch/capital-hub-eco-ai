/**
 * Configuracion del Funnel Test Personalidad.
 *
 * Valores centralizados — se cambian en 1 sitio:
 *   - TEST_URL: URL del test externo de Equilibria
 *   - WHATSAPP_NUMBER: numero internacional de Adrian, sin '+' ni espacios
 *   - INSTAGRAM_HANDLE: usuario IG de Adrian (sin @)
 */
export const FUNNEL_TEST_PERSONALIDAD = {
  TEST_URL: "https://pdi.equilibria.com/#/instructions/FULLES",
  WHATSAPP_NUMBER: "34611874062",
  INSTAGRAM_HANDLE: "adrianvillanuevarios",
} as const

export function whatsappLink(message = "Hola, acabo de hacer el test de personalidad. Te dejo mi resultado.") {
  return `https://wa.me/${FUNNEL_TEST_PERSONALIDAD.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function instagramDmLink() {
  // ig://user?username=X abre la app nativa si la tiene; instagram.com/<user> es fallback web
  return `https://instagram.com/${FUNNEL_TEST_PERSONALIDAD.INSTAGRAM_HANDLE}`
}
