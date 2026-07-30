import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"
import { conCors, responderOpciones } from "@/lib/bunny-cors"
import { puedeConLaFormacion, quienLlama } from "@/lib/bunny-acceso"
import { borrar, hayStorage } from "@/lib/bunny-storage"
import { deleteBunnyVideo } from "@/lib/bunny"
import { archivoLeccion, carpetaModulo } from "@/lib/bunny-rutas"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 120

/**
 * POST /api/admin/bunny/borrar
 *
 * Cuando se quita un vídeo, se quita DE VERDAD: del reproductor y del archivo.
 *
 * Marco, 2026-07-30: *"si quito el vídeo y borro aquí la lección, lo que debería
 * pasar es que se debería quitar de Bunny. Por lo que veo, sigue todavía ahí."*
 *
 * Tenía razón y era un agujero de los que crecen solos: cada vídeo reemplazado o
 * cada lección borrada dejaba su archivo en Bunny para siempre, ocupando y
 * ensuciando justo el orden que se acaba de montar.
 *
 * Body, una de estas dos:
 *   { leccionId: 12 }   el vídeo de esa lección
 *   { moduloId: 4 }     los vídeos de todas sus lecciones, y su carpeta
 *
 * **Se manda el id, nunca la ruta.** El servidor busca en la base a qué
 * formación pertenece y comprueba que quien llama puede con ella. Si el
 * navegador pudiera mandar una ruta, cualquiera con la consola abierta podría
 * pedir que se borrase otra cosa.
 *
 * Hay que llamarlo ANTES de borrar la fila: después ya no se sabe dónde vivía.
 */

const Entrada = z
  .object({
    leccionId: z.number().int().positive().optional(),
    moduloId: z.number().int().positive().optional(),
  })
  .refine((v) => Boolean(v.leccionId) !== Boolean(v.moduloId), {
    message: "Manda una lección o un módulo, no las dos ni ninguna.",
  })

type FilaLeccion = {
  id: number
  title: string | null
  bunny_video_id: string | null
  bunny_storage_path: string | null
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

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
  const { leccionId, moduloId } = cuerpo.data
  const cliente = admin()

  try {
    // 1. De qué módulo y formación estamos hablando.
    const idModulo =
      moduloId ??
      (
        await cliente.from("lessons").select("module_id").eq("id", leccionId!).maybeSingle()
      ).data?.module_id

    if (!idModulo) {
      return conCors(req, NextResponse.json({ error: "No existe." }, { status: 404 }))
    }

    const { data: modulo } = await cliente
      .from("modules")
      .select("name, formations:formation_id(routes:route_id(name))")
      .eq("id", idModulo)
      .maybeSingle()

    const nombreModulo = (modulo as { name?: string } | null)?.name
    const formacion = (
      modulo as { formations?: { routes?: { name?: string } } } | null
    )?.formations?.routes?.name

    if (!nombreModulo || !formacion) {
      return conCors(req, NextResponse.json({ error: "No existe." }, { status: 404 }))
    }
    if (!puedeConLaFormacion(permiso, formacion)) {
      return conCors(req, NextResponse.json({ error: "Esa formación no es la tuya." }, { status: 403 }))
    }

    // 2. Qué lecciones se llevan su vídeo por delante.
    const consulta = cliente
      .from("lessons")
      .select("id, title, bunny_video_id, bunny_storage_path")
    const { data } = leccionId
      ? await consulta.eq("id", leccionId)
      : await consulta.eq("module_id", idModulo)

    const filas = (data ?? []) as FilaLeccion[]
    const borrados: string[] = []
    const fallos: string[] = []

    for (const fila of filas) {
      if (fila.bunny_video_id) {
        try {
          await deleteBunnyVideo(fila.bunny_video_id)
        } catch (e) {
          fallos.push(`reproductor: ${e instanceof Error ? e.message : "error"}`)
        }
      }
      if (hayStorage()) {
        // La ruta guardada es la de verdad; la calculada cubre el caso de que el
        // reloj todavía no hubiera pasado a anotarla.
        const rutas = new Set(
          [
            fila.bunny_storage_path,
            archivoLeccion(formacion, nombreModulo, fila.title ?? ""),
          ].filter(Boolean) as string[],
        )
        for (const ruta of rutas) {
          await borrar(ruta).catch(() => {})
        }
      }
      if (fila.bunny_video_id) borrados.push(fila.title || `lección ${fila.id}`)
    }

    // 3. Si se va el módulo entero, se va también su carpeta.
    if (moduloId && hayStorage()) {
      await borrar(carpetaModulo(formacion, nombreModulo), true).catch(() => {})
    }

    return conCors(req, NextResponse.json({ ok: true, borrados, fallos }))
  } catch (e) {
    console.error("[bunny/borrar] falló", e)
    return conCors(
      req,
      NextResponse.json(
        { error: e instanceof Error ? e.message : "No se pudo borrar de Bunny." },
        { status: 500 },
      ),
    )
  }
}
