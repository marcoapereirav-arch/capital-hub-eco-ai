import type { Metadata } from "next"
import MifgeUpsellAnualPage from "@/features/public-pages/funnel-mifge/upsell-anual-page"

export const metadata: Metadata = {
  title: "Capital Hub — Plan Anual",
  description: "Cambia a anual y ahorra 194€ + 2 meses gratis.",
}

export default function MifgeUpsellAnualRoute() {
  return <MifgeUpsellAnualPage />
}
