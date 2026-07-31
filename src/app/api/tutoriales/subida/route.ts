import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { z } from "zod"
import { asegurarColeccion, crearVideoEnColeccion, getBunnyVideoStatus } from "@/lib/bunny"
import { asegurarCarpeta, hayStorage } from "@/lib/bunny-storage"
import { exigirAdmin } from "@/features/tutoriales/services/acceso"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Marco lo pidio con este nombre exacto (2026-07-31). */
export const CARPETA_TUTORIALES = "Tutoriales OS"

const Entrada = z.object({ titulo: z.string().trim().min(1).max(200) })

/**
 * POST /api/tutoriales/subida
 *
 * Prepara el hueco en Bunny y devuelve el permiso de subida para que el
 * navegador mande el archivo DIRECTO a Bunny (protocolo TUS), sin pasar por el
 * OS. Asi no hay limite de tamaño y una subida cortada se puede reanudar.
 *
 * A diferencia de la ruta equivalente del Estudio, esta SI comprueba quien
 * llama: solo Marco y Adrián.
 */
export async function POST(req: NextRequest) {
  const rechazo = await exigirAdmin()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const parsed = Entrada.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Falta el título del vídeo." }, { status: 400 })

  try {
    // El video nace ya dentro de "Tutoriales OS", no suelto en la raiz para
    // ordenarlo despues. La coleccion se crea sola la primera vez.
    const coleccion = await asegurarColeccion(CARPETA_TUTORIALES)
    const { guid: videoId, libraryId } = await crearVideoEnColeccion(parsed.data.titulo, coleccion)

    // Y su carpeta en el archivo ordenado (SOP 59). Que esto falle no puede
    // impedir la subida: el video ya existe y se puede subir igual.
    if (hayStorage()) {
      await asegurarCarpeta(
        CARPETA_TUTORIALES,
        "Tutoriales internos del equipo. Se suben desde /tutoriales en el OS.",
      ).catch((e) => console.error("[tutoriales] carpeta de archivo", e))
    }

    const apiKey = process.env.BUNNY_STREAM_API_KEY!
    const cdnHostname = process.env.BUNNY_CDN_HOSTNAME!
    const expirationTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60
    const authSignature = crypto
      .createHash("sha256")
      .update(libraryId + apiKey + expirationTime + videoId)
      .digest("hex")

    return NextResponse.json({
      videoId,
      libraryId,
      authSignature,
      expirationTime,
      cdnHostname,
      tusEndpoint: "https://video.bunnycdn.com/tusupload",
    })
  } catch (e) {
    console.error("[tutoriales/subida]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo preparar la subida." },
      { status: 500 },
    )
  }
}

/**
 * GET /api/tutoriales/subida?video=<guid>
 *
 * Como va el procesado. Bunny tarda un rato tras la subida: hasta que termina,
 * el video no se reproduce. La pantalla usa esto para decirlo en vez de enseñar
 * un reproductor roto.
 */
export async function GET(req: NextRequest) {
  const rechazo = await exigirAdmin()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const guid = req.nextUrl.searchParams.get("video")
  if (!guid) return NextResponse.json({ error: "Falta el vídeo." }, { status: 400 })

  try {
    const info = await getBunnyVideoStatus(guid)
    /* Bunny: 0 en cola · 1 procesando · 2 codificando · 3 terminado · 4 listo · 5 fallo.
     * OJO con dar por bueno "4 o mas": el 5 es que el video se rompio, y asi se
     * daria por listo un video que no existe. Se nombran los estados buenos. */
    return NextResponse.json({
      listo: info.status === 3 || info.status === 4,
      fallo: info.status === 5,
      status: info.status,
      duracion_seg: info.length ?? null,
    })
  } catch (e) {
    console.error("[tutoriales/estado]", e)
    return NextResponse.json({ error: "No se pudo consultar el estado." }, { status: 500 })
  }
}
