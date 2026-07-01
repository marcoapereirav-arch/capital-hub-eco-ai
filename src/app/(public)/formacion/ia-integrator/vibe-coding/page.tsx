import type { Metadata } from "next"
import { VibeCodingAlGrano } from "@/features/formacion-ia-integrator/components/vibe-coding-al-grano"

export const metadata: Metadata = {
  title: "Vibe Coding (al grano) · IA Integrator · Capital Hub",
  description: "Construye tu software hablándole a una IA. El método entero: los 4 lugares, main vs rama, commit/push/merge y tu vocabulario.",
}

export default function VibeCodingPage() {
  return <VibeCodingAlGrano />
}
