import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { asegurarEtiquetaDeFuente, normalizarFuente } from "@/lib/atribucion/atribucion"
import { construirLinkDeAfiliado, funnelsParaLinks } from "@/lib/afiliados/funnels"
import { FUNNEL_CATALOG } from "@/lib/meta/funnel-catalog"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * Los numeros de la seccion Afiliados.
 *
 * QUE CAMBIO EL 2026-08-07
 * Antes esta ruta devolvia UN link por afiliado, siempre al Test de Personalidad, escrito
 * a fuego (`FUNNEL_PATH = "/test-personalidad"`), y contra el dominio del OS
 * (os.capitalhubapp.com), que no es por donde entran los leads. Ahora devuelve los links
 * que Marco ha creado, hacia el funnel que el elija, contra el dominio publico.
 *
 * DE DONDE SALE CADA NUMERO
 * · Visitas   · `affiliate_visits`, una por navegador, funnel y dia. Se registran aunque el
 *               funnel no tenga formulario, asi que un link a LT8 tambien se mide.
 * · Contactos · `contacts.affiliate_slug`, por fecha de alta del contacto.
 * · Ingresos  · los eventos de venta (`contact_journey_events` type='sale'), por fecha de la
 *               VENTA. Es lo exacto para un rango de fechas: `contacts.total_revenue` es un
 *               acumulado sin fecha y sumaria ventas viejas dentro de "esta semana".
 */

/**
 * Como se reparte cada contacto entre los contadores. Cada etapa cae en UNA sola casilla,
 * y las casillas suman el total. Antes se contaban solo lead, agendado y alumno: quien
 * estaba en seguimiento, no show, perdido o lead cualificado no aparecia en ningun sitio,
 * asi que un afiliado con 40 leads y 30 en seguimiento parecia haber traido 10.
 */
const ETAPAS_LEAD = ["dm", "lead", "lead_cualificado"]
const ETAPAS_EN_JUEGO = ["seguimiento", "no_show"]

type ContactoFila = {
  affiliate_slug: string | null
  funnel_slug: string | null
  stage: string | null
  created_at: string
}

type EstadisticaBase = {
  visitas: number
  contactos: number
  leads: number
  agendados: number
  enJuego: number
  alumnos: number
  perdidos: number
  ingresos: number
  ventas: number
}

function statsVacias(): EstadisticaBase {
  return {
    visitas: 0,
    contactos: 0,
    leads: 0,
    agendados: 0,
    enJuego: 0,
    alumnos: 0,
    perdidos: 0,
    ingresos: 0,
    ventas: 0,
  }
}

