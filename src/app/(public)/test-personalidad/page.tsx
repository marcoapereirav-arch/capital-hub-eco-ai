import { TestPersonalidadLanding } from "@/features/funnel-test-personalidad/components/landing"

// Marco 2026-06-16: la landing se muestra SIEMPRE (sin bloqueo de draft/published)
// hasta que tengamos el diseno final aprobado. El toggle de /webs queda para uso futuro.

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Test de personalidad — Capital Hub",
  description:
    "Descubre qué tipo de emprendedor eres y qué camino te conviene para vivir de internet con high tickets.",
}

export default function TestPersonalidadRoute() {
  return <TestPersonalidadLanding />
}
