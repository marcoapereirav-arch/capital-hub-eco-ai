import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { render } from "@react-email/render"
import { WelcomeAlumnoHTEmail } from "@/lib/email/templates/welcome-alumno-ht"
import { TeamInviteEmail } from "@/lib/email/templates/team-invite"
import { InternalPurchaseAlert } from "@/lib/email/templates/internal-purchase-alert"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Catálogo de templates editables.
 * defaultSubject + defaultHtml se renderean a partir del componente React con datos
 * dummy de preview. Las variables {{...}} se sustituyen al enviar el email real.
 */
const TEMPLATES = [
  {
    key: "welcome_alumno_ht",
    label: "Bienvenida alumno tras venta",
    description: "Se manda al alumno cuando se cierra una venta y se genera la invitación de acceso a la App.",
    variables: ["firstName", "fullName", "product", "inviteUrl", "closerName"],
    renderDefault: async () => render(WelcomeAlumnoHTEmail({
      fullName: "{{fullName}}",
      product: "{{product}}",
      inviteUrl: "{{inviteUrl}}",
      closerName: "{{closerName}}",
    })),
    defaultSubject: "{{firstName}}, entras hoy a Capital Hub",
  },
  {
    key: "team_invite",
    label: "Invitación al equipo (OS)",
    description: "Se manda a un nuevo miembro del equipo (closer/setter/marketing/formador/super_admin).",
    variables: ["fullName", "invitedByName", "role", "acceptUrl"],
    renderDefault: async () => render(TeamInviteEmail({
      fullName: "{{fullName}}",
      invitedByName: "{{invitedByName}}",
      role: "{{role}}",
      acceptUrl: "{{acceptUrl}}",
      expiresIn: "7 días",
    })),
    defaultSubject: "{{invitedByName}} te invita al OS de Capital Hub",
  },
  {
    key: "internal_purchase_alert_marco",
    label: "Notif venta interna (Marco)",
    description: "Se manda a Marco cada vez que entra una venta en el OS.",
    variables: ["fullName", "email", "amount", "currency", "productName", "eventLabel"],
    renderDefault: async () => render(InternalPurchaseAlert({
      eventLabel: "{{eventLabel}}",
      fullName: "{{fullName}}",
      email: "{{email}}",
      amount: 0,
      currency: "{{currency}}",
      productName: "{{productName}}",
    })),
    defaultSubject: "{{amount}}€ · {{eventLabel}} — {{fullName}}",
  },
  {
    key: "internal_purchase_alert_adrian",
    label: "Notif venta interna (Adrián)",
    description: "Igual que la de Marco pero a Adrián.",
    variables: ["fullName", "email", "amount", "currency", "productName", "eventLabel"],
    renderDefault: async () => render(InternalPurchaseAlert({
      eventLabel: "{{eventLabel}}",
      fullName: "{{fullName}}",
      email: "{{email}}",
      amount: 0,
      currency: "{{currency}}",
      productName: "{{productName}}",
    })),
    defaultSubject: "{{amount}}€ · {{eventLabel}} — {{fullName}}",
  },
]

/**
 * GET /api/admin/email-templates
 * Devuelve los templates con su contenido actual (override si existe, default si no).
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: overrides } = await admin
    .from("email_template_overrides")
    .select("template_key, subject, html_body, updated_at")

  const overrideMap = new Map((overrides ?? []).map((o) => [o.template_key as string, o]))

  const result = await Promise.all(TEMPLATES.map(async (t) => {
    const override = overrideMap.get(t.key)
    const defaultHtml = await t.renderDefault()
    return {
      key: t.key,
      label: t.label,
      description: t.description,
      variables: t.variables,
      defaultSubject: t.defaultSubject,
      defaultHtml,
      currentSubject: override?.subject ?? t.defaultSubject,
      currentHtml: override?.html_body ?? defaultHtml,
      hasOverride: !!override,
      updatedAt: override?.updated_at ?? null,
    }
  }))

  return NextResponse.json({ templates: result })
}

/**
 * PUT /api/admin/email-templates
 * Body: { template_key, subject, html_body }
 * Upsert del override. Solo super_admin (chequeado por RLS de la tabla).
 */
export async function PUT(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as {
    template_key?: string
    subject?: string
    html_body?: string
  }
  if (!body.template_key || !body.subject || !body.html_body) {
    return NextResponse.json({ error: "template_key, subject y html_body son obligatorios" }, { status: 400 })
  }
  if (!TEMPLATES.find((t) => t.key === body.template_key)) {
    return NextResponse.json({ error: "Template no reconocido" }, { status: 400 })
  }

  const admin = getAdminClient()
  const { error } = await admin
    .from("email_template_overrides")
    .upsert({
      template_key: body.template_key,
      subject: body.subject,
      html_body: body.html_body,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "template_key" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/admin/email-templates?key=...
 * Borra el override → vuelve al default hardcoded del template React.
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const key = new URL(req.url).searchParams.get("key")
  if (!key) return NextResponse.json({ error: "key requerido" }, { status: 400 })

  const admin = getAdminClient()
  const { error } = await admin
    .from("email_template_overrides")
    .delete()
    .eq("template_key", key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
