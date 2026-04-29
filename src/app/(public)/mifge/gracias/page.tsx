import type { Metadata } from "next"
import MifgeThanksPage from "@/features/public-pages/funnel-mifge/thanks-page"

export const metadata: Metadata = {
  title: "Capital Hub — ¡Bienvenido!",
  description: "Tu prueba gratuita está activa.",
}

export default function MifgeThanksRoute() {
  return <MifgeThanksPage />
}
