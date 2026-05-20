/**
 * Genera un archivo .ics RFC 5545 para que el cliente lo añada a Google
 * Calendar / Apple Calendar / Outlook con un click.
 */

function formatIcsDate(d: Date): string {
  // YYYYMMDDTHHMMSSZ
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

export function generateIcs(input: {
  uid: string // único, ej call_id@capitalhub
  title: string
  description: string
  location?: string
  startIso: string
  endIso: string
  organizerEmail: string
  organizerName: string
  attendeeEmail: string
  attendeeName: string
}): string {
  const now = new Date()
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Capital Hub//MIFGE//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(new Date(input.startIso))}`,
    `DTEND:${formatIcsDate(new Date(input.endIso))}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    `DESCRIPTION:${escapeIcsText(input.description)}`,
    ...(input.location ? [`LOCATION:${escapeIcsText(input.location)}`] : []),
    `ORGANIZER;CN=${escapeIcsText(input.organizerName)}:mailto:${input.organizerEmail}`,
    `ATTENDEE;CN=${escapeIcsText(input.attendeeName)};RSVP=TRUE:mailto:${input.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Recordatorio: llamada con Adrián mañana",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  return lines.join("\r\n")
}
