import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { conCors, responderOpciones } from "@/lib/bunny-cors"
import { puedeConLaFormacion, quienLlama } from "@/lib/bunny-acceso"
import { hayStorage, subirLimpiando } from "@/lib/bunny-storage"
import { carpetaFormacion, nombreSeguro } from "@/lib/bunny-rutas"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 120

/**
 * POST /api/admin/bunny/documento
 *
 * Guarda el documento ORIGINAL con el que se montó una presentación, dentro de
 * la carpeta de su formación:
 *
 *   Formaciones/IA Integrator/Documentos/INTENSIVO BOOK.pdf
 *
 * Marco, 2026-07-30: *"guarda el documento original dentro de la misma carpeta
 * de formaciones para que esté ahí, para que no se pierda."*
 *
 * Antes el PDF se usaba para generar y se tiraba: en la base solo quedaba su
 * NOMBRE. Si el formador cerraba la pestaña a mitad, tenía que volver a subirlo.
 *
 * Body: { formacion, nombreArchivo, contenidoBase64 }
 */

/** Vercel corta las peticiones a 4,5 MB. Por debajo va sobrado para material. */
const MAX_BASE64 = 4 * 1024 * 1024

const Entrada = z.object({
  formacion: z.string().min(1).max(120),
  nombreArchivo: z.string().min(1).max(200),
  contenidoBase64: z.string().min(1),
})

export async function OPTIONS(req: NextRequest) {
  return responderOpciones(req)
}

export async function POST(req: NextRequest) {
  const permiso = await quienLlama(req.headers.get("authorization"))
  if (!permiso.ok) {
    return conCors(req, NextResponse.json({ error: permiso.motivo }, { status: permiso.estado }))
  }

  const cuerpo = Entrada.safeParse(await req.json().catch(() => ({})))
  if (!cuerpo.success) {
    return conCors(req, NextResponse.json({ error: "Petición incompleta." }, { status: 400 }))
  }
  const { formacion, nombreArchivo, contenidoBase64 } = cuerpo.data

  if (!puedeConLaFormacion(permiso, formacion)) {
    return conCors(req, NextResponse.json({ error: "Esa formación no es la tuya." }, { status: 403 }))
  }
  // Sin Storage configurado no se guarda, pero tampoco se rompe nada: la
  // presentación se genera igual. Es material de respaldo, no un requisito.
  if (!hayStorage()) {
    return conCors(req, NextResponse.json({ ok: true, omitido: "Bunny Storage sin configurar." }))
  }
  if (contenidoBase64.length > MAX_BASE64) {
    return conCors(
      req,
      NextResponse.json(
        { ok: true, omitido: "El documento pesa demasiado para archivarlo desde el navegador." },
        { status: 200 },
      ),
    )
  }

  try {
    const ruta = `${carpetaFormacion(formacion)}/Documentos/${nombreSeguro(nombreArchivo, "documento")}`
    await subirLimpiando(ruta, Buffer.from(contenidoBase64, "base64"))
    return conCors(req, NextResponse.json({ ok: true, ruta }))
  } catch (e) {
    console.error("[bunny/documento] falló", e)
    return conCors(
      req,
      NextResponse.json(
        { error: e instanceof Error ? e.message : "No se pudo guardar el documento." },
        { status: 500 },
      ),
    )
  }
}
