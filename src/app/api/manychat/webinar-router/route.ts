import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveAutoStage } from "@/lib/pipeline/stage-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 10

/**
 * POST /api/manychat/webinar-router
 *
 * Lo llama ManyChat (External Request) cuando alguien comenta la palabra clave
 * del reel del webinar. Con UNA llamada:
 *   1. Loguea el comentario (manychat_events) y cachea el suscriptor
 *   2. Crea/actualiza la ficha en el pipeline WEBINAR, stage 'dm' (comentó, aún
 *      sin datos): guardamos su Instagram + manychat_subscriber_id
 *   3. Le pone el tag del reel de origen (sistema de tags propio del OS)
 *   4. Devuelve el link del webinar con mc_id para el DM
 *
 * Modelo (SOP producto/20): 'dm' = comentó. Cuando rellena el opt-in, la MISMA
 * ficha se mueve a 'lead' y se completa (vinculada por mc_id). Una sola ficha
 * que evoluciona por todo el proceso; nunca se duplica.
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

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40)
}

type AdminClient = ReturnType<typeof createAdminClient>

async function ensureTag(supabase: AdminClient, name: string, color: string, description: string): Promise<string | null> {
  const { data: existing } = await supabase.from("tags").select("id").eq("name", name).maybeSingle()
  if (existing?.id) return existing.id as string
  const { data: created, error } = await supabase.from("tags").insert({ name, color, description }).select("id").single()
  if (error) {
    if (error.code === "23505") {
      const { data: again } = await supabase.from("tags").select("id").eq("name", name).maybeSingle()
      return (again?.id as string) ?? null
    }
    return null
  }
  return (created?.id as string) ?? null
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const secret = process.env.MANYCHAT_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "server_misconfigured" }, { status: 500 })
  const auth = req.headers.get("authorization") ?? ""
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : auth
  if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  // 2. Parse
  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: "invalid_body", detail: e instanceof z.ZodError ? e.flatten() : String(e) }, { status: 400 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const mcId = body.subscriber_id
  const ig = body.ig_username ? body.ig_username.replace(/^@/, "").trim() || null : null
  const fullName = [body.first_name, body.last_name].filter(Boolean).join(" ").trim() || (ig ? `@${ig}` : `Suscriptor ${mcId}`)

  // 3. Log del comentario + cache del suscriptor
  await supabase.from("manychat_events").insert({
    subscriber_id: mcId,
    event_type: "webinar_comment",
    payload: body as unknown as Record<string, unknown>,
  })
  const { data: subExists } = await supabase.from("manychat_subscribers_cache").select("id").eq("id", mcId).maybeSingle()
  if (!subExists) {
    await supabase.from("manychat_subscribers_cache").insert({
      id: mcId, name: fullName, first_name: body.first_name ?? null, last_name: body.last_name ?? null,
      ig_username: ig, status: "active", subscribed_at: now, last_interaction_at: now, synced_at: now,
    })
  }

  // 4. Pipeline del webinar
  const { data: pipeline } = await supabase.from("pipelines").select("id").eq("slug", "webinar").maybeSingle()
  const pipelineId = (pipeline?.id as string) ?? null

  // 5. Buscar/crear la ficha (por mc_id → ig_username). Comentar entra en stage 'dm'.
  let contact: { id: string; stage: string | null; pipeline_id: string | null; instagram_username: string | null; manychat_subscriber_id: string | null } | null = null
  {
    const { data } = await supabase
      .from("contacts")
      .select("id, stage, pipeline_id, instagram_username, manychat_subscriber_id")
      .eq("manychat_subscriber_id", mcId)
      .maybeSingle()
    contact = data ?? null
  }
  if (!contact && ig) {
    const { data } = await supabase
      .from("contacts")
      .select("id, stage, pipeline_id, instagram_username, manychat_subscriber_id")
      .eq("instagram_username", ig)
      .maybeSingle()
    contact = data ?? null
  }

  let contactId: string
  if (contact) {
    // Ya existe: NO degradar (resolveAutoStage mantiene lead/agendado/alumno).
    contactId = contact.id
    const update: Record<string, unknown> = { updated_at: now }
    if (!contact.manychat_subscriber_id) update.manychat_subscriber_id = mcId
    if (!contact.instagram_username && ig) update.instagram_username = ig
    if (!contact.pipeline_id && pipelineId) update.pipeline_id = pipelineId
    const nextStage = resolveAutoStage(contact.stage, "dm")
    if (contact.stage !== nextStage) update.stage = nextStage
    if (Object.keys(update).length > 1) await supabase.from("contacts").update(update).eq("id", contactId)
  } else {
    const slug = slugify(ig || fullName) + "_" + mcId.slice(-6)
    const { data: created, error } = await supabase.from("contacts").insert({
      full_name: fullName, slug, stage: "dm", pipeline_id: pipelineId,
      instagram_username: ig, manychat_subscriber_id: mcId,
      origin: "manychat_webinar_comment", source: "manychat", affiliate_slug: "instagram",
    }).select("id").single()
    if (error || !created) {
      console.error("[webinar-router] contact insert failed:", error?.message)
      return NextResponse.json({ error: "contact_insert_failed", detail: error?.message }, { status: 500 })
    }
    contactId = created.id
  }

  // 6. Tags (sistema propio): origen + reel de procedencia
  const tagIds: (string | null)[] = [
    await ensureTag(supabase, "origen:webinar", "#2A2D34", "Entró por el webinar"),
    await ensureTag(supabase, "fuente:instagram", "#3F3F46", "Vino de Instagram (ManyChat)"),
  ]
  if (body.post_id) {
    tagIds.push(await ensureTag(supabase, `reel:${body.post_id}`, "#52525B", `Comentó el reel ${body.post_id} (renombrable)`))
  }
  const tagRows = tagIds.filter((id): id is string => !!id).map((tag_id) => ({ contact_id: contactId, tag_id }))
  if (tagRows.length) await supabase.from("contact_tags").insert(tagRows)

  // 7. Journey
  await supabase.from("contact_journey_events").insert({
    contact_id: contactId, type: "manychat_webinar_comment",
    title: `Comentó en el reel del webinar (@${ig ?? "sin_username"})`,
    data: { subscriber_id: mcId, ig_username: ig, comment_text: body.comment_text ?? null, post_id: body.post_id },
  })

  // 8. Link del webinar con mc_id (para vincular al opt-in)
  const deliveryLink =
    `${SITE_CH}/webinar?mc_id=${encodeURIComponent(mcId)}&utm_source=instagram&utm_medium=manychat&utm_campaign=reel_webinar`

  return NextResponse.json({ matched: true, delivery_link: deliveryLink, contact_id: contactId, stage: "dm" })
}
