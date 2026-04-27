#!/usr/bin/env node
// Orquestador completo: sync → seleccionar top videos → transcribir → generar 3 virales.
//
// Uso: node scripts/auto-viral-generate.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync, appendFileSync } from 'node:fs'
import path from 'node:path'

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}
loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
const INTERNAL_KEY = process.env.INTERNAL_TRIGGER_KEY
const BASE_URL = process.env.AUTO_VIRAL_BASE_URL || 'http://localhost:3000'
const POLL_INTERVAL_MS = 30_000
const MAX_WAIT_SYNC_MS = 20 * 60_000
const MAX_WAIT_TRANSCRIBE_MS = 60 * 60_000
const TOP_N = Number(process.env.AUTO_VIRAL_TOP_N || 60)
const MIN_VIEWS = Number(process.env.AUTO_VIRAL_MIN_VIEWS || 10000)
const LOG_FILE = '/tmp/auto-viral-generate.log'

const VIRAL_BRIEFS = [
  {
    brief: `Reel 45-55s viral estilo contraste biologico -> moraleja existencial.

Tema: la diferencia entre estar cansado del trabajo vs cansado de ti mismo porque no haces lo que elegiste.

Angulo Adrian: el cansancio laboral no es por trabajar, es por vivir desalineado. El sistema nervioso registra como agresion cualquier minuto haciendo algo que no elegiste. El cerebro no finge.

Estructura: hook afirmacion disruptiva + contraste hobby vs curro + principio biologico + pattern interrupt (no vacaciones, no dormir, no terapia) + cierre aforistico.

Tono: directo, exigente, con profundidad. Sin humo. Sin X-no-Y simetrico. Sin te-lo-demuestro.

Sin CTA. Cierre aforistico.`,
    pillar: 'ser-humano-biologia',
    duration: 50,
  },
  {
    brief: `Reel 45-55s viral estilo hot take filosofico anti-sistema.

Tema: trabajar duro no es virtud, es trampa. El mercado paga por resultados no por horas.

Angulo Adrian: la moral del esfuerzo es construccion del sistema industrial para que aceptes menos. La virtud real es apalancamiento. Trabajar menos y mejor no es vaguez, es inteligencia. Quien domina una skill digital especifica trabaja 4h y gana mas que quien curra 12h en algo que no eligio.

Estructura: hook contrarian que pique + verdad incomoda + ejemplo tangible (skill concreta) + reencuadre (apalancamiento > sacrificio) + cierre con verdad seca.

Tono: exigente, anti-sistema, con profundidad. Reconoce merito del esfuerzo pero redirige donde esforzarse.

Sin CTA. Cierre con afirmacion que desafie la mentalidad tradicional.`,
    pillar: 'mentalidad-disciplina',
    duration: 50,
  },
  {
    brief: `Reel 50-60s viral estilo verdad generacional demoledora.

Tema: tu generacion (22-35 anos en Espana) es la PRIMERA en siglo y medio que va a vivir peor que sus padres. No es mala suerte, es porque el sistema economico cambio hace 20 anos y nadie te lo explico.

Angulo Adrian: no es mensaje de victima, es claridad brutal. Si el viejo camino ya no lleva donde llevaba, tienes que construir uno nuevo. Existe: skills digitales que el mercado paga. Pero primero ver la realidad sin anestesia.

Estructura: hook con dato demoledor + contraste abuelo/padre/tu (sueldo + vivienda + posibilidades) + principio (el sistema cambio pero las expectativas no) + reencuadre (la salida existe pero no por donde te dijeron) + cierre que invite a despertar sin vender nada.

Tono: crudo, honesto, sin victimismo, con perspectiva historica. Adrian habla como alguien que salio de esa trampa.

Sin CTA directo. Cierre que invite a accionar sin vender nada.`,
    pillar: 'mentalidad-disciplina',
    duration: 55,
  },
]

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function log(msg) {
  const ts = new Date().toISOString()
  const line = `[${ts}] ${msg}`
  console.log(line)
  try {
    appendFileSync(LOG_FILE, line + '\n')
  } catch {}
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForSync() {
  log('Fase 1: esperando sync de cuentas...')
  const start = Date.now()
  while (true) {
    if (Date.now() - start > MAX_WAIT_SYNC_MS) {
      log('TIMEOUT sync.')
      return false
    }
    const { data, error } = await supabase
      .from('ci_seed_accounts')
      .select('handle, sync_status, is_active')
      .eq('is_active', true)
    if (error) {
      log(`Error leyendo cuentas: ${error.message}`)
      await sleep(POLL_INTERVAL_MS)
      continue
    }
    const pending = (data || []).filter(
      (a) => a.sync_status === 'idle' || a.sync_status === 'running',
    )
    const ok = (data || []).filter((a) => a.sync_status === 'ok').length
    const err = (data || []).filter((a) => a.sync_status === 'error').length
    log(`Sync: ${ok} OK, ${err} ERROR, ${pending.length} pendientes (${pending.map((a) => a.handle).join(', ') || '-'})`)
    if (pending.length === 0) {
      log(`Sync completo: ${ok} OK, ${err} ERROR`)
      return true
    }
    await sleep(POLL_INTERVAL_MS)
  }
}

async function selectTopVideos() {
  log(`Fase 2: seleccionando top ${TOP_N} videos (>= ${MIN_VIEWS} views, sin transcript, de cuentas sincronizadas)...`)
  const { data, error } = await supabase
    .from('ci_videos')
    .select('id, engagement_rate, views')
    .gte('views', MIN_VIEWS)
    .is('transcript', null)
    .in('transcript_status', ['pending', 'error'])
    .order('engagement_rate', { ascending: false, nullsFirst: false })
    .limit(TOP_N)
  if (error) {
    log(`Error: ${error.message}`)
    return []
  }
  log(`${data?.length ?? 0} videos seleccionados`)
  return (data || []).map((v) => v.id)
}

async function resetErroredVideos() {
  const { error } = await supabase
    .from('ci_videos')
    .update({ transcript_status: 'pending', transcript_error: null })
    .in('transcript_status', ['error', 'running'])
  if (error) log(`Error reseteando: ${error.message}`)
  else log('Videos errored/running reseteados a pending')
}

async function triggerTranscription(videoIds) {
  if (videoIds.length === 0) return
  log(`Fase 3: disparando transcripcion background de ${videoIds.length} videos...`)
  const res = await fetch(`${BASE_URL}/api/content-intel/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': INTERNAL_KEY,
    },
    body: JSON.stringify({ video_ids: videoIds, background: true }),
  })
  const text = await res.text()
  log(`Response status: ${res.status}, body: ${text.slice(0, 200)}`)
}

async function waitForTranscription(videoIds) {
  log(`Fase 4: esperando transcripcion de ${videoIds.length} videos...`)
  const start = Date.now()
  while (true) {
    if (Date.now() - start > MAX_WAIT_TRANSCRIBE_MS) {
      log('TIMEOUT transcripcion.')
      return false
    }
    const { data, error } = await supabase
      .from('ci_videos')
      .select('id, transcript_status')
      .in('id', videoIds)
    if (error) {
      log(`Error: ${error.message}`)
      await sleep(POLL_INTERVAL_MS)
      continue
    }
    const states = (data || []).reduce((acc, v) => {
      acc[v.transcript_status] = (acc[v.transcript_status] || 0) + 1
      return acc
    }, {})
    const stillProcessing = (states.pending || 0) + (states.running || 0)
    const done = videoIds.length - stillProcessing
    log(`Transcripcion: ${done}/${videoIds.length} terminados - ${JSON.stringify(states)}`)
    if (stillProcessing === 0) {
      log(`Transcripcion completa: ${JSON.stringify(states)}`)
      return true
    }
    await sleep(POLL_INTERVAL_MS)
  }
}

async function generateViralScript(index) {
  const config = VIRAL_BRIEFS[index]
  log(`Fase 5.${index + 1}: generando guion viral...`)
  const res = await fetch(`${BASE_URL}/api/content-intel/scripts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': INTERNAL_KEY,
    },
    body: JSON.stringify({
      brief: config.brief,
      platform: 'instagram',
      duration_target_s: config.duration,
      content_pillar: config.pillar,
    }),
  })
  const json = await res.json()
  if (!res.ok || !json.ok) {
    log(`ERROR guion ${index + 1}: ${JSON.stringify(json).slice(0, 300)}`)
    return null
  }
  log(`Guion ${index + 1} creado: ${json.script?.id}`)
  return json.script
}

async function main() {
  log('=== AUTO-VIRAL-GENERATE V2 INICIADO ===')

  const syncOk = await waitForSync()
  if (!syncOk) {
    log('Abortando: sync no completo.')
    return
  }

  await resetErroredVideos()
  await sleep(3000)

  const videoIds = await selectTopVideos()
  if (videoIds.length === 0) {
    log('No hay videos para transcribir. Saltamos a generacion.')
  } else {
    await triggerTranscription(videoIds)
    await sleep(5000)
    const transcribed = await waitForTranscription(videoIds)
    if (!transcribed) {
      log('Transcripcion no termino completamente, pero seguimos con lo que hay.')
    }
  }

  log('Fase 5: generando 3 guiones virales en paralelo...')
  const results = await Promise.all([0, 1, 2].map((i) => generateViralScript(i)))
  const ok = results.filter((r) => r !== null).length
  log(`=== COMPLETADO: ${ok}/3 guiones generados ===`)
}

main().catch((err) => {
  log(`FATAL: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
