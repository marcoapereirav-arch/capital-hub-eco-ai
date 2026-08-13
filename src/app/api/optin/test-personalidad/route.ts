import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { render } from "@react-email/render"
import { z } from "zod"
import { notifyAdmins } from "@/lib/notifications/notify-admins"
import { sendEmail } from "@/lib/email/send-email"
import { TestPersonalidadAccesoEmail } from "@/lib/email/templates/test-personalidad-acceso"
import { TestPersonalidadConfirmacionEmail } from "@/lib/email/templates/test-personalidad-confirmacion"
import { getTestPersonalidadSettings } from "@/features/funnel-test-personalidad/get-settings"
import {
  camposAtribucionExistente,
  camposAtribucionNuevo,
  etiquetarAtribucion,
  normalizarFuente,
} from "@/lib/atribucion/atribucion"

/** Este funnel, en el catalogo unico. La atribucion se cuelga de aqui. */
const FUNNEL_SLUG = "test-personalidad"

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

/**
 * Origen público real de la petición (el lead puede estar en ch.capitalhubapp.com,
 * en os. o en localhost). Se usa para construir el link del email de acceso.
 */
function resolveOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host")
  const proto = req.headers.get("x-forwarded-proto") || "https"
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_FUNNEL_BASE_URL || "https://ch.capitalhubapp.com"
}

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
  // Quien lo trajo. La normalización vive en la pieza única de atribución.
  const source = normalizarFuente(parsed.data.utm_source)

  // Pipeline contextual de este funnel: Test Personalidad
  const { data: pipeline } = await admin
    .from("pipelines").select("id").eq("slug", "test-personalidad").maybeSingle()
  const pipelineId = pipeline?.id ?? null

  // Upsert contacto por email
  let contactId: string | null = null
  // Slug opaco del contacto. Viaja a la gracias (prefill del Calendly) y al email
  // de acceso (identifica al lead sin exponer id ni email en la URL). Ver PRP-007.
  let contactSlug: string | null = null
  let action: "created" | "updated" = "created"
  // Si el contacto YA estaba más allá de 'lead' (agendado, seguimiento, alumno…) y
  // vuelve a pasar por el opt-in, NO lo degradamos a lead y avisamos al equipo.
  let recurringFromStage: string | null = null
  {
    const { data: existing } = await admin
      .from("contacts")
      .select("id, slug, stage, pipeline_id, affiliate_slug, funnel_slug")
      .ilike("email", email)
      .maybeSingle()

    if (existing) {
      contactId = existing.id
      contactSlug = (existing.slug as string) ?? null
      action = "updated"
      if (existing.stage && existing.stage !== "lead") recurringFromStage = existing.stage
      const update: Record<string, unknown> = { full_name, phone, updated_at: new Date().toISOString() }
      // Solo se pone 'lead' si NO tenía stage. Un contacto ya avanzado conserva su stage.
      if (!existing.stage) update.stage = "lead"
      // pipeline_id: preservar si ya tenía; asignar el del funnel si era huérfano
      if (!existing.pipeline_id && pipelineId) update.pipeline_id = pipelineId
      // Atribución (fuente + funnel), first-touch. Decidida en un solo sitio.
      Object.assign(update, camposAtribucionExistente(existing, { source, funnelSlug: FUNNEL_SLUG }))
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
        ...camposAtribucionNuevo({ source, funnelSlug: FUNNEL_SLUG }),
      }).select("id").single()
      if (cErr) {
        return NextResponse.json({ error: "Error guardando el lead. Inténtalo de nuevo." }, { status: 500 })
      }
      contactId = created.id
      contactSlug = slug
    }
  }

  // Etiquetas de origen y de fuente. Las pone la pieza única de atribución.
  if (contactId) {
    await etiquetarAtribucion(admin, contactId, { source, funnelSlug: FUNNEL_SLUG })
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

  // ¿Hay paso intermedio? Decide DOS cosas a la vez: si se programa el email de espera
  // y a dónde va el lead después del formulario. Se lee una sola vez.
  const settings = await getTestPersonalidadSettings()

  // Email con el acceso al test, PROGRAMADO a los N minutos (default 7).
  // Era la pieza central del funnel v2: el lead veía la VSL mientras esperaba.
  // Desde el 2026-08-11 el paso intermedio está APAGADO, así que NO se programa nada:
  // el lead entra al test en el momento y un email de "aquí tienes tu acceso" siete
  // minutos después de que ya lo tenga solo sería ruido. Si Marco vuelve a encender el
  // interruptor en /webs, esto revive tal cual estaba.
  if (contactSlug && settings.pasoIntermedio) {
    try {
      const origin = resolveOrigin(req)
      const accessUrl = `${origin}/api/funnel/test-personalidad/acceso?c=${encodeURIComponent(contactSlug)}`
      // Mismos destinos que los botones de la landing del test, para que el lead
      // tenga el canal de contacto a mano aunque no llegue a abrirla.
      const whatsappUrl = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
        "Hola, acabo de hacer el test de personalidad. Te dejo mi resultado.",
      )}`
      const instagramUrl = `https://instagram.com/${settings.instagram}`
      const firstName = full_name.split(" ")[0] || full_name
      const html = await render(
        TestPersonalidadAccesoEmail({ firstName, accessUrl, whatsappUrl, instagramUrl }),
      )
      await sendEmail({
        template: "test_personalidad_acceso",
        to: email,
        toName: full_name,
        subject: "Aquí tienes tu test de personalidad",
        html,
        scheduledAt: `in ${settings.emailDelayMinutes} minutes`,
        metadata: {
          funnel: "test_personalidad",
          contact_id: contactId,
          action,
          delay_minutes: settings.emailDelayMinutes,
        },
        vars: { firstName, accessUrl, whatsappUrl, instagramUrl },
      })
    } catch (e) {
      // Nunca bloquea el opt-in: el lead ya está guardado y va a ver la VSL igual.
      console.error("[optin/test-personalidad] email de acceso falló (no bloquea)", e)
    }
  }

  // Correo de confirmación del funnel DIRECTO: sale al instante, con el acceso al test.
  // El lead ya lo tiene abierto en la web, así que esto no le entrega nada nuevo: es su
  // copia de seguridad. Si cierra la pestaña sin hacerlo, este correo es la única forma
  // que le queda de volver, y nos dio su email justo para eso.
  // Su botón apunta al endpoint de acceso, no a Equilibria: así abrirlo desde el correo
  // también lo marca como Lead cualificado, igual que el botón de la página.
  if (contactSlug && settings.emailConfirmacion) {
    try {
      const origin = resolveOrigin(req)
      const accessUrl = `${origin}/api/funnel/test-personalidad/acceso?c=${encodeURIComponent(contactSlug)}`
      const whatsappUrl = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
        "Hola, acabo de hacer el test de personalidad. Te dejo mi resultado.",
      )}`
      const instagramUrl = `https://instagram.com/${settings.instagram}`
      const firstName = full_name.split(" ")[0] || full_name
      const html = await render(
        TestPersonalidadConfirmacionEmail({ firstName, accessUrl, whatsappUrl, instagramUrl }),
      )
      await sendEmail({
        template: "test_personalidad_confirmacion",
        to: email,
        toName: full_name,
        subject: "Tu acceso al test de personalidad",
        html,
        metadata: { funnel: "test_personalidad", contact_id: contactId, action },
        vars: { firstName, accessUrl, whatsappUrl, instagramUrl },
      })
    } catch (e) {
      // Nunca bloquea el opt-in: el lead ya está guardado y ya tiene el test delante.
      console.error("[optin/test-personalidad] email de confirmación falló (no bloquea)", e)
    }
  }

  // Push + in-app al equipo: nuevo lead del test de personalidad.
  if (action === "created") {
    await notifyAdmins(admin, {
      title: "Nuevo lead · Test Personalidad",
      body: `${full_name} hizo opt-in en el test de personalidad.`,
      type: "lead",
      url: contactId ? `/crm/contactos/${contactId}` : "/crm/pipeline",
      data: { contact_id: contactId, email },
    })
  }

  // Notificación al equipo: un contacto YA avanzado vuelve a pasar por el opt-in.
  // "X (que ya estaba en Y) volvió a entrar por el funnel." No se modifica su stage.
  if (contactId && recurringFromStage) {
    try {
      const stageLabels: Record<string, string> = {
        agendado: "Agendado",
        seguimiento: "Seguimiento",
        no_show: "No show",
        alumno: "Alumno",
        perdido: "Perdido",
      }
      const label = stageLabels[recurringFromStage] ?? recurringFromStage
      // Va por el helper común: así llega TAMBIÉN al setter y TAMBIÉN por push. Antes
      // este aviso se montaba a mano aquí, solo para super_admins y solo en la campana:
      // el que tiene que escribirle no se enteraba, que es justo lo contrario de para
      // lo que sirve avisar de que un contacto ya conocido ha vuelto.
      await notifyAdmins(admin, {
        title: "Contacto recurrente en el funnel del test",
        body: `${full_name} ya estaba en «${label}» y volvió a pasar por la landing del test. Su etapa NO se modificó.`,
        type: "recurring_optin_test_personalidad",
        url: `/crm/contactos/${contactId}`,
        data: { contact_id: contactId, email, prior_stage: recurringFromStage, source },
      })
    } catch (e) {
      console.error("[optin/test-personalidad] notif recurrente falló (no bloquea)", e)
    }
  }

  // A dónde manda la landing al lead. Lo decide el SERVIDOR, no el navegador: así el
  // interruptor de /webs cambia el recorrido de verdad, sin desplegar y sin que quede una
  // versión vieja de la página mandando gente a la ruta equivocada.
  const next = contactSlug
    ? `${settings.pasoIntermedio ? "/test-personalidad/gracias" : "/test-personalidad/test"}?c=${encodeURIComponent(contactSlug)}`
    : settings.pasoIntermedio
      ? "/test-personalidad/gracias"
      : "/test-personalidad/test"

  return NextResponse.json({ ok: true, action, recurring: !!recurringFromStage, slug: contactSlug, next })
}
