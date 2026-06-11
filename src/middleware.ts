import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware global del OS.
 *
 * Responsabilidades:
 * 1. CORS: permite que la App alumno (app.capitalhubapp.com + previews Vercel
 *    + localhost dev) llame a endpoints del OS sin que el browser bloquee
 *    el preflight.
 *
 * Solo se aplica a rutas /api/auth/* y /api/public/* que están pensadas para
 * ser consumidas por la App (cross-origin). Los /api/admin/* NO necesitan
 * CORS porque solo el OS mismo los llama.
 */

const ALLOWED_ORIGIN_PATTERNS: Array<string | RegExp> = [
  "https://app.capitalhubapp.com",
  /^https:\/\/capital-hub-app-[a-z0-9-]+\.vercel\.app$/,
  "http://localhost:5173",
  "http://localhost:3000",
]

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGIN_PATTERNS.some((p) =>
    typeof p === "string" ? p === origin : p.test(origin)
  )
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Solo CORS sobre endpoints cross-origin de la App
  const needsCors =
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/public/") ||
    pathname.startsWith("/api/calendar/book")

  if (!needsCors) return NextResponse.next()

  const origin = req.headers.get("origin") ?? ""
  const allowed = isAllowedOrigin(origin)
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": allowed ? origin : "https://app.capitalhubapp.com",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  }

  // Preflight: responder inmediatamente con 204 + headers
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders })
  }

  // Para requests reales, dejamos pasar pero añadimos los headers a la response
  const res = NextResponse.next()
  for (const [k, v] of Object.entries(corsHeaders)) {
    res.headers.set(k, v)
  }
  return res
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/public/:path*", "/api/calendar/book/:path*"],
}
