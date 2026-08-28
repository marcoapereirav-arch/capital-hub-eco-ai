import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDatosPanel } from "@/lib/meta/panel"
import type { RangoFechas } from "@/lib/meta/insights"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/admin/ads/panel?from=AAAA-MM-DD&to=AAAA-MM-DD
 *
 * Todo lo que pinta el panel de Campañas en una sola llamada: totales, periodo anterior
 * para comparar, embudo, evolución día a día y desglose por campaña.
 *
 * Las fechas llegan SIEMPRE como rango explícito desde el filtro del OS, nunca como atajo
 * de Meta. Ver SOP producto/58.
 */
function leerRango(req: NextRequest): RangoFechas | null {
  const from = req.nextUrl.searchParams.get("from")
  const to = req.nextUrl.searchParams.get("to")
  if (!from || !to) return null
  const desde = new Date(`${from}T00:00:00`)
  const hasta = new Date(`${to}T23:59:59`)
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime()) || desde > hasta) return null
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
      { ok: false, error: "Faltan las fechas o están mal", sinPermiso: false },
      { status: 400 }
    )
  }

  // Lo marcado con casillas llega como lista separada por comas. Vacio = cuenta entera.
  const lista = (k: string) =>
    (req.nextUrl.searchParams.get(k) ?? "").split(",").map((x) => x.trim()).filter(Boolean)

  return NextResponse.json(
    await getDatosPanel(rango, {
      campanas: lista("campanas"),
      conjuntos: lista("conjuntos"),
      anuncios: lista("anuncios"),
    })
  )
}
