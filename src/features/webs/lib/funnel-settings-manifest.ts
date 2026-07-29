import { FUNNEL_TEST_PERSONALIDAD } from "@/features/funnel-test-personalidad/config"
import { FUNNEL_RESERVAR } from "@/features/funnel-reservar/config"
import { FUNNEL_WEBINAR } from "@/features/funnel-webinar/config"

/**
 * Manifiesto de ajustes editables por funnel (links de los botones/CTA).
 *
 * Es la "fuente de verdad" de qué campos muestra el popup ⚙️ de cada funnel:
 * el popup lee este manifiesto → un input por campo. Si se añade/quita un botón
 * editable, se actualiza aquí y el popup lo refleja solo (detección por manifiesto).
 *
 * Los valores se guardan en app_settings (key 'funnel:<slug>'). La landing/gracias
 * leen el override y, si está vacío, usan el `default` (de config.ts). Nunca se rompe.
 */
export type FunnelSettingField = {
  key: string
  label: string
  hint?: string
  default: string
}
export type FunnelManifest = {
  slug: string
  fields: FunnelSettingField[]
}

export const FUNNEL_MANIFESTS: Record<string, FunnelManifest> = {
  "test-personalidad": {
    slug: "test-personalidad",
    fields: [
      {
        key: "video_guid",
        label: "VSL de la página de gracias (GUID de Bunny)",
        hint: "Pega aquí el GUID del vídeo de Adrián cuando esté subido a Bunny. Vacío: la página no muestra reproductor y el resto del funnel sigue funcionando.",
        default: FUNNEL_TEST_PERSONALIDAD.VIDEO_GUID,
      },
      {
        key: "calendly_url",
        label: "Calendly embebido en la página de gracias",
        hint: "URL del evento de Calendly que se muestra debajo del vídeo.",
        default: FUNNEL_TEST_PERSONALIDAD.CALENDLY_URL,
      },
      {
        key: "email_delay_minutes",
        label: "Minutos hasta que llega el email con el test",
        hint: "Cuánto espera el lead viendo la VSL antes de recibir el acceso. Default 7. Cambia también el número que se muestra en la página.",
        default: String(FUNNEL_TEST_PERSONALIDAD.EMAIL_DELAY_MINUTES),
      },
      {
        key: "test_url",
        label: "Botón «Abrir el test» — URL del test",
        hint: "A dónde redirige el botón principal de la landing del test (/test-personalidad/test).",
        default: FUNNEL_TEST_PERSONALIDAD.TEST_URL,
      },
      {
        key: "whatsapp",
        label: "WhatsApp de Adrián",
        hint: "Solo números con prefijo de país, sin + ni espacios. Ej: 34611874062",
        default: FUNNEL_TEST_PERSONALIDAD.WHATSAPP_NUMBER,
      },
      {
        key: "instagram",
        label: "Instagram de Adrián",
        hint: "Solo el usuario, sin @. Ej: adrianvillanuevarios",
        default: FUNNEL_TEST_PERSONALIDAD.INSTAGRAM_HANDLE,
      },
    ],
  },
  webinar: {
    slug: "webinar",
    fields: [
      {
        key: "video_guid",
        label: "Mini-VSL de la landing (GUID de Bunny)",
        hint: "Pega aquí el GUID de la mini-VSL del evento cuando esté subida a Bunny. Vacío: la landing muestra el hueco con un placeholder de marca y el resto del funnel sigue funcionando.",
        default: FUNNEL_WEBINAR.VIDEO_GUID,
      },
      {
        key: "whatsapp_number",
        label: "WhatsApp de Adrián (botón de la página de gracias)",
        hint: "Solo números con prefijo de país, sin + ni espacios. Ej: 34611874062. Es el destino del botón «Conseguir mi entrada por WhatsApp».",
        default: FUNNEL_WEBINAR.WHATSAPP_NUMBER,
      },
      {
        key: "whatsapp_message",
        label: "Mensaje predefinido del WhatsApp",
        hint: "El texto que el lead envía al pulsar el botón. Ej: «Hola Adrián, quiero acceder al evento del 8 de agosto».",
        default: FUNNEL_WEBINAR.WHATSAPP_MESSAGE,
      },
      {
        key: "date_label",
        label: "Fecha/hora del webinar",
        hint: "Lo que se muestra en la landing. Ej: «8 de agosto · 19:00h».",
        default: FUNNEL_WEBINAR.WEBINAR_DATE_LABEL,
      },
      {
        key: "instagram",
        label: "Instagram de Adrián",
        hint: "Solo el usuario, sin @. Ej: adrianvillanuevarios",
        default: FUNNEL_WEBINAR.INSTAGRAM_HANDLE,
      },
    ],
  },
  reservar: {
    slug: "reservar",
    fields: [
      {
        key: "calendly_url",
        label: "Calendly — evento de la sesión",
        hint: "Scheduling URL del evento de Calendly que se embebe en /reservar.",
        default: FUNNEL_RESERVAR.CALENDLY_URL,
      },
      {
        key: "video_guid",
        label: "Vídeo post-agenda — GUID de Bunny",
        hint: "GUID del vídeo en Bunny Stream que se muestra en /reservar/gracias. Vacío = placeholder.",
        default: FUNNEL_RESERVAR.VIDEO_GUID,
      },
      {
        key: "test_url",
        label: "URL del test (Equilibria)",
        hint: "El test literal al que lleva el botón «¿aún no has hecho el test?».",
        default: FUNNEL_RESERVAR.TEST_URL,
      },
    ],
  },
}

export function getFunnelManifest(slug: string): FunnelManifest | null {
  return FUNNEL_MANIFESTS[slug] ?? null
}
