import { FUNNEL_TEST_PERSONALIDAD } from "@/features/funnel-test-personalidad/config"
import { FUNNEL_RESERVAR } from "@/features/funnel-reservar/config"

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
        key: "test_url",
        label: "Botón «Abrir el test» — URL del test",
        hint: "A dónde redirige el botón principal de la página de gracias.",
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
