import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { sendWelcomeAlumnoHT, notifyMarcoPurchase } from "@/lib/email/senders"
import { notifyAdmins } from "@/lib/notifications/notify-admins"
import { getProductosVendibles, productosQueNoExisten } from "@/lib/catalogo/productos"

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

// La lista de productos NO se escribe aqui: sale del catalogo real (routes).
// Ver src/lib/catalogo/productos.ts y el vigilante `npm run check:productos`.
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
  phone: z.string().min(6).max(40),
  source: z.string().max(60).optional(),
  // Producto
  // Se valida contra el catalogo real dentro del handler, no aqui:
  // un z.enum obligaria a repetir la lista y es justo lo que rompio esto.
  products: z.array(z.string().min(1).max(120)).min(1),
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

  // CANDADO · no se vende lo que no existe en el catalogo.
  // Sin esto, la venta se registraba, el correo salia, el alumno ponia su
  // contraseña, entraba... y veia la formacion VACIA sin ningun aviso.
  // Ahora el closer se entera EN EL MOMENTO, que es cuando se puede arreglar.
  try {
    const inexistentes = await productosQueNoExisten(data.products)
    if (inexistentes.length) {
      return NextResponse.json({
        error: `Este producto ya no existe en el catalogo: ${inexistentes.join(", ")}. Recarga la pagina y elige uno de la lista.`,
      }, { status: 400 })
    }
  } catch (e) {
    // FAIL-CLOSED: si no se puede comprobar, no se registra la venta.
    return NextResponse.json({
      error: "No se pudo comprobar el catalogo de productos. Vuelve a intentarlo.",
      detail: (e as Error).message,
    }, { status: 503 })
  }

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
        phone: data.phone.trim(),
        last_call_at: new Date().toISOString(),
        sale_pending: false,
        sale_pending_since: null,
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
          phone: data.phone.trim(),
          last_call_at: new Date().toISOString(),
          source: data.source ?? null,
          sale_pending: false,
          sale_pending_since: null,
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
          phone: data.phone.trim(),
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
  //    Se guarda TAMBIÉN quién trajo a esta persona. El dato ya vivía en el contacto,
  //    pero para saber de qué afiliado venía una venta había que ir a buscarlo a mano.
  //    Aquí queda escrito en la propia venta, con su fecha, que es lo que lee el
  //    dashboard de Afiliados para repartir los ingresos por periodo.
  const { data: quienLoTrajo } = await admin
    .from("contacts")
    .select("affiliate_slug, funnel_slug")
    .eq("id", contactId)
    .maybeSingle()

  const afiliadoSlug = (quienLoTrajo?.affiliate_slug as string | null) ?? null
  const { data: afiliado } = afiliadoSlug
    ? await admin.from("affiliates").select("name").eq("slug", afiliadoSlug).maybeSingle()
    : { data: null }
  const afiliadoNombre = (afiliado?.name as string | undefined) ?? afiliadoSlug

  await admin.from("contact_journey_events").insert({
    contact_id: contactId,
    type: "sale",
    title: afiliadoNombre
      ? `Venta cerrada · ${data.products.join(" + ")} · ${data.revenue.toFixed(2)}€ · vino de ${afiliadoNombre}`
      : `Venta cerrada · ${data.products.join(" + ")} · ${data.revenue.toFixed(2)}€`,
    description: data.notes ?? null,
    data: {
      revenue: data.revenue,
      cash_collected: data.cash_collected,
      payment_method: data.payment_method,
      close_type: data.close_type,
      closer_name: data.closer_name,
      products: data.products,
      affiliate_slug: afiliadoSlug,
      affiliate_name: afiliadoNombre,
      funnel_slug: (quienLoTrajo?.funnel_slug as string | null) ?? null,
    },
    created_by_user_id: user.id,
  })

  // 3. Student invite + email magic link
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: caller } = await admin.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle()

  // ⚠️ student_invites tiene UNIQUE index sobre lower(email) WHERE accepted_at IS NULL.
  // Si ya hay un invite pendiente para este email (alumno reactivado, etc), invalidamos
  // el viejo antes de crear el nuevo — sino el INSERT falla silenciosamente y se envía
  // un email con un token huérfano que NO existe en BD (bug verificado 2026-06-18).
  await admin
    .from("student_invites")
    .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
    .ilike("email", email)
    .is("accepted_at", null)

  const { error: inviteInsertError } = await admin.from("student_invites").insert({
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
  if (inviteInsertError) {
    console.error("[sales/register] student_invite INSERT failed", inviteInsertError)
    return NextResponse.json({
      error: "No se pudo generar la invitación. Revisa si el alumno ya tiene cuenta activa.",
      detail: inviteInsertError.message,
    }, { status: 500 })
  }

  // URL fija al dominio canónico de la App (NEXT_PUBLIC_APP_ALUMNO_URL puede estar mal seteada
  // a una preview URL de Vercel; forzamos app.capitalhubapp.com).
  const appUrl = "https://app.capitalhubapp.com"
  const acceptUrl = `${appUrl}/accept-invite/${token}`

  // Emails: AWAIT obligatorio. Sin await la función serverless de Vercel termina
  // antes de que el fetch a Resend complete y se aborta con
  // "Unable to fetch data. The request could not be resolved." (verificado en BD).
  const [welcomeResult, notifResult] = await Promise.allSettled([
    sendWelcomeAlumnoHT({
      fullName: data.full_name,
      email,
      product: data.products.join(" + "),
      inviteUrl: acceptUrl,
      closerName: data.closer_name,
      contactId,
    }),
    notifyMarcoPurchase({
      eventLabel: data.close_type === "sales_call" ? "Cierre tras llamada" : "Cierre directo (sin llamada)",
      fullName: data.full_name,
      email,
      amount: data.revenue,
      currency: "EUR",
      productName: data.products.join(" + "),
    }),
  ])

  const welcomeOk = welcomeResult.status === "fulfilled" && welcomeResult.value.ok
  if (!welcomeOk) {
    const err = welcomeResult.status === "fulfilled" ? welcomeResult.value.error : (welcomeResult.reason as Error)?.message
    console.error("[sales/register] welcome alumno email failed", err)
  }
  if (notifResult.status === "rejected") {
    console.error("[sales/register] notif Marco failed", notifResult.reason)
  }

  // Push + in-app al equipo (además del email de notifyMarcoPurchase).
  await notifyAdmins(admin, {
    title: "Venta registrada",
    body: afiliadoNombre
      ? `${data.full_name} · ${data.products.join(" + ")} · ${data.revenue.toFixed(0)} € · vino de ${afiliadoNombre}`
      : `${data.full_name} · ${data.products.join(" + ")} · ${data.revenue.toFixed(0)} €`,
    type: "venta",
    url: contactId ? `/crm/contactos/${contactId}` : "/crm/pipeline",
    data: { contact_id: contactId, email, revenue: data.revenue, affiliate_slug: afiliadoSlug },
  })

  return NextResponse.json({
    ok: true,
    contact_id: contactId,
    invite_url: acceptUrl,
    products: data.products,
    revenue: data.revenue,
    cash_collected: data.cash_collected,
    email_sent: welcomeOk,
    email_error: welcomeOk ? null : (welcomeResult.status === "fulfilled" ? welcomeResult.value.error : (welcomeResult.reason as Error)?.message ?? "unknown"),
  })
}

/**
 * GET — devuelve las personas que pueden figurar como "quién cerró".
 *
 * Fuente única = tabla `profiles` (la MISMA que alimenta /team). Cualquier
 * persona activa del SaaS, sin importar su rol (super_admin, marketing, closer,
 * setter, formador…), aparece aquí. Al crear un miembro nuevo en /team se refleja
 * automáticamente: este endpoint se refetchea cada vez que se abre el modal de venta.
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("active", true)
    .order("full_name", { nullsFirst: false })

  // FAIL-CLOSED: si el catalogo no carga, el widget se entera. Antes devolvia
  // una lista escrita a mano que llevaba 19 dias sin Clipper.
  let products: string[]
  try {
    products = (await getProductosVendibles()).map((p) => p.nombre)
  } catch (e) {
    return NextResponse.json(
      { error: "No se pudo cargar el catalogo de productos", detail: (e as Error).message },
      { status: 503 }
    )
  }

  return NextResponse.json({
    closers: data ?? [],
    products,
    payment_methods: PAYMENT_METHODS,
  })
}
