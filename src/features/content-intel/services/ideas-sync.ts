import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContentIntelError } from '../lib/errors'
import { createCorpusChat } from './corpus-chat'
import type { ViralLabFilters } from '../types/viral-lab'

/**
 * Sistema de Ideas externas.
 *
 * Permite al usuario tener un doc externo (hoy: Google Doc público) con
 * sus ideas crudas y convertirlas a guiones grounded en el corpus con 1 clic.
 *
 * Flujo:
 *   1. Usuario registra un Google Doc (URL o doc_id)
 *   2. Sistema sincroniza el doc → parsea cada idea → inserta en ci_ideas
 *   3. Usuario clica "Generar guion" en una idea → crea chat de corpus con
 *      la idea como brief inicial
 *
 * Source actual: google_doc (export plain text). En el futuro se puede
 * añadir notion, drive, apple_notes_csv...
 */

// ============================================================
// Tipos
// ============================================================

export type IdeaStatus =
  | 'pending'
  | 'generating'
  | 'generated'
  | 'recorded'
  | 'published'
  | 'archived'

export interface IdeaSourceRow {
  id: string
  user_id: string
  source_type: 'google_doc'
  source_id: string
  source_url: string | null
  display_name: string | null
  last_synced_at: string | null
  last_sync_error: string | null
  total_ideas_imported: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface IdeaRow {
  id: string
  user_id: string
  source_id: string | null
  content: string
  content_hash: string
  status: IdeaStatus
  generated_chat_id: string | null
  notes: string | null
  position_in_source: number | null
  created_at: string
  updated_at: string
}

// ============================================================
// Parser de Google Docs
// ============================================================

/**
 * Extrae el ID del doc desde una URL completa o devuelve el ID si ya viene limpio.
 *
 *   https://docs.google.com/document/d/{ID}/edit?...     → {ID}
 *   https://docs.google.com/document/d/{ID}              → {ID}
 *   1YFvH4YR4xQaFuR4A6XT9ladplvakxJhRjDHZwc5CIyg         → mismo
 */
export function extractGoogleDocId(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) throw new ContentIntelError('invalid_doc', 'Doc URL/ID vacío')

  const urlMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  if (urlMatch) return urlMatch[1]

  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed

  throw new ContentIntelError(
    'invalid_doc',
    'No reconozco ese formato. Pega la URL completa del Google Doc o el ID.',
  )
}

/**
 * Descarga el contenido del Google Doc como texto plano usando el endpoint
 * de export. SOLO funciona si el doc está en modo "anyone with the link
 * can view". Si está privado, devolverá 401 o redirect a login.
 */
async function fetchGoogleDocText(docId: string): Promise<string> {
  const url = `https://docs.google.com/document/d/${docId}/export?format=txt`
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'CapitalHub/1.0 (+content-intel)',
    },
  })

  if (!res.ok) {
    throw new ContentIntelError(
      'doc_fetch_failed',
      `No se pudo descargar el doc (HTTP ${res.status}). ¿Está en modo "cualquiera con el link puede ver"?`,
    )
  }

  // El export viene con BOM al principio (0xFEFF). Lo limpiamos.
  const text = await res.text()
  return text.replace(/^﻿/, '')
}

/**
 * Parsea el texto plano de un Google Doc y extrae ideas individuales.
 *
 * Heurística simple pero efectiva:
 *   - Líneas que empiezan con '* ', '- ', '• ' son items de bullet → 1 idea
 *   - Líneas indentadas (sub-bullets) son continuación de la idea anterior
 *   - Líneas vacías entre bullets separan ideas
 *   - Ignora líneas que son SOLO una URL (suelen ser referencias adjuntas
 *     a la idea anterior)
 *   - Mínimo 20 chars para considerarse idea (filtra basura)
 */
