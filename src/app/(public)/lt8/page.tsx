import type { Metadata } from "next"
import FunnelLt8Page from "@/features/public-pages/funnel-lt8/funnel-lt8-page"

export const metadata: Metadata = {
  title: "Capital Hub — Tu primer trabajo remoto en menos de 90 días",
  description:
    "Formación en profesiones digitales con bolsa de empleo real. Empieza por 8€, 14 días gratis, garantía de 30 días.",
}

export default function Lt8Route() {
  return <FunnelLt8Page />
}
