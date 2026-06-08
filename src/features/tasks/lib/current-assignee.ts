import { createClient } from "@/lib/supabase/client"
import type { Assignee } from "../types/task"

/**
 * Mapeo email del user logueado → key del enum Assignee.
 * Si no encuentra, usa "equipo" como fallback (mejor que asignar a Marco por defecto).
 */
const EMAIL_TO_ASSIGNEE: Record<string, Assignee> = {
  "marcoapereirav@gmail.com": "marco",
  "adrianvillanuevarios@gmail.com": "adrian",
}

/**
 * Devuelve el assignee del usuario que tiene la sesión actual en el browser.
 * Si no hay sesión o el email no está mapeado, devuelve "equipo".
 *
 * Esto es para que cuando ALGUIEN crea una task quick-capture o cualquier
 * otra, se le asigne a SÍ MISMO por defecto, no a Marco por accidente.
 */
export async function getCurrentAssignee(): Promise<Assignee> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) return "equipo"
    return EMAIL_TO_ASSIGNEE[user.email.toLowerCase()] ?? "equipo"
  } catch {
    return "equipo"
  }
}
