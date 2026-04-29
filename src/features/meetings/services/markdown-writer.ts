import type { SupabaseClient } from '@supabase/supabase-js'
import fg from 'fast-glob'
import matter from 'gray-matter'
import fs from 'node:fs/promises'
import { DOCS_COMMERCIAL_LOG, DOCS_OPERATIONAL_LOG } from '../constants'
import type { ClassificationResult } from '../types/classification'
import type { NormalizedMeeting } from '../types/fathom'
import type { ContactRow, MeetingRow, ResolvedParticipant } from '../types/meeting'
import { absPath, contactCallPath, contactFichaPath, teamMeetingPath, toMadridDate, toMadridTime } from '../lib/paths'
import {
  appendLineIfAbsent,
  composeMarkdown,
  fileExists,
  writeMarkdownIfChanged,
} from '../lib/md'

export interface WriteArtifactsInput {
  supabase: SupabaseClient
  meeting: MeetingRow
  classification: ClassificationResult
  normalized: NormalizedMeeting
  participants: ResolvedParticipant[]
}

export interface WriteArtifactsResult {
  markdownPath: string
  fichaPath: string | null
  logPath: string
  paths: string[]
}

export async function writeMeetingArtifacts(
  input: WriteArtifactsInput,
): Promise<WriteArtifactsResult> {
  const { meeting, classification, normalized } = input
  const paths: string[] = []

  if (meeting.scope === 'external') {
    return writeExternalMeeting(input, paths)
  }
  return writeInternalMeeting(input, paths)
}

async function writeExternalMeeting(
  input: WriteArtifactsInput,
  paths: string[],
): Promise<WriteArtifactsResult> {
  const primary = await resolvePrimaryContact(input)
  if (!primary) throw new Error('No primary contact found for external meeting')

  const callPath = contactCallPath({
    contactSlug: primary.slug,
    startedAtIso: input.meeting.started_at,
    title: input.meeting.title,
  })

  const callBody = renderCallMarkdown(input, primary)
  const res = await writeMarkdownIfChanged(callPath, callBody)
  if (res.changed) paths.push(callPath)

  const fichaPath = contactFichaPath(primary.slug)
  const fichaRes = await writeOrUpdateFicha(primary, fichaPath, paths)

  const logLine = renderCommercialLogLine(input, primary, callPath)
  const logRes = await appendLineIfAbsent(DOCS_COMMERCIAL_LOG, logLine)
  if (logRes.changed) paths.push(DOCS_COMMERCIAL_LOG)

  return {
    markdownPath: callPath,
    fichaPath: fichaRes ?? null,
    logPath: DOCS_COMMERCIAL_LOG,
    paths,
  }
}

async function writeInternalMeeting(
  input: WriteArtifactsInput,
  paths: string[],
): Promise<WriteArtifactsResult> {
  const mdPath = teamMeetingPath({
    startedAtIso: input.meeting.started_at,
    title: input.meeting.title,
  })

  const body = renderTeamMeetingMarkdown(input)
  const res = await writeMarkdownIfChanged(mdPath, body)
  if (res.changed) paths.push(mdPath)

  const logLine = renderOperationalLogLine(input, mdPath)
  const logRes = await appendLineIfAbsent(DOCS_OPERATIONAL_LOG, logLine)
  if (logRes.changed) paths.push(DOCS_OPERATIONAL_LOG)

  return {
    markdownPath: mdPath,
    fichaPath: null,
    logPath: DOCS_OPERATIONAL_LOG,
    paths,
  }
}

async function resolvePrimaryContact(
  input: WriteArtifactsInput,
): Promise<ContactRow | null> {
  const externals = input.participants.filter((p) => !p.team_member_id && p.contact_id)
  const primary =
    externals.find((p) => p.role === 'primary') ??
    externals.find((p) => p.role === 'decision_maker') ??
    externals[0]
  if (!primary?.contact_id) return null

  const { data, error } = await input.supabase
    .from('contacts')
    .select('*')
    .eq('id', primary.contact_id)
    .single()
  if (error || !data) return null
  return data as ContactRow
}