export function parseIdeasFromText(text: string): string[] {
  const lines = text.split(/\r?\n/)
  const ideas: string[] = []
  let current = ''

  const isBulletStart = (l: string) => /^\s*[*\-•]\s+/.test(l)
  const isOnlyUrl = (l: string) =>
    /^https?:\/\/\S+\s*$/.test(l.trim()) || /^\s*https?:\/\/\S+\s*$/.test(l)
  const stripBullet = (l: string) => l.replace(/^\s*[*\-•]\s+/, '').trim()

  const pushCurrent = () => {
    const clean = current.trim().replace(/\s+/g, ' ').trim()
    if (clean.length >= 20) ideas.push(clean)
    current = ''
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.length === 0) {
      // Línea vacía: cierra la idea actual si hay algo
      if (current.trim().length > 0) pushCurrent()
      continue
    }

    if (isBulletStart(rawLine) && !rawLine.startsWith('   ')) {
      // Nuevo bullet de primer nivel → cierra el anterior y empieza nuevo
      if (current.trim().length > 0) pushCurrent()
      current = stripBullet(rawLine)
      continue
    }

    // Sub-líneas o continuación: añadimos al current con espacio
    // Casos:
    //   - bullet anidado (   * sub) → continúa la idea principal
    //   - texto suelto continúa la idea anterior
    //   - URL sola en la línea → la añadimos como nota de la idea actual
    const cleaned = stripBullet(rawLine).trim()
    if (cleaned.length === 0) continue
    if (current.length === 0) {
      // Primera línea de texto, sin bullet previo: arrancamos idea
      current = cleaned
    } else if (isOnlyUrl(rawLine)) {
      current += ' [ref: ' + cleaned + ']'
    } else {
      current += ' ' + cleaned
    }
  }

  // Push final
  if (current.trim().length > 0) pushCurrent()

  return ideas
}

function hashContent(content: string): string {
  // Normalizamos antes de hashear: lowercase + sin espacios extra + sin URLs largas
  const normalized = content
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16)
}

// ============================================================
// API pública
// ============================================================

export async function registerGoogleDocSource(
  userId: string,
  docUrlOrId: string,
  displayName?: string,
): Promise<IdeaSourceRow> {
  const docId = extractGoogleDocId(docUrlOrId)
  const supabase = createAdminClient()

  // Upsert: si ya existe la fuente, no duplicamos
  const { data, error } = await supabase
    .from('ci_ideas_sources')
    .upsert(
      {
        user_id: userId,
        source_type: 'google_doc',
        source_id: docId,
        source_url: `https://docs.google.com/document/d/${docId}/edit`,
        display_name: displayName ?? 'Mi doc de ideas',
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,source_type,source_id' },
    )
    .select('*')
    .single()

  if (error) throw new ContentIntelError('register_source_failed', error.message)
  return data as IdeaSourceRow
}

export async function listIdeaSources(userId: string): Promise<IdeaSourceRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ci_ideas_sources')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new ContentIntelError('list_sources_failed', error.message)
  return (data ?? []) as IdeaSourceRow[]
}

export interface SyncResult {
  sourceId: string
  imported: number
  skipped_existing: number
  total_parsed: number
}

