import { notFound } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import { TestPersonalidadLanding } from "@/features/funnel-test-personalidad/components/landing"
import { isWebPublished } from "@/lib/webs/check-web-status"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Test de personalidad — Capital Hub",
  description:
    "Descubre qué tipo de emprendedor eres y qué camino te conviene para vivir de internet con high tickets.",
}

export default async function TestPersonalidadRoute() {
  noStore() // bypass Next.js data cache: el status puede cambiar desde /webs
  if (!(await isWebPublished("test-personalidad"))) {
    notFound()
  }
  return <TestPersonalidadLanding />
}
