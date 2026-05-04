import "server-only"
import { createClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"

/**
 * Rate limiter backed by Postgres (tabla rate_limits + RPC increment_rate_limit).
 * - Ventana fija (windowSeconds): cada ventana es un bucket por key.
 * - Atomic via RPC: una sola query por petición, sin races.
 *
 * Si la DB falla, FAIL OPEN (no bloquees al usuario por un error de infra).
 */

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() || "unknown"
  return req.headers.get("x-real-ip") ?? "unknown"
}

export async function rateLimit(input: {
  key: string
  limit: number
  windowSeconds: number
}): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const supabase = getAdminClient()
  const now = Date.now()
  const windowMs = input.windowSeconds * 1000
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs)
  const resetAt = new Date(windowStart.getTime() + windowMs)

  const { data, error } = await supabase.rpc("increment_rate_limit", {
    p_key: input.key,
    p_window_start: windowStart.toISOString(),
  })

  if (error || typeof data !== "number") {
    console.error("[rate-limit] error, failing open", error)
    return { allowed: true, remaining: input.limit, resetAt }
  }

  return {
    allowed: data <= input.limit,
    remaining: Math.max(0, input.limit - data),
    resetAt,
  }
}
