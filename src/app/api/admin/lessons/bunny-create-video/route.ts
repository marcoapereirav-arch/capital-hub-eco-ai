import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { asegurarColeccion, createBunnyVideo, crearVideoEnColeccion } from "@/lib/bunny"
import { asegurarCarpeta, hayStorage } from "@/lib/bunny-storage"
import {
  archivoLeccion,
  carpetaModulo,
  coleccionDeFormacion,
  nombreEnStream,
} from "@/lib/bunny-rutas"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/admin/lessons/bunny-create-video
 * Cross-origin (App alumno llama desde app.capitalhubapp.com).
 *
 * Body: { title: string }
 * Devuelve los datos necesarios para que el browser haga upload directo a Bunny
 * vía TUS resumable upload protocol — SIN pasar por el OS, así no hay límite
 * de tamaño y se puede reanudar si se corta la conexión.
 *
 * Response:
 *   { videoId, libraryId, authSignature, expirationTime, cdnHostname, hlsUrl, tusEndpoint }
 *
 * Frontend usa tus-js-client con los headers AuthorizationSignature + AuthorizationExpire
 * + LibraryId + VideoId. Bunny acepta archivos hasta su límite de plan
 * (típicamente 50GB por vídeo) en chunks de 50-100MB.
 *
 * Doc Bunny TUS: https://docs.bunny.net/reference/tus-resumable-uploads
 */

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "https://app.capitalhubapp.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) })
}

function withCors(req: NextRequest, res: NextResponse): NextResponse {
  const h = corsHeaders(req.headers.get("origin"))
  for (const [k, v] of Object.entries(h)) res.headers.set(k, v)
  return res
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      title?: string
      formacion?: string
      modulo?: string
      leccion?: string
      posicion?: number
      archivo?: string
    }

    /* El vídeo nace ordenado, no se ordena después.
     *
     * Si la App manda el contexto (formación, módulo, lección), el vídeo se crea
     * YA dentro de la colección de su formación y con el módulo y el número de
     * orden dentro del nombre. Además se prepara su carpeta en el archivo, para
     * que exista aunque el vídeo tarde en procesarse.
     *
     * Sin contexto se comporta igual que siempre: hay llamadas antiguas y no se
     * les puede romper la subida. */
    const conContexto = Boolean(body.formacion && body.modulo && body.leccion)

    const title = conContexto
      ? nombreEnStream(body.modulo!, body.leccion!, body.posicion)
      : (body.title ?? "Capital Hub lesson").slice(0, 200)

    let rutaArchivo: string | null = null

    if (conContexto) {
      rutaArchivo = archivoLeccion(body.formacion!, body.modulo!, body.leccion!, body.archivo)
      if (hayStorage()) {
        // Que la carpeta no se pueda preparar no puede impedir la subida: el
        // barrido de `archivar` la creará igual al guardar el vídeo.
        await asegurarCarpeta(
          carpetaModulo(body.formacion!, body.modulo!),
          `Aqui van los videos de las lecciones de "${body.modulo}".`,
        ).catch((e) => console.error("[bunny-create-video] carpeta", e))
      }
    }

    // 1. Crea entry de vídeo en Bunny library (devuelve guid), ya colocada
    const { guid: videoId, libraryId } = conContexto
      ? await crearVideoEnColeccion(
          title,
          await asegurarColeccion(coleccionDeFormacion(body.formacion!)),
        )
      : await createBunnyVideo(title)

    // 2. Calcula signature TUS (Bunny requiere SHA256 de libraryId + apiKey + expirationTime + videoId)
    const apiKey = process.env.BUNNY_STREAM_API_KEY!
    const cdnHostname = process.env.BUNNY_CDN_HOSTNAME!
    const expirationTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24h
    const authSignature = crypto
      .createHash("sha256")
      .update(libraryId + apiKey + expirationTime + videoId)
      .digest("hex")

    return withCors(req, NextResponse.json({
      videoId,
      libraryId,
      authSignature,
      expirationTime,
      cdnHostname,
      tusEndpoint: "https://video.bunnycdn.com/tusupload",
      hlsUrl: `https://${cdnHostname}/${videoId}/playlist.m3u8`,
      thumbnailUrl: `https://${cdnHostname}/${videoId}/thumbnail.jpg`,
      // Dónde va a quedar guardado en el archivo ordenado. La App lo enseña para
      // que el formador vea en qué carpeta cayó su vídeo.
      rutaArchivo,
    }))
  } catch (e) {
    console.error("[bunny-create-video] failed", e)
    return withCors(req, NextResponse.json({
      error: e instanceof Error ? e.message : "Failed",
    }, { status: 500 }))
  }
}
