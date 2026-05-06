import "server-only"
import { SignJWT, jwtVerify } from "jose"

/**
 * JWT helpers para firmar/verificar tokens de acceso a /lm/<slug>?t=<jwt>.
 *
 * Decisión: reutilizamos MANYCHAT_WEBHOOK_SECRET como secret de firma. Mismo dominio
 * (ManyChat → OS), no merece env var dedicada. Si en el futuro queremos rotar
 * independiente, se cambia a LM_JWT_SECRET sin tocar el endpoint público.
 *
 * Ver SOP marketing/06-lead-magnets sección "Filtro anti-compartir".
 */

export type LmTokenPayload = {
  /** lead_id en mifge_leads */
  lid: string
  /** lead_magnet_id */
  lmid: string
  /** lead_magnet_delivery_id (para idempotencia al marcar opened_at) */
  did: string
}

const ISSUER = "capital-hub-os"
const AUDIENCE = "lead-magnet-delivery"

function getSecret(): Uint8Array {
  const raw = process.env.MANYCHAT_WEBHOOK_SECRET
  if (!raw) {
    throw new Error("MANYCHAT_WEBHOOK_SECRET no configurado — no se pueden firmar tokens de lead magnet")
  }
  return new TextEncoder().encode(raw)
}

/** Firma un JWT válido por 30 días. */
export async function signLmToken(payload: LmTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("30d")
    .sign(getSecret())
}

/** Verifica un JWT. Devuelve null si inválido/expirado. */
export async function verifyLmToken(token: string): Promise<LmTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    if (
      typeof payload.lid === "string" &&
      typeof payload.lmid === "string" &&
      typeof payload.did === "string"
    ) {
      return { lid: payload.lid, lmid: payload.lmid, did: payload.did }
    }
    return null
  } catch {
    return null
  }
}
