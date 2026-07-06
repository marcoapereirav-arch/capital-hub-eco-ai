import { WebinarLanding } from "@/features/funnel-webinar/components/landing"
import { getWebinarSettings } from "@/features/funnel-webinar/get-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Webinar en directo · Capital Hub",
  description:
    "Cómo dejar tu trabajo y vivir de internet ganando entre 2.000 € y 4.000 € al mes en menos de 90 días. Webinar en vivo, gratis.",
}

export default async function WebinarRoute() {
  const s = await getWebinarSettings()
  return <WebinarLanding dateLabel={s.dateLabel} />
}
