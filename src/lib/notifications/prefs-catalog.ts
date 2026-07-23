/**
 * Catálogo de preferencias de notificación. Isomorfo (server + client):
 * el server filtra destinatarios con él y la UI de /perfil pinta los toggles.
 *
 * Cada tipo concreto de notificación (columna `type` de `notifications`)
 * pertenece a un grupo de preferencia. El usuario enciende/apaga GRUPOS.
 * Sin fila en `notification_preferences` = activado (default ON).
 *
 * Al añadir un tipo nuevo de notificación: mapearlo aquí. Un tipo sin mapear
 * se entrega SIEMPRE (mejor un aviso de más que perder uno importante).
 */

export type NotificationPref = {
  key: string
  label: string
  description: string
}

export const NOTIFICATION_PREFS: NotificationPref[] = [
  {
    key: "lead",
    label: "Nuevos leads",
    description: "Cada opt-in que entra por los funnels (webinar, test de personalidad) y contactos recurrentes.",
  },
  {
    key: "agenda",
    label: "Agenda",
    description: "Reservas, cancelaciones y no-shows (Calendly y calendario propio).",
  },
  {
    key: "venta",
    label: "Ventas",
    description: "Cada venta registrada.",
  },
  {
    key: "crm_manual",
    label: "Movimientos manuales del CRM",
    description: "Cuando alguien del equipo mueve un contacto de etapa a mano.",
  },
  {
    key: "sistema",
    label: "Sistema",
    description: "Alertas técnicas del OS (Google Calendar desconectado, etc.).",
  },
]

export const PREF_KEYS = NOTIFICATION_PREFS.map((p) => p.key)

const TYPE_TO_PREF: Record<string, string> = {
  lead: "lead",
  // v2 del funnel del test: abrió el acceso desde el email (ver PRP-007)
  lead_cualificado: "lead",
  recurring_optin_webinar: "lead",
  recurring_optin_test_personalidad: "lead",
  agenda: "agenda",
  calendly_created: "agenda",
  calendly_canceled: "agenda",
  calendly_no_show: "agenda",
  venta: "venta",
  manual_stage_change: "crm_manual",
  gcal_disconnected: "sistema",
}

/** Grupo de preferencia de un tipo concreto. null = tipo sin mapear (se entrega siempre). */
export function prefKeyForType(type: string): string | null {
  return TYPE_TO_PREF[type] ?? null
}
