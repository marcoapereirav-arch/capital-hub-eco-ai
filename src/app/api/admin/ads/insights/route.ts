import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { pedirInsights, periodoAnterior, type RangoFechas } from "@/lib/meta/insights"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/admin/ads/insights?from=AAAA-MM-DD&to=AAAA-MM-DD
 *
 * Los totales del periodo que se pide, más los del periodo anterior equivalente para poder
 * decir si algo sube o baja.
 *
 * Las fechas llegan SIEMPRE como rango explícito desde el filtro del OS. Antes esta ruta
 * aceptaba los atajos de Meta (`date_preset=last_30d`) y por eso Ads tenía sus propios
 * botones de periodo, distintos de los del resto del OS. Ver SOP producto/58.
 */

const CAMPOS = [
  "spend",
  "impressions",
  "reach",
  "frequency",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "actions",
  "action_values",
]

function leerRango(req: NextRequest): RangoFechas | null {
  const from = req.nextUrl.searchParams.get("from")
  const to = req.nextUrl.searchParams.get("to")
  if (!from || !to) return null
  const desde = new Date(`${from}T00:00:00`)
  const hasta = new Date(`${to}T23:59:59`)
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) return null
  if (desde > hasta) return null
  return { from: desde, to: hasta }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rango = leerRango(req)
  if (!rango) {
    return NextResponse.json(
      { configured: true, error: "Faltan las fechas o están mal (se esperan from y to)" },
      { status: 400 }
    )
  }

  // El periodo actual y el anterior se piden a la vez: así la comparativa no tarda el
  // doble ni llega a destiempo.
  const [actual, anterior] = await Promise.all([
    pedirInsights({ rango, campos: CAMPOS }),
    pedirInsights({ rango: periodoAnterior(rango), campos: CAMPOS }),
  ])

  if (!actual.ok) {
    return NextResponse.json(
      { configured: !actual.sinPermiso, error: actual.error, sinPermiso: actual.sinPermiso },
      { status: 200 }
    )
  }

  return NextResponse.json({
    configured: true,
    data: actual.filas,
    // Si el anterior falla no se rompe la pantalla: simplemente no hay comparativa.
    anterior: anterior.ok ? anterior.filas : [],
  })
}
