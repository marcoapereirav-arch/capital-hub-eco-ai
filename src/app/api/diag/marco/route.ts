import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service"

/**
 * Recoge las medidas REALES del telefono de Marco y las guarda.
 *
 * Existe porque la franja negra de abajo se me ha escapado cinco veces: yo mido en
 * un navegador donde las zonas seguras valen CERO, asi que cada intento era una
 * hipotesis.
 *
 * Dos cosas que ya salieron mal y por eso el filtro vive AQUI, en el servidor, y
 * no en el navegador:
 *   1. La primera medida llego desde el Mac de Marco y piso la del telefono.
 *   2. La segunda la piso mi propio robot de verificacion (HeadlessChrome), que
 *      abre la web al terminar de publicar.
 * Filtrar en el navegador no bastaba: hasta que el telefono no se traiga el codigo
 * nuevo, sigue mandando el viejo.
 *
 * Ademas se guarda HISTORICO (las ultimas 10), no un solo valor: asi nada puede
 * volver a pisar la medida buena.
 *
 * Es TEMPORAL. Se borra en cuanto la franja quede resuelta.
 */
export const dynamic = "force-dynamic"

const CLAVE = "diag_movil"
const CUANTAS_GUARDO = 10

export async function POST(req: Request) {
  try {
    const ua = req.headers.get("user-agent") ?? ""

    // Solo telefonos de verdad. Fuera ordenadores y fuera robots.
    const esTelefono = /iPhone|iPad|iPod|Android/i.test(ua)
    const esRobot = /Headless|bot|Playwright|Puppeteer/i.test(ua)
    if (!esTelefono || esRobot) {
      return NextResponse.json({ ok: true, guardado: false })
    }

    const medidas = await req.json()
    const supabase = createServiceRoleClient()

    const { data: previo } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", CLAVE)
      .maybeSingle()

    const historico = Array.isArray(previo?.value?.historico) ? previo.value.historico : []
    historico.unshift({ ...medidas, ua: ua.slice(0, 140), cuando: new Date().toISOString() })

    await supabase.from("app_settings").upsert(
      {
        key: CLAVE,
        value: { historico: historico.slice(0, CUANTAS_GUARDO) },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    )

    return NextResponse.json({ ok: true, guardado: true })
  } catch {
    // Nunca puede romper la app: si falla, se calla.
    return NextResponse.json({ ok: false })
  }
}
