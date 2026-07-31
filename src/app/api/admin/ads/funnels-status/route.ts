import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getFunnelsStatus } from "@/lib/meta/funnels-status"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/admin/ads/funnels-status
 *
 * La foto de la medición para la pantalla de Eventos de Ads. El cálculo vive en
 * `lib/meta/funnels-status` porque lo comparte con el board del sistema visual: un solo
 * sitio que lo decide, dos vistas que no se pueden contradecir.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json(await getFunnelsStatus())
}
