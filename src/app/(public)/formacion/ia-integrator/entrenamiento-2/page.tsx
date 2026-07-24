import type { Metadata } from "next"
import { Entrenamiento2 } from "@/features/formacion-ia-integrator/components/entrenamiento-2"

export const metadata: Metadata = {
  title: "Entrenamiento 2 · Cómo usar el sistema · IA Integrator · Capital Hub",
  description:
    "Lo que haces tú cada día: abrir sesión con /primer, decir tu objetivo, aprobar el plan, revisarlo, publicar y cerrar.",
}

export default function Entrenamiento2Page() {
  return <Entrenamiento2 />
}
