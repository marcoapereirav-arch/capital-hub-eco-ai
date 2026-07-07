/**
 * Configuración del Funnel Webinar (webinar semanal en directo).
 *
 * Flujo: el lead llega a /webinar → opt-in (nombre + email + teléfono) →
 * /webinar/gracias → botón grande "Entrar al grupo de WhatsApp". En el grupo se
 * suelta el link del Zoom del directo y los avisos. Durante el webinar, el CTA
 * lleva al funnel de agendar (/reservar, con el Calendly embebido).
 *
 * Valores centralizados (editables después desde el ⚙️ de /webs, key 'funnel:webinar'):
 *   - WHATSAPP_GROUP_URL: link de invitación del grupo/comunidad de WhatsApp.
 *       Lo crea Adrián (acción humana) y lo pega aquí. Vacío = el botón avisa
 *       "el grupo se abre en breve" en vez de romper.
 *   - WEBINAR_DATE_LABEL: fecha/hora que se muestra en la landing.
 *   - RESERVAR_URL: funnel de agendar (Calendly) que se enseña DURANTE el webinar.
 *   - INSTAGRAM_HANDLE: usuario IG de Adrián (sin @), para el pie/soporte.
 */
export const FUNNEL_WEBINAR = {
  WHATSAPP_GROUP_URL: "https://chat.whatsapp.com/C5wQD0OvYLlFLNOdYVcHAS",
  WEBINAR_DATE_LABEL: "Viernes 10 de julio · 17:00h",
  RESERVAR_URL: "/reservar",
  INSTAGRAM_HANDLE: "adrianvillanuevarios",
} as const

export function instagramLink(handle: string = FUNNEL_WEBINAR.INSTAGRAM_HANDLE) {
  return `https://instagram.com/${handle}`
}
