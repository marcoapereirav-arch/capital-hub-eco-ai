import type { Metadata } from "next"
import MifgeCheckoutPage from "@/features/public-pages/funnel-mifge/checkout-page"

export const metadata: Metadata = {
  title: "Capital Hub — Activa tu prueba gratuita",
  description: "14 días gratis · No se cobra nada hoy.",
}

export default function MifgeCheckoutRoute() {
  return <MifgeCheckoutPage />
}