function renderCallMarkdown(
  input: WriteArtifactsInput,
  primary: ContactRow,
): string {
  const { meeting, classification, normalized } = input
  const date = toMadridDate(meeting.started_at)
  const time = toMadridTime(meeting.started_at)
  const durationMin = meeting.duration_seconds
    ? Math.round(meeting.duration_seconds / 60)
    : null

  const teamAttendees = input.participants
    .filter((p) => p.team_member_id)
    .map((p) => p.raw_name)

  const frontmatter = {
    kind: 'call',
    fathom_id: meeting.fathom_meeting_id,
    date,
    time,
    duration_min: durationMin,
    scope: meeting.scope,
    tipo: meeting.tipo,
    resultado: meeting.resultado,
    funnel_stage: meeting.funnel_stage,
    contact_slug: primary.slug,
    contact_name: primary.full_name,
    team_attendees: teamAttendees,
    fathom_url: meeting.fathom_share_url,
  }

  const body = [
    `# ${primary.full_name} — ${humanTipo(meeting.tipo)} — ${date}`,
    '',
    '## Resumen',
    classification.resumen,
    '',
    renderActionItems(classification.action_items),
    renderDecisiones(classification.decisiones),
    renderParticipantes(input),
    renderTranscript(normalized),
  ]
    .filter(Boolean)
    .join('\n')

  return composeMarkdown(frontmatter, body)
}

function renderTeamMeetingMarkdown(input: WriteArtifactsInput): string {
  const { meeting, classification, normalized } = input
  const date = toMadridDate(meeting.started_at)
  const time = toMadridTime(meeting.started_at)
  const durationMin = meeting.duration_seconds
    ? Math.round(meeting.duration_seconds / 60)
    : null

  const teamAttendees = input.participants
    .filter((p) => p.team_member_id)
    .map((p) => p.raw_name)

  const frontmatter = {
    kind: 'team_meeting',
    fathom_id: meeting.fathom_meeting_id,
    date,
    time,
    duration_min: durationMin,
    scope: meeting.scope,
    tipo: meeting.tipo,
    resultado: meeting.resultado,
    team_attendees: teamAttendees,
    fathom_url: meeting.fathom_share_url,
  }

  const body = [
    `# ${humanTipo(meeting.tipo)} — ${date}`,
    '',
    '## Resumen',
    classification.resumen,
    '',
    renderDecisiones(classification.decisiones),
    renderActionItems(classification.action_items),
    renderParticipantes(input),
    renderTranscript(normalized),
  ]
    .filter(Boolean)
    .join('\n')

  return composeMarkdown(frontmatter, body)
}

function renderActionItems(items: ClassificationResult['action_items']): string {
  if (!items.length) return ''
  const lines = items.map((a) => {
    const owner = a.owner ? ` — @${a.owner}` : ''
    const due = a.due_date ? ` — vence ${a.due_date}` : ''
    return `- [ ] ${a.texto}${owner}${due}`
  })
  return `## Action Items\n${lines.join('\n')}\n`
}

function renderDecisiones(dec: ClassificationResult['decisiones']): string {
  if (!dec.length) return ''
  return `## Decisiones\n${dec.map((d) => `- ${d.texto}`).join('\n')}\n`
}

function renderParticipantes(input: WriteArtifactsInput): string {
  const lines = input.participants.map((p) => {
    const tag = p.team_member_id ? '(team)' : `(${p.role}${p.match_status === 'fuzzy_pending' ? ', match pendiente' : ''})`
    const email = p.raw_email ? ` — ${p.raw_email}` : ''
    return `- **${p.raw_name}** ${tag}${email}`
  })
  return `## Participantes\n${lines.join('\n')}\n`
}

function renderTranscript(n: NormalizedMeeting): string {
  if (!n.transcript_text) return ''
  return `## Transcript\n<details>\n<summary>Ver transcript completo</summary>\n\n${n.transcript_text}\n\n</details>\n`
}

