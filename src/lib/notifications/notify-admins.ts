import "server-only"
import webpush from "web-push"
import type { SupabaseClient } from "@supabase/supabase-js"
import { TEST_AGENT_EMAIL } from "./recipients"
import { prefKeyForType, rolesForType } from "./prefs-catalog"

/**
 * Notificaciones al equipo: in-app + PUSH, en un solo sitio.
 *
 * Objetivo (Marco 2026-07-07): cada evento importante (lead, agenda, venta) tiene
 * que avisar por push. Antes cada endpoint hacía lo suyo (unos in-app, otros email,
 * ninguno push). Este helper centraliza para que NO se escape ningún evento.
 *
 * `admin` = cliente Supabase con service role (bypass RLS). Nunca lanza: si algo
 * falla (VAPID, subs inválidas...) lo loguea pero no bloquea el flujo del endpoint.
 */

let vapidReady = false
function ensureVapid(): boolean {
  if (vapidReady) return true
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:noreply@capitalhubapp.com", pub, priv)
  vapidReady = true
  return true
}

type PushPayload = { title: string; body: string; data?: Record<string, unknown>; tag?: string }

/**
 * Filtra los userIds quitando a quienes APAGARON este tipo de aviso en /perfil
 * (tabla `notification_preferences`, sin fila = activado). Nunca lanza: si la
 * query falla, devuelve la lista completa (mejor un aviso de más que perder uno).
 */
export async function filterByNotificationPref(
  admin: SupabaseClient,
  userIds: string[],
  type: string,
): Promise<string[]> {
  try {
    const pref = prefKeyForType(type)
    if (!pref || userIds.length === 0) return userIds
    const { data } = await admin
      .from("notification_preferences")
      .select("user_id")
      .eq("pref", pref)
      .eq("enabled", false)
      .in("user_id", userIds)
    const off = new Set((data ?? []).map((r) => r.user_id as string))
    return userIds.filter((id) => !off.has(id))
  } catch (e) {
    console.error("[filterByNotificationPref] fallo (no bloquea, entrega a todos)", e)
    return userIds
  }
}

/** Envía web-push a TODOS los dispositivos suscritos de los userIds dados. */
export async function pushToUsers(
  admin: SupabaseClient,
  userIds: string[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0
  try {
    if (!ensureVapid() || userIds.length === 0) return { sent, failed }
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", userIds)
    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint as string, keys: { p256dh: sub.p256dh as string, auth: sub.auth as string } },
          JSON.stringify(payload),
        )
        await admin.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", sub.id)
        sent++
      } catch (err: unknown) {
        // Borrar SOLO si el push service dice que la suscripción ya no existe
        // (404/410). Un fallo de red (sin status) o un 400/401/403 (config VAPID)
        // NO significa suscripción muerta: borrarla dejaría al usuario sin push
        // para siempre y en silencio.
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id)
        } else {
          console.error(`[pushToUsers] push falló (status ${status ?? "sin status"}, sub ${sub.id})`, err)
        }
        failed++
      }
    }
  } catch (e) {
    console.error("[pushToUsers] fallo (no bloquea)", e)
  }
  return { sent, failed }
}

type NotifyInput = {
  title: string
  body: string
  /** tipo del evento (p.ej. 'lead', 'agenda', 'venta'), se usa como type in-app + tag push. */
  type: string
  /** a dónde navega al pulsar la notificación. Por defecto /crm/pipeline. */
  url?: string
  data?: Record<string, unknown>
  /**
   * Roles que reciben el aviso. Por defecto, los que diga el catálogo para este tipo
   * (los leads van también al setter). Solo se pasa a mano para casos sueltos.
   */
  roles?: string[]
}

/**
 * Notifica al equipo que corresponda según el TIPO de aviso: crea la notificación in-app
 * (campana del OS) Y manda push a sus dispositivos.
 *
 * Quién recibe qué está en `prefs-catalog` (`rolesForType`), no aquí: un aviso de lead va
 * a los super_admins y al setter, que es quien tiene que escribirle. Lo demás sigue yendo
 * solo a los super_admins.
 *
 * Siempre se excluye la cuenta-bot de pruebas y a la gente dada de baja.
 */
export async function notifyAdmins(admin: SupabaseClient, input: NotifyInput): Promise<void> {
  try {
    const roles = input.roles ?? rolesForType(input.type)
    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .in("role", roles)
      .eq("active", true)
      .neq("email", TEST_AGENT_EMAIL)
    let ids = (admins ?? []).map((a) => a.id as string)
    ids = await filterByNotificationPref(admin, ids, input.type)
    if (ids.length === 0) return

    const url = input.url ?? "/crm/pipeline"

    // 1) In-app (campana)
    const rows = ids.map((user_id) => ({
      user_id,
      title: input.title,
      body: input.body,
      type: input.type,
      data: { ...(input.data ?? {}), url },
    }))
    const { error: insertError } = await admin.from("notifications").insert(rows)
    if (insertError) console.error("[notifyAdmins] insert in-app falló (no bloquea)", insertError)

    // 2) Push
    await pushToUsers(admin, ids, { title: input.title, body: input.body, data: { url }, tag: input.type })
  } catch (e) {
    console.error("[notifyAdmins] fallo (no bloquea)", e)
  }
}
