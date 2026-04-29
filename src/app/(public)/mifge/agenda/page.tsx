import type { Metadata } from "next"
import MifgeAgendaPage from "@/features/public-pages/funnel-mifge/agenda-page"

export const metadata: Metadata = {
  title: "Capital Hub — Agenda 20 min con Adrián",
  description: "Llamada gratuita de diagnóstico personalizado.",
}

export default function MifgeAgendaRoute() {
  return <MifgeAgendaPage />
}
