import path from 'node:path'
import slugify from 'slugify'
import {
  DOCS_CONTACTS_DIR,
  DOCS_MANUAL_FORBIDDEN,
  DOCS_TEAM_MEETINGS_DIR,
  TIMEZONE,
} from '../constants'

export function projectRoot(): string {
  // Siempre operamos desde cwd del proyecto. En Vercel runtime, process.cwd() apunta al root.
  return process.cwd()
}

export function absPath(relative: string): string {
  return path.join(projectRoot(), relative)
}

export class ForbiddenWritePathError extends Error {
  constructor(public attemptedPath: string) {
    super(`Write blocked: path matches protected manual (${attemptedPath})`)
    this.name = 'ForbiddenWritePathError'
  }
}

export function assertWriteAllowed(relative: string): void {
  const norm = path.posix.normalize(relative.replaceAll('\\', '/'))
  const forbidden = path.posix.normalize(DOCS_MANUAL_FORBIDDEN)
  if (norm === forbidden || norm.endsWith('/' + path.posix.basename(forbidden))) {
    if (norm === forbidden) throw new ForbiddenWritePathError(relative)
  }
  if (norm === forbidden) throw new ForbiddenWritePathError(relative)
}

// Fecha en Europe/Madrid: "YYYY-MM-DD"
export function toMadridDate(iso: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(new Date(iso))
}

// Hora en Europe/Madrid: "HH:MM"
export function toMadridTime(iso: string): string {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return fmt.format(new Date(iso))
}

export function slug(name: string): string {
  return slugify(name, { lower: true, strict: true, locale: 'es' }) || 'sin-nombre'
}

export function contactCallPath(args: {
  contactSlug: string
  startedAtIso: string
  title: string
}): string {
  const date = toMadridDate(args.startedAtIso)
  const titleSlug = slug(args.title)
  return path.posix.join(
    DOCS_CONTACTS_DIR,
    args.contactSlug,
    'calls',
    `${date}-${titleSlug}.md`,
  )
}

export function contactFichaPath(contactSlug: string): string {
  return path.posix.join(DOCS_CONTACTS_DIR, contactSlug, 'ficha.md')
}

export function teamMeetingPath(args: { startedAtIso: string; title: string }): string {
  const date = toMadridDate(args.startedAtIso)
  const titleSlug = slug(args.title)
  return path.posix.join(DOCS_TEAM_MEETINGS_DIR, `${date}-${titleSlug}.md`)
}
