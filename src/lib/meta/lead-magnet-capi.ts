import "server-only"
import crypto from "crypto"
import { sendCapiEvent, type CapiUserData } from "./capi-client"

/**
 * Helper específico para disparar los eventos CAPI de lead magnets.
 *
 * Por cada opt-in dispara DOS eventos (agregado + granular) con el MISMO event_id:
 *   1. mifge_lead_magnet_optin → para análisis cross-LM en Meta
 *   2. mifge_lm_<slug> → granular, permite crear audiencias custom por LM específico
 *
 * Mismo event_id en ambos NO los deduplica (event_name distinto), pero permite
 * trazabilidad cruzada en el log meta_events_log.
 *
 * Server-only: el opt-in vive dentro de ManyChat, no hay browser nuestro → sin Pixel.
 *
 * Ver SOP marketing/05-tracking-meta v4 + marketing/06-lead-magnets.
 */

export type LeadMagnetCapiInput = {
  /** Slug del lead magnet (ej: "test-vocacional"). Se sanitiza a snake_case. */
  leadMagnetSlug: string
  /** ID del lead magnet en BD (custom_data). */
  leadMagnetId: string
  /** ID del lead en mifge_leads (para meta_events_log.lead_id). */
  leadId: string
  /** Email del lead (se hashea SHA256). */
  email?: string
  /** Username de IG (se manda en custom_data, no en user_data). */
  igUsername?: string
  /** ManyChat subscriber id (custom_data). */
  manychatSubscriberId?: string
  /** Post de IG que originó el opt-in (custom_data, para atribución por reel). */
  reelPostId?: string
  /** ID del comment específico (custom_data). */
  reelCommentId?: string
  /** IP del subscriber (si ManyChat la pasa, va a user_data). */
  ip?: string | null
  /** User agent del subscriber (si ManyChat lo pasa, va a user_data). */
  userAgent?: string | null
}

/** Sanitiza un slug para usarlo como sufijo del event_name custom de Meta. */
function sanitizeSlugForEventName(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
}

export async function sendLeadMagnetCapi(input: LeadMagnetCapiInput): Promise<{
  optin: { ok: boolean; eventId: string; error?: string }
  granular: { ok: boolean; eventId: string; error?: string; eventName: string }
}> {
  const slugSafe = sanitizeSlugForEventName(input.leadMagnetSlug)
  const granularEventName = `mifge_lm_${slugSafe}` as const
  // Mismo event_id en ambos para trazabilidad cruzada en el log
  const sharedEventId = crypto.randomUUID()

  const userData: CapiUserData = {
    email: input.email,
    ip: input.ip,
    userAgent: input.userAgent,
  }

  const customData = {
    lead_magnet_slug: input.leadMagnetSlug,
    lead_magnet_id: input.leadMagnetId,
    ...(input.igUsername && { ig_username: input.igUsername }),
    ...(input.manychatSubscriberId && { manychat_subscriber_id: input.manychatSubscriberId }),
    ...(input.reelPostId && { reel_post_id: input.reelPostId }),
    ...(input.reelCommentId && { reel_comment_id: input.reelCommentId }),
    value: 0,
    currency: "EUR",
  }

  const triggeredBy = `manychat_lm_router:${input.leadMagnetSlug}`

  // Disparar los 2 eventos en paralelo
  const [optinResult, granularResult] = await Promise.allSettled([
    sendCapiEvent({
      eventId: sharedEventId,
      eventName: "mifge_lead_magnet_optin",
      userData,
      customData,
      leadId: input.leadId,
      triggeredBy,
    }),
    sendCapiEvent({
      eventId: sharedEventId,
      eventName: granularEventName,
      userData,
      customData,
      leadId: input.leadId,
      triggeredBy,
    }),
  ])

  return {
    optin:
      optinResult.status === "fulfilled"
        ? optinResult.value
        : { ok: false, eventId: sharedEventId, error: String(optinResult.reason) },
    granular:
      granularResult.status === "fulfilled"
        ? { ...granularResult.value, eventName: granularEventName }
        : { ok: false, eventId: sharedEventId, error: String(granularResult.reason), eventName: granularEventName },
  }
}
