import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { construirLinkDeAfiliado } from "@/lib/afiliados/funnels"
import { funnelBySlug } from "@/lib/meta/funnel-catalog"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** Solo super_admin toca los links. Devuelve el cliente admin o la respuesta de corte. */
async function exigirSuperAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const admin = getAdminClient()
  const { data: perfil, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  // Fail-closed: si no se puede comprobar el permiso, NO se deja pasar.
  if (error) return { error: NextResponse.json({ error: "No se pudo comprobar el permiso" }, { status: 500 }) }
  if (perfil?.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Solo super_admin puede tocar los links" }, { status: 403 }) }
  }
  return { admin, userId: user.id }
}

const crearSchema = z.object({
  affiliate_slug: z.string().min(1).max(60),
  funnel_slug: z.string().min(1).max(60),
})

/**
 * POST /api/admin/affiliates/links — crea el link de un afiliado hacia UN funnel.
 *
 * El funnel se valida contra el catalogo unico del OS. Aqui no hay ninguna direccion
 * escrita a fuego: si manana hay un funnel nuevo en el catalogo, se puede enlazar el
 * mismo dia sin tocar este archivo.
 */
export async function POST(req: NextRequest) {
  const guardia = await exigirSuperAdmin()
  if (guardia.error) return guardia.error
  const { admin, userId } = guardia

  const parsed = crearSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const { affiliate_slug, funnel_slug } = parsed.data

  const funnel = funnelBySlug(funnel_slug)
  if (!funnel) return NextResponse.json({ error: "Ese funnel no existe" }, { status: 400 })

  const { data: afiliado } = await admin
    .from("affiliates")
    .select("slug, active")
    .eq("slug", affiliate_slug)
    .maybeSingle()
  if (!afiliado) return NextResponse.json({ error: "Ese afiliado no existe" }, { status: 404 })

  const { error } = await admin
    .from("affiliate_links")
    .insert({ affiliate_slug, funnel_slug, created_by: userId })

  if (error) {
    const duplicado = (error as { code?: string }).code === "23505"
    return NextResponse.json(
      { error: duplicado ? "Ese afiliado ya tiene un link a ese funnel" : "No se pudo crear el link" },
      { status: duplicado ? 409 : 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    url: construirLinkDeAfiliado(funnel.path, affiliate_slug),
  })
}

/** DELETE /api/admin/affiliates/links?id=<uuid> — borra un link. Las visitas se conservan. */
export async function DELETE(req: NextRequest) {
  const guardia = await exigirSuperAdmin()
  if (guardia.error) return guardia.error

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Falta el link" }, { status: 400 })

  const { error } = await guardia.admin.from("affiliate_links").delete().eq("id", id)
  if (error) return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 })

  return NextResponse.json({ ok: true })
}
