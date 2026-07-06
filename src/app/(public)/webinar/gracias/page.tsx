import { WebinarThankYou } from "@/features/funnel-webinar/components/thank-you"
import { getWebinarSettings } from "@/features/funnel-webinar/get-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Tu plaza está reservada · Capital Hub",
  description: "Entra al grupo de WhatsApp para recibir el link del directo.",
}

export default async function WebinarGraciasRoute() {
  const s = await getWebinarSettings()
  return <WebinarThankYou whatsappGroup={s.whatsappGroup} dateLabel={s.dateLabel} />
}
