import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * El historial diario de la actividad.
 *
 * Marco, 2026-08-28: "necesito tener un registro diario (historial) de las veces que se
 * registra actividad del setter... que se pueda ver quien registra y quien edito, que
 * hora y TODO lo necesario para tener claridad".
 *
 * Devuelve UNA linea por persona y dia del periodo, INCLUIDOS los dias que nadie
 * registro (REGLA #24 del protocolo: un hueco es un dato, no una fila que desaparece), y
 * dentro de cada dia la linea de tiempo completa de guardados que guarda la base.
 *
 * Las horas viajan en ISO y las pinta la pantalla en la hora de Madrid (REGLA #23: la
 * hora que se enseña es la hora real del negocio, nunca el UTC crudo).
 */

const ROLES_ADMIN = new Set(["super_admin", "admin"])
const ROLES_PERMITIDOS = new Set(["setter", "super_admin", "admin"])
const CAMPOS = ["conversaciones", "followups", "ofertas", "agendadas"] as const

type Campo = (typeof CAMPOS)[number]
type Numeros = Record<Campo, number>

const CERO: Numeros = { conversaciones: 0, followups: 0, ofertas: 0, agendadas: 0 }

/** El dia de Madrid, que es el dia del negocio. */
function diaMadrid(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" })
}

/** Los dias del periodo, de mas reciente a mas antiguo. Tope de un año para no pedirle a la base un imposible. */
function diasEntre(desde: string, hasta: string): string[] {
  const salida: string[] = []
  const fin = new Date(`${hasta}T12:00:00Z`)
  const cursor = new Date(`${desde}T12:00:00Z`)
  let guarda = 0
  while (cursor <= fin && guarda < 400) {
    salida.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    guarda++
  }
  return salida.reverse()
}

type FilaParte = {
  id: string
  profile_id: string
  report_date: string
  conversaciones: number
  followups: number
  ofertas: number
  agendadas: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

type FilaEvento = {
  profile_id: string
  report_date: string
  actor_id: string | null
  accion: string
  antes: Numeros | null
  despues: Numeros
  cambios: string[]
  created_at: string
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 })

  const { data: yo, error: errorPerfil } = await supabase
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .maybeSingle()

  /* FAIL-CLOSED: un error al comprobar el permiso nunca se lee como "adelante". */
  if (errorPerfil) return NextResponse.json({ error: "No se pudo comprobar tu permiso" }, { status: 500 })
  if (!yo || !yo.active) return NextResponse.json({ error: "Cuenta sin acceso" }, { status: 403 })
  if (!ROLES_PERMITIDOS.has(yo.role)) {
    return NextResponse.json({ error: "Tu rol no ve la actividad del equipo" }, { status: 403 })
  }
  const esAdmin = ROLES_ADMIN.has(yo.role)

  const hoy = diaMadrid(new Date())
  const paramDesde = req.nextUrl.searchParams.get("from")
  const paramHasta = req.nextUrl.searchParams.get("to")
  const desde = paramDesde ? diaMadrid(new Date(paramDesde)) : hoy
  /* Nunca se piden dias que no han llegado: no existen y solo ensucian la lista. */
  const hastaCrudo = paramHasta ? diaMadrid(new Date(paramHasta)) : hoy
  const hasta = hastaCrudo > hoy ? hoy : hastaCrudo

  /* Quien entra en el periodo: los setter activos, MAS cualquiera que tenga partes
     dentro del rango (un administrador tambien puede rellenar el suyo). */
  const [equipoRes, partesRes, eventosRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, active").in("role", ["setter"]).eq("active", true),
    supabase
      .from("setter_daily_reports")
      .select(
        "id, profile_id, report_date, conversaciones, followups, ofertas, agendadas, created_by, updated_by, created_at, updated_at",
      )
      .gte("report_date", desde)
      .lte("report_date", hasta),
    supabase
      .from("setter_report_events")
      .select("profile_id, report_date, actor_id, accion, antes, despues, cambios, created_at")
      .gte("report_date", desde)
      .lte("report_date", hasta)
      .order("created_at", { ascending: true }),
  ])

  /* Un fallo al leer NUNCA se confunde con "no hay datos": si la lista viniera vacia por
     un error, la pantalla diria que nadie registro nada y seria mentira. */
  if (partesRes.error || eventosRes.error || equipoRes.error) {
    return NextResponse.json({ error: "No se pudo leer el historial" }, { status: 500 })
  }

  const partes = (partesRes.data ?? []) as FilaParte[]
  const eventos = (eventosRes.data ?? []) as FilaEvento[]

  /* Los nombres. Se piden de una vez para no hacer una consulta por persona. */
  const idsQueSalen = new Set<string>([yo.id])
  for (const p of equipoRes.data ?? []) idsQueSalen.add(p.id)
  for (const p of partes) {
    idsQueSalen.add(p.profile_id)
    if (p.created_by) idsQueSalen.add(p.created_by)
    if (p.updated_by) idsQueSalen.add(p.updated_by)
  }
  for (const e of eventos) if (e.actor_id) idsQueSalen.add(e.actor_id)

  const { data: gente } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("id", Array.from(idsQueSalen))

  const nombre = new Map<string, string>()
  const rol = new Map<string, string>()
  for (const g of gente ?? []) {
    nombre.set(g.id, g.full_name ?? "Sin nombre")
    rol.set(g.id, g.role ?? "")
  }
  const comoSeLlama = (id: string | null) => (id ? (nombre.get(id) ?? "Alguien que ya no está en el equipo") : null)

  /* De quien se enseña el historial. Un setter ve SOLO lo suyo, aunque pida otra cosa. */
  const filtroPersona = req.nextUrl.searchParams.get("profile")

  /* Quien tiene el parte como TAREA: los setter. Solo a ellos se les generan los dias
     vacios, porque solo a ellos les falta algo cuando no registran. Un administrador que
     rellena el suyo sale con los dias que tenga, sin 30 huecos detras. */
  const esSetterDe = new Set<string>((equipoRes.data ?? []).map((p) => p.id))

  let personas = Array.from(new Set<string>([...esSetterDe, ...partes.map((p) => p.profile_id)]))
  if (!esAdmin) personas = [yo.id]
  else if (filtroPersona) personas = personas.filter((id) => id === filtroPersona)

  const porClave = new Map<string, FilaParte>()
  for (const p of partes) porClave.set(`${p.profile_id}|${p.report_date}`, p)

  const lineasPorClave = new Map<string, FilaEvento[]>()
  for (const e of eventos) {
    const clave = `${e.profile_id}|${e.report_date}`
    const lista = lineasPorClave.get(clave)
    if (lista) lista.push(e)
    else lineasPorClave.set(clave, [e])
  }

  const dias = []
  for (const fecha of diasEntre(desde, hasta)) {
    for (const personaId of personas) {
      const clave = `${personaId}|${fecha}`
      const parte = porClave.get(clave)
      /* Un dia vacio solo se dibuja para quien tenia que registrarlo. */
      if (!parte && !esSetterDe.has(personaId)) continue
      const lineasCrudas = lineasPorClave.get(clave) ?? []

      const lineas = lineasCrudas.map((e) => ({
        accion: e.accion,
        actor: comoSeLlama(e.actor_id),
        cuando: e.created_at,
        valores: e.despues,
        cambios: (e.cambios ?? []).map((campo) => ({
          campo,
          antes: e.antes ? (e.antes[campo as Campo] ?? null) : null,
          despues: e.despues[campo as Campo] ?? null,
        })),
      }))

      const correcciones = lineasCrudas.filter((e) => e.accion === "editado").length
      const numeros: Numeros = parte
        ? {
            conversaciones: parte.conversaciones,
            followups: parte.followups,
            ofertas: parte.ofertas,
            agendadas: parte.agendadas,
          }
        : CERO

      dias.push({
        clave,
        fecha,
        profileId: personaId,
        persona: comoSeLlama(personaId) ?? "Sin nombre",
        registrado: Boolean(parte),
        ...numeros,
        total: CAMPOS.reduce((s, c) => s + numeros[c], 0),
        creadoPor: parte ? comoSeLlama(parte.created_by) : null,
        creadoEl: parte ? parte.created_at : null,
        editadoPor: parte && correcciones > 0 ? comoSeLlama(parte.updated_by) : null,
        editadoEl: parte && correcciones > 0 ? parte.updated_at : null,
        correcciones,
        lineas,
      })
    }
  }

  const registrados = dias.filter((d) => d.registrado)
  const totales = {
    conversaciones: registrados.reduce((s, d) => s + d.conversaciones, 0),
    followups: registrados.reduce((s, d) => s + d.followups, 0),
    ofertas: registrados.reduce((s, d) => s + d.ofertas, 0),
    agendadas: registrados.reduce((s, d) => s + d.agendadas, 0),
    diasRegistrados: registrados.length,
    diasSinRegistrar: dias.length - registrados.length,
    correcciones: dias.reduce((s, d) => s + d.correcciones, 0),
  }

  return NextResponse.json({
    hoy,
    desde,
    hasta,
    esAdmin,
    yo: { id: yo.id, nombre: yo.full_name ?? "Tú" },
    personas: personas.map((id) => ({
      id,
      nombre: comoSeLlama(id) ?? "Sin nombre",
      rol: rol.get(id) ?? "",
      esSetter: esSetterDe.has(id),
    })),
    dias,
    totales,
  })
}
