import { TestPersonalidadLanding } from "@/features/funnel-test-personalidad/components/landing"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Test de personalidad — Capital Hub",
  description:
    "Descubre qué tipo de emprendedor eres y qué camino te conviene para vivir de internet con high tickets.",
}

export default function TestPersonalidadRoute() {
  return <TestPersonalidadLanding />
}
