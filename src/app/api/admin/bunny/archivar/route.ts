import { NextRequest, NextResponse } from "next/server"
import { conCors, responderOpciones } from "@/lib/bunny-cors"
import { quienLlama } from "@/lib/bunny-acceso"
import { archivarPendientes } from "@/lib/bunny-archivo"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300

/**
 * POST /api/admin/bunny/archivar
 *
 * Guarda en el archivo ordenado (Bunny Storage) los vídeos que ya están
 * reproduciéndose, cada uno en su carpeta:
 *
 *   Formaciones/IA Integrator/Módulo 1/Qué es un agente.mp4
 *
 * Esto es el empujón a mano. El automático va por su reloj, en
 * `/api/cron/bunny-archivar`. Los dos hacen exactamente lo mismo.
 */

export async function OPTIONS(req: NextRequest) {
  return responderOpciones(req)
}

export async function POST(req: NextRequest) {
  const permiso = await quienLlama(req.headers.get("authorization"))
  if (!permiso.ok) {
    return conCors(req, NextResponse.json({ error: permiso.motivo }, { status: permiso.estado }))
  }
  try {
    return conCors(req, NextResponse.json(await archivarPendientes()))
  } catch (e) {
    console.error("[bunny/archivar] falló", e)
    return conCors(
      req,
      NextResponse.json(
        { error: e instanceof Error ? e.message : "No se pudo archivar." },
        { status: 500 },
      ),
    )
  }
}
