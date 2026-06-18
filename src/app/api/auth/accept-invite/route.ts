import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const Schema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(8).max(72),
})

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/auth/accept-invite
 * El invitado introduce contraseña → activamos su cuenta + activamos profile.
 */
export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { token, password } = parsed.data
  const admin = getAdminClient()

  const { data: invite } = await admin
    .from("team_invitations")
    .select("id, email, full_name, role, expires_at, accepted_at, user_id")
    .eq("token", token)
    .maybeSingle()

  if (!invite) return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
  if (invite.accepted_at) return NextResponse.json({ error: "Esta invitación ya fue usada" }, { status: 409 })
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "La invitación ha caducado. Pide una nueva." }, { status: 410 })
  }
  if (!invite.user_id) return NextResponse.json({ error: "Invitación corrupta" }, { status: 500 })

  // Mapeo de rol OS → rol App. Necesario para que el user_metadata.role propague el rol
  // correcto a la App al activar la cuenta.
  const appRole = (invite.role === "super_admin" || invite.role === "admin" || invite.role === "formador") ? "ADMIN" : "USER"

  // Actualiza contraseña + propaga metadata role (defensa por si el endpoint /team falló en setearlo)
  const { error: updErr } = await admin.auth.admin.updateUserById(invite.user_id, {
    password,
    user_metadata: { full_name: invite.full_name, role: appRole },
  })
  if (updErr) {
    console.error("[accept-invite] updateUserById failed", updErr)
    return NextResponse.json({ error: "No se pudo establecer la contraseña", detail: updErr.message }, { status: 500 })
  }

  // Lee formacion_asignada del profile (si es formador)
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("formacion_asignada")
    .eq("id", invite.user_id)
    .maybeSingle()
  const formacionAsignada = (existingProfile as { formacion_asignada?: string | null } | null)?.formacion_asignada ?? null

  // Marca profile como activo. UPSERT por defensa: si por alguna razón el profile no existe
  // (bug histórico), lo creamos aquí desde los datos de la invitación.
  await admin
    .from("profiles")
    .upsert({
      id: invite.user_id,
      email: invite.email,
      full_name: invite.full_name,
      role: invite.role,
      formacion_asignada: formacionAsignada,
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" })

  // public.users (App): sincronizar role + formacion_asignada por si el trigger handle_new_auth_user
  // no propagó el role (race condition cuando user_metadata se setea después del insert inicial).
  await admin
    .from("users")
    .update({ role: appRole, formacion_asignada: formacionAsignada })
    .eq("auth_user_id", invite.user_id)
    .then(() => null, () => null)

  // Marca invitación como aceptada
  await admin
    .from("team_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id)

  return NextResponse.json({ ok: true, email: invite.email })
}
