import type { Metadata } from "next"
import { Entrenamiento1 } from "@/features/formacion-ia-integrator/components/entrenamiento-1"

export const metadata: Metadata = {
  title: "Entrenamiento 1 · Cómo funciona todo · IA Integrator · Capital Hub",
  description:
    "Cómo funciona construir un software con IA por dentro: frontend y backend, el viaje de tu código, las API keys, la base de datos y la regla de oro.",
}

export default function Entrenamiento1Page() {
  return <Entrenamiento1 />
}
