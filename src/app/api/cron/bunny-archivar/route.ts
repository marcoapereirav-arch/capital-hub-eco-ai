import { NextRequest } from "next/server"
import { archivarPendientes } from "@/lib/bunny-archivo"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * GET /api/cron/bunny-archivar
 *
 * Cada 10 minutos guarda en su carpeta los vídeos nuevos.
 *
 * Marco, 2026-07-30: *"tiene que ir cada vídeo para que haya un orden exacto en
 * todo esto."* El formador sube y se olvida; el orden lo pone esto solo.
 *
 * Va por reloj y no en el momento de subir porque Bunny tarda en procesar el
 * vídeo, y hasta que no termina no hay archivo que copiar.
 *
 * Auth: Vercel Cron manda `Authorization: Bearer <CRON_SECRET>`. Para probarlo
 * a mano vale `x-internal-key`, igual que el resto de relojes de la casa.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const internal = req.headers.get("x-internal-key")
  const cronSecret = process.env.CRON_SECRET
  const internalKey = process.env.INTERNAL_TRIGGER_KEY

  const validCron = cronSecret && auth === `Bearer ${cronSecret}`
  const validInternal = internalKey && internal === internalKey
  if (!validCron && !validInternal) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  try {
    const r = await archivarPendientes()
    console.log("[cron/bunny-archivar]", JSON.stringify(r))
    return Response.json(r)
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "error"
    console.error("[cron/bunny-archivar] falló", motivo)
    return Response.json({ ok: false, error: motivo }, { status: 500 })
  }
}
