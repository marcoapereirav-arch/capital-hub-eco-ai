import { NextRequest, NextResponse } from "next/server"

/**
 * Cabeceras para que la App del alumno (otro dominio) pueda llamar a estos
 * endpoints. Estaba copiado en cada archivo; ahora vive en un sitio.
 *
 * `Authorization` va en la lista de permitidas porque los endpoints de carpetas
 * exigen la sesión de quien llama (ver `bunny-acceso.ts`).
 */
export function cabecerasCors(origen: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origen ?? "https://app.capitalhubapp.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  }
}

export function responderOpciones(req: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: cabecerasCors(req.headers.get("origin")),
  })
}

export function conCors(req: NextRequest, res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(cabecerasCors(req.headers.get("origin")))) {
    res.headers.set(k, v)
  }
  return res
}
