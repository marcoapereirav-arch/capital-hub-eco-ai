import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 10

/**
 * POST /api/manychat/webinar-router
 *
 * Lo llama ManyChat (External Request) cuando alguien comenta la palabra clave
 * del reel del webinar. Con UNA llamada:
 *   1. Loguea el comentario en manychat_events (para el conteo "comentaron")
 *   2. Cachea el suscriptor si es nuevo (dashboard)
 *   3. Devuelve el link del webinar con mc_id para que ManyChat lo mande por DM
 *
 * IMPORTANTE — comentar NO es un lead:
 *   Un comentario es solo una interacción. NO crea contacto ni entra al pipeline.
 *   El contacto se crea como stage 'lead' SOLO cuando la persona rellena el
 *   opt-in en /webinar (POST /api/optin/webinar), que vincula por mc_id para
 *   atribuir ese lead al comentario. Ver SOP producto/20.
 *
 * Auth: Bearer MANYCHAT_WEBHOOK_SECRET.
 */

const BodySchema = z.object({
  subscriber_id: z.union([z.string(), z.number()]).transform(String),
  ig_username: z.string().optional().nullable(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  comment_text: z.string().optional().nullable(),
  comment_id: z.union([z.string(), z.number()]).optional().nullable().transform((v) => (v == null ? null : String(v))),
  post_id: z.union([z.string(), z.number()]).optional().nullable().transform((v) => (v == null ? null : String(v))),
})

const SITE_CH = process.env.NEXT_PUBLIC_CH_URL ?? "https://ch.capitalhubapp.com"

export async function POST(req: NextRequest) {
  // 1. Auth
  const secret = process.env.MANYCHAT_WEBHOOK_SECRET
  if (!secret) {
    console.error("[webinar-router] MANYCHAT_WEBHOOK_SECRET not set")
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 })
  }
  const auth = req.headers.get("authorization") ?? ""
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : auth
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // 2. Parse
  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json(
      { error: "invalid_body", detail: e instanceof z.ZodError ? e.flatten() : String(e) },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const mcId = body.subscriber_id
  const ig = body.ig_username ? body.ig_username.replace(/^@/, "").trim() || null : null
  const fullName = [body.first_name, body.last_name].filter(Boolean).join(" ").trim() || ig || `Suscriptor ${mcId}`

  // 3. Log del comentario (auditoría + conteo "comentaron"). NO crea lead.
  await supabase.from("manychat_events").insert({
    subscriber_id: mcId,
    event_type: "webinar_comment",
    payload: body as unknown as Record<string, unknown>,
  })

  // 4. Cachea el suscriptor si es nuevo (para el dashboard). No pisa datos ricos del webhook.
  const { data: subExists } = await supabase.from("manychat_subscribers_cache").select("id").eq("id", mcId).maybeSingle()
  if (!subExists) {
    await supabase.from("manychat_subscribers_cache").insert({
      id: mcId,
      name: fullName,
      first_name: body.first_name ?? null,
      last_name: body.last_name ?? null,
      ig_username: ig,
      status: "active",
      subscribed_at: now,
      last_interaction_at: now,
      synced_at: now,
    })
  }

  // 5. Devuelve el link del webinar con mc_id. La persona se convierte en 'lead'
  //    cuando rellena el opt-in (ahí sí entra al pipeline, vinculado por mc_id).
  const deliveryLink =
    `${SITE_CH}/webinar?mc_id=${encodeURIComponent(mcId)}` +
    `&utm_source=instagram&utm_medium=manychat&utm_campaign=reel_webinar`

  return NextResponse.json({ matched: true, delivery_link: deliveryLink, subscriber_id: mcId })
}
