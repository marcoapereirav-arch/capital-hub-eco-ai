import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { conCors, responderOpciones } from "@/lib/bunny-cors"
import { puedeConLaFormacion, quienLlama } from "@/lib/bunny-acceso"
import { asegurarCarpeta, hayStorage, moverCarpeta } from "@/lib/bunny-storage"
import { carpetaModulo, nombreSeguro } from "@/lib/bunny-rutas"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300

/**
 * POST /api/admin/bunny/carpeta
 *
 * La carpeta del módulo, que sigue al módulo.
 *
 * Marco, 2026-07-30: *"si el formador crea un módulo que se llama 'módulo uno',
 * entonces debe crearse una subcarpeta que se llame 'módulo uno'"*.
 *
 * Body:
 *   { formacion: "IA Integrator", modulo: "Módulo 1" }
 *      crea la carpeta si no está.
 *
 *   { formacion: "IA Integrator", modulo: "Fundamentos", moduloAnterior: "Módulo 1" }
 *      el formador renombró el módulo: la carpeta se mueve con sus vídeos dentro.
 *      Si no se moviera, el mismo módulo acabaría con dos carpetas y el orden se
 *      rompería justo por lo que se creó.
 */

const Entrada = z.object({
  formacion: z.string().min(1).max(120),
  modulo: z.string().min(1).max(120),
  moduloAnterior: z.string().min(1).max(120).optional(),
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
    return conCors(req, NextResponse.json({ error: "Faltan la formación y el módulo." }, { status: 400 }))
  }
  const { formacion, modulo, moduloAnterior } = cuerpo.data

  if (!puedeConLaFormacion(permiso, formacion)) {
    return conCors(
      req,
      NextResponse.json({ error: "Esa formación no es la tuya." }, { status: 403 }),
    )
  }

  // Sin Storage configurado esto no puede hacer nada, pero tampoco debe tumbar
  // al formador: que cree su módulo igual y las carpetas se pongan al día luego.
  if (!hayStorage()) {
    return conCors(req, NextResponse.json({ ok: true, omitido: "Bunny Storage sin configurar." }))
  }

  try {
    const destino = carpetaModulo(formacion, modulo)
    let movidos = 0

    if (moduloAnterior && nombreSeguro(moduloAnterior) !== nombreSeguro(modulo)) {
      movidos = await moverCarpeta(carpetaModulo(formacion, moduloAnterior), destino)
    }

    await asegurarCarpeta(destino, `Aqui van los videos de las lecciones de "${modulo}".`)
    return conCors(req, NextResponse.json({ ok: true, carpeta: destino, movidos }))
  } catch (e) {
    console.error("[bunny/carpeta] falló", e)
    return conCors(
      req,
      NextResponse.json(
        { error: e instanceof Error ? e.message : "No se pudo preparar la carpeta." },
        { status: 500 },
      ),
    )
  }
}
