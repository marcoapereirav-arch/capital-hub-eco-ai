import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import {
  getCurrentUser,
  listEventTypes,
  listWebhookSubscriptions,
  createWebhookSubscription,
  deleteWebhookSubscription,
} from "@/lib/calendly"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/admin/calendly/setup
 * Inicializa la integración con Calendly:
 *   1. GET /users/me → guarda user URI + organization URI + email + timezone en calendly_config
 *   2. Lista webhooks existentes en la organization
 *   3. Si NO hay webhook apuntando a nuestro callback → lo crea
 *   4. Guarda signing_key en BD
 *   5. Sync inicial de event types (lista todos los tipos de evento de la org)
 *
 * Solo super_admin puede ejecutarlo.
 * Idempotente: ejecutar múltiples veces no rompe nada (reusa webhook si ya existe).
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Solo super_admin" }, { status: 403 })
  }

  try {
    // 1. Identificar usuario + organization
    const me = await getCurrentUser()

    // 2. URL del webhook (canonical OS)
    const baseUrl = process.env.NEXT_PUBLIC_OS_URL ?? "https://ecoai.capitalhubapp.com"
    const callbackUrl = `${baseUrl}/api/webhooks/calendly`

    // 3. ¿Ya hay un webhook apuntando a nuestro callback?
    const existing = await listWebhookSubscriptions(me.current_organization)
    let webhook = existing.find((w) => w.callback_url === callbackUrl)
    let signingKey = webhook?.signing_key ?? null

    if (!webhook) {
      // 4. No existe → crear
      webhook = await createWebhookSubscription({
        callbackUrl,
        organizationUri: me.current_organization,
      })
      signingKey = webhook.signing_key
    }

    // 5. Upsert calendly_config con todo
    await admin.from("calendly_config").upsert({
      id: 1,
      organization_uri: me.current_organization,
      user_uri: me.uri,
      user_email: me.email,
      user_name: me.name,
      user_timezone: me.timezone,
      scheduling_url: me.scheduling_url,
      webhook_uri: webhook.uri,
      webhook_signing_key: signingKey,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" })

    // 6. Sync inicial event types
    const eventTypes = await listEventTypes(me.current_organization)
    if (eventTypes.length > 0) {
      await admin.from("calendly_event_types").upsert(
        eventTypes.map((et) => ({
          uri: et.uri,
          name: et.name,
          slug: et.slug,
          scheduling_url: et.scheduling_url,
          duration: et.duration,
          active: et.active,
          color: et.color,
          internal_note: et.internal_note,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "uri" }
      )
    }

    return NextResponse.json({
      ok: true,
      user: { name: me.name, email: me.email, timezone: me.timezone },
      organization_uri: me.current_organization,
      webhook: {
        uri: webhook.uri,
        callback_url: callbackUrl,
        events: webhook.events,
        state: webhook.state,
        signing_key_saved: !!signingKey,
        was_existing: existing.some((w) => w.callback_url === callbackUrl),
      },
      event_types_synced: eventTypes.length,
    })
  } catch (e) {
    console.error("[calendly/setup] failed", e)
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Setup failed",
    }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/calendly/setup
 * Borra el webhook de Calendly y limpia calendly_config (sin tocar event_types/scheduled_events ya sincronizados).
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "super_admin") return NextResponse.json({ error: "Solo super_admin" }, { status: 403 })

  const { data: cfg } = await admin.from("calendly_config").select("webhook_uri").eq("id", 1).maybeSingle()
  if (cfg?.webhook_uri) {
    try { await deleteWebhookSubscription(cfg.webhook_uri) } catch (e) { console.warn("[calendly/setup] delete webhook failed", e) }
  }
  await admin.from("calendly_config").update({
    webhook_uri: null,
    webhook_signing_key: null,
    updated_at: new Date().toISOString(),
  }).eq("id", 1)

  return NextResponse.json({ ok: true })
}
