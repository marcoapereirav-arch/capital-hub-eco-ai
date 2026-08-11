import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  verifyWebhookSignature,
  answersToObject,
  phoneFromInvitee,
  instagramFromInvitee,
  type CalendlyQuestionAnswer,
  type CalendlyTracking,
} from "@/lib/calendly"
import { resolveAutoStage } from "@/lib/pipeline/stage-guard"
import { notifyAdrianBooking, sendAgendaConfirmed } from "@/lib/email/senders"
import { pushToUsers, filterByNotificationPref } from "@/lib/notifications/notify-admins"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Receptor de Calendly.
 *
 * ============================================================================
 * EL FALLO QUE ESTE ARCHIVO EXISTE PARA NO REPETIR
 * ============================================================================
 * Del 2026-07-27 al 2026-08-07 no entro NI UNA reserva al OS, y nadie se entero.
 * En Calendly habia 14 reservas; en el OS, 5. Siete personas reales, con llamadas
 * ese mismo dia y el siguiente, no estaban en el CRM.
 *
 * La causa no fue que Calendly dejara de llamar: fue que este archivo le
 * CONTESTABA "todo bien" aunque no hubiera guardado nada.
 *
 *   - si el mensaje no traia `scheduled_event`  ->  return { ok: true }  con 200
 *   - el `catch` final                          ->  return { ...error }  con 200
 *
 * Calendly daba la entrega por buena, NO reintentaba, y la suscripcion seguia
 * marcada como sana. Un fallo mudo es peor que un fallo ruidoso: el ruidoso se
 * arregla el mismo dia.
 *
 * Las tres reglas de este archivo, y no se saltan:
 *
 *   1. TODO lo que entra queda registrado en `calendly_webhook_log` ANTES de
 *      procesarse, incluido lo que se rechaza por firma. Sin registro se
 *      investiga a ciegas, que es lo que paso.
 *   2. Si algo falla al guardar, se responde 500. Calendly reintenta durante 24
 *      horas y ademas salta un aviso al equipo. NUNCA se responde 200 sin haber
 *      guardado.
 *   3. Lo que legitimamente no nos interesa responde 200 con `ignored`. Esa
 *      distincion evita una tormenta de reintentos por algo que da igual.
 * ============================================================================
 */

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

type Admin = ReturnType<typeof getAdminClient>

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 50)
}

type Resultado = "processed" | "ignored" | "rejected" | "error"

/** Deja constancia de lo que entro. Nunca puede tumbar el procesado. */
async function registrar(
  admin: Admin,
  fila: {
    event?: string | null
    signature_ok: boolean
    outcome: Resultado
    reason?: string | null
    event_uri?: string | null
    invitee_email?: string | null
    raw?: unknown
  },
) {
  try {
    await admin.from("calendly_webhook_log").insert({
      event: fila.event ?? null,
      signature_ok: fila.signature_ok,
      outcome: fila.outcome,
      reason: fila.reason ?? null,
      event_uri: fila.event_uri ?? null,
      invitee_email: fila.invitee_email ?? null,
      raw: (fila.raw ?? null) as never,
    })
  } catch (e) {
    console.error("[calendly/webhook] no se pudo registrar la entrada", e)
  }
}

/**
 * Avisa al equipo de que una reserva no se pudo guardar.
 * Anti-ruido: como mucho un aviso por hora, aunque fallen varias seguidas.
 */
async function avisarDelFallo(admin: Admin, motivo: string, email?: string | null) {
  try {
    const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: previos } = await admin
      .from("calendly_webhook_log")
      .select("id")
      .eq("outcome", "error")
      .gte("created_at", haceUnaHora)
      .limit(2)
    // El que acabamos de escribir ya cuenta: si hay mas de uno, ya se aviso.
    if ((previos?.length ?? 0) > 1) return

    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "super_admin")
      .eq("active", true)
    const ids = (admins ?? []).map((a: { id: string }) => a.id)
    if (ids.length === 0) return

    const titulo = "Fallo al recibir una reserva de Calendly"
    const cuerpo = `No se pudo guardar la reserva${email ? ` de ${email}` : ""}. Calendly lo reintentará. Motivo: ${motivo}`

    await admin.from("notifications").insert(
      ids.map((user_id) => ({
        user_id,
        title: titulo,
        body: cuerpo,
        type: "calendly_error",
        data: { url: "/calendario" },
      })),
    )
    await pushToUsers(admin, ids, { title: titulo, body: cuerpo, data: { url: "/calendario" }, tag: "calendly_error" })
  } catch (e) {
    console.error("[calendly/webhook] no se pudo avisar del fallo", e)
  }
}

