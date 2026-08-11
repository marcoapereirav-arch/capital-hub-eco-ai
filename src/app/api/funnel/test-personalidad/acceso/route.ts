import { NextResponse } from "next/server"
import { cualificarPorAccesoAlTest } from "@/features/funnel-test-personalidad/cualificar"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/funnel/test-personalidad/acceso?c=<slug>
 *
 * Destino del botón del email del paso intermedio (flujo v2). Ese paso está EN PAUSA
 * desde el 2026-08-11 (funnel directo, ver SOP marketing/07), así que hoy este endpoint
 * no recibe tráfico. Se mantiene vivo y funcionando a propósito: si Marco vuelve a
 * encender el paso intermedio desde el engranaje de /webs, los emails que ya estuvieran
 * programados y los que se manden después siguen aterrizando bien.
 *
 * Toda la lógica de calificación vive en `cualificarPorAccesoAlTest`, compartida con el
 * botón «Abrir el test» de la página. Un solo sitio, un solo comportamiento.
 *
 * REGLA DURA: este endpoint NUNCA le falla al lead. Sin slug, con un slug que no existe,
 * con la BD caída o con Meta caído, IGUALMENTE redirige a la landing del test.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const slug = url.searchParams.get("c")?.trim() || null

  // El destino se calcula lo primero, para poder redirigir pase lo que pase.
  const destino = new URL("/test-personalidad/test", url.origin)
  if (slug) destino.searchParams.set("c", slug)

  // conCapi: aquí no hay navegador nuestro (el lead viene de su bandeja de entrada), así
  // que si el evento no sale desde el servidor no sale de ningún sitio.
  await cualificarPorAccesoAlTest({
    slug,
    sourceUrl: destino.toString(),
    via: "email",
    conCapi: true,
  })

  return NextResponse.redirect(destino, { status: 302 })
}
