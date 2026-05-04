import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"
import { sendWelcomeTrial, sendWelcomeAnual, sendBumpConfirmed, sendPaymentFailed, sendBetaRetargeting, notifyMarcoPurchase } from "@/lib/email/senders"
import { sendCapiEvent } from "@/lib/meta/capi-client"

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
          const lead = await upsertLeadStage(supabase, email, newStage, {
            full_name: data.user?.name,
            phone: data.user?.phone,
            whop_membership_id: data.membership_id ?? data.id ?? null,
            whop_user_id: data.user_id ?? null,
          })
          // Email bienvenida — template dedicado según plan
          if (newStage === "free_trial") {
            await sendWelcomeTrial({ fullName: data.user?.name ?? "", email, leadId: lead?.id })
          } else if (newStage === "won_ano") {
            await sendWelcomeAnual({ fullName: data.user?.name ?? "", email, leadId: lead?.id })
          }
          // Meta CAPI: free trial activado (MES) o anual comprado (AÑO)
          if (newStage === "free_trial") {
            sendCapiEvent({
              eventName: "mifge_free_trial_started",
              userData: { email, phone: data.user?.phone },
              customData: { value: 0, currency: "EUR", contentName: "CAPITAL HUB MES — Free Trial 14d" },
              leadId: lead?.id,
              triggeredBy: "webhook_whop_membership_activated_mes",
            }).catch((e) => console.error("[whop/webhook] CAPI free_trial_started", e))
            // Estándar Meta StartTrial paralelo (mejora optimización campañas)
            sendCapiEvent({
              eventName: "StartTrial",
              userData: { email, phone: data.user?.phone },
              customData: { value: 0, currency: "EUR", contentName: "CAPITAL HUB MES" },
              leadId: lead?.id,
              triggeredBy: "webhook_whop_membership_activated_mes_standard",
            }).catch(() => {})
            notifyMarcoPurchase({
              eventLabel: "Free Trial activado",
              fullName: data.user?.name ?? email,
              email,
              productName: "CAPITAL HUB MES (14d gratis)",
              leadId: lead?.id,
            }).catch((e) => console.error("[whop/webhook] notif Marco trial", e))
          } else if (newStage === "won_ano") {
            sendCapiEvent({
              eventName: "mifge_anual_purchased",
              userData: { email, phone: data.user?.phone },
              customData: { value: 970, currency: "EUR", contentName: "CAPITAL HUB AÑO" },
              leadId: lead?.id,
              triggeredBy: "webhook_whop_membership_activated_ano",
            }).catch((e) => console.error("[whop/webhook] CAPI anual_purchased", e))
            // Estándar Meta Purchase paralelo
            sendCapiEvent({
              eventName: "Purchase",
              userData: { email, phone: data.user?.phone },
              customData: { value: 970, currency: "EUR", contentName: "CAPITAL HUB AÑO" },
              leadId: lead?.id,
              triggeredBy: "webhook_whop_membership_activated_ano_standard",
            }).catch(() => {})
            notifyMarcoPurchase({
              eventLabel: "Compra Plan Anual",
              fullName: data.user?.name ?? email,
              email,
              amount: 970,
              currency: "EUR",
              productName: "CAPITAL HUB AÑO",
              leadId: lead?.id,
            }).catch((e) => console.error("[whop/webhook] notif Marco anual", e))
          }
        }
        // TODO provisión App Capital Hub: HTTP call con magic link
        break
      }

      case "payment.succeeded": {
        // Cobro recurrente exitoso (MES post-trial = WON Mes) o bump (badge)
        if (!email) break
        if (productId === PRODUCT_BUMP) {
          await markBumpPurchased(supabase, email)
          sendBumpConfirmed({
            fullName: data.user?.name ?? "",
            email,
          }).catch((e) => console.error("[whop/webhook] email bump", e))
          sendCapiEvent({
            eventName: "mifge_order_bump",
            userData: { email, phone: data.user?.phone },
            customData: { value: 19, currency: "EUR", contentName: "CAPITAL HUB BONUS" },
            triggeredBy: "webhook_whop_payment_bonus",
          }).catch((e) => console.error("[whop/webhook] CAPI order_bump", e))
          notifyMarcoPurchase({
            eventLabel: "Order Bump comprado",
            fullName: data.user?.name ?? email,
            email,
            amount: 19,
            currency: "EUR",
            productName: "CAPITAL HUB BONUS",
          }).catch((e) => console.error("[whop/webhook] notif Marco bump", e))
        } else if (productId === PRODUCT_MES) {
          // Si era free_trial, día 15 cobrado → WON Mes
          await transitionToWonMesIfTrial(supabase, email)
          sendCapiEvent({
            eventName: "mifge_monthly_purchased",
            userData: { email, phone: data.user?.phone },
            customData: { value: 97, currency: "EUR", contentName: "CAPITAL HUB MES recurrente" },
            triggeredBy: "webhook_whop_payment_mes_recurrente",
          }).catch((e) => console.error("[whop/webhook] CAPI monthly_purchased", e))
          // Estándar Meta Subscribe paralelo
          sendCapiEvent({
            eventName: "Subscribe",
            userData: { email, phone: data.user?.phone },
            customData: { value: 97, currency: "EUR", contentName: "CAPITAL HUB MES" },
            triggeredBy: "webhook_whop_payment_mes_recurrente_standard",
          }).catch(() => {})
          notifyMarcoPurchase({
            eventLabel: "Cobro mensual recurrente",
            fullName: data.user?.name ?? email,
            email,
            amount: 97,
            currency: "EUR",
            productName: "CAPITAL HUB MES",
          }).catch((e) => console.error("[whop/webhook] notif Marco mes", e))
        }
        break
      }

      case "payment.failed":
      case "membership.experience_changed": {
        // Cobro fallido → Pago Fallido
        if (!email) break
        const lead = await upsertLeadStage(supabase, email, "pago_fallido")
        await sendPaymentFailed({
          fullName: data.user?.name ?? "",
          email,
          leadId: lead?.id,
        })
        notifyMarcoPurchase({
          eventLabel: "⚠️ Pago Fallido",
          fullName: data.user?.name ?? email,
          email,
          leadId: lead?.id,
        }).catch((e) => console.error("[whop/webhook] notif Marco fail", e))
        break
      }

      case "membership.cancel_at_period_end":
      case "membership.went_invalid":
      case "membership.expired": {
        // Cancelación → Beta + email retargeting según origen
        if (!email) break
        const lead = await upsertLeadStage(supabase, email, "beta")
        // Determinar de qué cancela (si conocemos el producto)
        const cancelOrigin: "trial" | "monthly" | "annual" =
          productId === PRODUCT_ANO ? "annual" :
          productId === PRODUCT_MES ? "monthly" :
          "trial"
        sendBetaRetargeting({
          fullName: data.user?.name ?? "",
          email,
          cancelOrigin,
          leadId: lead?.id,
        }).catch((e) => console.error("[whop/webhook] beta retargeting", e))
        notifyMarcoPurchase({
          eventLabel: `Cancelación (${cancelOrigin})`,
          fullName: data.user?.name ?? email,
          email,
          leadId: lead?.id,
        }).catch(() => {})
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
): Promise<{ id: string } | null> {
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
    return { id: existing.id }
  }

  // Lead que llegó via Whop sin pasar por nuestro form (ej: link directo desde anuncio)
  const { data: inserted } = await supabase.from("mifge_leads").insert({
    email,
    full_name: extra?.full_name ?? "",
    phone: extra?.phone ?? "",
    pipeline_stage: pipelineStage,
    rgpd_accepted: true,
    source: "whop_webhook",
    whop_membership_id: extra?.whop_membership_id,
    whop_user_id: extra?.whop_user_id,
  }).select("id").single()

  return inserted ?? null
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