export async function syncGoogleDoc(
  userId: string,
  sourceId: string,
): Promise<SyncResult> {
  const supabase = createAdminClient()

  // Cargar la fuente
  const { data: source, error: srcErr } = await supabase
    .from('ci_ideas_sources')
    .select('*')
    .eq('id', sourceId)
    .eq('user_id', userId)
    .maybeSingle()
  if (srcErr) throw new ContentIntelError('load_source_failed', srcErr.message)
  if (!source) throw new ContentIntelError('source_not_found', 'Fuente no encontrada')

  const src = source as IdeaSourceRow

  try {
    const docText = await fetchGoogleDocText(src.source_id)
    const parsed = parseIdeasFromText(docText)

    let imported = 0
    let skipped = 0

    for (let i = 0; i < parsed.length; i++) {
      const content = parsed[i]
      const hash = hashContent(content)

      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('ci_ideas')
        .select('id')
        .eq('user_id', userId)
        .eq('content_hash', hash)
        .maybeSingle()

      if (existing) {
        skipped++
        // Actualizamos la posición por si cambió en el doc
        await supabase
          .from('ci_ideas')
          .update({ position_in_source: i, source_id: src.id })
          .eq('id', existing.id)
        continue
      }

      const { error: insertErr } = await supabase.from('ci_ideas').insert({
        user_id: userId,
        source_id: src.id,
        content,
        content_hash: hash,
        position_in_source: i,
        status: 'pending',
      })
      if (insertErr) {
        // Si es duplicate por hash (race condition), ignoramos
        if (!insertErr.message.includes('duplicate')) {
          console.warn(`[ideas-sync] insert failed: ${insertErr.message}`)
        }
        continue
      }
      imported++
    }

    await supabase
      .from('ci_ideas_sources')
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_error: null,
        total_ideas_imported: src.total_ideas_imported + imported,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sourceId)

    return {
      sourceId,
      imported,
      skipped_existing: skipped,
      total_parsed: parsed.length,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    await supabase
      .from('ci_ideas_sources')
      .update({
        last_sync_error: msg.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sourceId)
    throw err
  }
}

export async function listIdeas(
  userId: string,
  status?: IdeaStatus,
): Promise<IdeaRow[]> {
  const supabase = createAdminClient()
  let q = supabase
    .from('ci_ideas')
    .select('*')
    .eq('user_id', userId)
    .order('position_in_source', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(500)

  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) throw new ContentIntelError('list_ideas_failed', error.message)
  return (data ?? []) as IdeaRow[]
}

export async function updateIdeaStatus(
  userId: string,
  ideaId: string,
  status: IdeaStatus,
  notes?: string,
): Promise<void> {
  const supabase = createAdminClient()
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (notes !== undefined) patch.notes = notes
  const { error } = await supabase
    .from('ci_ideas')
    .update(patch)
    .eq('id', ideaId)
    .eq('user_id', userId)
  if (error) throw new ContentIntelError('update_idea_failed', error.message)
}

export async function deleteIdea(userId: string, ideaId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('ci_ideas')
    .delete()
    .eq('id', ideaId)
    .eq('user_id', userId)
  if (error) throw new ContentIntelError('delete_idea_failed', error.message)
}

/**
 * Convierte una idea en un chat de corpus.
 *
 * Crea un nuevo chat con los filtros pasados, usando el contenido de la
 * idea como brief inicial. Marca la idea como 'generating' inmediatamente.
 *
 * El cliente debe seguir el flujo normal del chat (enviar el brief como
 * primer mensaje y leer el stream) — esta función solo prepara el chat.
 */
export async function generateChatFromIdea(input: {
  userId: string
  ideaId: string
  filters: ViralLabFilters
  totalLimit?: number
}): Promise<{ chatId: string; ideaContent: string }> {
  const supabase = createAdminClient()

  const { data: idea, error: ideaErr } = await supabase
    .from('ci_ideas')
    .select('*')
    .eq('id', input.ideaId)
    .eq('user_id', input.userId)
    .maybeSingle()
  if (ideaErr) throw new ContentIntelError('load_idea_failed', ideaErr.message)
  if (!idea) throw new ContentIntelError('idea_not_found', 'Idea no encontrada')

  const ideaRow = idea as IdeaRow

  // Marcar como 'generating'
  await supabase
    .from('ci_ideas')
    .update({ status: 'generating', updated_at: new Date().toISOString() })
    .eq('id', input.ideaId)

  // Crear el chat de corpus con la idea como brief
  const chat = await createCorpusChat({
    userId: input.userId,
    filters: input.filters,
    totalLimit: input.totalLimit ?? 20,
    initialBrief: ideaRow.content,
  })

  // Vincular el chat con la idea
  await supabase
    .from('ci_ideas')
    .update({
      generated_chat_id: chat.id,
      status: 'generated',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.ideaId)

  return { chatId: chat.id, ideaContent: ideaRow.content }
}
