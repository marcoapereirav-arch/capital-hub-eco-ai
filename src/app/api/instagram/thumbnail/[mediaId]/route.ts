import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/instagram/thumbnail/[mediaId]
 *
 * Sirve el thumbnail de un media de IG SIN expirarse.
 *
 * Problema raiz: las URLs del CDN de IG (scontent-*.fbcdn.net) traen un
 * signed_url que caduca en ~1-2 dias. Si guardamos la URL en BD y la
 * servimos despues, el navegador del visitante recibe 403.
 *
 * Solucion: este endpoint llama al Graph API en vivo cada vez (con
 * IG_ACCESS_TOKEN nuestro) para obtener la URL FRESCA, descarga el binario
 * y lo sirve directamente con Content-Type adecuado y cache de 1 hora en
 * el navegador del cliente.
 *
 * Resultado: <img src="/api/instagram/thumbnail/<media_id>" /> nunca expira.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await ctx.params

  if (!mediaId || !/^\d+$/.test(mediaId)) {
    return NextResponse.json({ error: "mediaId invalido" }, { status: 400 })
  }

  const token = process.env.IG_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json({ error: "IG_ACCESS_TOKEN no configurado" }, { status: 500 })
  }

  try {
    // 1. Pedir URL fresca del thumbnail/media al Graph API
    const metaUrl = `https://graph.instagram.com/v22.0/${mediaId}?fields=media_type,thumbnail_url,media_url&access_token=${token}`
    const metaRes = await fetch(metaUrl, { cache: "no-store" })
    if (!metaRes.ok) {
      return NextResponse.json(
        { error: "media no encontrada en IG", status: metaRes.status },
        { status: 404 },
      )
    }
    const meta = (await metaRes.json()) as {
      media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
      thumbnail_url?: string
      media_url?: string
    }

    // VIDEO/REEL → thumbnail_url, IMAGE → media_url, CAROUSEL → media_url
    const freshUrl = meta.thumbnail_url ?? meta.media_url
    if (!freshUrl) {
      return NextResponse.json({ error: "media sin thumbnail" }, { status: 404 })
    }

    // 2. Descargar binario
    const imgRes = await fetch(freshUrl, { cache: "no-store" })
    if (!imgRes.ok) {
      return NextResponse.json({ error: "no se pudo descargar el thumbnail" }, { status: 502 })
    }

    const buffer = await imgRes.arrayBuffer()
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg"

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        // Cache 1h en navegador, 5min en CDN
        "Cache-Control": "public, max-age=3600, s-maxage=300, stale-while-revalidate=86400",
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
