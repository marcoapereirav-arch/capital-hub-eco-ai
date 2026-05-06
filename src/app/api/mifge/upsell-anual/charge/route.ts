import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"
import { getReceipt, listMemberPaymentMethods, chargeUser } from "@/lib/whop/whop-api-client"
import { rateLimit, getClientIp } from "@/lib/rate-limit/supabase-rate-limit"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const Schema = z.object({
  receipt_id: z.string().min(8),
  email: z.string().email().optional(),
})

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/mifge/upsell-anual/charge
 *
 * One-click upsell: cobra 970EUR a la tarjeta guardada del cliente que acaba
 * de comprar el MES. SIN volver a meter tarjeta, SIN segundo checkout.
 *
 * Flow:
 * 1. Recibe receipt_id (del checkout MES)
 * 2. Resuelve member_id via GET /receipts/{id}
 * 3. Lista payment methods → primer payt_xxx (la tarjeta recién guardada)
 * 4. POST /payments con plan_id=ANUAL, payment_method_id, member_id
 * 5. Si exito → 200 ok (frontend redirige a /mifge/agenda)
 *    Si fallo → 422 con { fallback_url } para que frontend redirija al checkout hosted
 *
 * El webhook membership.went_valid del ANUAL (logica existente) dispara
 * sendWelcomeAnual + Pixel Purchase 970EUR + notif Marco automaticamente.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = await rateLimit({ key: `upsell_anual:${ip}`, limit: 5, windowSeconds: 60 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 })
    }

    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const planIdAnual = process.env.WHOP_PLAN_ID_ANO
    const fallbackUrl = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_ANO ?? null
    if (!planIdAnual) {
      return NextResponse.json({ error: "WHOP_PLAN_ID_ANO no configurado", fallback_url: fallbackUrl }, { status: 500 })
    }

    // 1. Resolver member_id desde el receipt del MES
    let memberId: string | undefined
    try {
      const receipt = await getReceipt(parsed.data.receipt_id)
      memberId = receipt.member?.id ?? receipt.member_id
    } catch (e) {
      console.error("[upsell-anual/charge] getReceipt fallo", e)
      return NextResponse.json(
        { error: "No pudimos verificar tu compra previa", fallback_url: fallbackUrl },
        { status: 422 }
      )
    }

    if (!memberId) {
      return NextResponse.json(
        { error: "Receipt sin member asociado", fallback_url: fallbackUrl },
        { status: 422 }
      )
    }

    // 2. Buscar tarjeta guardada
    const methods = await listMemberPaymentMethods(memberId)
    const card = methods.find((m) => m.payment_method_type === "card") ?? methods[0]
    if (!card) {
      return NextResponse.json(
        { error: "No hay tarjeta guardada", fallback_url: fallbackUrl },
        { status: 422 }
      )
    }

    // 3. Cobrar 970EUR
    let payment
    try {
      payment = await chargeUser({
        memberId,
        paymentMethodId: card.id,
        planId: planIdAnual,
        metadata: {
          source: "mifge_upsell_anual_one_click",
          original_mes_receipt_id: parsed.data.receipt_id,
          ...(parsed.data.email && { email: parsed.data.email }),
        },
      })
    } catch (e) {
      console.error("[upsell-anual/charge] chargeUser fallo", e)
      // Fail soft: que el cliente pase por checkout hosted en lugar de perder la venta
      return NextResponse.json(
        { error: "El cobro falló", fallback_url: fallbackUrl },
        { status: 422 }
      )
    }

    // Marcar intencion en lead (confirmacion final via webhook membership.went_valid)
    if (parsed.data.email) {
      const supabase = getAdminClient()
      await supabase
        .from("mifge_leads")
        .update({ pipeline_stage: "won_ano" })
        .eq("email", parsed.data.email.toLowerCase().trim())
    }

    return NextResponse.json({
      ok: true,
      payment_id: payment.id,
      payment_status: payment.status,
    })
  } catch (e) {
    console.error("[upsell-anual/charge] error", e)
    const fallbackUrl = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_ANO ?? null
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error inesperado", fallback_url: fallbackUrl },
      { status: 500 }
    )
  }
}
