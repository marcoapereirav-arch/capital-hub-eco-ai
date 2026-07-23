import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { resolveAutoStage } from "@/lib/pipeline/stage-guard"
import { sendCapiEvent } from "@/lib/meta/capi-client"
import { notifyAdmins } from "@/lib/notifications/notify-admins"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/funnel/test-personalidad/acceso?c=<slug>
 *
 * Es el destino del botón del email que llega a los 7 minutos (funnel v2, PRP-007).
 * El clic de ese botón es EL disparador de calificación del funnel: quien lo pulsa ha
 * demostrado intención real, aunque todavía no haya agendado.
 *
 * Qué hace:
 *  - Resuelve el contacto por su slug público (contacts.slug, opaco, ya existente).
 *    Nunca se expone el UUID ni el email en la query string.
 *  - Sube el stage a 'lead_cualificado' con la guarda de no retroceso (un 'agendado'
 *    o un 'alumno' NO se degradan).
 *  - Deja evento en el journey del contacto.
 *  - Dispara Meta CAPI (test_personalidad_cualificado) para que las campañas puedan
 *    optimizar por calidad de lead y no solo por volumen. Petición de JP en la
 *    reunión del 18-jul-2026.
 *  - Avisa al equipo (campana + push) para que el setter escriba primero a estos.
 *
 * REGLA DURA: este endpoint NUNCA le falla al lead. Si no hay slug, si el contacto no
 * existe, si la BD peta o si Meta peta, IGUALMENTE redirige a la landing del test.
 * Marcar es secundario; entregar el test es lo principal.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const slug = url.searchParams.get("c")?.trim() || null

  // Destino final, se calcula ya para poder redirigir pase lo que pase.
  const destino = new URL("/test-personalidad/test", url.origin)
  if (slug) destino.searchParams.set("c", slug)

  if (!slug) return NextResponse.redirect(destino, { status: 302 })

  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: contact } = await admin
      .from("contacts")
      .select("id, full_name, email, phone, stage")
      .eq("slug", slug)
      .maybeSingle()

    if (!contact) return NextResponse.redirect(destino, { status: 302 })

    const nextStage = resolveAutoStage(contact.stage as string | null, "lead_cualificado")
    const subio = nextStage !== contact.stage

    if (subio) {
      await admin
        .from("contacts")
        .update({ stage: nextStage, updated_at: new Date().toISOString() })
        .eq("id", contact.id)
    }

    // Journey: se registra SIEMPRE que abre el acceso, aunque el stage no cambie
    // (un 'agendado' que reabre el email sigue siendo información útil).
    await admin.from("contact_journey_events").insert({
      contact_id: contact.id,
      type: "acceso_test_personalidad",
      title: subio
        ? "Abrió el acceso al test (pasa a Lead cualificado)"
        : "Abrió el acceso al test",
      data: { from: contact.stage ?? null, to: nextStage, changed: subio },
    })

    // Meta CAPI: solo la primera vez que se cualifica, para no inflar el evento.
    if (subio) {
      sendCapiEvent({
        eventName: "test_personalidad_cualificado",
        userData: {
          email: (contact.email as string) ?? undefined,
          phone: (contact.phone as string) ?? undefined,
        },
        customData: { value: 0, currency: "EUR", contentName: "Abrió el test de personalidad" },
        eventSourceUrl: destino.toString(),
        triggeredBy: "api_funnel_test_personalidad_acceso",
      }).catch((e) => console.error("[funnel/test-personalidad/acceso] CAPI", e))

      await notifyAdmins(admin, {
        title: "Lead cualificado · Test Personalidad",
        body: `${contact.full_name || contact.email || "Un contacto"} abrió el acceso al test. Escríbele antes que a los demás.`,
        type: "lead_cualificado",
        url: `/crm/contactos/${contact.id}`,
        data: { contact_id: contact.id, email: contact.email },
      })
    }
  } catch (e) {
    // Nunca romper la experiencia del lead: se loguea y se sigue al test.
    console.error("[funnel/test-personalidad/acceso] fallo (no bloquea al lead)", e)
  }

  return NextResponse.redirect(destino, { status: 302 })
}
