import { Suspense } from "react"
import { BookingEmbed } from "@/features/funnel-reservar/components/booking-embed"
import { LoadingScreen } from "@/components/ui/loading-screen"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Reserva tu sesión — Capital Hub",
  description: "Elige el día y la hora de tu sesión de orientación profesional con Capital Hub.",
}

export default function ReservarRoute() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <BookingEmbed />
    </Suspense>
  )
}
