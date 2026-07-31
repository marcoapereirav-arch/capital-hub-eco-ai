import { NextRequest, NextResponse } from "next/server"
import { exigirAdmin } from "@/features/tutoriales/services/acceso"
import { idDeLoom } from "@/features/tutoriales/types"

export const dynamic = "force-dynamic"

/**
 * GET /api/tutoriales/loom?url=<link de Loom>
 *
 * Le pregunta a Loom por el video para rellenar la ficha sola: titulo, duracion
 * y miniatura. Asi Marco pega el link y no tiene que escribir nada.
 *
 * Se usa el oEmbed oficial de Loom (comprobado el 2026-07-31 contra un video
 * real: devuelve title, duration y thumbnail_url).
 *
 * Se llama desde el servidor, no desde el navegador, porque Loom no permite
 * llamarlo desde otro dominio.
 */
export async function GET(req: NextRequest) {
  const rechazo = await exigirAdmin()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const url = req.nextUrl.searchParams.get("url") ?? ""
  const id = idDeLoom(url)
  if (!id) return NextResponse.json({ error: "Ese link no parece de Loom." }, { status: 400 })

  try {
    const r = await fetch(`https://www.loom.com/v1/oembed?url=https://www.loom.com/share/${id}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    /* Que Loom no conteste NO es motivo para bloquear.
     *
     * El video se guarda igual y se reproduce igual: lo unico que se pierde es
     * rellenar el titulo solo. Devolvemos vacio y la pantalla deja que Marco lo
     * escriba a mano. Fallar aqui seria impedirle guardar por un adorno. */
    if (!r.ok) return NextResponse.json({ datos: null })

    const j = (await r.json()) as { title?: string; duration?: number; thumbnail_url?: string }

    return NextResponse.json({
      datos: {
        titulo: j.title ?? null,
        duracion_seg: typeof j.duration === "number" ? Math.round(j.duration) : null,
        miniatura: j.thumbnail_url ?? null,
      },
    })
  } catch (e) {
    console.error("[tutoriales/loom]", e)
    return NextResponse.json({ datos: null })
  }
}
