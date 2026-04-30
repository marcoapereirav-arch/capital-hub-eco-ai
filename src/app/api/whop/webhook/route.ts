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
 * Whop firma cada webhook con HMAC-SHA256 usando WHOP_WEBHOOK_SECRET.
 * Validamos la firma comparando el header `whop-signature` con el HMAC del body crudo.
 */
function verifyWhopSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.WHOP_WEBHOOK_SECRET
  if (!secret) {
    console.error("[whop/webhook] WHOP_WEBHOOK_SECRET no configurado en .env")
    return false
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  // timing-safe compare
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

type WhopWebhookEvent = {
  action: string // ej "membership.went_valid", "membership.cancel_at_period_end", "payment.succeeded"
  data: {
    id?: string
    membership_id?: string
    user_id?: string
    user?: { email?: string; phone?: string; name?: string }
    product_id?: string
    plan_id?: string
    final_amount?: number
    currency?: string
    metadata?: Record<string, unknown>
    [k: string]: unknown
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("whop-signature")

  if (!verifyWhopSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: WhopWebhookEvent
  try {
    event = JSON.parse(rawBody) as WhopWebhookEvent
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const supabase = getAdminClient()
  const action = event.action
  const data = event.data
  const email = data.user?.email?.toLowerCase().trim()
  const productId = data.product_id

  // IDs de productos Whop (configurados tras MIFGE 03)
  const PRODUCT_MES = process.env.WHOP_PRODUCT_ID_MES
  const PRODUCT_ANO = process.env.WHOP_PRODUCT_ID_ANO
  const PRODUCT_BUMP = process.env.WHOP_PRODUCT_ID_BONUS

  // Persistir el evento crudo para auditoría
  await supabase.from("whop_webhook_events").insert({
    action,
    membership_id: data.membership_id ?? data.id ?? null,
    whop_user_id: data.user_id ?? null,
    email: email ?? null,
    product_id: productId ?? null,
    raw_payload: event,
  })

  // Routing por action → actualizar pipeline_stage del lead
  try {
    switch (action) {
      case "membership.went_valid": {
        // Membresía activada: trial empieza (MES) o anual comprado (AÑO)
        if (!email) break
        const newStage =
          productId === PRODUCT_ANO ? "won_ano" :
          productId === PRODUCT_MES ? "free_trial" :
          null

        if (newStage) {
          await upsertLeadStage(supabase, email, newStage, {
            full_name: data.user?.name,
            phone: data.user?.phone,
            whop_membership_id: data.membership_id ?? data.id ?? null,
            whop_user_id: data.user_id ?? null,
          })
        }
        // TODO MIFGE 10: enviar email bienvenida #1 (trial) o #3 (anual)
        // TODO MIFGE 11: disparar evento Meta CAPI mifge_free_trial_started o mifge_anual_purchased
        // TODO provisión App Capital Hub: HTTP call con magic link
        break
      }

      case "payment.succeeded": {
        // Cobro recurrente exitoso (MES post-trial = WON Mes) o bump (badge)
        if (!email) break
        if (productId === PRODUCT_BUMP) {
          await markBumpPurchased(supabase, email)
          // TODO MIFGE 10: email #2 confirmación bump
          // TODO MIFGE 11: evento mifge_order_bump
        } else if (productId === PRODUCT_MES) {
          // Si era free_trial, día 15 cobrado → WON Mes
          await transitionToWonMesIfTrial(supabase, email)
          // TODO MIFGE 10: email #9
          // TODO MIFGE 11: evento mifge_monthly_purchased
        }
        break
      }

      case "payment.failed":
      case "membership.experience_changed": {
        // Cobro fallido → Pago Fallido
        if (!email) break
        await upsertLeadStage(supabase, email, "pago_fallido")
        // TODO MIFGE 10: email #11
        break
      }

      case "membership.cancel_at_period_end":
      case "membership.went_invalid":
      case "membership.expired": {
        // Cancelación → Beta
        if (!email) break
        await upsertLeadStage(supabase, email, "beta")
        // TODO MIFGE 10: email #10 (puerta abierta)
        break
      }

      default:
        // Ignorado pero registrado en whop_webhook_events para auditoría
        break
    }
  } catch (e) {
    console.error("[whop/webhook] handler error", e)
    return NextResponse.json({ error: "Handler error", action }, { status: 500 })
  }

  return NextResponse.json({ ok: true, action })
}

async function upsertLeadStage(
  supabase: ReturnType<typeof getAdminClient>,
  email: string,
  pipelineStage: string,
  extra?: { full_name?: string; phone?: string; whop_membership_id?: string | null; whop_user_id?: string | null }
) {
  const { data: existing } = await supabase
    .from("mifge_leads")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("mifge_leads")
      .update({
        pipeline_stage: pipelineStage,
        ...(extra?.whop_membership_id && { whop_membership_id: extra.whop_membership_id }),
        ...(extra?.whop_user_id && { whop_user_id: extra.whop_user_id }),
      })
      .eq("id", existing.id)
  } else {
    // Lead que llegó via Whop sin pasar por nuestro form (ej: link directo desde anuncio)
    await supabase.from("mifge_leads").insert({
      email,
      full_name: extra?.full_name ?? "",
      phone: extra?.phone ?? "",
      pipeline_stage: pipelineStage,
      rgpd_accepted: true, // Whop ya lo recoge en su checkout
      source: "whop_webhook",
      whop_membership_id: extra?.whop_membership_id,
      whop_user_id: extra?.whop_user_id,
    })
  }
}

async function markBumpPurchased(
  supabase: ReturnType<typeof getAdminClient>,
  email: string
) {
  await supabase
    .from("mifge_leads")
    .update({ bump_purchased: true })
    .eq("email", email)
}

async function transitionToWonMesIfTrial(
  supabase: ReturnType<typeof getAdminClient>,
  email: string
) {
  const { data } = await supabase
    .from("mifge_leads")
    .select("id, pipeline_stage")
    .eq("email", email)
    .maybeSingle()
  if (!data) return
  // Solo movemos a won_mes si estaba en stages previos a la conversión
  if (["free_trial", "agendados", "no_show", "no_agendados", "pago_fallido"].includes(data.pipeline_stage)) {
    await supabase.from("mifge_leads").update({ pipeline_stage: "won_mes" }).eq("id", data.id)
  }
}
