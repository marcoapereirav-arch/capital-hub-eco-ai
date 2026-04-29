import type { Metadata } from "next"
import AgendaThanksPage from "@/features/public-pages/funnel-lt8/agenda-thanks-page"

export const metadata: Metadata = {
  title: "Capital Hub — Llamada confirmada",
  description: "Tu llamada con Adrián está confirmada. Antes de la llamada.",
}

export default function AgendaThankYouRoute() {
  return <AgendaThanksPage />
}
