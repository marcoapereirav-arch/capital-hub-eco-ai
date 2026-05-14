import { streamText, type ModelMessage } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { LLM_CROSS_QUERY_MODEL } from '../constants'
import { ContentIntelError, toErrorMessage } from '../lib/errors'
import { loadBrandContext } from './brand-context'
import type { Platform } from './../types/platform'
import type { ViralLabFilters } from '../types/viral-lab'

/**
 * Chats persistentes con el corpus.
 *
 * Cada chat tiene un set de filtros iniciales que pre-selecciona N videos
 * del corpus. Esos videos + sus transcripciones se cargan en el contexto
 * del modelo durante TODA la conversación.
 *
 * El usuario puede:
 *   - Crear chats nuevos con sus filtros
 *   - Retomar chats anteriores (historial preservado)
 *   - Iterar libremente con el modelo
 *   - Cambiar filtros dentro del chat (re-selecciona videos)
 *
 * Velocidad: respuestas con streaming Server-Sent Events para que se sienta
 * como Claude.ai.
 */

const MAX_HISTORY_MESSAGES = 20 // últimos 20 mensajes en el prompt
const MAX_VIDEOS_IN_CONTEXT = 30 // máximo de videos cargados por chat
const TRANSCRIPT_PREVIEW_CHARS = 3500 // chars de cada transcript en el prompt
const SLA_USD_PER_MILLION_TOKENS = 3

// ============================================================
// Tipos
// ============================================================

export type ChatRole = 'user' | 'assistant' | 'system'

export interface CorpusChatRow {
  id: string
  user_id: string
  title: string
  filters: ViralLabFilters
  video_ids: string[]
  analysis_md: string | null
  platform: Platform
  total_videos_in_context: number
  archived: boolean
  session_type: 'daily' | null
  created_at: string
  updated_at: string
}

export interface CorpusChatMessage {
  id: string
  chat_id: string
  role: ChatRole
  content: string
  metadata: Record<string, unknown>
  tokens_used: number
  cost_usd: number
  created_at: string
}

export interface CorpusChatWithMessages extends CorpusChatRow {
  messages: CorpusChatMessage[]
}

// ============================================================
// Modelo LLM
// ============================================================

function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new ContentIntelError('openrouter_key_missing', 'OPENROUTER_API_KEY not set')
  return createOpenRouter({
    apiKey,
    extraBody: { provider: { order: ['Anthropic'], allow_fallbacks: false } },
  })(LLM_CROSS_QUERY_MODEL)
}

// ============================================================
// System prompt para chat conversacional
// ============================================================

const CORPUS_CHAT_SYSTEM = `Eres el copywriter senior y estratega de contenido de Adrián Villanueva (Capital Hub).

CONTEXTO QUE RECIBES EN CADA TURNO:
- Brand playbook (voz de Adrián, anti-patrones, asociaciones, manifiesto)
- Avatar Andrés v3 (su audiencia objetivo)
- Análisis de patrones del corpus filtrado (hooks, estructuras, CTAs que funcionan)
- TOP videos del corpus con sus transcripciones COMPLETAS (puedes citar literal)
- Historial de la conversación

TU ROL:
- Conversas con Adrián sobre estrategia de contenido, guiones, hooks, ángulos
- Eres directo, agudo, con criterio. Cero relleno motivacional
- Cuando te pida texto literal de un video, busca en las transcripciones y cita sin inventar
- Cuando te pida un guion, escríbelo word-for-word para grabar a cámara
- Cuando te pida análisis, da insight accionable, no descripción genérica
- Cuando dudes entre 2 caminos, elige el que más conecte con el dolor de Andrés

REGLAS DE ESCRITURA:
- Frases cortas. Lenguaje real, no acartonado
- Cero "X, no Y" simétrico
- Cero "te voy a explicar", "tienes que entender que"
- Cero pregunta retórica genérica al abrir
- Si vas a citar un patrón del corpus, di la cuenta + el ejemplo concreto
- Si necesitas un dato que no tienes, márcalo [DATO_NECESARIO: ...] en vez de inventarlo

NUNCA inventes contenido del corpus. Si la información no está en los transcripts que tienes, dilo claramente. Mejor decir "no lo veo en el corpus filtrado" que adivinar.`

