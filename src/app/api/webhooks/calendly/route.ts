import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyWebhookSignature } from "@/lib/calendly"
import { resolveAutoStage } from "@/lib/pipeline/stage-guard"
import { notifyAdrianBooking } from "@/lib/email/senders"
import { pushToUsers, filterByNotificationPref } from "@/lib/notifications/notify-admins"

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
 * Tags visuales del CRM aplicados por el webhook según el tipo de evento Calendly.
 * Decisión Marco 2026-06-20: en lugar de "esperar 7 días tras cancelar", mover
 * al stage final (seguimiento / no_show) inmediato y aplicar un tag de color
 * para tener referencia visual rápida en el kanban del CRM.
 */
const TAG_BY_KIND: Record<string, string> = {
  created: "agendado_calendly",
  canceled: "cancelado_llamada",
  no_show: "no_show",
}

async function applyTag(admin: Admin, contactId: string, tagName: string) {
  const { data: tag } = await admin.from("tags").select("id").eq("name", tagName).maybeSingle()
  if (!tag?.id) return
  await admin.from("contact_tags").upsert({
    contact_id: contactId,
    tag_id: tag.id,
    assigned_at: new Date().toISOString(),
  }, { onConflict: "contact_id,tag_id" })
}

/**
 * Notifica al CLOSER que tiene la cita agendada + super_admins (Marco/Adrián).
 * Two canales: in-app notifications + email.
 *
 * Detección del closer:
 *   1. scheduled_event.event_memberships[0].user_email → match con profiles.email
 *   2. Si no matchea (closer aún no está en el OS) → solo super_admins
 *   3. Si matchea un super_admin → no duplicar (ya viene en la lista de super_admins)
 */
async function notifyHost(
  admin: Admin,
  kind: "created" | "canceled" | "no_show",
  inv: { email: string; name: string; phone?: string | null },
  scheduledStart: string,
  eventName: string,
  hostUserEmails: string[] = [],  // emails de event_memberships del scheduled_event
) {
  // 1) Super_admins (Marco + Adrián siempre reciben - visibilidad operacional)
  const { data: superAdmins } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "super_admin")
    .eq("active", true)

  // 2) Closer asignado al meeting - match por email
  let assignedCloser: { id: string; email: string; full_name: string | null } | null = null
  if (hostUserEmails.length > 0) {
    const { data: matched } = await admin
      .from("profiles")
      .select("id, email, full_name, role")
      .in("email", hostUserEmails.map((e) => e.toLowerCase()))
      .in("role", ["closer", "setter", "marketing", "formador"])
      .eq("active", true)
      .maybeSingle()
    assignedCloser = matched ?? null
  }

  // Dedupar: si el closer asignado también es super_admin, no añadir 2 veces
  const hostsById = new Map<string, { id: string; email: string; full_name: string | null }>()
  for (const sa of superAdmins ?? []) {
    hostsById.set(sa.id, sa)
  }
  if (assignedCloser && !hostsById.has(assignedCloser.id)) {
    hostsById.set(assignedCloser.id, assignedCloser)
  }
  const hosts = Array.from(hostsById.values())

  if (hosts.length === 0) return

  const dt = new Date(scheduledStart).toLocaleString("es-ES", {
    weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Madrid",
  })
  const kindLabel = kind === "created" ? "Nueva reserva" : kind === "canceled" ? "Cancelación" : "No show"
  const titles: Record<typeof kind, string> = {
    created: `${kindLabel} - ${inv.name}`,
    canceled: `${kindLabel} - ${inv.name}`,
    no_show: `${kindLabel} - ${inv.name}`,
  }
  const bodies: Record<typeof kind, string> = {
    created: `${inv.name} (${inv.email}) reservó "${eventName}" para el ${dt}.`,
    canceled: `${inv.name} (${inv.email}) canceló la reserva del ${dt}. Movido a 'seguimiento'.`,
    no_show: `${inv.name} (${inv.email}) no se presentó a la cita del ${dt}. Movido a 'no_show'.`,
  }

  // 1) In-app notifications (insert una row por host), respetando lo que cada
  //    uno tenga activado en /perfil (grupo 'agenda').
  const hostIds = await filterByNotificationPref(admin, hosts.map((h) => h.id), `calendly_${kind}`)
  const rows = hostIds.map((user_id) => ({
    user_id,
    title: titles[kind],
    body: bodies[kind],
    type: `calendly_${kind}`,
    data: { url: "/calendario", invitee_email: inv.email, invitee_name: inv.name, scheduled_start: scheduledStart, event_name: eventName },
  }))
  if (rows.length) {
    await admin.from("notifications").insert(rows).then(() => null, (e) => console.error("[calendly/notif] in-app insert failed", e))
  }

  // 1b) Push a los mismos hosts (super_admins + closer asignado)
  await pushToUsers(admin, hostIds, {
    title: titles[kind],
    body: bodies[kind],
    data: { url: "/calendario", invitee_email: inv.email },
    tag: `calendly_${kind}`,
  })

  // 2) Email - solo para 'created' usamos el template existente notifyAdrianBooking;
  //    para canceled/no_show usamos el mismo template con etiqueta clara en el subject.
  try {
    await notifyAdrianBooking({
      fullName: inv.name,
      email: inv.email,
      phone: inv.phone ?? null,
      slotStartIso: scheduledStart,
      notes: kind === "created" ? `Reserva Calendly: ${eventName}` : kind === "canceled" ? `CANCELACIÓN ${eventName}` : `NO SHOW ${eventName}`,
    })
  } catch (e) {
    console.error("[calendly/notif] email failed", e)
  }
}

