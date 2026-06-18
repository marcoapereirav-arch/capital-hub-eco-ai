import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { sendWelcomeAlumnoHT, notifyMarcoPurchase } from "@/lib/email/senders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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

const PRODUCTS = ["IA Integrator", "Media Buyer Digital", "Comercial Closing"] as const
const PAYMENT_METHODS = [
  "Stripe (full pay)",
  "Stripe (split pay)",
  "Hotmart",
  "SeQura",
  "Transferencia",
  "Whop manual",
  "Otro",
] as const

const Schema = z.object({
  close_type: z.enum(["sales_call", "direct"]),
  // Lead
  contact_id: z.string().uuid().optional(),
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  phone: z.string().max(40).optional(),
  source: z.string().max(60).optional(),
  // Producto
  products: z.array(z.enum(PRODUCTS)).min(1),
  // Cifras
  revenue: z.number().nonnegative(),
  cash_collected: z.number().nonnegative(),
  payment_method: z.enum(PAYMENT_METHODS),
  // Cerró
  closer_user_id: z.string().uuid(),
  closer_name: z.string().max(80),
  // Notas
  notes: z.string().max(2000).optional(),
})

/**
 * POST /api/admin/sales/register
 * El closer rellena el formulario tras cerrar. Hace 4 cosas:
 * 1. Crea/actualiza contacto con stage 'won' + cifras + productos
 * 2. Crea contact_journey_event tipo 'sale'
 * 3. Crea student_invite con token único + email al alumno con magic link
 * 4. Notif a Marco con purchase alert
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const data = parsed.data
  const admin = getAdminClient()
  const email = data.email.toLowerCase().trim()

  // 1. Upsert contacto
  let contactId = data.contact_id
  if (contactId) {
    // Update existing
    const { data: existing } = await admin.from("contacts").select("products, total_revenue, total_cash_collected").eq("id", contactId).maybeSingle()
    const mergedProducts = Array.from(new Set([...(existing?.products ?? []), ...data.products]))
    await admin
      .from("contacts")
      .update({
        stage: "alumno",
        products: mergedProducts,
        total_revenue: (existing?.total_revenue ?? 0) + data.revenue,
        total_cash_collected: (existing?.total_cash_collected ?? 0) + data.cash_collected,
        owner_assignee: data.closer_name,
        full_name: data.full_name.trim(),
        phone: data.phone?.trim() ?? null,
        last_call_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId)
  } else {
    // Buscar por email o crear
    const { data: existing } = await admin.from("contacts").select("id, products, total_revenue, total_cash_collected").ilike("email", email).maybeSingle()
    if (existing) {
      contactId = existing.id
      const mergedProducts = Array.from(new Set([...(existing.products ?? []), ...data.products]))
      await admin
        .from("contacts")
        .update({
          stage: "alumno",
          products: mergedProducts,
          total_revenue: (existing.total_revenue ?? 0) + data.revenue,
          total_cash_collected: (existing.total_cash_collected ?? 0) + data.cash_collected,
          owner_assignee: data.closer_name,
          full_name: data.full_name.trim(),
          phone: data.phone?.trim() ?? null,
          last_call_at: new Date().toISOString(),
          source: data.source ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
    } else {
      // Slug: slugified name + sufijo aleatorio (NOT NULL sin default en BD)
      const slugBase = data.full_name.trim().toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "alumno"
      const slug = `${slugBase}-${Math.random().toString(36).slice(2, 8)}`
      const { data: created, error: insErr } = await admin
        .from("contacts")
        .insert({
          email,
          slug,
          full_name: data.full_name.trim(),
          phone: data.phone?.trim() ?? null,
          stage: "alumno",
          products: data.products,
          total_revenue: data.revenue,
          total_cash_collected: data.cash_collected,
          owner_assignee: data.closer_name,
          source: data.source ?? (data.close_type === "sales_call" ? "sales_call_close" : "direct_close"),
          last_call_at: new Date().toISOString(),
        })
        .select("id")
        .single()
      if (insErr) {
        console.error("[sales/register] contact insert failed", insErr)
        return NextResponse.json({ error: "Could not upsert contact", detail: insErr.message }, { status: 500 })
      }
      contactId = created?.id
    }
  }

  if (!contactId) {
    return NextResponse.json({ error: "Could not upsert contact" }, { status: 500 })
  }

  // 2. Journey event
  await admin.from("contact_journey_events").insert({
    contact_id: contactId,
    type: "sale",
    title: `Venta cerrada · ${data.products.join(" + ")} · ${data.revenue.toFixed(2)}€`,
    description: data.notes ?? null,
    data: {
      revenue: data.revenue,
      cash_collected: data.cash_collected,
      payment_method: data.payment_method,
      close_type: data.close_type,
      closer_name: data.closer_name,
      products: data.products,
    },
    created_by_user_id: user.id,
  })

  // 3. Student invite + email magic link
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: caller } = await admin.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle()

  await admin.from("student_invites").insert({
    contact_id: contactId,
    email,
    full_name: data.full_name.trim(),
    products: data.products,
    token,
    expires_at: expiresAt,
    invited_by: user.id,
    invited_by_name: caller?.full_name ?? caller?.email ?? "Capital Hub",
    metadata: {
      revenue: data.revenue,
      cash_collected: data.cash_collected,
      payment_method: data.payment_method,
      close_type: data.close_type,
    },
  })

  // URL fija al dominio canónico de la App (NEXT_PUBLIC_APP_ALUMNO_URL puede estar mal seteada
  // a una preview URL de Vercel; forzamos app.capitalhubapp.com).
  const appUrl = "https://app.capitalhubapp.com"
  const acceptUrl = `${appUrl}/accept-invite/${token}`

  // Email al alumno
  sendWelcomeAlumnoHT({
    fullName: data.full_name,
    email,
    product: data.products.join(" + "),
    inviteUrl: acceptUrl,
    closerName: data.closer_name,
    contactId,
  }).catch((e) => console.error("[sales/register] welcome alumno email failed", e))

  // Notif a Marco
  notifyMarcoPurchase({
    eventLabel: data.close_type === "sales_call" ? "Cierre tras llamada" : "Cierre directo (sin llamada)",
    fullName: data.full_name,
    email,
    amount: data.revenue,
    currency: "EUR",
    productName: data.products.join(" + "),
  }).catch((e) => console.error("[sales/register] notif Marco failed", e))

  return NextResponse.json({
    ok: true,
    contact_id: contactId,
    invite_url: acceptUrl,
    products: data.products,
    revenue: data.revenue,
    cash_collected: data.cash_collected,
  })
}

/**
 * GET — devuelve los closers disponibles (super_admin + closer)
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["super_admin", "closer"])
    .eq("active", true)
    .order("full_name")

  return NextResponse.json({
    closers: data ?? [],
    products: PRODUCTS,
    payment_methods: PAYMENT_METHODS,
  })
}
