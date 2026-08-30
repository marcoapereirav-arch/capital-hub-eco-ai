import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSlugsFormacion } from "@/lib/catalogo/productos"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { sendTeamInvite } from "@/lib/email/senders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const ROLES = ["super_admin", "marketing", "closer", "setter", "formador"] as const
// Las formaciones asignables NO se escriben aqui: salen del catalogo real.
// Esta lista tenia "media-buyer-digital" (retirado el 2026-07-30) y le faltaba
// "clipper", asi que no se podia asignar un formador a Clipper.

const InviteSchema = z.object({
  email: z.string().email().max(255),
  full_name: z.string().min(2).max(120),
  role: z.enum(ROLES),
  // Solo requerido si role=formador. Ignorado para los demás roles.
  formacion_asignada: z.string().min(1).max(80).optional().nullable(),
}).refine(
  (data) => data.role !== "formador" || !!data.formacion_asignada,
  { message: "El formador debe tener una formacion_asignada", path: ["formacion_asignada"] },
)

/**
 * Mapea el rol del OS al rol que se setea en auth.users.user_metadata.role
 * y en public.users.role (tabla de la App). La App lee este valor para decidir
 * si el user puede editar (ADMIN) o solo ver (USER).
 *
 * Decisión Marco 2026-06-18:
 * - super_admin/admin → ADMIN (edita todo en la App)
 * - formador → ADMIN (edita solo SU formación, gate por formacion_asignada)
 * - marketing/closer/setter → USER (ve todo, no edita nada)
 */
function osRoleToAppRole(osRole: typeof ROLES[number]): "ADMIN" | "USER" {
  if (osRole === "super_admin" || osRole === "formador") return "ADMIN"
  return "USER"
}

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

  // CANDADO · la formacion asignada tiene que existir en el catalogo real.
  // Si no, el formador entra y no ve nada suyo, sin ningun error.
  if (data.formacion_asignada) {
    try {
      const validas = await getSlugsFormacion()
      if (!validas.includes(data.formacion_asignada)) {
        return NextResponse.json({
          error: `Esa formacion no existe: ${data.formacion_asignada}. Disponibles: ${validas.join(", ")}`,
        }, { status: 400 })
      }
    } catch (e) {
      return NextResponse.json({
        error: "No se pudo comprobar el catalogo de formaciones. Vuelve a intentarlo.",
        detail: (e as Error).message,
      }, { status: 503 })
    }
  }
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

  const appRole = osRoleToAppRole(data.role)

  // Crear user en Supabase Auth SIN mandar email.
  // user_metadata.role es CRÍTICO: la App lo lee para gate de permisos (ADMIN/USER).
  // Sin este metadata el user cae a USER por default y los formadores/admins no podrían editar.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: data.full_name, role: appRole },
  })
  if (createErr || !created.user) {
    console.error("[team/invite] createUser failed", createErr)
    return NextResponse.json({ error: "Error creando usuario", detail: createErr?.message }, { status: 500 })
  }

  // Profile OS: UPSERT explícito. El trigger handle_new_auth_user escribe en public.users
  // (tabla App), no en public.profiles (tabla OS). Si confiábamos en él, profile quedaba
  // vacío → role=null → loop infinito en login.
  const { error: profileErr } = await admin
    .from("profiles")
    .upsert({
      id: created.user.id,
      email,
      role: data.role,
      full_name: data.full_name,
      formacion_asignada: data.role === "formador" ? data.formacion_asignada : null,
      invited_by: user.id,
      invited_at: new Date().toISOString(),
      active: false,  // se activa al aceptar invitación
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" })
  if (profileErr) {
    console.error("[team/invite] profile upsert failed", profileErr)
    await admin.auth.admin.deleteUser(created.user.id).catch(() => null)
    return NextResponse.json({ error: "Error creando perfil", detail: profileErr.message }, { status: 500 })
  }

  // public.users (App): propagar formacion_asignada si es formador.
  // El trigger handle_new_auth_user ya creó el row con role del metadata (ADMIN/USER).
  // Aquí le añadimos formacion_asignada para que la App pueda hacer gate de edición.
  if (data.role === "formador" && data.formacion_asignada) {
    await admin
      .from("users")
      .update({ formacion_asignada: data.formacion_asignada })
      .eq("auth_user_id", created.user.id)
      .then(() => null, () => null)
  }

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://os.capitalhubapp.com"
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
