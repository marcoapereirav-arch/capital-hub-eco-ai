import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyWebhookSignature } from "@/lib/calendly"
import { resolveAutoStage } from "@/lib/pipeline/stage-guard"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 50)
}

type Admin = ReturnType<typeof getAdminClient>

/**
 * Mueve la película del contacto en el pipeline a partir de un evento de Calendly.
 * - created: agenda → 'agendado' (guarda no-retroceso, nunca degrada alumno). Si no
 *   existe el contacto (agendó sin pasar por el test), lo crea.
 * - canceled: si seguía 'agendado' → 'seguimiento'.
 * - no_show: → 'no_show' salvo que sea alumno.
 */
async function moveContactForCalendly(
  admin: Admin,
  kind: "created" | "canceled" | "no_show",
  inv: { email?: string; name?: string; phone?: string | null },
  scheduledStart?: string,
) {
  const email = inv.email?.toLowerCase().trim()
  if (!email) return

  const { data: existing } = await admin
    .from("contacts")
    .select("id, stage, pipeline_id")
    .ilike("email", email)
    .maybeSingle()

  if (kind === "created") {
    if (existing) {
      const nextStage = resolveAutoStage(existing.stage, "agendado")
      await admin.from("contacts").update({
        stage: nextStage,
        last_call_at: scheduledStart ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id)
      await logJourney(admin, existing.id, "call_booked", "Agendó llamada (Calendly)")
    } else {
      // Agendó sin pasar por el test → crear contacto en el funnel
      const { data: pipeline } = await admin
        .from("pipelines").select("id").eq("slug", "test-personalidad").maybeSingle()
      const fullName = inv.name?.trim() || email
      const { data: created } = await admin.from("contacts").insert({
        full_name: fullName,
        email,
        phone: inv.phone ?? null,
        slug: slugify(fullName) + "_" + Math.random().toString(36).slice(2, 8),
        stage: "agendado",
        pipeline_id: pipeline?.id ?? null,
        origin: "calendly_online_coffee",
        source: "calendly_online_coffee",
      }).select("id").single()
      if (created?.id) await logJourney(admin, created.id, "call_booked", "Agendó llamada (Calendly, sin test previo)")
    }
    return
  }

  if (!existing) return

  if (kind === "canceled") {
    if (existing.stage === "agendado") {
      await admin.from("contacts").update({ stage: "seguimiento", updated_at: new Date().toISOString() }).eq("id", existing.id)
    }
    await logJourney(admin, existing.id, "call_cancelled", "Canceló la llamada (Calendly)")
    return
  }

  if (kind === "no_show") {
    // no_show no degrada a un alumno (won)
    if (existing.stage !== "alumno") {
      await admin.from("contacts").update({ stage: "no_show", updated_at: new Date().toISOString() }).eq("id", existing.id)
    }
    await logJourney(admin, existing.id, "call_no_show", "No se presentó a la llamada (Calendly)")
  }
}

async function logJourney(admin: Admin, contactId: string, type: string, title: string) {
  await admin.from("contact_journey_events").insert({ contact_id: contactId, type, title, data: { source: "calendly" } })
}

/**
 * POST /api/webhooks/calendly
 * Eventos: invitee.created, invitee.canceled, invitee_no_show.created.
 *
 * Flow:
 *   1. Verifica HMAC (calendly_config.webhook_signing_key)
 *   2. Upsert en calendly_scheduled_events (log)
 *   3. Mueve la película del contacto en el pipeline (match por email)
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

      await moveContactForCalendly(
        admin,
        event === "invitee.created" ? "created" : "canceled",
        { email: inv.email, name: inv.name, phone: inv.text_reminder_number ?? null },
        scheduled.start_time,
      )
    } else if (event === "invitee_no_show.created") {
      await admin.from("calendly_scheduled_events").update({
        status: "no_show",
        updated_at: new Date().toISOString(),
      }).eq("uri", scheduled.uri)

      await moveContactForCalendly(admin, "no_show", { email: inv.email, name: inv.name })
    }

    return NextResponse.json({ ok: true, event, uri: scheduled.uri })
  } catch (e) {
    console.error("[calendly/webhook] processing failed", e)
    return NextResponse.json({ ok: true, error: (e as Error).message }, { status: 200 })
  }
}
