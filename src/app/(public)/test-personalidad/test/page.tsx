import { TestPersonalidadTestLanding } from "@/features/funnel-test-personalidad/components/test-landing"
import { getTestPersonalidadSettings } from "@/features/funnel-test-personalidad/get-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Tu test de personalidad · Capital Hub",
  description: "Aquí tienes tu acceso al test. Son 15 minutos.",
  // Es una pagina de entrega privada (se llega por el email): fuera de buscadores.
  robots: { index: false, follow: false },
}

/**
 * Landing del test (paso 4 del funnel v2). Destino del boton del email.
 * Se llega aqui a traves de /api/funnel/test-personalidad/acceso, que ya ha marcado
 * al contacto como 'lead_cualificado'. Ver PRP-007.
 */
export default async function TestPersonalidadTestRoute() {
  const s = await getTestPersonalidadSettings()
  return <TestPersonalidadTestLanding testUrl={s.testUrl} whatsapp={s.whatsapp} instagram={s.instagram} />
}
