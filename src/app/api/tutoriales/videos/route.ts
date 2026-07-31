import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { exigirAdmin, quienLlama } from "@/features/tutoriales/services/acceso"
import { esLoomValido } from "@/features/tutoriales/types"
import { deleteBunnyVideo } from "@/lib/bunny"

export const dynamic = "force-dynamic"

const Loom = z.string().trim().refine(esLoomValido, "Ese link no parece de Loom. Copia el de compartir.")

const Crear = z
  .object({
    folder_id: z.string().uuid(),
    titulo: z.string().trim().min(1, "Ponle un título.").max(200),
    descripcion: z.string().trim().max(600).optional(),
    fuente: z.enum(["bunny", "loom"]),
    bunny_video_id: z.string().trim().min(1).optional(),
    loom_url: Loom.optional(),
    duracion_seg: z.number().int().min(0).optional(),
    miniatura: z.string().url().optional(),
  })
  .refine((v) => (v.fuente === "loom" ? Boolean(v.loom_url) : true), {
    message: "Falta el link de Loom.",
    path: ["loom_url"],
  })

const Editar = z.object({
  id: z.string().uuid(),
  titulo: z.string().trim().min(1).max(200).optional(),
  descripcion: z.string().trim().max(600).nullable().optional(),
  loom_url: Loom.optional(),
  bunny_video_id: z.string().trim().min(1).optional(),
  duracion_seg: z.number().int().min(0).nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  display_order: z.number().int().min(0).optional(),
  folder_id: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  const rechazo = await exigirAdmin()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const parsed = Crear.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos no válidos." }, { status: 400 })
  }

  const quien = await quienLlama()
  const supabase = await createClient()

  const { data: ultimo } = await supabase
    .from("tutorials")
    .select("display_order")
    .eq("folder_id", parsed.data.folder_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  /* Nace en borrador SIEMPRE, tambien el de Loom.
   *
   * Con Loom el video ya se puede ver al instante, asi que seria facil
   * publicarlo de una. Pero entonces un link mal pegado saldria al equipo sin
   * que nadie lo hubiera mirado. Se publica cuando Marco le da a publicar. */
  const { data, error } = await supabase
    .from("tutorials")
    .insert({
      folder_id: parsed.data.folder_id,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion || null,
      fuente: parsed.data.fuente,
      bunny_video_id: parsed.data.fuente === "bunny" ? parsed.data.bunny_video_id ?? null : null,
      loom_url: parsed.data.fuente === "loom" ? parsed.data.loom_url ?? null : null,
      // Loom da duracion y portada al pegar el link; Bunny las pone al procesar.
      duracion_seg: parsed.data.duracion_seg ?? null,
      miniatura: parsed.data.miniatura ?? null,
      status: "draft",
      display_order: (ultimo?.display_order ?? -1) + 1,
      created_by: quien?.userId ?? null,
    })
    .select(
      "id, folder_id, titulo, descripcion, fuente, bunny_video_id, loom_url, duracion_seg, miniatura, status, display_order",
    )
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tutorial: data })
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

  // El `.select()` distingue "guardado" de "el candado me lo filtro": sin el,
  // una escritura bloqueada por RLS devuelve 0 filas sin error y esto respondia
  // que habia ido bien. Fallo mudo.
  const { data, error } = await supabase.from("tutorials").update(cambios).eq("id", id).select("id").maybeSingle()

  if (error) {
    // La base impide publicar una ficha sin video. Traducido a algo que se lea.
    if (error.message.includes("tutorials_publicado_con_video")) {
      return NextResponse.json({ error: "Ese tutorial todavía no tiene vídeo, así que no se puede publicar." }, { status: 400 })
    }
    if (error.message.includes("titulo_no_vacio")) {
      return NextResponse.json({ error: "Ponle un título al tutorial." }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "No se pudo guardar: ese vídeo ya no existe o no tienes permiso." }, { status: 403 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const rechazo = await exigirAdmin()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Falta el tutorial." }, { status: 400 })

  const supabase = await createClient()
  const { data: ficha } = await supabase
    .from("tutorials")
    .select("fuente, bunny_video_id")
    .eq("id", id)
    .maybeSingle()

  const { data: borrada, error } = await supabase.from("tutorials").delete().eq("id", id).select("id").maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!borrada) {
    return NextResponse.json({ error: "No se pudo borrar: ese vídeo ya no existe o no tienes permiso." }, { status: 403 })
  }

  /* Quitar un video lo quita de Bunny de verdad (mismo criterio que el Estudio,
   * SOP 59): si solo se borrara la ficha, el archivo seguiria ocupando y
   * pagandose para siempre sin que nadie supiera que esta ahi.
   *
   * Un Loom NO se toca: el video es de Marco y vive en su cuenta de Loom. */
  if (ficha?.fuente === "bunny" && ficha.bunny_video_id) {
    await deleteBunnyVideo(ficha.bunny_video_id).catch((e) =>
      console.error("[tutoriales] no se pudo borrar en Bunny", e),
    )
  }

  return NextResponse.json({ ok: true })
}
