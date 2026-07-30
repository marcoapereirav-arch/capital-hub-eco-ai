import { NextRequest, NextResponse } from "next/server"
import { conCors, responderOpciones } from "@/lib/bunny-cors"
import { quienLlama } from "@/lib/bunny-acceso"
import { hayStorage } from "@/lib/bunny-storage"
import { asegurarColecciones, asegurarEstructura } from "@/lib/bunny-estructura"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * POST /api/admin/bunny/estructura
 *
 * Monta el árbol base de Bunny ahora mismo, sin esperar al reloj:
 *
 *   Testimonios/
 *   VSLs/
 *   Formaciones/{IA Integrator, Comercial Closing, Clipper}/
 *
 * Normalmente NO hace falta llamarlo: el reloj del archivado lo monta solo en
 * cuanto encuentra las claves puestas. Esto es el empujón para no esperar.
 */

export async function OPTIONS(req: NextRequest) {
  return responderOpciones(req)
}

export async function POST(req: NextRequest) {
  const permiso = await quienLlama(req.headers.get("authorization"))
  if (!permiso.ok) {
    return conCors(req, NextResponse.json({ error: permiso.motivo }, { status: permiso.estado }))
  }
  if (!permiso.esSuperAdmin) {
    return conCors(
      req,
      NextResponse.json({ error: "Solo un administrador monta la estructura." }, { status: 403 }),
    )
  }
  if (!hayStorage()) {
    return conCors(
      req,
      NextResponse.json(
        { error: "Falta configurar Bunny Storage (BUNNY_STORAGE_ZONE y BUNNY_STORAGE_PASSWORD)." },
        { status: 503 },
      ),
    )
  }

  try {
    const carpetas = await asegurarEstructura()
    const colecciones = await asegurarColecciones()
    return conCors(
      req,
      NextResponse.json({ ok: true, carpetas: carpetas.creadas, colecciones: colecciones.creadas }),
    )
  } catch (e) {
    console.error("[bunny/estructura] falló", e)
    return conCors(
      req,
      NextResponse.json(
        { error: e instanceof Error ? e.message : "No se pudo montar la estructura." },
        { status: 500 },
      ),
    )
  }
}