function humanTipo(tipo: string): string {
  const map: Record<string, string> = {
    sales_discovery: 'Sales Discovery',
    sales_closing: 'Sales Closing',
    client_onboarding: 'Client Onboarding',
    client_success: 'Client Success',
    team_daily: 'Daily',
    team_strategy: 'Strategy',
    partner: 'Partner Meeting',
    delivery: 'Delivery',
    otros: 'Otros',
  }
  return map[tipo] ?? tipo
}

async function writeOrUpdateFicha(
  contact: ContactRow,
  fichaPath: string,
  paths: string[],
): Promise<string> {
  // Regenerar ficha completa desde filesystem (lista de calls vive en disco).
  const calls = await listCallsForContact(contact.slug)

  let existingProfile = ''
  if (await fileExists(fichaPath)) {
    const abs = absPath(fichaPath)
    const raw = await fs.readFile(abs, 'utf8')
    const parsed = matter(raw)
    existingProfile = extractProfileSection(parsed.content)
  }

  const frontmatter = {
    kind: 'contact_profile',
    slug: contact.slug,
    name: contact.full_name,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    stage: contact.stage,
    origin: contact.origin,
    tags: contact.tags,
    created_at: contact.created_at.slice(0, 10),
    updated_at: contact.updated_at.slice(0, 10),
  }

  const body = [
    `# ${contact.full_name}`,
    '',
    '## Perfil',
    existingProfile || '_Sin notas todavía._',
    '',
    '## Historial de Calls',
    calls.length
      ? calls.map((c) => `- [${c.date} — ${c.title}](./calls/${c.file}) — \`${c.resultado ?? 'na'}\``).join('\n')
      : '_Sin calls registradas._',
    '',
  ].join('\n')

  const content = composeMarkdown(frontmatter, body)
  const res = await writeMarkdownIfChanged(fichaPath, content)
  if (res.changed) paths.push(fichaPath)
  return fichaPath
}

function extractProfileSection(markdown: string): string {
  const m = markdown.match(/## Perfil\s*\n([\s\S]*?)(?=\n## |$)/)
  const body = m?.[1]?.trim() ?? ''
  if (!body || body === '_Sin notas todavía._') return ''
  return body
}

interface CallRef {
  file: string
  date: string
  title: string
  resultado: string | null
}

async function listCallsForContact(contactSlug: string): Promise<CallRef[]> {
  const dir = absPath(`docs/contacts/${contactSlug}/calls`)
  const entries = await fg('*.md', { cwd: dir, onlyFiles: true }).catch(() => [])
  const refs: CallRef[] = []
  for (const file of entries) {
    try {
      const raw = await fs.readFile(`${dir}/${file}`, 'utf8')
      const parsed = matter(raw)
      const fm = parsed.data as Record<string, unknown>
      refs.push({
        file,
        date: String(fm.date ?? file.slice(0, 10)),
        title: humanTipo(String(fm.tipo ?? 'call')),
        resultado: (fm.resultado as string | null) ?? null,
      })
    } catch {
      // ignore corrupt files
    }
  }
  refs.sort((a, b) => (a.date < b.date ? 1 : -1))
  return refs
}

function renderCommercialLogLine(
  input: WriteArtifactsInput,
  primary: ContactRow,
  callPath: string,
): string {
  const date = toMadridDate(input.meeting.started_at)
  const firstSentence = input.classification.resumen.split(/(?<=\.)\s+/)[0] ?? input.classification.resumen
  const linkPath = callPath.replace(/^docs\//, '../')
  return [
    `## ${date} · ${primary.full_name} · ${input.meeting.tipo} · ${input.meeting.resultado ?? 'na'}`,
    `[Link](${linkPath})`,
    firstSentence,
    '',
  ].join('\n')
}

function renderOperationalLogLine(input: WriteArtifactsInput, mdPath: string): string {
  const date = toMadridDate(input.meeting.started_at)
  const firstSentence = input.classification.resumen.split(/(?<=\.)\s+/)[0] ?? input.classification.resumen
  const linkPath = mdPath.replace(/^docs\//, '../')
  return [
    `## ${date} · ${humanTipo(input.meeting.tipo)} · ${input.meeting.tipo}`,
    `[Link](${linkPath})`,
    firstSentence,
    '',
  ].join('\n')
}
