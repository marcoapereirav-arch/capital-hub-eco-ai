import type { Metadata } from "next"
import { FormacionPortada } from "@/features/formacion-ia-integrator/components/portada"

export const metadata: Metadata = {
  title: "Formación IA Integrator · Capital Hub",
  description: "Aprende a construir software hablándole a una IA. Los manuales de la formación IA Integrator, en versión visual.",
}

export default function FormacionIaIntegratorPage() {
  return <FormacionPortada />
}
