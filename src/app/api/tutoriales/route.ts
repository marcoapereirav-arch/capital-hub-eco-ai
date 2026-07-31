import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exigirEquipo, quienLlama } from "@/features/tutoriales/services/acceso"
import type { Carpeta, Tutorial } from "@/features/tutoriales/types"

export const dynamic = "force-dynamic"

/**
 * GET /api/tutoriales
 *
 * El arbol entero de una vez: todas las carpetas (con su padre) y todos los
 * videos. La pantalla navega en el cliente, asi que entrar en una carpeta es
 * instantaneo y las migas de pan no piden nada al servidor.
 *
 * Se trae todo a proposito: aqui hablamos de decenas de carpetas, no de miles.
 * Si algun dia crece de verdad, se cambia a pedir solo el nivel visible.
 *
 * La base ya filtra por RLS: el equipo ve lo publicado, quien administra ve
 * tambien los borradores.
 */
export async function GET() {
  const rechazo = await exigirEquipo()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const quien = await quienLlama()
  const supabase = await createClient()

  const [carpetas, tutoriales] = await Promise.all([
    supabase
      .from("tutorial_folders")
      .select("id, nombre, descripcion, parent_id, display_order")
      .order("display_order"),
    supabase
      .from("tutorials")
      .select(
        "id, folder_id, titulo, descripcion, fuente, bunny_video_id, loom_url, duracion_seg, miniatura, status, display_order",
      )
      .order("display_order"),
  ])

  /* Un fallo al leer NO es "no hay nada".
   *
   * Si esto devolviera lista vacia ante un error, la pantalla diria "todavia no
   * hay tutoriales" y Marco pensaria que se le borro todo. Se responde error. */
  if (carpetas.error) return NextResponse.json({ error: carpetas.error.message }, { status: 500 })
  if (tutoriales.error) return NextResponse.json({ error: tutoriales.error.message }, { status: 500 })

  return NextResponse.json({
    esAdmin: quien?.esAdmin ?? false,
    // El reproductor los necesita para armar la direccion del video de Bunny.
    libraryId: process.env.BUNNY_LIBRARY_ID ?? "",
    cdnHostname: process.env.BUNNY_CDN_HOSTNAME ?? "",
    carpetas: (carpetas.data ?? []) as Carpeta[],
    videos: (tutoriales.data ?? []) as Tutorial[],
  })
}
