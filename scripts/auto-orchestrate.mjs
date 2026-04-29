#!/usr/bin/env node
// Orquestador automático: espera a que terminen los syncs en curso y luego
// dispara la transcripción de los top N videos del corpus.
//
// Uso: node scripts/auto-orchestrate.mjs
//
// Variables requeridas en .env.local:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//   INTERNAL_TRIGGER_KEY

import { createClient } from '@supabase/supabase-js'
import { readFileSync, appendFileSync } from 'node:fs'
import path from 'node:path'

// -------- Cargar .env.local manualmente --------
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2]
    }
  }
}
loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
const INTERNAL_KEY = process.env.INTERNAL_TRIGGER_KEY
const BASE_URL = process.env.AUTO_ORCH_BASE_URL || 'http://localhost:3000'
const TOP_N = Number(process.env.AUTO_ORCH_TOP_N || 40)
const MIN_VIEWS = Number(process.env.AUTO_ORCH_MIN_VIEWS || 10000)
const POLL_INTERVAL_MS = 60_000 // 1 min
const MAX_WAIT_MS = 90 * 60_000 // 90 min max waiting for sync

const LOG_FILE = path.join(process.cwd(), '/tmp/auto-orchestrate.log')

function log(msg) {
  const ts = new Date().toISOString()
  const line = `[${ts}] ${msg}`
  console.log(line)
  try {
    appendFileSync(LOG_FILE, line + '\n')
  } catch {
    // silent
  }
}

if (!SUPABASE_URL || !SUPABASE_KEY || !INTERNAL_KEY) {
  log('FATAL: faltan variables de entorno (SUPABASE_URL, SUPABASE_SERVICE_KEY, INTERNAL_TRIGGER_KEY)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForSyncCompletion() {
  log(`Empezando a esperar que terminen los syncs en curso. Poll cada ${POLL_INTERVAL_MS / 1000}s.`)
  const start = Date.now()

  while (true) {
    if (Date.now() - start > MAX_WAIT_MS) {
      log('TIMEOUT esperando syncs. Abandonando.')
      return false
    }

    const { data, error } = await supabase
      .from('ci_seed_accounts')
      .select('handle, sync_status, is_active')
      .eq('is_active', true)

    if (error) {
      log(`Error leyendo accounts: ${error.message}. Reintentando en ${POLL_INTERVAL_MS / 1000}s.`)
      await sleep(POLL_INTERVAL_MS)
      continue
    }

    const inFlight = (data || []).filter(
      (a) => a.sync_status === 'running' || a.sync_status === 'idle',
    )
    const ok = (data || []).filter((a) => a.sync_status === 'ok').length
    const err = (data || []).filter((a) => a.sync_status === 'error').length

    log(`Estado: ${ok} OK, ${err} ERROR, ${inFlight.length} pendientes (${inFlight.map((a) => a.handle).join(', ') || 'ninguna'})`)

    if (inFlight.length === 0) {
      log(`Sync completo. ${ok} OK, ${err} ERROR.`)
      return true
    }

    await sleep(POLL_INTERVAL_MS)
  }
}

async function selectTopVideos() {
  log(`Seleccionando top ${TOP_N} videos con al menos ${MIN_VIEWS} views y sin transcript...`)
  const { data, error } = await supabase
    .from('ci_videos')
    .select('id, views, likes, comments, engagement_rate, caption')
    .gte('views', MIN_VIEWS)
    .is('transcript', null)
    .in('transcript_status', ['pending', 'error'])
    .order('engagement_rate', { ascending: false, nullsFirst: false })
    .limit(TOP_N)

  if (error) {
    log(`Error seleccionando videos: ${error.message}`)
    return []
  }

  log(`${data?.length ?? 0} videos seleccionados.`)
  return (data || []).map((v) => v.id)
}

async function triggerTranscription(videoIds) {
  if (videoIds.length === 0) {
    log('No hay videos para transcribir.')
    return
  }

  log(`Disparando transcripción para ${videoIds.length} videos...`)
  const res = await fetch(`${BASE_URL}/api/content-intel/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': INTERNAL_KEY,
    },
    body: JSON.stringify({ video_ids: videoIds }),
  })

  const text = await res.text()
  log(`Response status: ${res.status}`)
  log(`Response body (primeros 500): ${text.slice(0, 500)}`)

  if (!res.ok) {
    log(`ERROR en transcripción: ${res.status}`)
  } else {
    log('Transcripción completada (o encolada).')
  }
}

async function main() {
  log('=== AUTO-ORQUESTADOR INICIADO ===')
  log(`TOP_N=${TOP_N}, MIN_VIEWS=${MIN_VIEWS}, BASE_URL=${BASE_URL}`)

  try {
    const syncDone = await waitForSyncCompletion()
    if (!syncDone) {
      log('Abortando: sync no completó dentro del tiempo esperado.')
      return
    }

    // Pequeña pausa para asegurar que la BD está consistente
    await sleep(3000)

    const videoIds = await selectTopVideos()
    await triggerTranscription(videoIds)

    log('=== AUTO-ORQUESTADOR TERMINADO ===')
  } catch (err) {
    log(`FATAL: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
}

main()
