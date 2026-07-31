import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendCapiEvent, type CapiEventName } from "@/lib/meta/capi-client"
import { funnelFromUrl, isFunnelTrackingEnabled, logSkippedEvent } from "@/lib/meta/funnel-tracking"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const ALLOWED_EVENTS: CapiEventName[] = [
  "mifge_lead",
  "mifge_free_trial_started",
  "mifge_order_bump",
  "mifge_call_booked",
  "mifge_anual_purchased",
  "mifge_monthly_purchased",
  "mifge_call_attended",
  "test_personalidad_lead",
  "test_personalidad_cualificado",
  "webinar_lead",
  "agenda_reserva",
  // Eventos ESTÁNDAR de Meta. Antes no estaban aquí, así que el estándar solo salía
  // por el píxel del navegador: si el lead rechazaba cookies, Meta no recibía ningún
  // `Lead`. Ahora salen también por servidor. Ver SOP marketing/09.
  "ViewContent",
  "Lead",
  "Schedule",
  "Contact",
]

const TrackSchema = z.object({
  event_id: z.string().min(8).max(128),
  event_name: z.string().refine((v): v is CapiEventName => ALLOWED_EVENTS.includes(v as CapiEventName), {
    message: "event_name no permitido",
  }),
  url: z.string().url().optional(),
  user_data: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().max(30).optional(),
      fbp: z.string().nullish(),
      fbc: z.string().nullish(),
    })
    .default({}),
  custom_data: z
    .object({
      value: z.number().optional(),
      currency: z.string().max(8).optional(),
      contentName: z.string().max(120).optional(),
      contentIds: z.array(z.string()).optional(),
    })
    .passthrough()
    .default({}),
  lead_id: z.string().uuid().optional(),
})

/**
 * POST /api/meta/capi/track
 * Recibe el evento desde el browser (con event_id ya generado por el Pixel)
 * y lo dispara también server-side a CAPI con el mismo event_id para deduplicación.
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = TrackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined
  const userAgent = req.headers.get("user-agent") ?? undefined

  // Interruptor de medición del funnel. Publicado NO significa que deba medir: el
  // acceso al OS está publicado y no manda nada. Si está apagado, se registra el
  // descarte con su motivo (nunca en silencio) y se devuelve OK: el funnel no está
  // roto, está apagado a propósito.
  const funnel = funnelFromUrl(data.url)
  const gate = await isFunnelTrackingEnabled(funnel)
  if (!gate.enabled) {
    await logSkippedEvent({
      eventId: data.event_id,
      eventName: data.event_name,
      url: data.url,
      email: data.user_data.email ?? null,
      funnel,
      reason: gate.reason ?? "medición apagada",
    })
    return NextResponse.json({ ok: true, skipped: true, reason: gate.reason }, { status: 200 })
  }

  const result = await sendCapiEvent({
    eventId: data.event_id,
    eventName: data.event_name as CapiEventName,
    eventSourceUrl: data.url,
    userData: {
      email: data.user_data.email,
      phone: data.user_data.phone,
      fbp: data.user_data.fbp ?? null,
      fbc: data.user_data.fbc ?? null,
      ip,
      userAgent,
    },
    customData: data.custom_data as Record<string, unknown>,
    leadId: data.lead_id,
    triggeredBy: "browser_pixel_paired",
    source: "server",
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
