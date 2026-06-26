import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** POST /api/me/password — el usuario autenticado cambia su contraseña. */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { password?: string }
  const password = body.password ?? ""
  if (password.length < 8) return NextResponse.json({ error: "La contraseña debe tener mínimo 8 caracteres" }, { status: 400 })

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aviso de confirmación por Resend (best-effort, no bloquea).
  if (user.email) {
    try {
      const { sendPasswordChanged } = await import("@/lib/email/senders")
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      await sendPasswordChanged({ email: user.email, fullName: profile?.full_name ?? user.email, changedAt: new Date() })
    } catch (e) {
      console.error("[me/password] email confirmacion fallo:", e)
    }
  }
  return NextResponse.json({ ok: true })
}
