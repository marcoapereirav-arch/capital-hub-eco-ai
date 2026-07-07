import { WebinarLanding } from "@/features/funnel-webinar/components/landing"
import { getWebinarSettings } from "@/features/funnel-webinar/get-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Webinar en directo · Capital Hub",
  description:
    "En enero de 2022 dejé mi trabajo y gané 4.000 € al mes. Te enseño a hacer lo mismo en menos de 90 días. Webinar en vivo y gratis.",
}

export default async function WebinarRoute() {
  const s = await getWebinarSettings()
  return <WebinarLanding dateLabel={s.dateLabel} />
}
