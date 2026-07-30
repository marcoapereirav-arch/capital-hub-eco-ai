import { WebinarThankYou } from "@/features/funnel-webinar/components/thank-you"
import { getWebinarSettings } from "@/features/funnel-webinar/get-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Tu plaza está reservada · Capital Hub",
  description: "Mira el vídeo y escríbenos por WhatsApp para conseguir tu entrada al directo.",
}

export default async function WebinarGraciasRoute({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const [{ c }, s] = await Promise.all([searchParams, getWebinarSettings()])
  return (
    <WebinarThankYou
      whatsappNumber={s.whatsappNumber}
      whatsappMessage={s.whatsappMessage}
      dateLabel={s.dateLabel}
      webinarDate={s.webinarDate}
      webinarTime={s.webinarTime}
      videoGuid={s.videoGuid}
      bunnyLibraryId={s.bunnyLibraryId}
      slug={c}
    />
  )
}
