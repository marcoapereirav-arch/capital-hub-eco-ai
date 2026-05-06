/**
 * Placeholder: el componente SubtitleKaraoke importa loadCapitalHubFonts pero
 * el módulo no existía y el build de producción fallaba con
 * "Cannot find module '../lib/fonts'".
 *
 * Esta es una implementación no-op para desbloquear el deploy. Si se requieren
 * fuentes específicas en el render Remotion, completar con la API:
 * https://www.remotion.dev/docs/google-fonts
 *
 * Creado 2026-05-06 para desbloquear el deploy de la Fase A de lead-magnets.
 */
export function loadCapitalHubFonts(): void {
  // Intencionalmente vacío. Comportamiento previo (antes del bug): sin
  // carga de fuentes — los renders usaban la fuente por defecto del sistema.
}
