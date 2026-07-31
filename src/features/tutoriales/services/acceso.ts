import "server-only"
import { createClient } from "@/lib/supabase/server"

/**
 * Quien puede tocar los tutoriales.
 *
 * Los candados de verdad estan en la base (RLS): aunque alguien se saltara esto,
 * la base le devolveria cero. Esta comprobacion existe para dar un error claro
 * (401 / 403) en vez de un "no hay datos" silencioso, que es justo el fallo mudo
 * contra el que avisa la regla de fabrica de RLS.
 */

export type Quien = { userId: string; rol: string; esAdmin: boolean }

export async function quienLlama(): Promise<Quien | null> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return null

  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", auth.user.id)
    .maybeSingle()

  // Fail-closed: un error al comprobar el permiso NO es "adelante".
  if (error) throw new Error(`No se pudo comprobar el permiso: ${error.message}`)
  if (!perfil || perfil.active === false) return null

  const rol = String(perfil.role ?? "")
  return { userId: auth.user.id, rol, esAdmin: rol === "super_admin" || rol === "admin" }
}

/** Devuelve el motivo del rechazo, o null si puede pasar. */
export async function exigirAdmin(): Promise<{ estado: 401 | 403; motivo: string } | null> {
  const quien = await quienLlama()
  if (!quien) return { estado: 401, motivo: "Entra con tu usuario del OS." }
  if (!quien.esAdmin) return { estado: 403, motivo: "Solo Marco y Adrián pueden administrar los tutoriales." }
  return null
}

/** Para leer: basta con ser del equipo interno (tener ficha activa en profiles). */
export async function exigirEquipo(): Promise<{ estado: 401; motivo: string } | null> {
  const quien = await quienLlama()
  if (!quien) return { estado: 401, motivo: "Entra con tu usuario del OS." }
  return null
}
