import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { exigirAdmin } from "@/features/tutoriales/services/acceso"

export const dynamic = "force-dynamic"

const Crear = z.object({
  nombre: z.string().trim().min(1, "Ponle un nombre a la carpeta.").max(120),
  descripcion: z.string().trim().max(400).optional(),
})

const Editar = z.object({
  id: z.string().uuid(),
  nombre: z.string().trim().min(1).max(120).optional(),
  descripcion: z.string().trim().max(400).nullable().optional(),
  display_order: z.number().int().min(0).optional(),
})

export async function POST(req: NextRequest) {
  const rechazo = await exigirAdmin()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const parsed = Crear.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos no válidos." }, { status: 400 })
  }

  const supabase = await createClient()

  // La carpeta nueva va al final, no al principio: el orden que Marco ya
  // ordeno a mano no se le desbarata cada vez que crea una.
  const { data: ultima } = await supabase
    .from("tutorial_folders")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase
    .from("tutorial_folders")
    .insert({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      display_order: (ultima?.display_order ?? -1) + 1,
    })
    .select("id, nombre, descripcion, display_order")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
  const { error } = await supabase.from("tutorial_folders").update(cambios).eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const rechazo = await exigirAdmin()
  if (rechazo) return NextResponse.json({ error: rechazo.motivo }, { status: rechazo.estado })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Falta la carpeta." }, { status: 400 })

  const supabase = await createClient()

  // Borrar la carpeta se lleva sus tutoriales por delante (cascade en la base).
  // El aviso de "esto borra N vídeos" se da en pantalla ANTES de llamar aqui.
  const { error } = await supabase.from("tutorial_folders").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
