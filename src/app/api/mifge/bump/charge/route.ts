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
  lead_id: z.string().uuid().optional(),
})

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/mifge/bump/charge
 *
 * Llamado desde el cliente cuando termina el embed Whop del MES si el
 * usuario habia marcado "Anadir Bonus Bundle Express por 19EUR".
 *
 * Flow:
 * 1. Recibe receipt_id del onComplete del embed
 * 2. Resuelve member_id via GET /receipts/{id}
 * 3. Lista payment methods del member -> primer payt_xxx
 * 4. POST /payments con plan_id=BUMP, payment_method_id, member_id
 * 5. El webhook payment.succeeded del bump actualizara mifge_leads.bump_purchased
 *    y disparara email + CAPI automaticamente (logica ya existente)
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = await rateLimit({ key: `bump_charge:${ip}`, limit: 5, windowSeconds: 60 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas peticiones" },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const planIdBump = process.env.WHOP_PLAN_ID_BONUS
    if (!planIdBump) {
      return NextResponse.json({ error: "WHOP_PLAN_ID_BONUS no configurado" }, { status: 500 })
    }

    // 1. Resolver member_id desde receipt
    const receipt = await getReceipt(parsed.data.receipt_id)
    const memberId = receipt.member?.id ?? receipt.member_id
    if (!memberId) {
      console.error("[bump/charge] receipt sin member", receipt)
      return NextResponse.json({ error: "Receipt sin member asociado" }, { status: 422 })
    }

    // 2. Buscar tarjeta guardada del member
    const methods = await listMemberPaymentMethods(memberId)
    const card = methods.find((m) => m.payment_method_type === "card") ?? methods[0]
    if (!card) {
      return NextResponse.json({ error: "No hay tarjeta guardada del member" }, { status: 422 })
    }

    // 3. Cobrar
    const payment = await chargeUser({
      memberId,
      paymentMethodId: card.id,
      planId: planIdBump,
      metadata: {
        source: "mifge_checkout_bump",
        original_receipt_id: parsed.data.receipt_id,
        ...(parsed.data.lead_id && { lead_id: parsed.data.lead_id }),
        ...(parsed.data.email && { email: parsed.data.email }),
      },
    })

    // Marcar la intencion en mifge_leads (confirmacion final via webhook payment.succeeded)
    if (parsed.data.email) {
      const supabase = getAdminClient()
      await supabase
        .from("mifge_leads")
        .update({ order_bump_added: true })
        .eq("email", parsed.data.email.toLowerCase().trim())
    }

    return NextResponse.json({
      ok: true,
      payment_id: payment.id,
      payment_status: payment.status,
    })
  } catch (e) {
    console.error("[bump/charge] error", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado" }, { status: 500 })
  }
}
