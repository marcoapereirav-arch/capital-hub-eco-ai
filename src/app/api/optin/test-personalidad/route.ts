import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const optinSchema = z.object({
  full_name: z.string().min(2).max(120).trim(),
  email: z.string().email().max(180).trim().toLowerCase(),
  // Teléfono obligatorio: el lead debe ser contactable por WhatsApp para el seguimiento manual.
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v.replace(/\D/g, "").length >= 6, "Teléfono inválido"),
})

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 50)
}

/**
 * POST /api/optin/test-personalidad
 *
 * El lead rellena nombre + email + teléfono en /test-personalidad y este endpoint:
 *  - Upsert contacto: si existe por email lo actualiza, si no lo crea con stage='lead'
 *  - Asigna pipeline = 'Test Personalidad' (contexto del funnel — no el default)
 *  - Tag 'origen:test_personalidad'
 *  - Añade evento al journey
 *  - Devuelve { ok: true } para que la landing redirija a /test-personalidad/gracias
 *
 * Regla de asignación de pipeline (SOP 12):
 * - Lead que pasa por este optin → pipeline_id = Test Personalidad (slug='test-personalidad')
 * - Lead que agenda directamente sin contexto → pipeline_id = General (default)
 * - Si el contacto YA existe con un pipeline_id → SE PRESERVA (no se sobreescribe)
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = optinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.format() }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { full_name, email, phone } = parsed.data

  // Pipeline contextual de este funnel: Test Personalidad
  const { data: pipeline } = await admin
    .from("pipelines").select("id").eq("slug", "test-personalidad").maybeSingle()
  const pipelineId = pipeline?.id ?? null

  // Tag 'origen:test_personalidad'
  let tagId: string | null = null
  {
    const { data: existing } = await admin.from("tags").select("id").eq("name", "origen:test_personalidad").maybeSingle()
    if (existing?.id) {
      tagId = existing.id
    } else {
      const { data: created } = await admin.from("tags").insert({
        name: "origen:test_personalidad",
        color: "#8b5cf6",
        description: "Lead que entró por la landing del test de personalidad",
      }).select("id").single()
      tagId = created?.id ?? null
    }
  }

  // Upsert contacto por email
  let contactId: string | null = null
  let action: "created" | "updated" = "created"
  {
    const { data: existing } = await admin.from("contacts").select("id, stage, pipeline_id").ilike("email", email).maybeSingle()

    if (existing) {
      contactId = existing.id
      action = "updated"
      // Solo subir a 'lead' si todavia estaba en stage previo "puro" — aqui no degradamos
      const update: Record<string, unknown> = { full_name, phone, updated_at: new Date().toISOString() }
      if (!existing.stage) update.stage = "lead"
      // Si el contacto NO tenía pipeline_id (lead huérfano), asignar el de Test Personalidad
      // por el contexto de este funnel. Si ya tenía pipeline_id, PRESERVAR (no sobreescribir).
      if (!existing.pipeline_id && pipelineId) update.pipeline_id = pipelineId
      await admin.from("contacts").update(update).eq("id", existing.id)
    } else {
      const slug = slugify(full_name) + "_" + Math.random().toString(36).slice(2, 8)
      const { data: created, error: cErr } = await admin.from("contacts").insert({
        full_name,
        email,
        phone,
        slug,
        stage: "lead",
        pipeline_id: pipelineId,
        origin: "landing_test_personalidad",
        source: "landing_test_personalidad",
      }).select("id").single()
      if (cErr) {
        return NextResponse.json({ error: "Error guardando el lead. Inténtalo de nuevo." }, { status: 500 })
      }
      contactId = created.id
    }
  }

  // Asignar tag
  if (contactId && tagId) {
    await admin.from("contact_tags").insert({ contact_id: contactId, tag_id: tagId })
    // Ignoramos error 23505 (ya asignado)
  }

  // Journey event
  if (contactId) {
    await admin.from("contact_journey_events").insert({
      contact_id: contactId,
      type: "optin_test_personalidad",
      title:
        action === "created"
          ? "Opt-in en la landing del Test de Personalidad"
          : "Reenvió opt-in en la landing del Test de Personalidad",
      data: { email, action },
    })
  }

  return NextResponse.json({ ok: true, action })
}
