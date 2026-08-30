import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getProductosVendibles } from "@/lib/catalogo/productos"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/catalogo/productos
 * La lista de productos vendibles, para las pantallas del OS que necesitan
 * ofrecerla. Sale del catalogo real: nunca de una lista escrita a mano.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const productos = await getProductosVendibles()
    return NextResponse.json({ productos })
  } catch (e) {
    // FAIL-CLOSED: mejor que la pantalla diga que no puede cargar, a ofrecer
    // una lista inventada que deje al alumno sin acceso.
    return NextResponse.json(
      { error: "No se pudo cargar el catalogo", detail: (e as Error).message },
      { status: 503 }
    )
  }
}
