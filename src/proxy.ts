import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/**
 * Proxy (anteriormente middleware) — Next.js 16+ renombró middleware → proxy.
 *
 * Hace 3 cosas:
 *
 * 1. HOST-BASED ROUTING (Marco 2026-07-02):
 *    En ch.capitalhubapp.com solo se sirven rutas explicitamente marcadas
 *    como publicas (tabla webs hostname='ch' + fallback
 *    hardcoded). Cualquier ruta del OS bajo ch. devuelve 404.
 *    Se ejecuta ANTES del CORS/session porque tiene prioridad de
 *    aislamiento del OS. En os. y hosts dev/preview no aplica.
 *
 * 2. CORS para rutas que la App alumno consume cross-origin:
 *    - /api/auth/*  (student-invite-accept)
 *    - /api/public/*
 *    Preflight OPTIONS responde 204 inmediato con headers correctos.
 *    Para GET/POST/etc añade headers a la response.
 *
 * 3. updateSession (Supabase Auth) en TODAS las demás rutas para mantener
 *    la sesión refrescada (excepto _next/static, imágenes, etc).
 */

// ============================================================
// HOST-BASED ROUTING (bloque 1)
// ============================================================

const CH_HOSTNAME = 'ch.capitalhubapp.com'

const SYSTEM_PREFIXES = [
  '/_next/',
  '/api/',
  '/favicon',
  '/icons/',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
  '/sw.js',
  '/apple-touch-icon',
  '/assets/',
]

const CH_FALLBACK_SLUGS = new Set([
  'test-personalidad',
  'lm',
  'formacion',
  'legal',
  'reservar',
  'welcome',
  'agenda',
  'mifge',
  'lt8',
])

let chSlugCache: { slugs: Set<string>; expiresAt: number } | null = null

async function fetchChPublicSlugs(): Promise<Set<string>> {
  const now = Date.now()
  if (chSlugCache && chSlugCache.expiresAt > now) return chSlugCache.slugs

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anon) return CH_FALLBACK_SLUGS

  const slugs = new Set<string>()
  try {
    // Los lead magnets se retiraron del OS el 2026-08-07 (Marco: no se estaban
    // usando). Ya no se consultan ni se dejan pasar: la ruta /lm/<slug> no existe,
    // asi que dejarlos aqui solo serviria para mandar a nadie a un 404.
    const websRes = await fetch(
      `${supabaseUrl}/rest/v1/webs?select=slug&hostname=eq.ch&status=eq.published`,
      { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, cache: 'no-store' }
    )
    if (websRes.ok) {
      const rows = (await websRes.json()) as { slug: string }[]
      for (const r of rows) if (r.slug) slugs.add(r.slug)
    }
  } catch {
    return CH_FALLBACK_SLUGS
  }

  for (const s of CH_FALLBACK_SLUGS) slugs.add(s)
  chSlugCache = { slugs, expiresAt: now + 30_000 }
  return slugs
}

function firstSegment(pathname: string): string {
  return pathname.replace(/^\//, '').split('/')[0] ?? ''
}

async function isChPublicRoute(pathname: string): Promise<boolean> {
  for (const prefix of SYSTEM_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix)) return true
  }
  if (pathname === '/' || pathname === '') return false
  const seg = firstSegment(pathname)
  const chSlugs = await fetchChPublicSlugs()
  return chSlugs.has(seg)
}

const ALLOWED_ORIGIN_PATTERNS: Array<string | RegExp> = [
  'https://app.capitalhubapp.com',
  /^https:\/\/capital-hub-[a-z0-9-]*\.vercel\.app$/,
  'http://localhost:5173',
  'http://localhost:3000',
]

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGIN_PATTERNS.some((p) =>
    typeof p === 'string' ? p === origin : p.test(origin)
  )
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && isAllowedOrigin(origin)
  return {
    'Access-Control-Allow-Origin': allow ? origin : 'https://app.capitalhubapp.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

function needsCors(pathname: string): boolean {
  return (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/public/')
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = (request.headers.get('host') ?? '').toLowerCase()

  // === 1. HOST-BASED ROUTING ===
  // Solo aplica en ch.capitalhubapp.com. En os./localhost/previews pasa tal cual.
  if (hostname === CH_HOSTNAME) {
    const allowed = await isChPublicRoute(pathname)
    if (!allowed) return new NextResponse(null, { status: 404 })
    // Ruta publica ok: continua a Supabase session refresh normal.
  }

  // === 2. CORS para rutas cross-origin que llama la App alumno ===
  if (needsCors(pathname)) {
    const origin = request.headers.get('origin')
    const corsHeaders = getCorsHeaders(origin)

    // Preflight OPTIONS: respuesta inmediata 204 con headers
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: corsHeaders })
    }

    // Para requests reales (GET/POST/etc), pasar al handler PERO añadir headers
    const response = NextResponse.next({ request: { headers: request.headers } })
    for (const [k, v] of Object.entries(corsHeaders)) {
      response.headers.set(k, v)
    }
    return response
  }

  // === 3. Supabase Auth session refresh para el resto del OS ===
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
