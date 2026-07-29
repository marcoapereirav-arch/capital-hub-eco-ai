import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getWebinarSettings } from "@/features/funnel-webinar/get-settings"
import { webinarTagName, webinarDateLabel } from "@/features/funnel-webinar/config"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/funnel/webinar/whatsapp-click?c=<slug>
 *
 * Se llama (vía navigator.sendBeacon) cuando el lead toca el botón de WhatsApp en la
 * página de gracias del webinar. Ese clic es el ÚLTIMO paso del funnel (el punto de
 * éxito): a partir de ahí se nutre a la persona dentro del chat.
 *
 * Qué hace:
 *  - Resuelve el contacto por su slug opaco (contacts.slug). Nunca se expone el UUID
 *    ni el email en la query string.
 *  - Le pone el tag `whatsapp-webinar-DD_MM_YYYY` con la FECHA del webinar al que accedió
 *    (fuente: WEBINAR_DATE en los ajustes del funnel). Como hacemos webinars de forma
 *    constante, el tag identifica exactamente de qué webinar vino cada persona; al cambiar
 *    la fecha del siguiente webinar, el tag cambia solo.
 *  - Deja un evento en su timeline (journey).
 *
 * Nunca falla de forma dura: si no hay slug o la BD peta, responde 200 igual. Es un
 * beacon disparado mientras el navegador ya está saltando a WhatsApp.
 */
const TAG_COLOR = "#3F3F46"

export async function POST(req: Request) {
  const url = new URL(req.url)
  const slug = url.searchParams.get("c")?.trim() || null
  if (!slug) return NextResponse.json({ ok: true, skipped: "no_slug" })

  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: contact } = await admin
      .from("contacts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (!contact) return NextResponse.json({ ok: true, skipped: "no_contact" })

    // El tag lleva la fecha del webinar al que accedió el lead. Fuente única: WEBINAR_DATE.
    const settings = await getWebinarSettings()
    const tagName = webinarTagName(settings.webinarDate)
    const tagDesc = `Escribió por WhatsApp para el webinar del ${webinarDateLabel(settings.webinarDate)} (último paso del funnel).`

    // Tag por webinar: se crea la primera vez y se reutiliza después.
    const { data: existingTag } = await admin
      .from("tags")
      .select("id")
      .eq("name", tagName)
      .maybeSingle()
    let tagId = existingTag?.id as string | undefined
    if (!tagId) {
      const { data: createdTag } = await admin
        .from("tags")
        .insert({ name: tagName, color: TAG_COLOR, description: tagDesc })
        .select("id")
        .single()
      tagId = createdTag?.id as string | undefined
    }

    if (tagId) {
      // upsert: si el contacto ya tenía el tag, no lo duplica ni falla.
      await admin.from("contact_tags").upsert(
        { contact_id: contact.id, tag_id: tagId, assigned_at: new Date().toISOString() },
        { onConflict: "contact_id,tag_id" },
      )
    }

    await admin.from("contact_journey_events").insert({
      contact_id: contact.id,
      type: "webinar_whatsapp_click",
      title: "Tocó el botón de WhatsApp (gracias del webinar)",
      data: { funnel: "webinar", webinar_date: settings.webinarDate, tag: tagName },
    })
  } catch (e) {
    console.error("[funnel/webinar/whatsapp-click] fallo (no bloquea)", e)
  }

  return NextResponse.json({ ok: true })
}
