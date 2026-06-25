import { ThanksAgenda } from "@/features/funnel-reservar/components/thanks-agenda"
import { getReservarSettings } from "@/features/funnel-reservar/get-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Sesión agendada · Capital Hub",
  description: "Tu sesión está reservada. Mira el vídeo y prepárate para sacarle el máximo partido.",
}

export default async function ReservarGraciasRoute() {
  const s = await getReservarSettings()
  return <ThanksAgenda videoGuid={s.videoGuid} libraryId={s.libraryId} testPath={s.testPath} />
}
