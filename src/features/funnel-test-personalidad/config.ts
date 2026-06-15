/**
 * Configuracion del Funnel Test Personalidad.
 *
 * PLACEHOLDERS — el usuario reemplaza estos valores ANTES de difundir el funnel:
 *   - TEST_URL: URL del test externo (otra empresa colaboradora)
 *   - WHATSAPP_NUMBER: numero internacional sin '+' (ej. '34600000000')
 *   - INSTAGRAM_HANDLE: usuario IG de Adrian (sin @)
 *
 * Estan aqui centralizados para que Marco los cambie en 1 sitio.
 */
export const FUNNEL_TEST_PERSONALIDAD = {
  TEST_URL: "https://test-personalidad-externo.example.com",
  WHATSAPP_NUMBER: "34600000000",
  INSTAGRAM_HANDLE: "adrianvillanueva",
} as const

export function whatsappLink(message = "Hola, acabo de hacer el test de personalidad. Te dejo el resultado.") {
  return `https://wa.me/${FUNNEL_TEST_PERSONALIDAD.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function instagramDmLink() {
  // ig://user?username=X abre la app nativa si la tiene; instagram.com/<user> es fallback web
  return `https://instagram.com/${FUNNEL_TEST_PERSONALIDAD.INSTAGRAM_HANDLE}`
}
