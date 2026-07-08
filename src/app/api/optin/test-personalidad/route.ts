import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"
import { TEST_AGENT_EMAIL } from "@/lib/notifications/recipients"
import { notifyAdmins } from "@/lib/notifications/notify-admins"

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
  // Atribución: de qué fuente/afiliado vino (utm_source del link). Opcional.
  utm_source: z.string().max(80).trim().optional(),
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
 *  - Tag 'origen:test_personalidad' (de qué funnel vino)
 *  - Atribución: guarda affiliate_slug (= utm_source, first-touch) + tag 'fuente:<slug>'
 *  - Añade evento al journey
 *  - Devuelve { ok: true } para que la landing redirija a /test-personalidad/gracias
 *
 * Regla de asignación de pipeline (SOP 12):
 * - Lead que pasa por este optin → pipeline_id = Test Personalidad (slug='test-personalidad')
 * - Si el contacto YA existe con un pipeline_id → SE PRESERVA (no se sobreescribe)
 *
 * Atribución (SOP marketing/07): affiliate_slug es first-touch — si el contacto ya
 * tenía una fuente, NO se sobreescribe (la primera fuente que lo trajo manda).
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
  const source = parsed.data.utm_source ? slugify(parsed.data.utm_source) : null

  // Crea el tag si no existe y devuelve su id. Colores del brandkit (neutros).
  const ensureTag = async (name: string, color: string, description: string): Promise<string | null> => {
    const { data: existing } = await admin.from("tags").select("id").eq("name", name).maybeSingle()
    if (existing?.id) return existing.id as string
    const { data: created } = await admin
      .from("tags")
      .insert({ name, color, description })
      .select("id")
      .single()
    return (created?.id as string) ?? null
  }

  // Pipeline contextual de este funnel: Test Personalidad
  const { data: pipeline } = await admin
    .from("pipelines").select("id").eq("slug", "test-personalidad").maybeSingle()
  const pipelineId = pipeline?.id ?? null

  // Tag de origen (de qué funnel vino) — color neutro brandkit
  const origenTagId = await ensureTag(
    "origen:test_personalidad",
    "#2A2D34",
    "Lead que entró por la landing del test de personalidad",
  )

  // Tag de fuente (qué afiliado/canal lo trajo) — si hay utm_source
  const fuenteTagId = source
    ? await ensureTag(`fuente:${source}`, "#3F3F46", `Lead atribuido a la fuente '${source}'`)
    : null

  // Upsert contacto por email
  let contactId: string | null = null
  let action: "created" | "updated" = "created"
  // Si el contacto YA estaba más allá de 'lead' (agendado, seguimiento, alumno…) y
  // vuelve a pasar por el opt-in, NO lo degradamos a lead y avisamos al equipo.
  let recurringFromStage: string | null = null
  {
    const { data: existing } = await admin
      .from("contacts")
      .select("id, stage, pipeline_id, affiliate_slug")
      .ilike("email", email)
      .maybeSingle()

    if (existing) {
      contactId = existing.id
      action = "updated"
      if (existing.stage && existing.stage !== "lead") recurringFromStage = existing.stage
      const update: Record<string, unknown> = { full_name, phone, updated_at: new Date().toISOString() }
      // Solo se pone 'lead' si NO tenía stage. Un contacto ya avanzado conserva su stage.
      if (!existing.stage) update.stage = "lead"
      // pipeline_id: preservar si ya tenía; asignar el del funnel si era huérfano
      if (!existing.pipeline_id && pipelineId) update.pipeline_id = pipelineId
      // affiliate_slug: first-touch — solo si todavía no tenía fuente
      if (!existing.affiliate_slug && source) update.affiliate_slug = source
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
        source: source ?? "landing_test_personalidad",
        affiliate_slug: source,
      }).select("id").single()
      if (cErr) {
        return NextResponse.json({ error: "Error guardando el lead. Inténtalo de nuevo." }, { status: 500 })
      }
      contactId = created.id
    }
  }

  // Asignar tags (origen + fuente). Ignora 23505 (ya asignado).
  if (contactId) {
    const tagRows = [origenTagId, fuenteTagId]
      .filter((id): id is string => !!id)
      .map((tag_id) => ({ contact_id: contactId as string, tag_id }))
    if (tagRows.length) await admin.from("contact_tags").insert(tagRows)
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
      data: { email, action, source },
    })
  }

  // Push + in-app al equipo: nuevo lead del test de personalidad.
  if (action === "created") {
    await notifyAdmins(admin, {
      title: "🎯 Nuevo lead · Test Personalidad",
      body: `${full_name} hizo opt-in en el test de personalidad.`,
      type: "lead",
      url: "/crm/pipeline",
      data: { contact_id: contactId, email },
    })
  }

  // Notificación al equipo: un contacto YA avanzado vuelve a pasar por el opt-in.
  // "X (que ya estaba en Y) volvió a entrar por el funnel." No se modifica su stage.
  if (contactId && recurringFromStage) {
    try {
      const { data: admins } = await admin
        .from("profiles")
        .select("id")
        .eq("role", "super_admin")
        .neq("email", TEST_AGENT_EMAIL)
      const stageLabels: Record<string, string> = {
        agendado: "Agendado",
        seguimiento: "Seguimiento",
        no_show: "No show",
        alumno: "Alumno",
        perdido: "Perdido",
      }
      const label = stageLabels[recurringFromStage] ?? recurringFromStage
      const rows = (admins ?? []).map((a) => ({
        user_id: a.id,
        title: "🔁 Contacto recurrente en el funnel del test",
        body: `${full_name} (${email}) ya estaba en «${label}» y volvió a pasar por la landing del test. Su stage NO se modificó.`,
        type: "recurring_optin_test_personalidad",
        data: { contact_id: contactId, email, prior_stage: recurringFromStage, source },
      }))
      if (rows.length) await admin.from("notifications").insert(rows)
    } catch (e) {
      console.error("[optin/test-personalidad] notif recurrente falló (no bloquea)", e)
    }
  }

  return NextResponse.json({ ok: true, action, recurring: !!recurringFromStage })
}
