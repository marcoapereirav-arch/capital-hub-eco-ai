import { Suspense } from "react"
import { BookingEmbed } from "@/features/funnel-reservar/components/booking-embed"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Reserva tu sesión — Capital Hub",
  description: "Elige el día y la hora de tu sesión de orientación profesional con Capital Hub.",
}

export default function ReservarRoute() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", backgroundColor: "#0F0F12" }} />}>
      <BookingEmbed />
    </Suspense>
  )
}
