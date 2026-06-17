import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Resend usa svix para firmar webhooks. Verifica con HMAC-SHA256.
 * Headers: svix-id, svix-timestamp, svix-signature
 * Formato firma: "v1,base64(hmac_sha256(secret, id.timestamp.body))"
 *
 * Ref: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
 */
function verifyResendSignature(
  body: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null,
  secret: string
): boolean {
  if (!svixId || !svixTimestamp || !svixSignature) return false
  // El secret de Resend viene como "whsec_..." pero el contenido tras "whsec_" es base64
  const secretPayload = secret.startsWith("whsec_") ? secret.slice(6) : secret
  let secretBytes: Buffer
  try {
    secretBytes = Buffer.from(secretPayload, "base64")
  } catch {
    return false
  }
  const signedPayload = `${svixId}.${svixTimestamp}.${body}`
  const expected = "v1," + crypto.createHmac("sha256", secretBytes).update(signedPayload).digest("base64")
  // Resend puede mandar varias firmas (v1,..v1,..). Cualquiera válida sirve.
  const signatures = svixSignature.split(" ")
  return signatures.some((s) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))
    } catch {
      return false
    }
  })
}

/**
 * POST /api/email/webhooks/resend
 * Recibe eventos: email.sent, delivered, opened, clicked, bounced, complained, delivery_delayed.
 * Actualiza email_logs con timestamps + status según corresponda.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const svixId = req.headers.get("svix-id")
  const svixTimestamp = req.headers.get("svix-timestamp")
  const svixSignature = req.headers.get("svix-signature")

  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET no configurado")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  if (!verifyResendSignature(rawBody, svixId, svixTimestamp, svixSignature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { type?: string; data?: { email_id?: string; created_at?: string; to?: string[]; subject?: string; click?: { link?: string }; bounce?: { reason?: string } } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const type = event.type ?? "unknown"
  const resendId = event.data?.email_id
  const occurredAt = event.data?.created_at ?? new Date().toISOString()

  if (!resendId) {
    // Sin resend_id no podemos linkar al log; aceptamos pero no procesamos
    return NextResponse.json({ ok: true, warn: "no_email_id" })
  }

  const supabase = getAdminClient()

  // Buscamos el log por resend_id (lo guardamos al enviar)
  const { data: existing } = await supabase
    .from("email_logs")
    .select("id, opened_at, clicked_at")
    .eq("resend_id", resendId)
    .maybeSingle()

  const update: Record<string, unknown> = {}
  switch (type) {
    case "email.delivered":
      update.delivered_at = occurredAt
      break
    case "email.opened":
      // Solo actualizar si NO había timestamp previo (track la primera apertura)
      if (!existing?.opened_at) update.opened_at = occurredAt
      break
    case "email.clicked":
      if (!existing?.clicked_at) update.clicked_at = occurredAt
      break
    case "email.bounced":
      update.status = "failed"
      update.error = event.data?.bounce?.reason ?? "bounced"
      break
    case "email.complained":
      update.status = "failed"
      update.error = "marked as spam"
      break
    case "email.delivery_delayed":
      // No requiere acción inmediata pero queda log
      update.status = "sent"
      update.error = "delivery_delayed"
      break
    case "email.sent":
      // ya está guardado al enviar; no hace falta tocar
      break
    default:
      console.warn(`[resend-webhook] tipo desconocido: ${type}`)
  }

  if (Object.keys(update).length > 0 && existing?.id) {
    await supabase.from("email_logs").update(update).eq("id", existing.id)
  }

  // === SISTEMA TOKEN-BASED (email_messages + email_events + email_suppressions) ===
  // Persistir el evento crudo
  await supabase
    .from("email_events")
    .insert({ resend_id: resendId, type, payload: event })
    .then(() => null, () => null)

  // Actualizar status de email_messages cuando aplique
  const statusMap: Record<string, string> = {
    "email.delivered": "delivered",
    "email.bounced": "bounced",
    "email.complained": "complained",
  }
  const newStatus = statusMap[type]
  if (newStatus) {
    await supabase
      .from("email_messages")
      .update({ status: newStatus })
      .eq("resend_id", resendId)
      .then(() => null, () => null)
  }

  // Auto-suppression en bounce / complaint
  if (type === "email.bounced" || type === "email.complained") {
    const tos = Array.isArray(event.data?.to) ? event.data!.to! : []
    for (const addr of tos) {
      await supabase
        .from("email_suppressions")
        .upsert({ email: addr.toLowerCase(), reason: type }, { onConflict: "email" })
        .then(() => null, () => null)
    }
  }

  return NextResponse.json({ ok: true, type, resend_id: resendId })
}