const DAILY_SESSION_SYSTEM = `${CORPUS_CHAT_SYSTEM}

═══════════════════════════════════════════════════════════════
MODO ESPECIAL: SESIÓN DEL DÍA
═══════════════════════════════════════════════════════════════

Esta NO es una conversación libre. Es la sesión diaria de Adrián para
elegir las 3 ideas que va a grabar HOY (2 TOFU + 1 MOFU) y producir
los 3 guiones uno por uno.

PROTOCOLO DE LA SESIÓN (síguelo estrictamente):

FASE 1 — Selección de ternas
Cuando Adrián te pida "dame las 3 mejores" (o equivalente):
1. Lee la sección "IDEAS PENDIENTES" del contexto (te las paso siempre)
2. Cruza cada idea con: corpus + avatar Andrés + brand playbook
3. Propón EXACTAMENTE 3 ideas: 2 TOFU + 1 MOFU
4. Para cada una di: ID de la idea, contenido resumido, funnel,
   por qué la elegiste (anclando al corpus y/o al avatar concreto),
   hook propuesto en ≤12 palabras
5. Espera la respuesta de Adrián. Posibles respuestas:
   - "Las 3 me convencen" / "vamos con estas" → FASE 2
   - "La 2 no me convence, dame otra" → propón otra TOFU manteniendo
     las que aprobó. Vuelve a esperar
   - "Ninguna me convence" → propón otra terna distinta
   - Pregunta específica → respondes y vuelves a esperar

FASE 2 — Generación de guiones (uno por uno, NUNCA todos a la vez)
Cuando Adrián confirme las 3:
1. Listas el orden: "vamos con guion 1 (...), después 2, después 3"
2. Generas SOLO el primer guion completo (hook ≤12 palabras + 3
   variantes, cuerpo word-for-word, CTA implícito, notas de producción)
3. Esperas su feedback. Posibles respuestas:
   - "Perfecto, siguiente" → generas el guion 2
   - "Cambia X" → iteras solo lo que pide, NO repites todo el guion
   - "Hazlo más afilado" / etc → iteras
4. Solo cuando confirma un guion, pasas al siguiente
5. Al final de los 3 guiones: confirmas "Sesión cerrada. 3 guiones
   listos para grabar."

REGLAS DURAS:
- Nunca generes los 3 guiones a la vez aunque te lo pidan. Uno por uno
- Nunca te saltes la fase de selección. Aunque Adrián te pida "dame
  el primer guion", primero le confirmas qué idea es esa
- Si Adrián cambia de idea a mitad ("olvida la #2, mejor esta otra"),
  flexibilízate pero recuérdale el orden actual antes de seguir
- Si propones una idea, SIEMPRE incluye su ID (el del input) para que
  el sistema pueda marcarla como "generated" en BD después`

// ============================================================
// Helper: cargar videos del chat con transcripts
// ============================================================

interface ChatContextVideo {
  id: string
  handle: string
  role: string
  is_own: boolean
  views: number | null
  caption: string | null
  transcript: string | null
}

async function loadChatContextVideos(
  supabase: SupabaseClient,
  videoIds: string[],
): Promise<ChatContextVideo[]> {
  if (videoIds.length === 0) return []
  const { data, error } = await supabase
    .from('ci_videos')
    .select(`
      id, views, caption, transcript,
      ci_seed_accounts!inner(handle, role, is_own)
    `)
    .in('id', videoIds)
    .order('views', { ascending: false, nullsFirst: false })

  if (error) {
    console.warn(`[corpus-chat] loadChatContextVideos failed: ${error.message}`)
    return []
  }

  return (data ?? []).map((r) => {
    const rec = r as unknown as {
      id: string
      views: number | null
      caption: string | null
      transcript: string | null
      ci_seed_accounts: { handle: string; role: string; is_own: boolean }
    }
    return {
      id: rec.id,
      handle: rec.ci_seed_accounts.handle,
      role: rec.ci_seed_accounts.role,
      is_own: rec.ci_seed_accounts.is_own,
      views: rec.views,
      caption: rec.caption,
      transcript: rec.transcript,
    }
  })
}

// ============================================================
// Construir el system prompt completo para un turno del chat
// ============================================================

