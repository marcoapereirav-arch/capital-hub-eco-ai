import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { sendTeamInvite } from "@/lib/email/senders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const ROLES = ["super_admin", "marketing", "closer", "setter", "formador", "equipo"] as const

const InviteSchema = z.object({
  email: z.string().email().max(255),
  full_name: z.string().min(2).max(120),
  role: z.enum(ROLES),
})

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * GET /api/admin/team
 * Lista miembros activos + invitaciones pendientes.
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const [{ data: members }, { data: invitations }] = await Promise.all([
    admin.from("profiles").select("id, email, full_name, role, active, created_at").order("created_at"),
    admin.from("team_invitations").select("id, email, full_name, role, invited_by_name, expires_at, accepted_at, created_at").is("accepted_at", null).order("created_at", { ascending: false }),
  ])
  return NextResponse.json({ members: members ?? [], pendingInvitations: invitations ?? [] })
}

/**
 * POST /api/admin/team
 * Invitar nuevo miembro. Solo super_admin.
 * Flow BYOE:
 * 1. Crea usuario en auth con email_confirm=true (NO manda email Supabase)
 * 2. Genera token nuestro
 * 3. Guarda invitation en BD con token
 * 4. Manda email via Resend con link /accept-invite/[token]
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verifica super_admin
  const { data: caller } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single()
  if (!caller || caller.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden — solo super_admin puede invitar" }, { status: 403 })
  }

  const parsed = InviteSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const data = parsed.data
  const admin = getAdminClient()

  const email = data.email.toLowerCase().trim()

  // Verifica no exista ya
  const { data: existingMember } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle()
  if (existingMember) {
    return NextResponse.json({ error: "Ese email ya está en el equipo" }, { status: 409 })
  }

  // Crear user en Supabase Auth SIN mandar email
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  })
  if (createErr || !created.user) {
    console.error("[team/invite] createUser failed", createErr)
    return NextResponse.json({ error: "Error creando usuario", detail: createErr?.message }, { status: 500 })
  }

  // Profile (trigger handle_new_user lo crea — actualizamos rol)
  await admin
    .from("profiles")
    .update({
      role: data.role,
      full_name: data.full_name,
      invited_by: user.id,
      invited_at: new Date().toISOString(),
      active: false,  // se activa al aceptar invitación
    })
    .eq("id", created.user.id)

  // Token nuestro
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: invErr } = await admin.from("team_invitations").insert({
    email,
    full_name: data.full_name,
    role: data.role,
    token,
    invited_by: user.id,
    invited_by_name: caller.full_name ?? caller.email ?? "Capital Hub",
    expires_at: expiresAt,
    user_id: created.user.id,
  })
  if (invErr) {
    return NextResponse.json({ error: "Error guardando invitación", detail: invErr.message }, { status: 500 })
  }

  // Email Resend con link nuestro (BYOE)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ecoai.capitalhubapp.com"
  const acceptUrl = `${baseUrl}/accept-invite/${token}`

  await sendTeamInvite({
    fullName: data.full_name,
    email,
    invitedByName: caller.full_name ?? caller.email ?? "Capital Hub",
    role: data.role,
    acceptUrl,
    expiresIn: "7 días",
  })

  return NextResponse.json({ ok: true, accept_url: acceptUrl }, { status: 201 })
}
