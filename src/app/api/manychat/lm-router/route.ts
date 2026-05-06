import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { signLmToken } from "@/lib/lead-magnets/jwt"
import { sendLeadMagnetCapi } from "@/lib/meta/lead-magnet-capi"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 10

/**
 * POST /api/manychat/lm-router
 *
 * Recibe llamadas del flow "Lead Magnet Router" en ManyChat (External Request).
 * Detecta keyword del comentario, busca lead_magnet activo, crea/actualiza el lead
 * en stage 'lead', genera JWT, registra delivery, dispara CAPI y devuelve el link
 * para que ManyChat lo envíe por DM.
 *
 * Auth: Bearer MANYCHAT_WEBHOOK_SECRET.
 *
 * Ver SOP marketing/06-lead-magnets para flow completo.
 */

const BodySchema = z.object({
  subscriber_id: z.union([z.string(), z.number()]).transform(String),
  ig_username: z.string().optional().nullable(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  comment_text: z.string().min(1),
  comment_id: z.union([z.string(), z.number()]).optional().nullable().transform((v) => (v == null ? null : String(v))),
  post_id: z.union([z.string(), z.number()]).optional().nullable().transform((v) => (v == null ? null : String(v))),
})

type LeadMagnetRow = {
  id: string
  slug: string
  name: string
  delivery_route: string | null
  manychat_keywords: string[]
}

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecoai.capitalhubapp.com"
}

function placeholderEmail(subscriberId: string): string {
  return `manychat-${subscriberId}@lead.capitalhubapp.local`
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const secret = process.env.MANYCHAT_WEBHOOK_SECRET
  if (!secret) {
    console.error("[lm-router] MANYCHAT_WEBHOOK_SECRET not set")
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 })
  }
  const auth = req.headers.get("authorization") ?? ""
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : auth
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // 2. Parse + validate body
  let body: z.infer<typeof BodySchema>
  try {
    const json = await req.json()
    body = BodySchema.parse(json)
  } catch (e) {
    return NextResponse.json(
      { error: "invalid_body", detail: e instanceof z.ZodError ? e.flatten() : String(e) },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const keyword = body.comment_text.trim().toLowerCase()

  // 3. Buscar lead_magnet activo cuyas keywords contengan la keyword del comentario
  // Las keywords en BD se guardan lowercase. Consulta usando operador @> con array.
  const { data: lms, error: lmsError } = await supabase
    .from("lead_magnets")
    .select("id, slug, name, delivery_route, manychat_keywords")
    .eq("active", true)
    .contains("manychat_keywords", [keyword])
    .limit(1)

  if (lmsError) {
    console.error("[lm-router] lead_magnets query failed:", lmsError)
    return NextResponse.json({ error: "db_query_failed", detail: lmsError.message }, { status: 500 })
  }

  const lm = (lms?.[0] ?? null) as LeadMagnetRow | null

  if (!lm) {
    // No match — no es un comentario de lead magnet (puede ser cualquier otro comentario)
    return NextResponse.json({ matched: false })
  }

  // 4. Upsert lead por manychat_subscriber_id (clave universal antes de tener email)
  // 4a. Buscar si ya existe
  const { data: existingLead } = await supabase
    .from("mifge_leads")
    .select("id, email, first_touch_lead_magnet_id")
    .eq("manychat_subscriber_id", body.subscriber_id)
    .limit(1)
    .maybeSingle()

  let leadId: string

  if (existingLead) {
    // Lead ya existe — solo actualizamos campos blandos. NO sobreescribimos first_touch_lead_magnet_id.
    leadId = existingLead.id
    const updates: Record<string, unknown> = {
      // Si ahora tenemos email real y antes era placeholder, actualizar
      ...(body.email && existingLead.email.endsWith("@lead.capitalhubapp.local") && { email: body.email.toLowerCase().trim() }),
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from("mifge_leads").update(updates).eq("id", leadId)
    }
  } else {
    // Insertar nuevo lead en stage 'lead'
    const fullName = [body.first_name, body.last_name].filter(Boolean).join(" ").trim() || body.ig_username || "Lead ManyChat"
    const email = body.email?.toLowerCase().trim() || placeholderEmail(body.subscriber_id)

    const { data: inserted, error: insertError } = await supabase
      .from("mifge_leads")
      .insert({
        email,
        full_name: fullName,
        phone: body.phone ?? "",
        pipeline_stage: "lead",
        lead_source: "manychat",
        manychat_subscriber_id: body.subscriber_id,
        first_touch_lead_magnet_id: lm.id,
        rgpd_accepted: false, // Se pedirá explícitamente en la página /lm si fuera necesario
        source: "manychat_lead_magnet",
      })
      .select("id")
      .single()

    if (insertError || !inserted) {
      console.error("[lm-router] mifge_leads insert failed:", insertError)
      return NextResponse.json(
        { error: "lead_insert_failed", detail: insertError?.message },
        { status: 500 }
      )
    }
    leadId = inserted.id
  }

  // 5. Insert lead_magnet_delivery con JWT firmado
  // Generamos el delivery_id primero para incluirlo en el JWT (idempotencia al marcar opened_at)
  const deliveryRowDraft = {
    lead_id: leadId,
    lead_magnet_id: lm.id,
    reel_post_id: body.post_id,
    reel_comment_id: body.comment_id,
    manychat_subscriber_id: body.subscriber_id,
    jwt_token: "PENDING", // se actualiza con el JWT real después
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from("lead_magnet_deliveries")
    .insert(deliveryRowDraft)
    .select("id")
    .single()

  if (deliveryError || !delivery) {
    console.error("[lm-router] delivery insert failed:", deliveryError)
    return NextResponse.json(
      { error: "delivery_insert_failed", detail: deliveryError?.message },
      { status: 500 }
    )
  }

  // Firmar JWT con el delivery_id real
  const token = await signLmToken({
    lid: leadId,
    lmid: lm.id,
    did: delivery.id,
  })

  // Update delivery con el JWT real
  await supabase
    .from("lead_magnet_deliveries")
    .update({ jwt_token: token })
    .eq("id", delivery.id)

  // 6. CAPI fire-and-forget (no bloqueamos la respuesta a ManyChat)
  sendLeadMagnetCapi({
    leadMagnetSlug: lm.slug,
    leadMagnetId: lm.id,
    leadId,
    email: body.email ?? undefined,
    igUsername: body.ig_username ?? undefined,
    manychatSubscriberId: body.subscriber_id,
    reelPostId: body.post_id ?? undefined,
    reelCommentId: body.comment_id ?? undefined,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
    userAgent: req.headers.get("user-agent"),
  }).catch((e) => console.error("[lm-router] CAPI fire failed:", e))

  // 7. Construir delivery_link y devolver
  const deliveryLink = `${getSiteUrl()}/lm/${lm.slug}?t=${token}`

  return NextResponse.json({
    matched: true,
    delivery_link: deliveryLink,
    lead_magnet_slug: lm.slug,
    lead_magnet_name: lm.name,
    lead_id: leadId,
  })
}
