import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware host-based para separar ch. (publico, solo funnels/lead magnets)
 * de os. (interno). Marco 2026-07-02.
 *
 * Reglas:
 *   - ch.capitalhubapp.com: SOLO rutas que aparecen en tabla webs o lead_magnets
 *     con hostname='ch' y estado publicado/activo, mas assets del sistema y APIs.
 *   - Cualquier otro host (os., localhost, *.vercel.app previews, ecoai. ya
 *     lo redirige Vercel): pasa tal cual, el flujo normal del OS aplica.
 *
 * Cache in-memory por 30s para no consultar BD en cada request.
 */

const CH_HOSTNAME = "ch.capitalhubapp.com"

/**
 * Rutas del sistema / APIs / assets que SIEMPRE deben servirse en cualquier host.
 * Cambios aqui son delicados. No incluye rutas de negocio.
 */
const SYSTEM_PREFIXES = [
  "/_next/",
  "/api/",
  "/favicon",
  "/icons/",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
  "/sw.js",
  "/apple-touch-icon",
  "/assets/",
]

/**
 * Fallback whitelist si por lo que sea la consulta BD falla. Son los slugs
 * publicos que HOY sabemos que estan activos en ch. Se usan solo como red
 * de seguridad; la fuente de verdad es la BD.
 */
const CH_FALLBACK_SLUGS = new Set([
  "test-personalidad",
  "lm",
  "formacion",
  "legal",
  "reservar",
  "welcome",
  "agenda",
  "mifge",
  "lt8",
])

let cache: { slugs: Set<string>; expiresAt: number } | null = null

async function fetchChPublicSlugs(): Promise<Set<string>> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.slugs

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anon) return CH_FALLBACK_SLUGS

  const slugs = new Set<string>()
  try {
    const [websRes, lmRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/webs?select=slug&hostname=eq.ch&status=eq.published`,
        { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, cache: "no-store" }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/lead_magnets?select=slug&hostname=eq.ch&active=eq.true`,
        { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, cache: "no-store" }
      ),
    ])
    if (websRes.ok) {
      const rows = (await websRes.json()) as { slug: string }[]
      for (const r of rows) if (r.slug) slugs.add(r.slug)
    }
    if (lmRes.ok) {
      const rows = (await lmRes.json()) as { slug: string }[]
      for (const r of rows) if (r.slug) slugs.add(`lm/${r.slug}`)
    }
  } catch {
    return CH_FALLBACK_SLUGS
  }

  // Union del fallback + BD para no perder rutas conocidas si un slug se
  // borra de BD por error.
  for (const s of CH_FALLBACK_SLUGS) slugs.add(s)

  cache = { slugs, expiresAt: now + 30_000 }
  return slugs
}

function firstSegment(pathname: string): string {
  return pathname.replace(/^\//, "").split("/")[0] ?? ""
}

export async function middleware(req: NextRequest) {
  const hostname = (req.headers.get("host") ?? "").toLowerCase()
  const pathname = req.nextUrl.pathname

  // Assets del sistema y APIs siempre pasan (sus propias auths aplican).
  for (const prefix of SYSTEM_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix)) return NextResponse.next()
  }

  // Solo el hostname ch. restringe. os., localhost, previews pasan tal cual.
  if (hostname !== CH_HOSTNAME) return NextResponse.next()

  // Raiz de ch. sin path definido: 404 (no queremos revelar el OS).
  if (pathname === "/" || pathname === "") {
    return new NextResponse(null, { status: 404 })
  }

  const seg = firstSegment(pathname)
  const chSlugs = await fetchChPublicSlugs()
  if (chSlugs.has(seg)) return NextResponse.next()

  // Cualquier ruta no marcada como publica en ch. -> 404 limpio.
  return new NextResponse(null, { status: 404 })
}

export const config = {
  // Corre en TODAS las rutas. Los skips los maneja el codigo (mas legible que
  // regex negativos que en Next 16 con la nueva ejecucion tienen quirks).
  matcher: ["/((?!_next/static|_next/image).*)"],
}
