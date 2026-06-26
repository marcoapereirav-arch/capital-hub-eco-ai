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
    <>
      {/* Carga rápida de Calendly: conecta y precarga el widget antes de que corra el JS */}
      <link rel="preconnect" href="https://assets.calendly.com" />
      <link rel="preconnect" href="https://calendly.com" />
      <link rel="dns-prefetch" href="https://assets.calendly.com" />
      <link rel="preload" as="script" href="https://assets.calendly.com/assets/external/widget.js" />
      <Suspense fallback={<LoadingScreen />}>
        <BookingEmbed />
      </Suspense>
    </>
  )
}
