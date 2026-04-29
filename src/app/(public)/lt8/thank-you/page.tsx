import type { Metadata } from "next"
import ThanksPage from "@/features/public-pages/funnel-lt8/thanks-page"

export const metadata: Metadata = {
  title: "Capital Hub — ¡Bienvenido!",
  description: "Tu acceso está listo. Próximos pasos para empezar.",
}

export default function ThankYouRoute() {
  return <ThanksPage />
}
