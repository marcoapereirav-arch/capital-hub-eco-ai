import { LoadingScreen } from "@/components/ui/loading-screen"

/**
 * Loading raíz de Next.js (App Router): se muestra AUTOMÁTICAMENTE como fallback
 * mientras carga cualquier ruta. Es el efecto de carga de marca por defecto del OS.
 */
export default function Loading() {
  return <LoadingScreen />
}
