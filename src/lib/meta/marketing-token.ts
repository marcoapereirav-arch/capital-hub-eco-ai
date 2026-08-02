import "server-only"
import { createClient } from "@supabase/supabase-js"

/**
 * La llave para LEER las campañas de Meta (gasto, impresiones, resultados).
 *
 * Es distinta de la de conversiones: esa ESCRIBE eventos, esta LEE rendimiento. Son dos
 * permisos de Meta diferentes (`ads_read`) y por eso son dos llaves.
 *
 * Se guarda en `app_settings`, que tiene la seguridad al máximo: seguridad a nivel de fila
 * activada y CERO políticas, así que ningún usuario logueado puede leerla. Solo el
 * servidor, con la llave de administración. Nunca viaja al navegador: a la pantalla solo
 * se le manda una versión tapada.
 */

const CLAVE = "meta_marketing_token"

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type TokenGuardado = {
  token: string
  /** ISO. null = no caduca (los de usuario del sistema no caducan). */
  expiresAt: string | null
  savedAt: string
}

/** Tapa la llave para poder enseñarla sin exponerla. */
export function taparToken(t: string): string {
  if (t.length <= 12) return "•".repeat(t.length)
  return `${t.slice(0, 6)}${"•".repeat(18)}${t.slice(-4)}`
}

/**
 * Devuelve la llave activa. Prioridad: la guardada desde la pantalla, y si no hay, la del
 * fichero de entorno. Así el equipo puede cambiarla sin tocar código ni desplegar.
 */
export async function getMarketingToken(): Promise<string | null> {
  try {
    const { data } = await admin()
      .from("app_settings")
      .select("value")
      .eq("key", CLAVE)
      .maybeSingle()
    const guardado = (data?.value as TokenGuardado | null)?.token
    if (guardado) return guardado
  } catch {
    // Si la base falla, se cae al fichero de entorno.
  }
  return process.env.META_MARKETING_API_TOKEN || null
}

export async function getMarketingTokenInfo(): Promise<{
  configurado: boolean
  origen: "pantalla" | "entorno" | null
  tapado: string | null
  expiresAt: string | null
  savedAt: string | null
}> {
  try {
    const { data } = await admin()
      .from("app_settings")
      .select("value")
      .eq("key", CLAVE)
      .maybeSingle()
    const g = data?.value as TokenGuardado | null
    if (g?.token) {
      return {
        configurado: true,
        origen: "pantalla",
        tapado: taparToken(g.token),
        expiresAt: g.expiresAt ?? null,
        savedAt: g.savedAt ?? null,
      }
    }
  } catch {
    // sigue al fichero de entorno
  }

  const env = process.env.META_MARKETING_API_TOKEN
  if (env) {
    return { configurado: true, origen: "entorno", tapado: taparToken(env), expiresAt: null, savedAt: null }
  }
  return { configurado: false, origen: null, tapado: null, expiresAt: null, savedAt: null }
}

export async function guardarMarketingToken(t: TokenGuardado): Promise<void> {
  await admin()
    .from("app_settings")
    .upsert({ key: CLAVE, value: t }, { onConflict: "key" })
}

export async function borrarMarketingToken(): Promise<void> {
  await admin().from("app_settings").delete().eq("key", CLAVE)
}

/**
 * Cambia una llave corta por una larga usando el identificador y el secreto de la app.
 *
 * Las llaves que se sacan a mano suelen durar un par de horas. Esta llamada las convierte
 * en una de unos 60 días, y el usuario no tiene que hacer nada.
 *
 * Las llaves de un usuario del sistema NO caducan y no se pueden cambiar: si Meta
 * responde error, se devuelve la original tal cual, que es lo correcto.
 */
export async function alargarToken(
  corto: string
): Promise<{ token: string; expiresAt: string | null; alargado: boolean }> {
  const appId = process.env.META_APP_ID
  const secret = process.env.META_APP_SECRET
  if (!appId || !secret) return { token: corto, expiresAt: null, alargado: false }

  try {
    const url =
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?grant_type=fb_exchange_token&client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(secret)}&fb_exchange_token=${encodeURIComponent(corto)}`
    const res = await fetch(url, { cache: "no-store" })
    const json = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!res.ok || !json.access_token) return { token: corto, expiresAt: null, alargado: false }

    const expiresAt = json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : null
    return { token: json.access_token, expiresAt, alargado: true }
  } catch {
    return { token: corto, expiresAt: null, alargado: false }
  }
}

/**
 * Comprueba de verdad que la llave puede leer la cuenta publicitaria.
 * Guardar una llave que no funciona es peor que no guardar nada: da falsa sensación de
 * que está resuelto y el fallo aparece días después.
 */
export async function probarToken(
  token: string
): Promise<{ ok: boolean; error?: string; cuenta?: string }> {
  const cuenta = process.env.META_AD_ACCOUNT_ID
  if (!cuenta) return { ok: false, error: "Falta el identificador de la cuenta publicitaria" }

  try {
    const url = `https://graph.facebook.com/v19.0/act_${cuenta}?fields=name&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url, { cache: "no-store" })
    const json = (await res.json()) as { name?: string; error?: { message?: string } }
    if (json.error) return { ok: false, error: json.error.message ?? "Meta la rechazó" }
    return { ok: true, cuenta: json.name }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo contactar con Meta" }
  }
}
