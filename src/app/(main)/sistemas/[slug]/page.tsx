import { notFound } from "next/navigation"
import { getSistema } from "@/features/sistemas/lib/systems"
import { WebinarWorkflow } from "@/features/sistemas/components/webinar-workflow"
import { getWebinarSettings } from "@/features/funnel-webinar/get-settings"
import { webinarTagName } from "@/features/funnel-webinar/config"

export const dynamic = "force-dynamic"

/**
 * Detalle de un sistema del hub. Cada slug renderiza su board visual.
 * Para añadir uno nuevo: entrada en el registro (systems.ts) + un case aquí.
 */
export default async function SistemaDetalleRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const sistema = getSistema(slug)
  if (!sistema) notFound()

  if (slug === "webinar") {
    // La fecha y el tag salen de los ajustes REALES del funnel → lo que se ve coincide
    // con lo que pasa de verdad (misma fecha, mismo tag whatsapp-webinar-DD_MM_YYYY).
    const settings = await getWebinarSettings()
    return (
      <WebinarWorkflow
        dateLabel={settings.dateLabel}
        tagName={webinarTagName(settings.webinarDate)}
        whatsappMessage={settings.whatsappMessage}
        emailWhatsappEnabled={settings.emailWhatsappEnabled}
      />
    )
  }

  notFound()
}
