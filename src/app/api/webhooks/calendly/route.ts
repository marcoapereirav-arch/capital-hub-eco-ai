import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyWebhookSignature } from "@/lib/calendly"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/webhooks/calendly
 * Recibe eventos de Calendly (invitee.created, invitee.canceled, invitee_no_show.created).
 *
 * Flow:
 *   1. Lee signing_key de BD (calendly_config)
 *   2. Verifica HMAC-SHA256 del header Calendly-Webhook-Signature
 *   3. Parsea payload + upsert en calendly_scheduled_events
 *   4. Devuelve 200 OK
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signatureHeader = req.headers.get("Calendly-Webhook-Signature")

  const admin = getAdminClient()
  const { data: cfg } = await admin
    .from("calendly_config")
    .select("webhook_signing_key")
    .eq("id", 1)
    .maybeSingle()

  if (!cfg?.webhook_signing_key) {
    console.error("[calendly/webhook] No signing_key in BD — run /api/admin/calendly/setup first")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 })
  }

  const verify = verifyWebhookSignature(rawBody, signatureHeader, cfg.webhook_signing_key)
  if (!verify.valid) {
    console.error("[calendly/webhook] Invalid signature:", verify.reason)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: {
    event: string
    payload: {
      uri?: string
      event?: string
      name?: string
      email?: string
      text_reminder_number?: string | null
      cancellation?: { reason?: string }
      scheduled_event?: {
        uri: string
        name: string
        status: string
        start_time: string
        end_time: string
        event_type: string
        location?: { type: string; location?: string; join_url?: string }
      }
    }
  }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    const event = payload.event
    const inv = payload.payload
    const scheduled = inv.scheduled_event

    if (!scheduled?.uri) {
      console.warn("[calendly/webhook] Missing scheduled_event in payload")
      return NextResponse.json({ ok: true, skipped: true })
    }

    if (event === "invitee.created" || event === "invitee.canceled") {
      await admin.from("calendly_scheduled_events").upsert({
        uri: scheduled.uri,
        name: scheduled.name,
        start_time: scheduled.start_time,
        end_time: scheduled.end_time,
        status: scheduled.status,
        location_kind: scheduled.location?.type ?? null,
        location_uri: scheduled.location?.location ?? null,
        meeting_url: scheduled.location?.join_url ?? null,
        event_type_uri: scheduled.event_type,
        invitee_uri: inv.uri,
        invitee_email: inv.email,
        invitee_name: inv.name,
        invitee_phone: inv.text_reminder_number ?? null,
        invitee_cancellation_reason: inv.cancellation?.reason ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "uri" })
    } else if (event === "invitee_no_show.created") {
      await admin.from("calendly_scheduled_events").update({
        status: "no_show",
        updated_at: new Date().toISOString(),
      }).eq("uri", scheduled.uri)
    }

    return NextResponse.json({ ok: true, event, uri: scheduled.uri })
  } catch (e) {
    console.error("[calendly/webhook] processing failed", e)
    return NextResponse.json({ ok: true, error: (e as Error).message }, { status: 200 })
  }
}
