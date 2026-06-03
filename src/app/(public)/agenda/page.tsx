import type { Metadata } from "next"
import { Suspense } from "react"
import { AgendaPublica } from "@/features/calendario/components/agenda-publica"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Reserva tu llamada con Adrián — Capital Hub",
  description: "Agenda 20 minutos con Adrián. Vídeollamada por Zoom.",
  robots: { index: false, follow: false },
}

export default function AgendaRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0F12]" />}>
      <AgendaPublica />
    </Suspense>
  )
}
