import type { Metadata } from "next"
import { Suspense } from "react"
import MifgeUpsellAnualPage from "@/features/public-pages/funnel-mifge/upsell-anual-page"

export const metadata: Metadata = {
  title: "Capital Hub — Plan Anual",
  description: "Cambia a anual y ahorra 194€ + 2 meses gratis.",
}

// useSearchParams requiere Suspense boundary en App Router para prerender.
export const dynamic = "force-dynamic"

export default function MifgeUpsellAnualRoute() {
  return (
    <Suspense fallback={null}>
      <MifgeUpsellAnualPage />
    </Suspense>
  )
}
