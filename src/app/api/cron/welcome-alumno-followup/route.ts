import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/send-email"
import { render } from "@react-email/render"
import { WelcomeAlumnoHTEmail } from "@/lib/email/templates/welcome-alumno-ht"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Cron diario: si un student_invite lleva 3+ días sin aceptar, reenvía el email.
 * Solo lo hace 1 vez (marca followup_sent_at en metadata).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getAdminClient()
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: stale } = await admin
    .from("student_invites")
    .select("id, email, full_name, products, token, metadata, expires_at, created_at")
    .is("accepted_at", null)
    .lt("created_at", threeDaysAgo)
    .gt("expires_at", new Date().toISOString())

  const appUrl = process.env.NEXT_PUBLIC_APP_ALUMNO_URL ?? "https://app.capitalhubapp.com"
  let sent = 0
  for (const invite of stale ?? []) {
    const metadata = (invite.metadata ?? {}) as Record<string, unknown>
    if (metadata.followup_sent_at) continue

    try {
      const html = await render(WelcomeAlumnoHTEmail({
        fullName: invite.full_name,
        product: invite.products.join(" + "),
        inviteUrl: `${appUrl}/accept-invite/${invite.token}`,
        closerName: "Equipo Capital Hub",
      }))
      await sendEmail({
        template: "welcome_alumno_ht_followup",
        to: invite.email,
        toName: invite.full_name,
        subject: "Tu acceso a Capital Hub sigue activo · Recordatorio",
        html,
      })
      await admin
        .from("student_invites")
        .update({ metadata: { ...metadata, followup_sent_at: new Date().toISOString() } })
        .eq("id", invite.id)
      sent++
    } catch (e) {
      console.error("[welcome-alumno-followup] error", invite.id, e)
    }
  }

  return NextResponse.json({ ok: true, found: stale?.length ?? 0, sent })
}
