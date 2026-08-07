import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMarketingToken } from "@/lib/meta/marketing-token"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/admin/ads/insights?preset=last_30d
 *
 * Devuelve metricas agregadas de Meta Ads (Facebook + Instagram) para el
 * ad account configurado en META_AD_ACCOUNT_ID.
 *
 * Necesita un Marketing API access token con permisos `ads_read`. Si solo
 * tenemos CAPI token (conversiones) devolveremos un error claro para que el
 * usuario sepa que tiene que generar uno especifico.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accountId = process.env.META_AD_ACCOUNT_ID
  // La llave de lectura se busca primero donde la guarda el equipo desde Ads, Ajustes.
  // Si no hay, cae al fichero de entorno, y en último caso a la de conversiones (que NO
  // sirve para leer, pero deja que el mensaje de error explique exactamente qué falta).
  const accessToken =
    (await getMarketingToken()) ?? process.env.META_CAPI_TOKEN
  if (!accountId || !accessToken) {
    return NextResponse.json({
      configured: false,
      error: "Falta META_AD_ACCOUNT_ID o META_MARKETING_API_TOKEN en .env",
    }, { status: 200 })
  }

  const preset = req.nextUrl.searchParams.get("preset") ?? "last_30d"
  const fields = [
    "spend",
    "impressions",
    "clicks",
    "cpc",
    "ctr",
    "cpm",
    "reach",
    "frequency",
    "actions",
    "action_values",
  ].join(",")

  const url = `https://graph.facebook.com/v19.0/act_${accountId}/insights?date_preset=${preset}&fields=${fields}&access_token=${accessToken}`

  try {
    const res = await fetch(url, { cache: "no-store" })
    const json = await res.json() as { data?: unknown[]; error?: { message: string; code?: number } }
    if (json.error) {
      return NextResponse.json({
        configured: true,
        error: json.error.message,
        code: json.error.code,
      }, { status: 200 })
    }
    return NextResponse.json({ configured: true, data: json.data ?? [] })
  } catch (e) {
    return NextResponse.json({
      configured: true,
      error: e instanceof Error ? e.message : "fetch failed",
    }, { status: 200 })
  }
}
