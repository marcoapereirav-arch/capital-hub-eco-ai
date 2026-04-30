import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = "force-dynamic"

const LeadSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  full_name: z.string().min(2, "Nombre demasiado corto").max(120),
  phone: z.string().min(6, "Teléfono inválido").max(30),
  order_bump_added: z.boolean().default(false),
  rgpd_accepted: z.literal(true, { message: "Debes aceptar la política de privacidad" }),
  source: z.string().max(60).default("mifge_checkout"),
})

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = LeadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data
    const supabase = getAdminClient()

    const { data: inserted, error } = await supabase
      .from("mifge_leads")
      .insert({
        email: data.email.toLowerCase().trim(),
        full_name: data.full_name.trim(),
        phone: data.phone.trim(),
        order_bump_added: data.order_bump_added,
        rgpd_accepted: data.rgpd_accepted,
        source: data.source,
        user_agent: req.headers.get("user-agent") ?? null,
        ip:
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          req.headers.get("x-real-ip") ??
          null,
      })
      .select("id, email")
      .single()

    if (error) {
      console.error("[mifge/leads] insert error", error)
      return NextResponse.json({ error: "No se pudo guardar el lead" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, lead_id: inserted.id }, { status: 201 })
  } catch (e) {
    console.error("[mifge/leads] unexpected", e)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
