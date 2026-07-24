import type { Metadata } from "next"
import { Entrenamiento3 } from "@/features/formacion-ia-integrator/components/entrenamiento-3"

export const metadata: Metadata = {
  title: "Entrenamiento 3 · Trabajar en equipo · IA Integrator · Capital Hub",
  description:
    "Cuando en tu proyecto trabaja más de una persona: meter a alguien nuevo, el día a día, los conflictos y las reglas del equipo.",
}

export default function Entrenamiento3Page() {
  return <Entrenamiento3 />
}
