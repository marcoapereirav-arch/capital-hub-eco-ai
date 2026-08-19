import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const Schema = z.object({ accion: z.enum(["quitar", "devolver"]) })

/**
 * POST /api/admin/contacts/[id]/acceso   { accion: "quitar" | "devolver" }
 *
 * Quita o devuelve el acceso a la formacion de un alumno.
 *
 * POR QUE EXISTE (2026-08-18): no habia NINGUNA forma de retirarle el acceso a
 * alguien. Ante una devolucion o un impago, la unica salida era entrar a la
 * base de datos a mano y borrar su invitacion, que ademas es lo que le da el
 * acceso: borrarla dejaba al alumno fuera pero sin rastro de por que.
 * Ahora se marca `revoked_at` y queda el registro de quien y cuando.
 *
 * NO se le borra la cuenta ni el progreso: si vuelve a pagar, se devuelve el
 * acceso y se encuentra sus lecciones donde las dejo.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Accion invalida" }, { status: 400 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: contact } = await admin
    .from("contacts").select("id, email, full_name").eq("id", id).maybeSingle()
  if (!contact) return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 })

  const quitar = parsed.data.accion === "quitar"

  // Se tocan TODAS sus invitaciones aceptadas: si compro dos productos, quitar
  // el acceso los quita los dos. Media tijera es peor que ninguna.
  const { data: afectadas, error } = await admin
    .from("student_invites")
    .update(
      quitar
        ? { revoked_at: new Date().toISOString(), revoked_by: user.id }
        : { revoked_at: null, revoked_by: null }
    )
    .eq("email", contact.email)
    .not("accepted_at", "is", null)
    .select("id")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!afectadas?.length) {
    return NextResponse.json({
      error: "Este contacto no tiene ningun acceso activado, asi que no hay nada que cambiar.",
    }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    accion: parsed.data.accion,
    accesos: afectadas.length,
  })
}
