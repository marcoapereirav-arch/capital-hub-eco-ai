import { notFound } from "next/navigation"
import { TestPersonalidadLanding } from "@/features/funnel-test-personalidad/components/landing"
import { isWebPublished } from "@/lib/webs/check-web-status"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Test de personalidad — Capital Hub",
  description:
    "Descubre qué tipo de emprendedor eres y qué camino te conviene para vivir de internet con high tickets.",
}

export default async function TestPersonalidadRoute() {
  // Si el funnel está en 'draft' o no existe → 404 público
  if (!(await isWebPublished("test-personalidad"))) {
    notFound()
  }
  return <TestPersonalidadLanding />
}
