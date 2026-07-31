import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exigirEquipo, quienLlama } from "@/features/tutoriales/services/acceso"
import type { Carpeta, Tutorial } from "@/features/tutoriales/types"

export const dynamic = "force-dynamic"

/**
 * GET /api/tutoriales
 *
 * Las carpetas con sus tutoriales dentro. La base ya filtra por RLS:
 * el equipo ve lo publicado, quien administra ve tambien los borradores.
 */
export async function GET() {
  const rechazo = await exigirEquipo()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const quien = await quienLlama()
  const supabase = await createClient()

  const [carpetas, tutoriales] = await Promise.all([
    supabase.from("tutorial_folders").select("id, nombre, descripcion, display_order").order("display_order"),
    supabase
      .from("tutorials")
      .select("id, folder_id, titulo, descripcion, fuente, bunny_video_id, loom_url, duracion_seg, status, display_order")
      .order("display_order"),
  ])

  if (carpetas.error) return NextResponse.json({ error: carpetas.error.message }, { status: 500 })
  if (tutoriales.error) return NextResponse.json({ error: tutoriales.error.message }, { status: 500 })

  const porCarpeta = new Map<string, Tutorial[]>()
  for (const t of (tutoriales.data ?? []) as Tutorial[]) {
    const lista = porCarpeta.get(t.folder_id) ?? []
    lista.push(t)
    porCarpeta.set(t.folder_id, lista)
  }

  return NextResponse.json({
    esAdmin: quien?.esAdmin ?? false,
    // El reproductor los necesita para armar la direccion del video de Bunny.
    libraryId: process.env.BUNNY_LIBRARY_ID ?? "",
    cdnHostname: process.env.BUNNY_CDN_HOSTNAME ?? "",
    carpetas: ((carpetas.data ?? []) as Carpeta[]).map((c) => ({
      ...c,
      tutoriales: porCarpeta.get(c.id) ?? [],
    })),
  })
}