/**
 * Mueve la película del contacto en el pipeline + aplica tag visual + notif al host.
 *  - created: agenda → 'agendado' (guarda no-retroceso, nunca degrada alumno).
 *  - canceled: inmediato → 'seguimiento' + tag 'cancelado_llamada' (NO espera 7 días).
 *  - no_show: → 'no_show' (salvo alumno) + tag 'no_show'.
 */
async function moveContactForCalendly(
  admin: Admin,
  kind: "created" | "canceled" | "no_show",
  inv: { email?: string; name?: string; phone?: string | null },
  scheduledStart: string,
  eventName: string,
  hostUserEmails: string[] = [],
) {
  const email = inv.email?.toLowerCase().trim()
  if (!email) return

  const { data: existing } = await admin
    .from("contacts")
    .select("id, stage, pipeline_id")
    .ilike("email", email)
    .maybeSingle()

  let contactId: string | undefined = existing?.id

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
      // Decisión Marco 2026-06-20: leads que agendan DIRECTO en Calendly (sin pasar
      // por el funnel test-personalidad) van al pipeline GENERAL (agenda directa).
      // Match por slug, NO por is_default (no hay default sesgado).
      const { data: pipeline } = await admin
        .from("pipelines").select("id").eq("slug", "general").maybeSingle()
      const fullName = inv.name?.trim() || email
      const { data: created } = await admin.from("contacts").insert({
        full_name: fullName,
        email,
        phone: inv.phone ?? null,
        slug: slugify(fullName) + "_" + Math.random().toString(36).slice(2, 8),
        stage: "agendado",
        pipeline_id: pipeline?.id ?? null,
        origin: "calendly_direct",
        source: "calendly_direct",
      }).select("id").single()
      contactId = created?.id
      if (contactId) await logJourney(admin, contactId, "call_booked", "Agendó llamada (Calendly, sin test previo) → pipeline general")
    }
  } else if (kind === "canceled" && existing) {
    // Decisión Marco 2026-06-20: cancelación → seguimiento INMEDIATO (no 7 días).
    // El tag 'cancelado_llamada' (rojo) deja la huella visual en el CRM.
    if (existing.stage === "agendado") {
      await admin.from("contacts").update({ stage: "seguimiento", updated_at: new Date().toISOString() }).eq("id", existing.id)
    }
    await logJourney(admin, existing.id, "call_cancelled", "Canceló la llamada (Calendly)")
  } else if (kind === "no_show" && existing) {
    if (existing.stage !== "alumno") {
      await admin.from("contacts").update({ stage: "no_show", updated_at: new Date().toISOString() }).eq("id", existing.id)
    }
    await logJourney(admin, existing.id, "call_no_show", "No se presentó a la llamada (Calendly)")
  }

  // Aplicar tag visual + notif al host
  if (contactId) {
    const tagName = TAG_BY_KIND[kind]
    if (tagName) await applyTag(admin, contactId, tagName)
  }
  if (inv.email && inv.name) {
    await notifyHost(admin, kind, { email: inv.email, name: inv.name, phone: inv.phone ?? null }, scheduledStart, eventName, hostUserEmails)
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
    console.error("[calendly/webhook] No signing_key in BD - run /api/admin/calendly/setup first")
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
        event_memberships?: Array<{ user: string; user_email: string; user_name?: string }>
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

      const hostEmails = (scheduled.event_memberships ?? []).map((m) => m.user_email).filter(Boolean)
      await moveContactForCalendly(
        admin,
        event === "invitee.created" ? "created" : "canceled",
        { email: inv.email, name: inv.name, phone: inv.text_reminder_number ?? null },
        scheduled.start_time,
        scheduled.name,
        hostEmails,
      )
    } else if (event === "invitee_no_show.created") {
      // status update + read del scheduled_event guardado para tener start_time + name (no vienen completos en este payload)
      await admin.from("calendly_scheduled_events").update({
        status: "no_show",
        updated_at: new Date().toISOString(),
      }).eq("uri", scheduled.uri)

      const { data: savedEvent } = await admin
        .from("calendly_scheduled_events")
        .select("start_time, name")
        .eq("uri", scheduled.uri)
        .maybeSingle()

      const hostEmailsNs = (scheduled.event_memberships ?? []).map((m) => m.user_email).filter(Boolean)
      await moveContactForCalendly(
        admin,
        "no_show",
        { email: inv.email, name: inv.name },
        savedEvent?.start_time ?? scheduled.start_time ?? new Date().toISOString(),
        savedEvent?.name ?? scheduled.name ?? "(evento)",
        hostEmailsNs,
      )
    }

    return NextResponse.json({ ok: true, event, uri: scheduled.uri })
  } catch (e) {
    console.error("[calendly/webhook] processing failed", e)
    return NextResponse.json({ ok: true, error: (e as Error).message }, { status: 200 })
  }
}