function buildContextBlock(videos: ChatContextVideo[]): string {
  if (videos.length === 0) return '(no hay videos en el contexto del chat)'

  return videos
    .slice(0, MAX_VIDEOS_IN_CONTEXT)
    .map((v, i) => {
      const transcript =
        v.transcript && v.transcript.length > 0
          ? v.transcript.slice(0, TRANSCRIPT_PREVIEW_CHARS)
          : '(sin transcripción)'
      return [
        `## [${i + 1}] @${v.handle}${v.is_own ? ' (TU CUENTA)' : ''} · ${v.views ?? '?'} views`,
        v.caption ? `Caption: ${v.caption.slice(0, 350)}` : '',
        '',
        'Transcript:',
        transcript,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n---\n\n')
}

async function loadPendingIdeasForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Array<{ id: string; content: string }>> {
  const { data, error } = await supabase
    .from('ci_ideas')
    .select('id, content, position_in_source')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('position_in_source', { ascending: true, nullsFirst: false })
    .limit(100)

  if (error) {
    console.warn(`[corpus-chat] loadPendingIdeas failed: ${error.message}`)
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    content: r.content as string,
  }))
}

async function buildFullSystemPrompt(
  supabase: SupabaseClient,
  chat: CorpusChatRow,
): Promise<string> {
  const brand = await loadBrandContext()
  const videos = await loadChatContextVideos(supabase, chat.video_ids)
  const contextBlock = buildContextBlock(videos)

  const filtersDescription = describeFilters(chat.filters)

  const isDaily = chat.session_type === 'daily'
  const systemBase = isDaily ? DAILY_SESSION_SYSTEM : CORPUS_CHAT_SYSTEM

  // En modo daily, cargamos las ideas pendientes del usuario en cada turno.
  // Las cargamos cada vez (no cacheadas en el chat) porque el usuario puede
  // sincronizar el doc mientras la sesión está abierta y queremos que se
  // refleje sin tener que cerrar el chat.
  let pendingIdeasBlock = ''
  if (isDaily) {
    const pendingIdeas = await loadPendingIdeasForUser(supabase, chat.user_id)
    if (pendingIdeas.length === 0) {
      pendingIdeasBlock = '_(No hay ideas pendientes. Avísale a Adrián que sincronice su doc o añada ideas nuevas.)_'
    } else {
      pendingIdeasBlock = pendingIdeas
        .map(
          (i, idx) =>
            `${idx + 1}. (id: ${i.id}) ${i.content.slice(0, 400)}${i.content.length > 400 ? '…' : ''}`,
        )
        .join('\n\n')
    }
  }

  return [
    systemBase,
    '',
    '# BRAND PLAYBOOK',
    brand.playbook.text,
    '',
    '# AVATAR ANDRÉS',
    brand.avatar.text,
    '',
    '# FILTROS APLICADOS A ESTE CHAT',
    filtersDescription,
    '',
    chat.analysis_md
      ? '# ANÁLISIS DE PATRONES DEL CORPUS\n' + chat.analysis_md
      : '',
    '',
    '# TOP VIDEOS DEL CORPUS (transcripciones completas)',
    contextBlock,
    '',
    isDaily ? '# IDEAS PENDIENTES (las que Adrián tiene apuntadas y aún no ha grabado)' : '',
    isDaily ? pendingIdeasBlock : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function describeFilters(f: ViralLabFilters): string {
  const parts: string[] = []
  if (f.account_ids && f.account_ids.length > 0) {
    parts.push(`${f.account_ids.length} cuentas específicas`)
  } else {
    parts.push('Todas las cuentas activas')
  }
  if (f.min_views) parts.push(`min_views=${f.min_views.toLocaleString()}`)
  if (f.from_date) parts.push(`desde=${f.from_date.slice(0, 10)}`)
  if (f.to_date) parts.push(`hasta=${f.to_date.slice(0, 10)}`)
  parts.push(`orden=${f.order_by ?? 'engagement_rate'}`)
  if (f.top_n_per_account) parts.push(`max ${f.top_n_per_account} por cuenta`)
  return parts.join(' · ')
}

// ============================================================
// API pública del servicio
// ============================================================

export interface CreateChatInput {
  userId: string
  platform?: Platform
  filters: ViralLabFilters
  totalLimit?: number
  initialBrief?: string // opcional: primer mensaje del usuario
  preselectedVideoIds?: string[] // opcional: si ya tenemos videos analizados
  analysisMd?: string // opcional: análisis previo (ej. del Viral Lab)
}

export async function createCorpusChat(
  input: CreateChatInput,
): Promise<CorpusChatRow> {
  return _createCorpusChatInternal(input, null)
}

/**
 * Crea una "sesión del día": un chat de corpus pre-configurado para el
 * workflow diario de Adrián.
 *
 * Diferencias con un chat normal:
 *   - session_type='daily' marcado en BD
 *   - El system prompt incluye protocolo estricto (selección → guiones uno a uno)
 *   - Las IDEAS PENDIENTES del usuario se cargan EN CADA TURNO en el system
 *     prompt (se actualiza dinámicamente si sincroniza el doc mid-sesión)
 *   - Título auto: "Sesión del día — DD/MM"
 *   - Auto-mensaje inicial: "Dame las 3 mejores: 2 TOFU + 1 MOFU"
 */
export async function createDailySession(input: {
  userId: string
  filters: ViralLabFilters
  totalLimit?: number
  platform?: Platform
}): Promise<{ chat: CorpusChatRow; firstUserMessage: string }> {
  const chat = await _createCorpusChatInternal(
    {
      userId: input.userId,
      filters: input.filters,
      totalLimit: input.totalLimit ?? 25,
      platform: input.platform,
    },
    'daily',
  )

  const firstUserMessage =
    'De todas las ideas pendientes que tengo, mira el corpus y los patrones que funcionan AHORA, mira mi avatar Andrés, y proponme las 3 ideas con mayor potencial para grabar hoy: 2 TOFU + 1 MOFU. Para cada una dime: el ID de la idea, el funnel, hook propuesto en ≤12 palabras, y por qué la has elegido (con referencia concreta al corpus o al avatar). Si necesitas que cambie alguna, te lo digo y propones otra.'

  return { chat, firstUserMessage }
}

async function _createCorpusChatInternal(
  input: CreateChatInput,
  sessionType: 'daily' | null,
): Promise<CorpusChatRow> {
  const supabase = createAdminClient()
  const platform: Platform = input.platform ?? 'instagram'

  let videoIds: string[] = input.preselectedVideoIds ?? []
  let analysisMd: string | null = input.analysisMd ?? null

  // Si no nos pasaron videos pre-seleccionados, lo hacemos ahora
  if (videoIds.length === 0) {
    // Importamos lazy para evitar ciclo
    const { runCorpusSelectionForChat } = await import('./corpus-chat-selection')
    const selection = await runCorpusSelectionForChat({
      filters: input.filters,
      totalLimit: input.totalLimit ?? 30,
      platform,
    })
    videoIds = selection.videoIds
    analysisMd = selection.analysisMd
  }

  // Generamos un título inicial provisional
  const title =
    sessionType === 'daily'
      ? `Sesión del día — ${new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
      : input.initialBrief
        ? generateTitleFromBrief(input.initialBrief)
        : `Chat del ${new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`

  const { data, error } = await supabase
    .from('ci_corpus_chats')
    .insert({
      user_id: input.userId,
      title,
      filters: input.filters,
      video_ids: videoIds,
      analysis_md: analysisMd,
      platform,
      total_videos_in_context: videoIds.length,
      session_type: sessionType,
    })
    .select('*')
    .single()

  if (error) throw new ContentIntelError('create_chat_failed', error.message)
  return data as CorpusChatRow
}

function generateTitleFromBrief(brief: string): string {
  const cleaned = brief.trim().replace(/\s+/g, ' ').slice(0, 60)
  return cleaned.length > 0 ? cleaned : 'Nuevo chat'
}

export async function listCorpusChats(userId: string): Promise<CorpusChatRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ci_corpus_chats')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) throw new ContentIntelError('list_chats_failed', error.message)
  return (data ?? []) as CorpusChatRow[]
}

export async function getCorpusChat(
  chatId: string,
  userId: string,
): Promise<CorpusChatWithMessages | null> {
  const supabase = createAdminClient()
  const { data: chat, error: chatErr } = await supabase
    .from('ci_corpus_chats')
    .select('*')
    .eq('id', chatId)
    .eq('user_id', userId)
    .maybeSingle()

  if (chatErr) throw new ContentIntelError('get_chat_failed', chatErr.message)
  if (!chat) return null

  const { data: messages, error: msgErr } = await supabase
    .from('ci_corpus_chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (msgErr) throw new ContentIntelError('get_messages_failed', msgErr.message)

  return {
    ...(chat as CorpusChatRow),
    messages: (messages ?? []) as CorpusChatMessage[],
  }
}

export async function archiveCorpusChat(
  chatId: string,
  userId: string,
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('ci_corpus_chats')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', chatId)
    .eq('user_id', userId)
  if (error) throw new ContentIntelError('archive_chat_failed', error.message)
}

export async function updateCorpusChatTitle(
  chatId: string,
  userId: string,
  title: string,
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('ci_corpus_chats')
    .update({ title: title.slice(0, 120), updated_at: new Date().toISOString() })
    .eq('id', chatId)
    .eq('user_id', userId)
  if (error) throw new ContentIntelError('update_title_failed', error.message)
}

export async function updateCorpusChatFilters(
  chatId: string,
  userId: string,
  filters: ViralLabFilters,
  totalLimit: number = 30,
): Promise<CorpusChatRow> {
  const supabase = createAdminClient()
  const { data: chat, error: loadErr } = await supabase
    .from('ci_corpus_chats')
    .select('*')
    .eq('id', chatId)
    .eq('user_id', userId)
    .maybeSingle()
  if (loadErr) throw new ContentIntelError('load_chat_failed', loadErr.message)
  if (!chat) throw new ContentIntelError('chat_not_found', 'Chat no encontrado')

  const { runCorpusSelectionForChat } = await import('./corpus-chat-selection')
  const selection = await runCorpusSelectionForChat({
    filters,
    totalLimit,
    platform: (chat as CorpusChatRow).platform,
  })

  const { data: updated, error: updateErr } = await supabase
    .from('ci_corpus_chats')
    .update({
      filters,
      video_ids: selection.videoIds,
      analysis_md: selection.analysisMd,
      total_videos_in_context: selection.videoIds.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chatId)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (updateErr) throw new ContentIntelError('update_filters_failed', updateErr.message)
  return updated as CorpusChatRow
}

/**
 * Envía un mensaje y devuelve el stream de la respuesta del LLM.
 * El caller (endpoint) debe consumir el stream y guardar el resultado.
 */
export async function streamCorpusChatMessage(input: {
  chatId: string
  userId: string
  userMessage: string
}): Promise<{
  stream: ReadableStream<Uint8Array>
  saveAssistantResponse: (fullText: string, tokensUsed: number) => Promise<void>
}> {
  const supabase = createAdminClient()

  // 1) Cargar chat + verificar ownership
  const { data: chat, error: chatErr } = await supabase
    .from('ci_corpus_chats')
    .select('*')
    .eq('id', input.chatId)
    .eq('user_id', input.userId)
    .maybeSingle()
  if (chatErr) throw new ContentIntelError('load_chat_failed', chatErr.message)
  if (!chat) throw new ContentIntelError('chat_not_found', 'Chat no encontrado')

  const chatRow = chat as CorpusChatRow

  // 2) Cargar historial reciente
  const { data: history, error: histErr } = await supabase
    .from('ci_corpus_chat_messages')
    .select('role, content')
    .eq('chat_id', input.chatId)
    .order('created_at', { ascending: true })
    .limit(MAX_HISTORY_MESSAGES * 2) // overfetch para luego cortar últimos N
  if (histErr) throw new ContentIntelError('load_history_failed', histErr.message)

  const recentHistory = (history ?? []).slice(-MAX_HISTORY_MESSAGES) as Array<{
    role: ChatRole
    content: string
  }>

  // 3) Construir system prompt con todo el contexto
  const systemPrompt = await buildFullSystemPrompt(supabase, chatRow)

  // 4) Insertar mensaje del usuario (lo persistimos ANTES de llamar al LLM
  //    para que si el stream falla a mitad, el msg del user queda guardado)
  const { error: insertUserErr } = await supabase
    .from('ci_corpus_chat_messages')
    .insert({
      chat_id: input.chatId,
      role: 'user',
      content: input.userMessage,
    })
  if (insertUserErr) throw new ContentIntelError('insert_user_msg_failed', insertUserErr.message)

  // Actualizamos updated_at del chat
  await supabase
    .from('ci_corpus_chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', input.chatId)

  // 5) Construir messages para el LLM
  const messages: ModelMessage[] = [
    ...recentHistory.map(
      (m) =>
        ({
          role: m.role === 'system' ? 'system' : m.role,
          content: m.content,
        }) as ModelMessage,
    ),
    { role: 'user', content: input.userMessage },
  ]

  // 6) Llamar al LLM con stream
  let result
  try {
    result = streamText({
      model: getModel(),
      system: systemPrompt,
      messages,
      temperature: 0.55,
      maxOutputTokens: 4000,
    })
  } catch (err) {
    throw new ContentIntelError('stream_failed', toErrorMessage(err))
  }

  // 7) Función helper para guardar la respuesta cuando termine el stream
  const saveAssistantResponse = async (fullText: string, tokensUsed: number) => {
    const cost = (tokensUsed / 1_000_000) * SLA_USD_PER_MILLION_TOKENS
    await supabase.from('ci_corpus_chat_messages').insert({
      chat_id: input.chatId,
      role: 'assistant',
      content: fullText,
      tokens_used: tokensUsed,
      cost_usd: cost,
    })
    // Auto-update title si era el provisional y el primer mensaje fue corto
    if (
      chatRow.title.startsWith('Chat del ') ||
      chatRow.title === 'Nuevo chat'
    ) {
      const newTitle = generateTitleFromBrief(input.userMessage)
      if (newTitle !== chatRow.title) {
        await supabase
          .from('ci_corpus_chats')
          .update({ title: newTitle })
          .eq('id', input.chatId)
      }
    }
  }

  return {
    stream: result.toTextStreamResponse().body!,
    saveAssistantResponse,
  }
}
