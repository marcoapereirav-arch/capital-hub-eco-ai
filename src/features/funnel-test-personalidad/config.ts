/**
 * Configuracion del Funnel Test Personalidad (v3, ver SOP marketing/07).
 *
 * Flujo v3 (VIGENTE, Marco 2026-08-11): opt-in -> DIRECTO a la landing del test.
 * Sin pagina intermedia y sin email de espera: el lead entra al test en el mismo
 * momento en que deja sus datos.
 *
 * El flujo v2 (gracias con VSL + Calendly, y email de acceso a los 7 minutos) NO se
 * borro: vive detras del interruptor PASO_INTERMEDIO. Encenderlo desde el engranaje
 * de /webs devuelve el funnel al comportamiento v2 sin tocar codigo ni publicar.
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
 *   - PASO_INTERMEDIO: false = funnel directo (v3). true = vuelve el v2 completo
 *     (gracias con VSL + Calendly, y email de acceso programado).
 */
export const FUNNEL_TEST_PERSONALIDAD = {
  TEST_URL: "https://pdi.equilibria.com/#/instructions/FULLES",
  WHATSAPP_NUMBER: "34611874062",
  INSTAGRAM_HANDLE: "adrianvillanuevarios",
  VIDEO_GUID: "", // se rellena tras subir el VSL a Bunny
  BUNNY_LIBRARY_ID: "686883",
  CALENDLY_URL: "https://calendly.com/adrian-sales-capital/online-coffee",
  EMAIL_DELAY_MINUTES: 7,
  /**
   * El paso intermedio (gracias + email de los 7 min) esta APAGADO.
   * Decision de Marco del 2026-08-11: para la campana, el lead entra al test en el
   * momento. Nada se ha borrado; esto es un interruptor, no una amputacion.
   */
  PASO_INTERMEDIO: false,
  /**
   * Correo de confirmacion que sale AL INSTANTE del opt-in con el acceso al test.
   * Distinto del de los 7 minutos (ese va con PASO_INTERMEDIO).
   * Nace apagado: Marco lo enciende cuando da el visto bueno al copy.
   */
  EMAIL_CONFIRMACION: false,
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