const TAG_BY_KIND: Record<string, string> = {
  created: "agendado_calendly",
  canceled: "cancelado_llamada",
  no_show: "no_show",
}

async function applyTag(admin: Admin, contactId: string, tagName: string) {
  const { data: tag } = await admin.from("tags").select("id").eq("name", tagName).maybeSingle()
  if (!tag?.id) return
  await admin
    .from("contact_tags")
    .upsert(
      { contact_id: contactId, tag_id: tag.id, assigned_at: new Date().toISOString() },
      { onConflict: "contact_id,tag_id" },
    )
}

async function logJourney(admin: Admin, contactId: string, type: string, title: string, data: Record<string, unknown>) {
  await admin.from("contact_journey_events").insert({ contact_id: contactId, type, title, data })
}

/**
 * Notifica al closer con la cita y a los super_admins.
 * Envuelto en try/catch por quien llama: un aviso que falla no puede hacer que
 * Calendly reintente una reserva que YA se guardo bien.
 */
async function notifyHost(
  admin: Admin,
  kind: "created" | "canceled" | "no_show",
  inv: { email: string; name: string; phone?: string | null },
  scheduledStart: string,
  eventName: string,
  hostUserEmails: string[] = [],
) {
  const { data: superAdmins } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "super_admin")
    .eq("active", true)

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

  const hostsById = new Map<string, { id: string; email: string; full_name: string | null }>()
  for (const sa of superAdmins ?? []) hostsById.set(sa.id, sa)
  if (assignedCloser && !hostsById.has(assignedCloser.id)) hostsById.set(assignedCloser.id, assignedCloser)
  const hosts = Array.from(hostsById.values())
  if (hosts.length === 0) return

  /* La hora que se enseña es la hora REAL del negocio, no la de la cuenta de
     Calendly: la de Adrian esta en Asia/Dubai. REGLA #23 del protocolo. */
  const dt = new Date(scheduledStart).toLocaleString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  })
  const kindLabel = kind === "created" ? "Nueva reserva" : kind === "canceled" ? "Cancelación" : "No show"
  const titulo = `${kindLabel} - ${inv.name}`
  const cuerpos: Record<typeof kind, string> = {
    created: `${inv.name} (${inv.email}) reservó "${eventName}" para el ${dt}.`,
    canceled: `${inv.name} (${inv.email}) canceló la reserva del ${dt}. Movido a 'seguimiento'.`,
    no_show: `${inv.name} (${inv.email}) no se presentó a la cita del ${dt}. Movido a 'no_show'.`,
  }

  const hostIds = await filterByNotificationPref(admin, hosts.map((h) => h.id), `calendly_${kind}`)
  if (hostIds.length) {
    await admin
      .from("notifications")
      .insert(
        hostIds.map((user_id) => ({
          user_id,
          title: titulo,
          body: cuerpos[kind],
          type: `calendly_${kind}`,
          data: {
            url: "/calendario",
            invitee_email: inv.email,
            invitee_name: inv.name,
            scheduled_start: scheduledStart,
            event_name: eventName,
          },
        })),
      )
      .then(() => null, (e) => console.error("[calendly/notif] in-app insert failed", e))
  }

  await pushToUsers(admin, hostIds, {
    title: titulo,
    body: cuerpos[kind],
    data: { url: "/calendario", invitee_email: inv.email },
    tag: `calendly_${kind}`,
  })

  await notifyAdrianBooking({
    fullName: inv.name,
    email: inv.email,
    phone: inv.phone ?? null,
    slotStartIso: scheduledStart,
    notes:
      kind === "created"
        ? `Reserva Calendly: ${eventName}`
        : kind === "canceled"
          ? `CANCELACIÓN ${eventName}`
          : `NO SHOW ${eventName}`,
  })
}

