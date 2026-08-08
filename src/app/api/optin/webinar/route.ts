import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"
import { render } from "@react-email/render"
import { sendEmail } from "@/lib/email/send-email"
import { WebinarOptinEmail } from "@/lib/email/templates/webinar-optin"
import { getWebinarSettings } from "@/features/funnel-webinar/get-settings"
import { whatsappLink } from "@/features/funnel-webinar/config"
import { TEST_AGENT_EMAIL } from "@/lib/notifications/recipients"
import { notifyAdmins, filterByNotificationPref } from "@/lib/notifications/notify-admins"
import { resolveAutoStage } from "@/lib/pipeline/stage-guard"
import {
  camposAtribucionExistente,
  camposAtribucionNuevo,
  etiquetarAtribucion,
  normalizarFuente,
} from "@/lib/atribucion/atribucion"

/** Este funnel, en el catalogo unico. La atribucion se cuelga de aqui. */
const FUNNEL_SLUG = "webinar"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const optinSchema = z.object({
  full_name: z.string().min(2).max(120).trim(),
  email: z.string().email().max(180).trim().toLowerCase(),
  // Teléfono obligatorio: el lead debe ser contactable por WhatsApp para el directo.
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v.replace(/\D/g, "").length >= 6, "Teléfono inválido"),
  // Atribución: de qué fuente/afiliado vino (utm_source del link). Opcional.
  utm_source: z.string().max(80).trim().optional(),
  // ManyChat subscriber id: si el lead vino del DM del reel, vincula al MISMO
  // contacto creado en el comentario (dedup). Ver SOP producto/20.
  mc_id: z.string().max(120).trim().optional(),
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
 * POST /api/optin/webinar
 *
 * El lead reserva su plaza (nombre + email + teléfono) en /webinar. Este endpoint:
 *  - Upsert contacto: si existe por email lo actualiza, si no lo crea con stage='lead'
 *  - Asigna pipeline = 'Funnel Webinar' (slug='webinar') — contexto del funnel
 *  - Tag 'origen:webinar' + tag 'fuente:<utm_source>' (atribución first-touch)
 *  - Añade evento al journey
 *  - Envía email de confirmación con el link del grupo de WhatsApp (si está configurado)
 *  - Devuelve { ok: true } para que la landing redirija a /webinar/gracias
 *
 * Reglas (SOP 12 + marketing/07):
 *  - Si el contacto YA existe con pipeline_id → SE PRESERVA (no se sobreescribe).
 *  - Si YA estaba avanzado (agendado/alumno...) NO se degrada a lead; se avisa al equipo.
 *  - affiliate_slug es first-touch: la primera fuente que lo trajo manda.
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
  // Quien lo trajo. La normalización vive en la pieza única de atribución.
  const source = normalizarFuente(parsed.data.utm_source)
  const mcId = parsed.data.mc_id ?? null

  // Pipeline contextual de este funnel: Webinar
  const { data: pipeline } = await admin
    .from("pipelines").select("id").eq("slug", "webinar").maybeSingle()
  const pipelineId = pipeline?.id ?? null

  // Upsert contacto por email
  let contactId: string | null = null
  let contactSlug: string | null = null
  let action: "created" | "updated" = "created"
  let recurringFromStage: string | null = null
  {
    // 1) Si el lead vino del DM del reel (mc_id), busca el contacto ya creado en
    //    el comentario para NO duplicar (dedup). 2) Si no, busca por email.
    type ExistingContact = {
      id: string
      stage: string | null
      pipeline_id: string | null
      affiliate_slug: string | null
      funnel_slug: string | null
      email: string | null
      manychat_subscriber_id: string | null
      slug: string | null
    }
    let existing: ExistingContact | null = null
    if (mcId) {
      const { data } = await admin
        .from("contacts")
        .select("id, stage, pipeline_id, affiliate_slug, funnel_slug, email, manychat_subscriber_id, slug")
        .eq("manychat_subscriber_id", mcId)
        .maybeSingle()
      existing = (data as ExistingContact | null) ?? null
    }
    if (!existing) {
      const { data } = await admin
        .from("contacts")
        .select("id, stage, pipeline_id, affiliate_slug, funnel_slug, email, manychat_subscriber_id, slug")
        .ilike("email", email)
        .maybeSingle()
      existing = (data as ExistingContact | null) ?? null
    }

    if (existing) {
      contactId = existing.id
      action = "updated"
      // 'dm' (solo comentó) y 'lead' NO son "recurrente": es el flujo normal.
      // Solo avisamos al equipo si el contacto YA estaba más avanzado (agendado/alumno...).
      if (existing.stage && !["dm", "lead"].includes(existing.stage)) recurringFromStage = existing.stage
      const update: Record<string, unknown> = { full_name, phone, updated_at: new Date().toISOString() }
      // Opt-in = dejó sus datos → la ficha se mueve de 'dm' a 'lead'. Sin degradar si ya avanzó.
      const nextStage = resolveAutoStage(existing.stage, "lead")
      if (nextStage !== existing.stage) update.stage = nextStage
      if (!existing.pipeline_id && pipelineId) update.pipeline_id = pipelineId
      // Atribución (fuente + funnel), first-touch. Decidida en un solo sitio.
      Object.assign(update, camposAtribucionExistente(existing, { source, funnelSlug: FUNNEL_SLUG }))
      if (mcId && !existing.manychat_subscriber_id) update.manychat_subscriber_id = mcId
      // El contacto pudo crearse en el comentario sin email real: ahora lo tenemos.
      if (!existing.email) update.email = email
      // Slug opaco para la gracias (marcar quién toca WhatsApp). Si no lo tenía, se crea.
      contactSlug = existing.slug
      if (!existing.slug) {
        contactSlug = slugify(full_name) + "_" + Math.random().toString(36).slice(2, 8)
        update.slug = contactSlug
      }
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
        origin: "landing_webinar",
        ...camposAtribucionNuevo({ source, funnelSlug: FUNNEL_SLUG }),
        manychat_subscriber_id: mcId,
      }).select("id").single()
      if (cErr) {
        return NextResponse.json({ error: "Error guardando el lead. Inténtalo de nuevo." }, { status: 500 })
      }
      contactId = created.id
      contactSlug = slug
    }
  }

  // Asignar tags (origen + fuente). Ignora 23505 (ya asignado).
  if (contactId) {
    await etiquetarAtribucion(admin, contactId, { source, funnelSlug: FUNNEL_SLUG })
  }

  // Journey event
  if (contactId) {
    await admin.from("contact_journey_events").insert({
      contact_id: contactId,
      type: "optin_webinar",
      title:
        action === "created"
          ? "Reservó plaza en el webinar"
          : "Reenvió su reserva del webinar",
      data: { email, action, source },
    })
  }

  // Email de confirmación de la reserva. El botón al WhatsApp PRIVADO de Adrián es
  // OPCIONAL: se incluye solo si el interruptor "¿Incluir WhatsApp en el correo?" está
  // activo en el ⚙️ de /webs (settings.emailWhatsappEnabled). El mensaje del botón es el
  // mismo editable del funnel (settings.whatsappMessage). Copy editable/pausable en
  // /email-marketing ('optin_webinar').
  try {
    const settings = await getWebinarSettings()
    const waUrl = settings.emailWhatsappEnabled
      ? whatsappLink(settings.whatsappNumber, settings.whatsappMessage)
      : undefined
    const dateLabel = settings.dateLabel
    const firstName = full_name.split(" ")[0] || full_name
    const subject = settings.emailWhatsappEnabled
      ? "Tu plaza está reservada. Escríbenos por WhatsApp para tu entrada."
      : "Tu plaza está reservada para el directo."
    const html = await render(
      WebinarOptinEmail({ firstName, whatsappUrl: waUrl, dateLabel }),
    )
    await sendEmail({
      template: "optin_webinar",
      to: email,
      toName: full_name,
      subject,
      html,
      metadata: { funnel: "webinar", contact_id: contactId, action },
      vars: { firstName, whatsappUrl: waUrl ?? "", dateLabel },
    })
  } catch (e) {
    console.error("[optin/webinar] email de confirmación falló (no bloquea)", e)
  }

  // Push + in-app al equipo: nuevo lead del webinar.
  if (action === "created") {
    await notifyAdmins(admin, {
      title: "Nuevo lead · Webinar",
      body: `${full_name} reservó plaza en el webinar.`,
      type: "lead",
      url: contactId ? `/crm/contactos/${contactId}` : "/crm/pipeline",
      data: { contact_id: contactId, email },
    })
  }

  // Notificación al equipo: un contacto YA avanzado vuelve a pasar por el opt-in.
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
      const adminIds = await filterByNotificationPref(
        admin,
        (admins ?? []).map((a) => a.id as string),
        "recurring_optin_webinar",
      )
      const rows = adminIds.map((user_id) => ({
        user_id,
        title: "Contacto recurrente en el webinar",
        body: `${full_name} (${email}) ya estaba en «${label}» y volvió a reservar plaza en el webinar. Su stage NO se modificó.`,
        type: "recurring_optin_webinar",
        data: { url: `/crm/contactos/${contactId}`, contact_id: contactId, email, prior_stage: recurringFromStage, source },
      }))
      if (rows.length) await admin.from("notifications").insert(rows)
    } catch (e) {
      console.error("[optin/webinar] notif recurrente falló (no bloquea)", e)
    }
  }

  return NextResponse.json({ ok: true, action, recurring: !!recurringFromStage, slug: contactSlug })
}
