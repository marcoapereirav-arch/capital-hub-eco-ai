import { NextRequest, NextResponse } from "next/server"
import { createBunnyVideo, uploadBunnyVideo, getBunnyVideoStatus } from "@/lib/bunny"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300  // 5 min para uploads grandes

/**
 * POST /api/admin/lessons/bunny-upload
 * Cross-origin (la App alumno llama desde app.capitalhubapp.com).
 *
 * Body: multipart/form-data con:
 *   - file: el vídeo (mp4/mov/webm, max 500MB)
 *   - title: título para identificar en Bunny library (ej "IA Integrator · Modulo 1 · Bienvenida")
 *
 * Devuelve:
 *   { ok, guid, libraryId, hlsUrl, thumbnailUrl, status }
 *
 * El frontend después debe actualizar la lección con bunny_video_id=guid via
 * el Edge Function de lessons del proyecto Supabase (la App ya tiene esa función).
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
    const form = await req.formData()
    const file = form.get("file") as File | null
    const titleRaw = form.get("title") as string | null
    const title = (titleRaw ?? "Capital Hub lesson").toString().slice(0, 200)

    if (!file) {
      return withCors(req, NextResponse.json({ error: "Falta archivo 'file' en multipart" }, { status: 400 }))
    }
    if (file.size > 500 * 1024 * 1024) {
      return withCors(req, NextResponse.json({ error: "Archivo > 500MB. Comprime el vídeo." }, { status: 413 }))
    }

    // 1. Crea entry en Bunny
    const { guid, libraryId } = await createBunnyVideo(title)

    // 2. Sube el binario
    const buf = Buffer.from(await file.arrayBuffer())
    await uploadBunnyVideo(guid, buf)

    // 3. Lee status para devolver thumbnail + duracion estimada
    let status = 0
    try {
      const s = await getBunnyVideoStatus(guid)
      status = s.status
    } catch {
      // status puede no estar disponible aún si Bunny no terminó de procesar
    }

    const cdn = process.env.BUNNY_CDN_HOSTNAME!
    return withCors(req, NextResponse.json({
      ok: true,
      guid,
      libraryId,
      hlsUrl: `https://${cdn}/${guid}/playlist.m3u8`,
      thumbnailUrl: `https://${cdn}/${guid}/thumbnail.jpg`,
      status,
    }))
  } catch (e) {
    console.error("[bunny-upload] failed", e)
    return withCors(req, NextResponse.json({
      error: e instanceof Error ? e.message : "Upload failed",
    }, { status: 500 }))
  }
}
