import type { Metadata } from "next"
import CheckoutPage from "@/features/public-pages/funnel-lt8/checkout-page"

export const metadata: Metadata = {
  title: "Capital Hub — Checkout",
  description: "Completa tu acceso por 8€. 14 días gratis. Garantía 30 días.",
}

export default function CheckoutRoute() {
  return <CheckoutPage />
}