function sumarContacto(s: EstadisticaBase, stage: string | null): void {
  s.contactos += 1
  if (stage === "alumno") s.alumnos += 1
  else if (stage === "perdido") s.perdidos += 1
  else if (stage === "agendado") s.agendados += 1
  else if (stage && ETAPAS_EN_JUEGO.includes(stage)) s.enJuego += 1
  else if (stage && ETAPAS_LEAD.includes(stage)) s.leads += 1
  else s.leads += 1 // sin etapa todavia: es un lead recien entrado
}

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rango de fechas del filtro del OS. Sin rango, todo el historico.
  const desde = req.nextUrl.searchParams.get("from")
  const hasta = req.nextUrl.searchParams.get("to")

  const admin = getAdminClient()

  let consultaContactos = admin
    .from("contacts")
    .select("affiliate_slug, funnel_slug, stage, created_at")
    .not("affiliate_slug", "is", null)
  if (desde) consultaContactos = consultaContactos.gte("created_at", desde)
  if (hasta) consultaContactos = consultaContactos.lte("created_at", hasta)

  let consultaVisitas = admin
    .from("affiliate_visits")
    .select("affiliate_slug, funnel_slug, created_at")
  if (desde) consultaVisitas = consultaVisitas.gte("created_at", desde)
  if (hasta) consultaVisitas = consultaVisitas.lte("created_at", hasta)

  let consultaVentas = admin
    .from("contact_journey_events")
    .select("contact_id, data, created_at")
    .eq("type", "sale")
  if (desde) consultaVentas = consultaVentas.gte("created_at", desde)
  if (hasta) consultaVentas = consultaVentas.lte("created_at", hasta)

  const [
    { data: afiliados },
    { data: links },
    { data: contactos },
    { data: visitas },
    { data: ventas },
    funnels,
  ] = await Promise.all([
    admin.from("affiliates").select("slug, name, active, created_at").order("name"),
    admin.from("affiliate_links").select("id, affiliate_slug, funnel_slug, active, created_at"),
    consultaContactos,
    consultaVisitas,
    consultaVentas,
    funnelsParaLinks(admin),
  ])

  // Las ventas guardan el contacto, no el afiliado: hay que traducir.
  const idsDeVenta = [...new Set((ventas ?? []).map((v) => v.contact_id as string))]
  const afiliadoPorContacto = new Map<string, { slug: string | null; funnel: string | null }>()
  if (idsDeVenta.length) {
    const { data: duenos } = await admin
      .from("contacts")
      .select("id, affiliate_slug, funnel_slug")
      .in("id", idsDeVenta)
    for (const c of duenos ?? []) {
      afiliadoPorContacto.set(c.id as string, {
        slug: (c.affiliate_slug as string | null) ?? null,
        funnel: (c.funnel_slug as string | null) ?? null,
      })
    }
  }

  const porAfiliado = new Map<string, EstadisticaBase>()
  const porAfiliadoFunnel = new Map<string, EstadisticaBase>()
  const claveCruce = (slug: string, funnel: string | null) => `${slug}::${funnel ?? "sin_funnel"}`

  const dame = (mapa: Map<string, EstadisticaBase>, clave: string) => {
    const actual = mapa.get(clave) ?? statsVacias()
    mapa.set(clave, actual)
    return actual
  }

  for (const c of (contactos ?? []) as ContactoFila[]) {
    const slug = c.affiliate_slug as string
    sumarContacto(dame(porAfiliado, slug), c.stage)
    sumarContacto(dame(porAfiliadoFunnel, claveCruce(slug, c.funnel_slug)), c.stage)
  }

  for (const v of visitas ?? []) {
    const slug = v.affiliate_slug as string
    dame(porAfiliado, slug).visitas += 1
    dame(porAfiliadoFunnel, claveCruce(slug, v.funnel_slug as string | null)).visitas += 1
  }

  for (const venta of ventas ?? []) {
    const dueno = afiliadoPorContacto.get(venta.contact_id as string)
    if (!dueno?.slug) continue
    const importe = Number((venta.data as { revenue?: number } | null)?.revenue ?? 0)
    const s = dame(porAfiliado, dueno.slug)
    s.ingresos += importe
    s.ventas += 1
    const cruce = dame(porAfiliadoFunnel, claveCruce(dueno.slug, dueno.funnel))
    cruce.ingresos += importe
    cruce.ventas += 1
  }

  // Evolucion en el tiempo: contactos traidos por afiliados, dia a dia.
  const porDia = new Map<string, { fecha: string; contactos: number; alumnos: number; ingresos: number }>()
  const dameDia = (fecha: string) => {
    const actual = porDia.get(fecha) ?? { fecha, contactos: 0, alumnos: 0, ingresos: 0 }
    porDia.set(fecha, actual)
    return actual
  }
  for (const c of (contactos ?? []) as ContactoFila[]) {
    const dia = dameDia(c.created_at.slice(0, 10))
    dia.contactos += 1
    if (c.stage === "alumno") dia.alumnos += 1
  }
  for (const venta of ventas ?? []) {
    const dueno = afiliadoPorContacto.get(venta.contact_id as string)
    if (!dueno?.slug) continue
    const dia = dameDia((venta.created_at as string).slice(0, 10))
    dia.ingresos += Number((venta.data as { revenue?: number } | null)?.revenue ?? 0)
  }

  const etiquetaFunnel = new Map(FUNNEL_CATALOG.map((f) => [f.slug, f.label]))
  const linksPorAfiliado = new Map<string, Array<Record<string, unknown>>>()
  for (const l of links ?? []) {
    const slug = l.affiliate_slug as string
    const funnelSlug = l.funnel_slug as string
    const funnel = FUNNEL_CATALOG.find((f) => f.slug === funnelSlug)
    const lista = linksPorAfiliado.get(slug) ?? []
    lista.push({
      id: l.id,
      funnelSlug,
      funnelLabel: funnel?.label ?? funnelSlug,
      activo: l.active,
      url: funnel ? construirLinkDeAfiliado(funnel.path, slug) : null,
      creadoEl: l.created_at,
      stats: porAfiliadoFunnel.get(claveCruce(slug, funnelSlug)) ?? statsVacias(),
    })
    linksPorAfiliado.set(slug, lista)
  }

  const filas = (afiliados ?? []).map((a) => {
    const slug = a.slug as string
    const stats = porAfiliado.get(slug) ?? statsVacias()
    const cruce = FUNNEL_CATALOG.map((f) => ({
      funnelSlug: f.slug,
      funnelLabel: f.label,
      stats: porAfiliadoFunnel.get(claveCruce(slug, f.slug)) ?? statsVacias(),
    })).filter((c) => c.stats.contactos > 0 || c.stats.visitas > 0)

    return {
      slug,
      name: a.name as string,
      active: a.active as boolean,
      creadoEl: a.created_at as string,
      etiqueta: `fuente:${slug}`,
      links: linksPorAfiliado.get(slug) ?? [],
      stats,
      porFunnel: cruce,
    }
  })

  const totales = filas.reduce((acc, f) => {
    acc.visitas += f.stats.visitas
    acc.contactos += f.stats.contactos
    acc.leads += f.stats.leads
    acc.agendados += f.stats.agendados
    acc.enJuego += f.stats.enJuego
    acc.alumnos += f.stats.alumnos
    acc.perdidos += f.stats.perdidos
    acc.ingresos += f.stats.ingresos
    acc.ventas += f.stats.ventas
    return acc
  }, statsVacias())

  return NextResponse.json({
    afiliados: filas,
    funnels,
    totales,
    serie: [...porDia.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    etiquetasFunnel: Object.fromEntries(etiquetaFunnel),
  })
}

/**
 * POST /api/admin/affiliates — crea un afiliado nuevo. Solo super_admin.
 * Crea tambien SU ETIQUETA (`fuente:<slug>`) en el momento, no al primer lead: si nadie
 * entraba por su link, la etiqueta no existia y no se podia ni filtrar por ella.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Solo super_admin puede crear afiliados" }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as { name?: string; slug?: string }
  const name = (body.name ?? "").trim()
  if (name.length < 2) return NextResponse.json({ error: "Nombre obligatorio" }, { status: 400 })
  const slug = normalizarFuente(body.slug || name)
  if (!slug) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })

  const { error } = await admin.from("affiliates").insert({ slug, name })
  if (error) {
    const dup = (error as { code?: string }).code === "23505"
    return NextResponse.json(
      { error: dup ? "Ya existe un afiliado con ese identificador" : "No se pudo crear" },
      { status: dup ? 409 : 500 },
    )
  }

  // La etiqueta nace con el afiliado. Un fallo aqui NO puede dejar el afiliado a medias.
  await asegurarEtiquetaDeFuente(admin, slug, name)

  return NextResponse.json({ ok: true, slug, name })
}
