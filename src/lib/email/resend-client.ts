import "server-only"
import { Resend } from "resend"

let _client: Resend | null = null

export function getResendClient(): Resend {
  if (_client) return _client
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY no configurada")
  _client = new Resend(key)
  return _client
}

export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "adrian@mail.capitalhubapp.com"
export const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME ?? "Adrián Villanueva"
export const RESEND_FROM = `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`

// Dominio público del OS para construir links absolutos en emails
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://os.capitalhubapp.com"