/**
 * Mueve al contacto en el pipeline.
 * SOLO la agenda de VENTA toca el CRM: en la cuenta hay tambien la de arranque
 * de clientes y una personal de Adrian, y mezclarlas ensucia cualquier numero.
 *
 * Lanza si algo esencial falla, para que quien llama responda 500.
 */
async function moverContacto(
  admin: Admin,
  kind: "created" | "canceled" | "no_show",
  inv: { email?: string | null; name?: string | null; phone: string | null; instagram: string | null },
  scheduledStart: string,
  esAgendaDeVenta: boolean,
  eventUri: string,
): Promise<string | null> {
  const email = inv.email?.toLowerCase().trim()
  if (!email || !esAgendaDeVenta) return null

  const { data: existing, error: errLeer } = await admin
    .from("contacts")
    .select("id, stage, phone, instagram_username")
    .ilike("email", email)
    .maybeSingle()
  if (errLeer) throw new Error(`no se pudo leer el contacto: ${errLeer.message}`)

  if (kind === "created") {
    if (existing) {
      const nextStage = resolveAutoStage(existing.stage, "agendado")
      const patch: Record<string, unknown> = {
        stage: nextStage,
        last_call_at: scheduledStart,
        updated_at: new Date().toISOString(),
      }
      // Nunca pisar lo que ya hay: solo se rellena lo que esta vacio.
      if (!existing.phone && inv.phone) patch.phone = inv.phone
      if (!existing.instagram_username && inv.instagram) patch.instagram_username = inv.instagram

      const { error } = await admin.from("contacts").update(patch).eq("id", existing.id)
      if (error) throw new Error(`no se pudo actualizar el contacto: ${error.message}`)
      await logJourney(admin, existing.id, "call_booked", "Agendó llamada (Calendly)", {
        source: "calendly",
        calendly_uri: eventUri,
        start_time: scheduledStart,
      })
      return existing.id
    }

    /* Quien agenda sin venir de ningun funnel cae en el embudo General: para eso
       esta (decision de Marco, confirmada el 2026-08-07). */
    const { data: pipeline } = await admin.from("pipelines").select("id").eq("slug", "general").maybeSingle()
    const fullName = inv.name?.trim() || email
    const { data: created, error } = await admin
      .from("contacts")
      .insert({
        full_name: fullName,
        email,
        phone: inv.phone,
        instagram_username: inv.instagram,
        slug: `${slugify(fullName)}_${Math.random().toString(36).slice(2, 8)}`,
        stage: "agendado",
        pipeline_id: pipeline?.id ?? null,
        origin: "calendly_direct",
        source: "calendly_direct",
        last_call_at: scheduledStart,
      })
      .select("id")
      .single()
    if (error) throw new Error(`no se pudo crear el contacto: ${error.message}`)
    await logJourney(admin, created.id, "call_booked", "Agendó llamada (Calendly, sin funnel previo)", {
      source: "calendly",
      calendly_uri: eventUri,
      start_time: scheduledStart,
    })
    return created.id
  }

  if (!existing) return null

  if (kind === "canceled") {
    if (existing.stage === "agendado") {
      const { error } = await admin
        .from("contacts")
        .update({ stage: "seguimiento", updated_at: new Date().toISOString() })
        .eq("id", existing.id)
      if (error) throw new Error(`no se pudo mover a seguimiento: ${error.message}`)
    }
    await logJourney(admin, existing.id, "call_cancelled", "Canceló la llamada (Calendly)", {
      source: "calendly",
      calendly_uri: eventUri,
    })
    return existing.id
  }

  // no_show
  if (existing.stage !== "alumno") {
    const { error } = await admin
      .from("contacts")
      .update({ stage: "no_show", updated_at: new Date().toISOString() })
      .eq("id", existing.id)
    if (error) throw new Error(`no se pudo marcar el no show: ${error.message}`)
  }
  await logJourney(admin, existing.id, "call_no_show", "No se presentó a la llamada (Calendly)", {
    source: "calendly",
    calendly_uri: eventUri,
  })
  return existing.id
}

