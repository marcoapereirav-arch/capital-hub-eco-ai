import { FUNNEL_TEST_PERSONALIDAD } from "@/features/funnel-test-personalidad/config"

/**
 * Configuración del funnel de Reserva (booking de la sesión con Adrián/equipo).
 *
 * Flujo: el lead llega a /reservar → Calendly en POPUP (online-coffee) → al reservar,
 * capturamos el evento `calendly.event_scheduled` y redirigimos a /reservar/gracias
 * (página nuestra). Así NO hace falta configurar nada en Calendly.
 *
 * Valores centralizados (editables después desde el ⚙️ de /webs):
 *   - CALENDLY_URL: scheduling URL del evento online-coffee de Adrián
 *   - BUNNY_LIBRARY_ID: id público de la library de Bunny (va en la URL del iframe)
 *   - VIDEO_GUID: guid del vídeo en Bunny (vacío hasta subirlo). Si está vacío → placeholder.
 *   - TEST_URL: el TEST LITERAL (Equilibria), no la landing. Para "aún no he hecho el test".
 */
export const FUNNEL_RESERVAR = {
  CALENDLY_URL: "https://calendly.com/adrian-sales-capital/online-coffee",
  BUNNY_LIBRARY_ID: "686883",
  BUNNY_CDN: "vz-6b29b2f5-059.b-cdn.net", // hostname público (poster/thumbnail)
  VIDEO_GUID: "", // ← se rellena tras subir el vídeo a Bunny
  TEST_URL: FUNNEL_TEST_PERSONALIDAD.TEST_URL, // test literal de Equilibria
} as const

/** URL del iframe embebible de Bunny Stream (vacía si no hay vídeo todavía). */
export function bunnyEmbedUrl(guid: string, libraryId: string): string {
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}?autoplay=false&preload=true`
}
