import "server-only"
import { createClient } from "@supabase/supabase-js"

/**
 * Quién puede tocar las carpetas de Bunny.
 *
 * Los endpoints de Bunny los llama la App del alumno desde otro dominio. Hasta
 * hoy no comprobaban NADA: cualquiera que supiera la dirección podía crear
 * vídeos en la biblioteca. Con carpetas de por medio eso ya no vale, porque un
 * desconocido podría además reorganizar o vaciar el archivo.
 *
 * La regla es la misma que ya usa la App para editar formaciones:
 *   - ADMIN sin formación asignada  → super admin, puede con todo.
 *   - ADMIN con formación asignada  → formador, solo con la suya.
 *   - cualquier otro               → no.
 */

export type Permiso = {
  ok: true
  esSuperAdmin: boolean
  /** Nombre de la ruta que puede tocar, o null si puede con todas. */
  formacionAsignada: string | null
}

export type Rechazo = { ok: false; motivo: string; estado: 401 | 403 }

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function quienLlama(cabeceraAuth: string | null): Promise<Permiso | Rechazo> {
  const token = (cabeceraAuth ?? "").replace(/^Bearer\s+/i, "").trim()
  if (!token) return { ok: false, motivo: "Falta la sesión.", estado: 401 }

  const cliente = admin()
  const { data: sesion, error } = await cliente.auth.getUser(token)
  if (error || !sesion?.user) return { ok: false, motivo: "Sesión no válida.", estado: 401 }

  const { data: ficha } = await cliente
    .from("users")
    .select("role, formacion_asignada, is_active")
    .eq("auth_user_id", sesion.user.id)
    .maybeSingle()

  if (!ficha || ficha.is_active === false) {
    return { ok: false, motivo: "Cuenta sin acceso.", estado: 403 }
  }
  if (ficha.role !== "ADMIN") {
    return { ok: false, motivo: "Hace falta ser formador o administrador.", estado: 403 }
  }

  const asignada = (ficha.formacion_asignada as string | null) ?? null
  return { ok: true, esSuperAdmin: asignada === null, formacionAsignada: asignada }
}

/**
 * ¿Puede tocar ESTA formación? El formador solo la suya.
 *
 * `formacion_asignada` guarda el identificador corto de la ruta
 * (`ia-integrator`), mientras que las carpetas usan el nombre de cara
 * ("IA Integrator"). Se comparan reducidos a la misma forma para que no
 * dependa de guiones, mayúsculas ni tildes.
 */
export function puedeConLaFormacion(permiso: Permiso, formacion: string): boolean {
  if (permiso.esSuperAdmin) return true
  return reducir(permiso.formacionAsignada ?? "") === reducir(formacion)
}

function reducir(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
}
