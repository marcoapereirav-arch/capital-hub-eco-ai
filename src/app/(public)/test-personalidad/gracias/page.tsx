import { TestPersonalidadThankYou } from "@/features/funnel-test-personalidad/components/thank-you"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Gracias · Capital Hub",
  description: "Tu test está listo. Aquí tienes el link para hacerlo.",
}

export default function TestPersonalidadGraciasRoute() {
  return <TestPersonalidadThankYou />
}
