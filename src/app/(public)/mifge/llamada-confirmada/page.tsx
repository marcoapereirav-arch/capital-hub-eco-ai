import type { Metadata } from "next"
import MifgeAgendaThanksPage from "@/features/public-pages/funnel-mifge/agenda-thanks-page"

export const metadata: Metadata = {
  title: "Capital Hub — Llamada confirmada",
  description: "Tu llamada con Adrián está confirmada.",
}

export default function MifgeAgendaThanksRoute() {
  return <MifgeAgendaThanksPage />
}
