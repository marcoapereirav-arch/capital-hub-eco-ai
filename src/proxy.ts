import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/**
 * Proxy (anteriormente middleware) — Next.js 16+ renombró middleware → proxy.
 *
 * Hace 2 cosas:
 *
 * 1. CORS para rutas que la App alumno consume cross-origin:
 *    - /api/auth/*  (student-invite-accept)
 *    - /api/public/*
 *    - /api/calendar/book/*
 *    Preflight OPTIONS responde 204 inmediato con headers correctos.
 *    Para GET/POST/etc añade headers a la response.
 *
 * 2. updateSession (Supabase Auth) en TODAS las demás rutas para mantener
 *    la sesión refrescada (excepto _next/static, imágenes, etc).
 */

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
    pathname.startsWith('/api/public/') ||
    pathname.startsWith('/api/calendar/book')
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // === 1. CORS para rutas cross-origin que llama la App alumno ===
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

  // === 2. Supabase Auth session refresh para el resto del OS ===
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
