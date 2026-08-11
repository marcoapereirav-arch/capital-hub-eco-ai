import "server-only"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { resolveAutoStage } from "@/lib/pipeline/stage-guard"
import { sendCapiEvent } from "@/lib/meta/capi-client"
import { isFunnelTrackingEnabled, logSkippedEvent } from "@/lib/meta/funnel-tracking"
import { notifyAdmins } from "@/lib/notifications/notify-admins"

/**
 * LA SEÑAL DE INTENCIÓN REAL del funnel del test: el lead abrió el test.
 *
 * Vive aquí, y no dentro de una ruta, porque hay DOS puertas por las que se llega al
 * mismo hecho y las dos tienen que marcarlo igual:
 *
 *  - v3 (vigente): el botón «Abrir el test» de /test-personalidad/test.
 *  - v2 (en pausa): el botón del email de los N minutos, que entra por
 *    /api/funnel/test-personalidad/acceso. Si Marco vuelve a encender el paso
 *    intermedio, sigue funcionando sin tocar nada.
 *
 * Si esto estuviera duplicado en las dos rutas, arreglar un fallo en una dejaría la otra
 * mintiendo. Un solo sitio, un solo comportamiento.
 *
 * REGLA DURA: esta función NUNCA le falla al lead. No lanza nunca. Si la BD peta o Meta
 * peta, se registra y se sigue. Marcar es secundario; entregar el test es lo principal.
 */
export async function cualificarPorAccesoAlTest(input: {
  /** Slug opaco del contacto (contacts.slug). Nunca el UUID ni el email. */
  slug: string | null
  /** URL desde la que se disparó, para que el evento se atribuya a este funnel. */
  sourceUrl: string
  /** Por dónde entró: el botón de la página o el botón del email. Va al journey. */
  via: "boton_pagina" | "email"
  /**
   * ¿Manda ESTA función el evento a Meta?
   *
   * Desde el botón de la página va en `false`: el navegador ya dispara el par
   * (píxel + servidor) con el mismo identificador, y ese camino lleva las cookies de
   * Meta, la IP y el navegador del lead, así que Meta lo empareja mucho mejor. Mandarlo
   * también desde aquí sería un segundo identificador para el mismo hecho: dos
   * conversiones donde hay una.
   *
   * Desde el email va en `true`: ahí no hay navegador nuestro, solo un clic que aterriza
   * en el servidor. Si no lo manda esta función, no lo manda nadie.
   */
  conCapi: boolean
}): Promise<{ cualificado: boolean }> {
  if (!input.slug) return { cualificado: false }

  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: contact } = await admin
      .from("contacts")
      .select("id, full_name, email, phone, stage")
      .eq("slug", input.slug)
      .maybeSingle()

    if (!contact) return { cualificado: false }

    const nextStage = resolveAutoStage(contact.stage as string | null, "lead_cualificado")
    const subio = nextStage !== contact.stage

    if (subio) {
      await admin
        .from("contacts")
        .update({ stage: nextStage, updated_at: new Date().toISOString() })
        .eq("id", contact.id)
    }

    // El journey se registra SIEMPRE que abre el test, aunque el stage no cambie: un
    // 'agendado' que vuelve a abrirlo sigue siendo información útil para el setter.
    await admin.from("contact_journey_events").insert({
      contact_id: contact.id,
      type: "acceso_test_personalidad",
      title: subio ? "Abrió el test (pasa a Lead cualificado)" : "Abrió el test",
      data: { from: contact.stage ?? null, to: nextStage, changed: subio, via: input.via },
    })

    // Meta y aviso al equipo: SOLO la primera vez, para no inflar el evento ni la campana.
    if (subio && input.conCapi) {
      // El interruptor de medición del funnel manda también aquí. Antes este evento salía
      // por su cuenta desde el servidor, así que apagar la medición en /webs no lo paraba:
      // el funnel parecía en silencio y seguía mandando. Ahora respeta el interruptor y,
      // si está apagado, queda registrado el descarte con su motivo.
      const gate = await isFunnelTrackingEnabled("test-personalidad")
      if (gate.enabled) {
        void sendCapiEvent({
          eventName: "test_personalidad_cualificado",
          userData: {
            email: (contact.email as string) ?? undefined,
            phone: (contact.phone as string) ?? undefined,
          },
          customData: { value: 0, currency: "EUR", contentName: "Abrió el test de personalidad" },
          eventSourceUrl: input.sourceUrl,
          triggeredBy: `funnel_test_personalidad_${input.via}`,
        }).catch((e) => console.error("[test-personalidad/cualificar] CAPI", e))
      } else {
        void logSkippedEvent({
          eventId: `cualificado-${contact.id}-${Date.now()}`,
          eventName: "test_personalidad_cualificado",
          url: input.sourceUrl,
          email: (contact.email as string) ?? null,
          funnel: "test-personalidad",
          reason: gate.reason ?? "medición apagada",
        })
      }
    }

    // El aviso al equipo va aparte del evento de Meta a propósito: no depende de quién
    // mande el evento. El setter tiene que enterarse igual venga por el botón o por el
    // correo. Una sola vez, cuando de verdad sube de columna.
    if (subio) {
      await notifyAdmins(admin, {
        title: "Lead cualificado · Test Personalidad",
        body: `${contact.full_name || contact.email || "Un contacto"} abrió el test. Escríbele antes que a los demás.`,
        type: "lead_cualificado",
        url: `/crm/contactos/${contact.id}`,
        data: { contact_id: contact.id, email: contact.email, via: input.via },
      })
    }

    return { cualificado: subio }
  } catch (e) {
    console.error("[test-personalidad/cualificar] fallo (no bloquea al lead)", e)
    return { cualificado: false }
  }
}
