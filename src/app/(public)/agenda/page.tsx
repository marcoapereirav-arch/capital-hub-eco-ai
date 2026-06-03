import type { Metadata } from "next"
import { AgendaPublica } from "@/features/calendario/components/agenda-publica"

export const metadata: Metadata = {
  title: "Reserva tu llamada con Adrián — Capital Hub",
  description: "Agenda 20 minutos con Adrián. Vídeollamada por Zoom.",
  robots: { index: false, follow: false },
}

export default function AgendaRoute() {
  return <AgendaPublica />
}