/** Confirmacion de agenda con NUESTRA marca, una sola vez. */
async function confirmarAlLeadUnaVez(
  admin: Admin,
  ev: { uri: string; email: string; name: string; startIso: string; endIso: string; meetingUrl: string | null },
) {
  try {
    const { data: prev } = await admin
      .from("email_logs")
      .select("id")
      .eq("call_id", ev.uri)
      .eq("template", "agenda_confirmed")
      .eq("status", "sent")
      .limit(1)
      .maybeSingle()
    if (prev) return
    await sendAgendaConfirmed({
      fullName: ev.name,
      email: ev.email,
      slotStartIso: ev.startIso,
      slotEndIso: ev.endIso,
      meetingUrl: ev.meetingUrl,
      callId: ev.uri,
    })
  } catch (e) {
    console.error("[calendly/webhook] confirmación al lead falló (no bloquea)", e)
  }
}

const EVENTOS_QUE_NOS_INTERESAN = new Set(["invitee.created", "invitee.canceled", "invitee_no_show.created"])

type Payload = {
  event?: string
  payload?: {
    uri?: string
    name?: string
    email?: string
    status?: string
    text_reminder_number?: string | null
    questions_and_answers?: CalendlyQuestionAnswer[]
    tracking?: CalendlyTracking | null
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

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signatureHeader = req.headers.get("Calendly-Webhook-Signature")
  const admin = getAdminClient()

  // ---- Firma ----
  const { data: cfg } = await admin
    .from("calendly_config")
    .select("webhook_signing_key")
    .eq("id", 1)
    .maybeSingle()

  if (!cfg?.webhook_signing_key) {
    await registrar(admin, { signature_ok: false, outcome: "error", reason: "sin signing key en BD", raw: rawBody })
    await avisarDelFallo(admin, "falta la llave de firma de Calendly en la base")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 })
  }

  const verify = verifyWebhookSignature(rawBody, signatureHeader, cfg.webhook_signing_key)
  if (!verify.valid) {
    await registrar(admin, { signature_ok: false, outcome: "rejected", reason: verify.reason, raw: rawBody })
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  // ---- Cuerpo ----
  let payload: Payload
  try {
    payload = JSON.parse(rawBody) as Payload
  } catch {
    await registrar(admin, { signature_ok: true, outcome: "error", reason: "el cuerpo no es JSON", raw: rawBody })
    await avisarDelFallo(admin, "Calendly mandó algo que no es JSON")
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const event = payload.event ?? null
  const inv = payload.payload ?? {}
  const scheduled = inv.scheduled_event
  const base = { event, signature_ok: true, invitee_email: inv.email ?? null, event_uri: scheduled?.uri ?? null }

  // Un evento que no nos interesa SI responde 200: no queremos reintentos por algo que da igual.
  if (!event || !EVENTOS_QUE_NOS_INTERESAN.has(event)) {
    await registrar(admin, { ...base, outcome: "ignored", reason: `evento no suscrito: ${event}`, raw: payload })
    return NextResponse.json({ ok: true, ignored: true })
  }

  /* AQUI ESTABA EL AGUJERO: sin `scheduled_event` se devolvia 200 y se tiraba el
     mensaje. Ahora es un ERROR: es un evento que SI nos interesa y no se pudo
     guardar, asi que Calendly tiene que reintentarlo. */
  if (!scheduled?.uri) {
    await registrar(admin, { ...base, outcome: "error", reason: "el evento no trae scheduled_event", raw: payload })
    await avisarDelFallo(admin, "llegó una reserva sin los datos de la cita", inv.email)
    return NextResponse.json({ error: "Missing scheduled_event" }, { status: 500 })
  }

  const kind: "created" | "canceled" | "no_show" =
    event === "invitee.created" ? "created" : event === "invitee.canceled" ? "canceled" : "no_show"

  try {
    /* Lo que Calendly manda y ANTES se tiraba a la basura: las 9 respuestas del
       formulario. El telefono NO viene en `text_reminder_number` (llega null):
       viene dentro de las respuestas. Verificado el 2026-08-07. */
    const answers = answersToObject(inv.questions_and_answers)
    const phone = phoneFromInvitee(answers, inv.text_reminder_number)
    const instagram = instagramFromInvitee(answers)
    const hostEmails = (scheduled.event_memberships ?? []).map((m) => m.user_email).filter(Boolean)

    // Que agenda es. Solo la de venta toca el CRM.
    const { data: tipo } = await admin
      .from("calendly_event_types")
      .select("purpose")
      .eq("uri", scheduled.event_type)
      .maybeSingle()
    const esAgendaDeVenta = tipo?.purpose === "venta"

    // El estado real lo manda el invitado: si el cancelo, la reserva esta cancelada.
    let status = scheduled.status
    if (kind === "canceled" || inv.status === "canceled") status = "canceled"
    if (kind === "no_show") status = "no_show"

    // 1) El contacto. Si esto falla, se responde 500 y Calendly reintenta.
    const contactId = await moverContacto(
      admin,
      kind,
      { email: inv.email, name: inv.name, phone, instagram },
      scheduled.start_time,
      esAgendaDeVenta,
      scheduled.uri,
    )

    // 2) La reserva. Idem.
    const { error: errGuardar } = await admin.from("calendly_scheduled_events").upsert(
      {
        uri: scheduled.uri,
        name: scheduled.name,
        start_time: scheduled.start_time,
        end_time: scheduled.end_time,
        status,
        location_kind: scheduled.location?.type ?? null,
        location_uri: scheduled.location?.location ?? null,
        meeting_url: scheduled.location?.join_url ?? null,
        event_type_uri: scheduled.event_type,
        invitee_uri: inv.uri ?? null,
        invitee_email: inv.email ?? null,
        invitee_name: inv.name ?? null,
        invitee_phone: phone,
        invitee_cancellation_reason: inv.cancellation?.reason ?? null,
        host_email: hostEmails[0] ?? null,
        answers,
        utm_source: inv.tracking?.utm_source ?? null,
        utm_medium: inv.tracking?.utm_medium ?? null,
        utm_campaign: inv.tracking?.utm_campaign ?? null,
        utm_content: inv.tracking?.utm_content ?? null,
        contact_id: contactId,
        synced_from: "webhook",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "uri" },
    )
    if (errGuardar) throw new Error(`no se pudo guardar la reserva: ${errGuardar.message}`)

    /* 3) Los avisos y el correo. Van DESPUES de guardar y en su propio try:
       si falla un correo, la reserva YA esta guardada y no queremos que
       Calendly la reintente ni que el fallo tape el trabajo bien hecho. */
    try {
      if (contactId) {
        const tagName = TAG_BY_KIND[kind]
        if (tagName) await applyTag(admin, contactId, tagName)
      }
      if (esAgendaDeVenta && inv.email && inv.name) {
        await notifyHost(admin, kind, { email: inv.email, name: inv.name, phone }, scheduled.start_time, scheduled.name, hostEmails)
      }
      if (kind === "created" && esAgendaDeVenta && inv.email) {
        await confirmarAlLeadUnaVez(admin, {
          uri: scheduled.uri,
          email: inv.email,
          name: inv.name || inv.email,
          startIso: scheduled.start_time,
          endIso: scheduled.end_time,
          meetingUrl: scheduled.location?.join_url ?? scheduled.location?.location ?? null,
        })
      }
    } catch (e) {
      console.error("[calendly/webhook] avisos fallaron, la reserva SI se guardó", e)
    }

    await registrar(admin, {
      ...base,
      outcome: "processed",
      reason: esAgendaDeVenta ? `${kind} · agenda de venta` : `${kind} · agenda que no cuenta (${tipo?.purpose ?? "sin clasificar"})`,
      raw: payload,
    })
    return NextResponse.json({ ok: true, event, uri: scheduled.uri })
  } catch (e) {
    const motivo = e instanceof Error ? e.message : String(e)
    console.error("[calendly/webhook] procesado fallido:", motivo)
    await registrar(admin, { ...base, outcome: "error", reason: motivo, raw: payload })
    await avisarDelFallo(admin, motivo, inv.email)
    /* 500 A PROPOSITO: es lo que hace que Calendly reintente durante 24 horas.
       Devolver 200 aqui es exactamente lo que nos costo diez dias de llamadas. */
    return NextResponse.json({ error: motivo }, { status: 500 })
  }
}
