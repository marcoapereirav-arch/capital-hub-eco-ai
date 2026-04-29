import type { Metadata } from "next"
import FunnelMifgePage from "@/features/public-pages/funnel-mifge/funnel-mifge-page"

export const metadata: Metadata = {
  title: "Capital Hub — Empieza GRATIS tu carrera digital",
  description: "Prueba 14 días gratis sin pagar nada. Cancela cuando quieras. Después 97€/mes si te quedas.",
}

export default function MifgeRoute() {
  return <FunnelMifgePage />
}
