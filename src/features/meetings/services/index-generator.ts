import fg from 'fast-glob'
import fs from 'node:fs/promises'
import matter from 'gray-matter'
import {
  DOCS_COMMERCIAL_LOG,
  DOCS_INDEX_FILE,
  DOCS_OPERATIONAL_LOG,
} from '../constants'
import { absPath } from '../lib/paths'
import { writeMarkdownIfChanged } from '../lib/md'

interface ContactEntry {
  slug: string
  name: string
  stage: string | null
  callsCount: number
}

interface TeamMeetingEntry {
  relativePath: string
  date: string
  tipo: string
  title: string
}

export async function regenerateIndex(): Promise<{ changed: boolean; path: string }> {
  const contacts = await scanContacts()
  const teamMeetings = await scanTeamMeetings()

  const lines: string[] = []
  lines.push('# Índice del Segundo Cerebro')
  lines.push('')
  lines.push(`## Contactos (${contacts.length})`)
  if (contacts.length === 0) lines.push('_Sin contactos todavía._')
  else {
    for (const c of contacts) {
      lines.push(
        `- [${c.name}](./contacts/${c.slug}/ficha.md) — ${c.stage ?? 'lead'} — ${c.callsCount} call${c.callsCount === 1 ? '' : 's'}`,
      )
    }
  }
  lines.push('')
  lines.push(`## Meetings de Equipo (${teamMeetings.length})`)
  if (teamMeetings.length === 0) lines.push('_Sin meetings de equipo todavía._')
  else {
    for (const m of teamMeetings) {
      lines.push(`- ${m.date} — [${humanTipo(m.tipo)} · ${m.title}](./${m.relativePath.replace(/^docs\//, '')})`)
    }
  }
  lines.push('')
  lines.push('## Logs')
  lines.push(`- [Commercial Log](./${DOCS_COMMERCIAL_LOG.replace(/^docs\//, '')})`)
  lines.push(`- [Operational Log](./${DOCS_OPERATIONAL_LOG.replace(/^docs\//, '')})`)
  lines.push('')
  lines.push(`_Último update: ${new Date().toISOString()}_`)
  lines.push('')

  const content = lines.join('\n')
  const res = await writeMarkdownIfChanged(DOCS_INDEX_FILE, content)
  return { changed: res.changed, path: DOCS_INDEX_FILE }
}

async function scanContacts(): Promise<ContactEntry[]> {
  const files = await fg('docs/contacts/*/ficha.md', { cwd: absPath(''), onlyFiles: true }).catch(
    () => [],
  )
  const entries: ContactEntry[] = []
  for (const rel of files) {
    try {
      const raw = await fs.readFile(absPath(rel), 'utf8')
      const parsed = matter(raw)
      const fm = parsed.data as Record<string, unknown>
      const slug = String(fm.slug ?? '')
      if (!slug) continue
      const calls = await fg(`docs/contacts/${slug}/calls/*.md`, {
        cwd: absPath(''),
        onlyFiles: true,
      }).catch(() => [])
      entries.push({
        slug,
        name: String(fm.name ?? slug),
        stage: (fm.stage as string | null) ?? null,
        callsCount: calls.length,
      })
    } catch {
      // skip corrupt ficha
    }
  }
  entries.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  return entries
}

async function scanTeamMeetings(): Promise<TeamMeetingEntry[]> {
  const files = await fg('docs/meetings/team/*.md', { cwd: absPath(''), onlyFiles: true }).catch(
    () => [],
  )
  const entries: TeamMeetingEntry[] = []
  for (const rel of files) {
    try {
      const raw = await fs.readFile(absPath(rel), 'utf8')
      const parsed = matter(raw)
      const fm = parsed.data as Record<string, unknown>
      entries.push({
        relativePath: rel,
        date: String(fm.date ?? rel.slice(-13, -3)),
        tipo: String(fm.tipo ?? 'otros'),
        title: deriveTitleFromFilename(rel),
      })
    } catch {
      // skip
    }
  }
  entries.sort((a, b) => (a.date < b.date ? 1 : -1))
  return entries
}

function deriveTitleFromFilename(rel: string): string {
  const base = rel.split('/').pop() ?? ''
  return base.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '').replaceAll('-', ' ')
}

function humanTipo(tipo: string): string {
  const map: Record<string, string> = {
    sales_discovery: 'Sales Discovery',
    sales_closing: 'Sales Closing',
    client_onboarding: 'Client Onboarding',
    client_success: 'Client Success',
    team_daily: 'Daily',
    team_strategy: 'Strategy',
    partner: 'Partner',
    delivery: 'Delivery',
    otros: 'Otros',
  }
  return map[tipo] ?? tipo
}
