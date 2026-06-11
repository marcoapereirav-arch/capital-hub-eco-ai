import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware CORS. Aplica a /api/auth/* y /api/calendar/book/* que son
 * los endpoints que la App alumno (cross-origin) llama.
 *
 * Modo aplicación:
 * - OPTIONS preflight: respuesta 204 inmediata con headers CORS.
 * - GET/POST: forwarder al handler, pero AÑADE headers CORS a la response
 *   final con NextResponse.next({headers}) que en Next.js 16 sí propaga.
 */

const ALLOWED_ORIGIN_PATTERNS: Array<string | RegExp> = [
  "https://app.capitalhubapp.com",
  /^https:\/\/capital-hub-[a-z0-9-]*\.vercel\.app$/,
  "http://localhost:5173",
  "http://localhost:3000",
]

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGIN_PATTERNS.some((p) =>
    typeof p === "string" ? p === origin : p.test(origin)
  )
}

function getCorsHeaders(origin: string | null): HeadersInit {
  const allow = origin && isAllowedOrigin(origin)
  return {
    "Access-Control-Allow-Origin": allow ? origin : "https://app.capitalhubapp.com",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  }
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin")
  const headers = getCorsHeaders(origin)

  // Preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers })
  }

  // Forward + añadir headers a la response (Next 16 lo propaga con esta sintaxis)
  return NextResponse.next({
    headers,
    request: { headers: req.headers },
  })
}

export const config = {
  // Matcher amplio: cualquier /api/auth/* o /api/calendar/book/*
  matcher: [
    "/api/auth/:path*",
    "/api/calendar/book/:path*",
    "/api/public/:path*",
  ],
}
