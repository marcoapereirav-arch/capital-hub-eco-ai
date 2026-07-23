/**
 * Configuracion del Funnel Test Personalidad (v2, ver PRP-007 y SOP marketing/07).
 *
 * Flujo v2: opt-in -> pagina de gracias con VSL + Calendly embebido -> email a los
 * 7 minutos con el acceso -> landing del test (califica el lead) -> Equilibria.
 *
 * Valores centralizados (se cambian en 1 sitio) y todos sobreescribibles SIN deploy
 * desde el engranaje de /webs (app_settings, key 'funnel:test-personalidad'):
 *   - TEST_URL: URL del test externo de Equilibria
 *   - WHATSAPP_NUMBER: numero internacional de Adrian, sin '+' ni espacios
 *   - INSTAGRAM_HANDLE: usuario IG de Adrian (sin @)
 *   - VIDEO_GUID: guid del VSL en Bunny Stream. Vacio hasta que Adrian lo grabe;
 *     con el vacio la pagina de gracias NO se rompe, solo oculta el reproductor.
 *   - BUNNY_LIBRARY_ID: id publico de la library de Bunny (va en la URL del iframe)
 *   - CALENDLY_URL: scheduling URL del evento online-coffee de Adrian
 *   - EMAIL_DELAY_MINUTES: retraso del email con el acceso al test
 */
export const FUNNEL_TEST_PERSONALIDAD = {
  TEST_URL: "https://pdi.equilibria.com/#/instructions/FULLES",
  WHATSAPP_NUMBER: "34611874062",
  INSTAGRAM_HANDLE: "adrianvillanuevarios",
  VIDEO_GUID: "", // se rellena tras subir el VSL a Bunny
  BUNNY_LIBRARY_ID: "686883",
  CALENDLY_URL: "https://calendly.com/adrian-sales-capital/online-coffee",
  EMAIL_DELAY_MINUTES: 7,
} as const

export function whatsappLink(message = "Hola, acabo de hacer el test de personalidad. Te dejo mi resultado.") {
  return `https://wa.me/${FUNNEL_TEST_PERSONALIDAD.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function instagramDmLink() {
  // ig://user?username=X abre la app nativa si la tiene; instagram.com/<user> es fallback web
  return `https://instagram.com/${FUNNEL_TEST_PERSONALIDAD.INSTAGRAM_HANDLE}`
}

/** URL del iframe embebible de Bunny Stream (vacia si no hay video todavia). */
export function bunnyEmbedUrl(guid: string, libraryId: string): string {
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}?autoplay=false&preload=true`
}
