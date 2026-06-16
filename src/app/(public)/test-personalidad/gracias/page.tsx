import { notFound } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import { TestPersonalidadThankYou } from "@/features/funnel-test-personalidad/components/thank-you"
import { isWebPublished } from "@/lib/webs/check-web-status"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Gracias · Capital Hub",
  description: "Tu test está listo. Aquí tienes el link para hacerlo.",
}

export default async function TestPersonalidadGraciasRoute() {
  noStore()
  if (!(await isWebPublished("test-personalidad"))) {
    notFound()
  }
  return <TestPersonalidadThankYou />
}
