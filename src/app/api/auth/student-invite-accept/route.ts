import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const ValidateSchema = z.object({
  token: z.string().min(32).max(128),
})

const AcceptSchema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(8).max(72),
})

/**
 * GET /api/auth/student-invite-accept?token=...
 * Valida que el token existe, no esta caducado, no esta usado.
 * Devuelve email + full_name + products para que la App los muestre antes de pedir password.
 */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token")
  const parsed = ValidateSchema.safeParse({ token })
  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 400 })
  }

  const admin = getAdminClient()
  const { data: invite } = await admin
    .from("student_invites")
    .select("email, full_name, products, expires_at, accepted_at")
    .eq("token", parsed.data.token)
    .maybeSingle()

  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invitacion no encontrada" }, { status: 404 })
  }
  if (invite.accepted_at) {
    return NextResponse.json({ valid: false, error: "Esta invitacion ya fue usada" }, { status: 409 })
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "Invitacion caducada" }, { status: 410 })
  }

  return NextResponse.json({
    valid: true,
    email: invite.email,
    full_name: invite.full_name,
    products: invite.products,
  })
}

/**
 * POST /api/auth/student-invite-accept
 * Acepta la invitacion + crea usuario en App auth + activa cuenta.
 *
 * Flow:
 * 1. Valida token (existe, no caducado, no usado)
 * 2. Crea usuario en auth.users con email_confirm=true (BYOE - no manda email Supabase)
 * 3. Si el usuario ya existe (mismo email), actualiza password
 * 4. Marca invitation como aceptada
 * 5. Crea o actualiza row en public.users (perfil App alumno) con datos del contacto
 *
 * NOTA: el OS y la App comparten la misma Supabase. La tabla public.users es de la App
 * (creada en migration 0030+). No confundir con auth.users (sistema) ni public.profiles (admins OS).
 */
export async function POST(req: NextRequest) {
  const parsed = AcceptSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { token, password } = parsed.data
  const admin = getAdminClient()

  const { data: invite } = await admin
    .from("student_invites")
    .select("id, email, full_name, products, expires_at, accepted_at, contact_id")
    .eq("token", token)
    .maybeSingle()

  if (!invite) return NextResponse.json({ error: "Invitacion no encontrada" }, { status: 404 })
  if (invite.accepted_at) return NextResponse.json({ error: "Ya fue usada" }, { status: 409 })
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "Caducada" }, { status: 410 })

  const email = invite.email.toLowerCase().trim()

  // Crear o actualizar user en auth.users
  let userId: string | undefined
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { full_name: invite.full_name, role: "REP" },
  })
  if (createErr) {
    // Si ya existe, buscarlo y actualizar password
    const code = (createErr as { code?: string; status?: number }).code
    const message = (createErr as { message?: string }).message ?? ""
    if (code === "email_exists" || message.toLowerCase().includes("already")) {
      const { data: existingByEmail } = await admin.auth.admin.listUsers()
      const u = existingByEmail.users.find((x) => x.email?.toLowerCase() === email)
      if (u) {
        userId = u.id
        await admin.auth.admin.updateUserById(u.id, { password })
      }
    }
    if (!userId) {
      console.error("[student-invite-accept] createUser fallo", createErr)
      return NextResponse.json({ error: "No se pudo crear cuenta", detail: createErr.message }, { status: 500 })
    }
  } else {
    userId = created.user.id
  }

  // Marca aceptado
  await admin
    .from("student_invites")
    .update({ accepted_at: new Date().toISOString(), user_id: userId })
    .eq("id", invite.id)

  // Upsert public.users (perfil App alumno)
  // La tabla users de la App tiene id BIGINT IDENTITY + enlaza via auth_user_id (uuid)
  // first_name + last_name en lugar de full_name
  const [firstName, ...rest] = invite.full_name.trim().split(/\s+/)
  const lastName = rest.join(" ") || null

  const { data: existingProfile } = await admin
    .from("users")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle()

  if (!existingProfile) {
    await admin.from("users").insert({
      auth_user_id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      role: "REP",
      is_active: true,
      contact_id: invite.contact_id ?? null,
    })
  } else {
    await admin
      .from("users")
      .update({
        email,
        first_name: firstName,
        last_name: lastName,
        is_active: true,
        contact_id: invite.contact_id ?? null,
      })
      .eq("auth_user_id", userId)
  }

  // Unlock formaciones segun products comprados
  // user_formation_unlocks tiene FK a user_id (de public.users) + formation_id (formations table)
  // Por ahora solo dejamos la cuenta activa. El alumno hara onboarding y vera su catalogo.
  // El bloqueo por producto se aplica en el catalogo: solo muestra formations cuyo
  // product matchea invite.products.

  return NextResponse.json({
    ok: true,
    email,
    products: invite.products,
    user_id: userId,
  })
}
