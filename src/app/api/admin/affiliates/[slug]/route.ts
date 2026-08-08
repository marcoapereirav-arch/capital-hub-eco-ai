import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { asegurarEtiquetaDeFuente } from "@/lib/atribucion/atribucion"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const patchSchema = z.object({
  name: z.string().min(2).max(120).trim().optional(),
  active: z.boolean().optional(),
})

/**
 * PATCH /api/admin/affiliates/<slug> — renombrar o activar/desactivar. Solo super_admin.
 *
 * El IDENTIFICADOR no se puede cambiar, a proposito: es lo que va dentro de todos los
 * links ya repartidos y de la etiqueta `fuente:<slug>`. Cambiarlo dejaria esos links sin
 * atribuir y partiria el historial en dos.
 *
 * Desactivar NO borra nada: el afiliado deja de ofrecerse para links nuevos, pero sus
 * leads, sus visitas y sus ingresos siguen contando.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: perfil, error: errPerfil } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  if (errPerfil) return NextResponse.json({ error: "No se pudo comprobar el permiso" }, { status: 500 })
  if (perfil?.role !== "super_admin") {
    return NextResponse.json({ error: "Solo super_admin puede editar afiliados" }, { status: 403 })
  }

  const { slug } = await ctx.params
  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success || (parsed.data.name === undefined && parsed.data.active === undefined)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const cambios: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) cambios.name = parsed.data.name
  if (parsed.data.active !== undefined) cambios.active = parsed.data.active

  const { data: actualizado, error } = await admin
    .from("affiliates")
    .update(cambios)
    .eq("slug", slug)
    .select("slug, name, active")
    .maybeSingle()

  if (error) return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  if (!actualizado) return NextResponse.json({ error: "Ese afiliado no existe" }, { status: 404 })

  // Si cambio el nombre, la etiqueta sigue siendo la misma (va por identificador), pero
  // se asegura de que exista.
  await asegurarEtiquetaDeFuente(admin, slug, actualizado.name as string)

  return NextResponse.json({ ok: true, afiliado: actualizado })
}
