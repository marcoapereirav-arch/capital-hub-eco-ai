import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * El parte diario: los cuatro numeros que rellena quien abre conversaciones.
 *
 * UNA fila por persona y dia. Lo garantiza el UNIQUE (profile_id, report_date)
 * de la base, no la pantalla: asi es imposible que salgan dos partes del mismo
 * dia o que los numeros se sumen sin querer.
 *
 * El `profile_id` sale SIEMPRE de la sesion, nunca del cuerpo de la peticion.
 */

const ROLES_PERMITIDOS = new Set(["setter", "super_admin"])

/** El dia "de hoy" es el de Madrid, no el de UTC: si no, a partir de las 22:00 el parte se iria al dia siguiente. */
function hoyEnMadrid(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" })
}

const esquema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha tiene que ser AAAA-MM-DD"),
  conversaciones: z.number().int().min(0).max(10000),
  followups: z.number().int().min(0).max(10000),
  ofertas: z.number().int().min(0).max(10000),
  agendadas: z.number().int().min(0).max(10000),
})

async function quienEres() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Sin sesión", status: 401 as const }

  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("id, role, active")
    .eq("id", user.id)
    .maybeSingle()

  /* FAIL-CLOSED: si no se puede comprobar el permiso, es un NO. Un error al
     comprobar no puede leerse nunca como "adelante". */
  if (error) return { error: "No se pudo comprobar tu permiso", status: 500 as const }
  if (!perfil || !perfil.active) return { error: "Cuenta sin acceso", status: 403 as const }
  if (!ROLES_PERMITIDOS.has(perfil.role)) return { error: "Tu rol no rellena el parte diario", status: 403 as const }

  return { supabase, perfilId: perfil.id }
}

export async function GET(req: NextRequest) {
  const yo = await quienEres()
  if ("error" in yo) return NextResponse.json({ error: yo.error }, { status: yo.status })

  const fecha = req.nextUrl.searchParams.get("date") ?? hoyEnMadrid()

  const { data, error } = await yo.supabase
    .from("setter_daily_reports")
    .select("report_date, conversaciones, followups, ofertas, agendadas")
    .eq("profile_id", yo.perfilId)
    .eq("report_date", fecha)
    .maybeSingle()

  if (error) return NextResponse.json({ error: "No se pudo leer tu parte" }, { status: 500 })

  return NextResponse.json({ hoy: hoyEnMadrid(), fecha, parte: data ?? null })
}

export async function POST(req: NextRequest) {
  const yo = await quienEres()
  if ("error" in yo) return NextResponse.json({ error: yo.error }, { status: yo.status })

  let cuerpo: unknown
  try {
    cuerpo = await req.json()
  } catch {
    return NextResponse.json({ error: "No se entendió lo que mandaste" }, { status: 400 })
  }

  const parseado = esquema.safeParse(cuerpo)
  if (!parseado.success) {
    return NextResponse.json({ error: parseado.error.issues[0]?.message ?? "Datos no válidos" }, { status: 400 })
  }
  const v = parseado.data

  if (v.date > hoyEnMadrid()) {
    return NextResponse.json({ error: "No se puede rellenar el parte de un día que no ha llegado" }, { status: 400 })
  }

  const { data, error } = await yo.supabase
    .from("setter_daily_reports")
    .upsert(
      {
        profile_id: yo.perfilId,
        report_date: v.date,
        conversaciones: v.conversaciones,
        followups: v.followups,
        ofertas: v.ofertas,
        agendadas: v.agendadas,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,report_date" },
    )
    .select("report_date, conversaciones, followups, ofertas, agendadas")
    .single()

  if (error) return NextResponse.json({ error: "No se pudo guardar tu parte" }, { status: 500 })

  return NextResponse.json({ ok: true, parte: data })
}
