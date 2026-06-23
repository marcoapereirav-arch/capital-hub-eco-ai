import { TestPersonalidadThankYou } from "@/features/funnel-test-personalidad/components/thank-you"
import { getTestPersonalidadSettings } from "@/features/funnel-test-personalidad/get-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Gracias · Capital Hub",
  description: "Tu test está listo. Aquí tienes el link para hacerlo.",
}

export default async function TestPersonalidadGraciasRoute() {
  const s = await getTestPersonalidadSettings()
  return <TestPersonalidadThankYou testUrl={s.testUrl} whatsapp={s.whatsapp} instagram={s.instagram} />
}
