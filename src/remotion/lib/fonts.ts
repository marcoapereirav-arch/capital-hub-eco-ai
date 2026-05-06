/**
 * Font loader para Remotion.
 *
 * Carga Google Fonts dinámicamente en el browser de Remotion para que
 * el render tenga acceso a la tipografía correcta (Inter Bold para
 * SubtitleKaraoke estilo Diego).
 *
 * Reemplaza al stub no-op que se creó temporalmente para desbloquear
 * deploy. Sin esto, los subs Diego renderizan con fallback system font
 * en vez de Inter Bold.
 */

const loadedFonts = new Set<string>()

export const loadGoogleFont = (
  fontFamily: string,
  weights = '400;500;600;700;800;900',
): void => {
  if (typeof document === 'undefined') return
  if (loadedFonts.has(fontFamily)) return

  const link = document.createElement('link')
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${weights}&display=swap`
  link.rel = 'stylesheet'
  document.head.appendChild(link)
  loadedFonts.add(fontFamily)
}

export const FONT_FAMILIES = {
  primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  display: "'Poppins', sans-serif",
} as const

export const loadCapitalHubFonts = (): void => {
  loadGoogleFont('Inter')
}
