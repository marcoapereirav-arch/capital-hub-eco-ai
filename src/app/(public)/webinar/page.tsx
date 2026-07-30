import { WebinarLanding } from "@/features/funnel-webinar/components/landing"
import { getWebinarSettings } from "@/features/funnel-webinar/get-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Clase gratuita en directo · Capital Hub",
  description:
    "Cómo ganar de 2k a 4k al mes en menos de 90 días con una profesión digital aunque no tengas experiencia y partas de 0. Clase gratuita y en directo.",
}

export default async function WebinarRoute() {
  const s = await getWebinarSettings()
  return (
    /* Sin vídeo: el vídeo es de la página de gracias (post-registro). */
    <WebinarLanding
      dateLabel={s.dateLabel}
      webinarDate={s.webinarDate}
      webinarTime={s.webinarTime}
    />
  )
}
