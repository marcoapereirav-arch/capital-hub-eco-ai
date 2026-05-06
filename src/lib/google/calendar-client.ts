import "server-only"
import { createClient } from "@supabase/supabase-js"

/**
 * Cliente de Google Calendar v3 con OAuth.
 * - Tokens persisten en calls_availability (singleton id=1).
 * - Auto-refresca el access_token cuando expira.
 * - createCalendarEventWithMeet() crea el evento + Meet link de un click.
 */

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
const CALENDAR_API = "https://www.googleapis.com/calendar/v3"

export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ")

export function getGoogleOAuthEnv() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type GoogleConnection = {
  email: string | null
  refresh_token: string | null
  access_token: string | null
  expires_at: string | null
  calendar_id: string
  connected_at: string | null
}

export async function loadGoogleConnection(): Promise<GoogleConnection | null> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from("calls_availability")
    .select("google_oauth_email, google_oauth_refresh_token, google_oauth_access_token, google_oauth_expires_at, google_calendar_id, google_oauth_connected_at")
    .eq("id", 1)
    .single()
  if (error || !data) return null
  return {
    email: data.google_oauth_email,
    refresh_token: data.google_oauth_refresh_token,
    access_token: data.google_oauth_access_token,
    expires_at: data.google_oauth_expires_at,
    calendar_id: data.google_calendar_id ?? "primary",
    connected_at: data.google_oauth_connected_at,
  }
}

/**
 * Si access_token está vivo (>60s), lo devuelve. Si expira, lo refresca con
 * el refresh_token y persiste el nuevo en DB.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const conn = await loadGoogleConnection()
  if (!conn || !conn.refresh_token) return null

  const env = getGoogleOAuthEnv()
  if (!env) return null

  const now = Date.now()
  const expiresAt = conn.expires_at ? new Date(conn.expires_at).getTime() : 0
  if (conn.access_token && expiresAt - now > 60_000) {
    return conn.access_token
  }

  // Refresh
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.clientId,
      client_secret: env.clientSecret,
      refresh_token: conn.refresh_token,
      grant_type: "refresh_token",
    }),
  })
  if (!res.ok) {
    console.error("[google-calendar] refresh failed", await res.text())
    return null
  }
  const data = (await res.json()) as { access_token: string; expires_in: number }
  const newExpires = new Date(Date.now() + data.expires_in * 1000).toISOString()

  await getAdminClient()
    .from("calls_availability")
    .update({
      google_oauth_access_token: data.access_token,
      google_oauth_expires_at: newExpires,
    })
    .eq("id", 1)

  return data.access_token
}

export async function exchangeCodeForTokens(code: string): Promise<{
  refresh_token?: string
  access_token: string
  expires_in: number
  id_token?: string
} | null> {
  const env = getGoogleOAuthEnv()
  if (!env) return null
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.clientId,
      client_secret: env.clientSecret,
      redirect_uri: env.redirectUri,
      grant_type: "authorization_code",
    }),
  })
  if (!res.ok) {
    console.error("[google-calendar] code exchange failed", await res.text())
    return null
  }
  return (await res.json()) as {
    refresh_token?: string
    access_token: string
    expires_in: number
    id_token?: string
  }
}

export function decodeIdTokenEmail(idToken: string): string | null {
  try {
    const payload = idToken.split(".")[1]
    if (!payload) return null
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"))
    return typeof json.email === "string" ? json.email : null
  } catch {
    return null
  }
}

/**
 * Crea evento en el calendario CON un meeting URL externo (ej Zoom estático).
 * El URL se embebe en location + description, NO se solicita Meet.
 * Devuelve el eventId para poder cancelar/actualizar después.
 */
export async function createCalendarEventWithExternalUrl(input: {
  title: string
  description: string
  startIso: string
  endIso: string
  attendeeEmail: string
  attendeeName: string
  meetingUrl: string
}): Promise<{ eventId: string; htmlLink: string | null } | null> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) return null
  const conn = await loadGoogleConnection()
  if (!conn) return null

  const fullDescription = `${input.description}\n\nLink de la videollamada: ${input.meetingUrl}`

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(conn.calendar_id)}/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.title,
        description: fullDescription,
        location: input.meetingUrl,
        start: { dateTime: input.startIso, timeZone: "Europe/Madrid" },
        end: { dateTime: input.endIso, timeZone: "Europe/Madrid" },
        attendees: [{ email: input.attendeeEmail, displayName: input.attendeeName }],
        reminders: { useDefault: true },
      }),
    }
  )
  if (!res.ok) {
    console.error("[google-calendar] create event (external URL) failed", await res.text())
    return null
  }
  const data = (await res.json()) as { id: string; htmlLink?: string }
  return { eventId: data.id, htmlLink: data.htmlLink ?? null }
}

/**
 * @deprecated Solo se usa si no hay default_meeting_url configurado.
 * Crea evento con Meet auto-generado.
 */
export async function createCalendarEventWithMeet(input: {
  title: string
  description: string
  startIso: string
  endIso: string
  attendeeEmail: string
  attendeeName: string
}): Promise<{ eventId: string; meetUrl: string | null; htmlLink: string | null } | null> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) return null
  const conn = await loadGoogleConnection()
  if (!conn) return null

  const requestId = `ch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(conn.calendar_id)}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        start: { dateTime: input.startIso, timeZone: "Europe/Madrid" },
        end: { dateTime: input.endIso, timeZone: "Europe/Madrid" },
        attendees: [{ email: input.attendeeEmail, displayName: input.attendeeName }],
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: { useDefault: true },
      }),
    }
  )
  if (!res.ok) {
    console.error("[google-calendar] create event failed", await res.text())
    return null
  }
  const data = (await res.json()) as {
    id: string
    hangoutLink?: string
    htmlLink?: string
    conferenceData?: { entryPoints?: { uri: string; entryPointType: string }[] }
  }
  const meetEntry = data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
  return {
    eventId: data.id,
    meetUrl: data.hangoutLink ?? meetEntry?.uri ?? null,
    htmlLink: data.htmlLink ?? null,
  }
}
