import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { exigirAdmin } from "@/features/tutoriales/services/acceso"
import { deleteBunnyVideo } from "@/lib/bunny"

export const dynamic = "force-dynamic"

const Crear = z.object({
  nombre: z.string().trim().min(1, "Ponle un nombre a la carpeta.").max(120),
  descripcion: z.string().trim().max(400).optional(),
  /** null o ausente = va a la raiz. Si viene, cuelga de esa carpeta. */
  parent_id: z.string().uuid().nullable().optional(),
})

const Editar = z.object({
  id: z.string().uuid(),
  nombre: z.string().trim().min(1).max(120).optional(),
  descripcion: z.string().trim().max(400).nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  display_order: z.number().int().min(0).optional(),
})

/** Traduce los candados de la base a algo que se pueda leer en pantalla. */
function enClaro(mensaje: string): string | null {
  if (mensaje.includes("dentro de si misma")) return "Una carpeta no puede estar dentro de sí misma."
  if (mensaje.includes("subcarpetas")) return "No se puede mover una carpeta dentro de una de sus subcarpetas."
  if (mensaje.includes("nombre_raiz_uniq") || mensaje.includes("nombre_hijo_uniq")) {
    return "Ya hay una carpeta con ese nombre en este sitio."
  }
  if (mensaje.includes("nombre_no_vacio")) return "Ponle un nombre a la carpeta."
  return null
}

export async function POST(req: NextRequest) {
  const rechazo = await exigirAdmin()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const parsed = Crear.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos no válidos." }, { status: 400 })
  }

  const supabase = await createClient()

  // La carpeta nueva va al final DE SU NIVEL, no al principio: el orden que
  // Marco ya ordeno a mano no se le desbarata cada vez que crea una.
  const padre = parsed.data.parent_id ?? null
  const consulta = supabase.from("tutorial_folders").select("display_order")
  const { data: ultima } = await (padre === null ? consulta.is("parent_id", null) : consulta.eq("parent_id", padre))
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase
    .from("tutorial_folders")
    .insert({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      parent_id: padre,
      display_order: (ultima?.display_order ?? -1) + 1,
    })
    .select("id, nombre, descripcion, parent_id, display_order")
    .single()

  if (error) {
    const claro = enClaro(error.message)
    return NextResponse.json({ error: claro ?? error.message }, { status: claro ? 400 : 500 })
  }
  return NextResponse.json({ carpeta: data })
}

export async function PATCH(req: NextRequest) {
  const rechazo = await exigirAdmin()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const parsed = Editar.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos no válidos." }, { status: 400 })
  }

  const { id, ...cambios } = parsed.data
  const supabase = await createClient()

  /* El `.select()` NO es decorativo: es lo que distingue "guardado" de
   * "el candado me lo filtro".
   *
   * Sin el, cuando la RLS bloquea la fila, PostgREST devuelve 0 filas con
   * error null y esto respondia que todo habia ido bien. En pantalla salia
   * guardado, recargabas, y no habia cambiado nada. Es el fallo mudo de RLS. */
  const { data, error } = await supabase
    .from("tutorial_folders")
    .update(cambios)
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) {
    const claro = enClaro(error.message)
    return NextResponse.json({ error: claro ?? error.message }, { status: claro ? 400 : 500 })
  }
  if (!data) {
    return NextResponse.json(
      { error: "No se pudo guardar: esa carpeta ya no existe o no tienes permiso." },
      { status: 403 },
    )
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const rechazo = await exigirAdmin()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Falta la carpeta." }, { status: 400 })

  const supabase = await createClient()

  /* ANTES de borrar hay que saber que videos se van a llevar por delante,
   * incluidos los de las subcarpetas a cualquier profundidad.
   *
   * La base los borra en cascada, pero Bunny no se entera: los archivos se
   * quedarian ahi pagandose para siempre y sin ninguna fila que los nombre
   * para poder encontrarlos despues. Se piden primero, se borra, y luego se
   * limpia Bunny. */
  const { data: dentro } = await supabase.rpc("tutorial_subarbol", { raiz: id })
  const enBunny = ((dentro ?? []) as { fuente: string; bunny_video_id: string | null }[]).filter(
    (v) => v.fuente === "bunny" && v.bunny_video_id,
  )

  const { data, error } = await supabase.from("tutorial_folders").delete().eq("id", id).select("id").maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) {
    return NextResponse.json(
      { error: "No se pudo borrar: esa carpeta ya no existe o no tienes permiso." },
      { status: 403 },
    )
  }

  // Los Loom no se tocan: el video vive en la cuenta de Loom de Marco.
  for (const v of enBunny) {
    await deleteBunnyVideo(v.bunny_video_id!).catch((e) =>
      console.error("[tutoriales] no se pudo borrar en Bunny", v.bunny_video_id, e),
    )
  }

  return NextResponse.json({ ok: true, videosBorrados: enBunny.length })
}
