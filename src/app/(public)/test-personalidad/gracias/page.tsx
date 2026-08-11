import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { TestPersonalidadThankYou } from "@/features/funnel-test-personalidad/components/thank-you"
import { getTestPersonalidadSettings } from "@/features/funnel-test-personalidad/get-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Gracias · Capital Hub",
  description: "Tu test llega a tu correo en unos minutos. Mientras tanto, mira este vídeo.",
  // Página del paso intermedio, hoy en pausa. Fuera de buscadores para que nadie
  // aterrice aquí desde Google en un paso que ahora mismo no existe en el recorrido.
  robots: { index: false, follow: false },
}

/**
 * Página de gracias del paso intermedio: VSL + Calendly embebido.
 *
 * EN PAUSA desde el 2026-08-11 (Marco): el funnel va directo del formulario al test.
 * No se ha borrado nada. Si alguien llega aquí con el paso apagado —un enlace viejo, el
 * botón atrás, un email antiguo— se le manda al test en vez de dejarlo en una página que
 * le promete un correo que ya no va a llegar. Encender el interruptor «paso intermedio»
 * en el engranaje de /webs devuelve esta página al recorrido sin tocar código.
 *
 * Recibe `?c=<slug>` (slug opaco del contacto, puesto por el opt-in). Se resuelve
 * AQUÍ, en el server, para poder prellenar el Calendly con nombre y email sin
 * exponerlos nunca en la query string. Si no hay slug o falla la BD, la página
 * funciona igual, solo que el lead tendrá que teclear sus datos en el Calendly.
 */
async function resolveLead(slug: string | undefined) {
  if (!slug) return {}
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await admin
      .from("contacts")
      .select("full_name, email")
      .eq("slug", slug)
      .maybeSingle()
    return {
      leadName: (data?.full_name as string) || undefined,
      leadEmail: (data?.email as string) || undefined,
    }
  } catch {
    return {}
  }
}

export default async function TestPersonalidadGraciasRoute({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const [{ c }, s] = await Promise.all([searchParams, getTestPersonalidadSettings()])

  // Paso intermedio apagado: esta página no forma parte del recorrido. Al test, con su
  // slug si lo trae, para que igualmente se le pueda marcar como Lead cualificado.
  if (!s.pasoIntermedio) {
    redirect(c ? `/test-personalidad/test?c=${encodeURIComponent(c)}` : "/test-personalidad/test")
  }

  const lead = await resolveLead(c)

  return (
    <>
      {/* Carga rápida de Calendly: conecta y precarga el widget antes de que corra el JS */}
      <link rel="preconnect" href="https://assets.calendly.com" />
      <link rel="preconnect" href="https://calendly.com" />
      <link rel="dns-prefetch" href="https://assets.calendly.com" />
      <link rel="preload" as="script" href="https://assets.calendly.com/assets/external/widget.js" />
      <TestPersonalidadThankYou
        videoGuid={s.videoGuid}
        bunnyLibraryId={s.bunnyLibraryId}
        calendlyUrl={s.calendlyUrl}
        emailDelayMinutes={s.emailDelayMinutes}
        leadName={lead.leadName}
        leadEmail={lead.leadEmail}
      />
    </>
  )
}
