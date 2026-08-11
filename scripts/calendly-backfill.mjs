#!/usr/bin/env node
// Trae de Calendly TODO el historico de reservas al OS.
//
// Por que existe: el receptor de Calendly solo escucha reservas nuevas, y ademas
// devolvia "todo bien" aunque no guardara nada. Del 2026-07-27 al 2026-08-07 se
// perdieron 5 reservas reales en silencio. Este importador recupera lo que falte
// y deja la base igual que si nunca hubiera fallado.
//
// REGLA DURA: no manda NI UN correo ni NI UNA notificacion. Las llamadas que trae
// ya estan agendadas; avisar ahora seria ruido (decision de Marco, 2026-08-07).
//
// Uso:
//   node scripts/calendly-backfill.mjs            # aplica
//   node scripts/calendly-backfill.mjs --dry-run  # solo dice que haria

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// -------- Cargar .env.local manualmente --------
function loadEnv() {
  const content = readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
  }
}
loadEnv()

const DRY = process.argv.includes('--dry-run')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const CALENDLY_TOKEN = process.env.CALENDLY_PERSONAL_ACCESS_TOKEN

if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Faltan credenciales de Supabase en .env.local')
if (!CALENDLY_TOKEN) throw new Error('Falta CALENDLY_PERSONAL_ACCESS_TOKEN en .env.local')

const db = createClient(SUPABASE_URL, SUPABASE_KEY)

// ---------------------------------------------------------------------------
// Calendly
// ---------------------------------------------------------------------------
async function cal(url) {
  const res = await fetch(url.startsWith('http') ? url : `https://api.calendly.com${url}`, {
    headers: { Authorization: `Bearer ${CALENDLY_TOKEN}`, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Calendly ${url} -> ${res.status}: ${await res.text()}`)
  return res.json()
}

async function calAll(url) {
  const out = []
  let next = url
  while (next) {
    const page = await cal(next)
    out.push(...(page.collection ?? []))
    next = page.pagination?.next_page ?? null
  }
  return out
}

// ---------------------------------------------------------------------------
// Escalera del no retroceso. Misma regla que src/lib/pipeline/stage-guard.ts:
// en automatico el stage nunca baja, y a un 'alumno' no se le degrada jamas.
// ---------------------------------------------------------------------------
const STAGE_RANK = { dm: 0, lead: 1, lead_cualificado: 2, agendado: 3, alumno: 4 }
function resolveAutoStage(current, proposed) {
  if (!current) return proposed
  if (current === 'alumno') return current
  const rc = STAGE_RANK[current]
  const rp = STAGE_RANK[proposed]
  if (rc != null && rp != null) return rp >= rc ? proposed : current
  return proposed
}

// ---------------------------------------------------------------------------
// El telefono y el Instagram NO vienen en los campos de Calendly: vienen dentro
// de las respuestas del formulario, identificadas por el TEXTO de la pregunta.
// Adrian puede renombrar esas preguntas, asi que se busca con tolerancia y nunca
// por posicion fija.
// ---------------------------------------------------------------------------
function answersToObject(qa) {
  const out = {}
  for (const item of qa ?? []) {
    if (item?.question) out[item.question.trim()] = item.answer ?? null
  }
  return out
}

function findAnswer(answers, ...needles) {
  for (const [q, a] of Object.entries(answers)) {
    const key = q.toLowerCase()
    if (needles.some((n) => key.includes(n))) {
      const val = typeof a === 'string' ? a.trim() : a
      if (val) return val
    }
  }
  return null
}

function cleanPhone(raw) {
  if (!raw) return null
  const cleaned = String(raw).replace(/[^\d+]/g, '')
  return cleaned.replace(/^\+?$/, '') || null
}

function cleanInstagram(raw) {
  if (!raw) return null
  const val = String(raw).trim().replace(/^@+/, '').replace(/\s+/g, '')
  if (!val || /^(no\.?tengo|notengoinstagram|\.\.\.|-)$/i.test(val)) return null
  return val.slice(0, 60)
}

function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50)
}

// ---------------------------------------------------------------------------
const stats = { eventos: 0, nuevos: 0, actualizados: 0, contactosCreados: 0, contactosMovidos: 0, journey: 0, saltados: 0, soloHistorial: 0 }

// Cuantos dias hacia atras se considera que una reserva sigue viva para el CRM.
// Una llamada de hace 4 meses no puede aparecer hoy en la columna "Agendado":
// para los numeros si cuenta, pero el pipeline es lo que hay AHORA.
const DIAS_VIVOS = 30

async function main() {
  console.log(DRY ? '\n  MODO PRUEBA: no se escribe nada\n' : '\n  Importando de Calendly\n')

  const { data: cfg } = await db.from('calendly_config').select('organization_uri').eq('id', 1).maybeSingle()
  const org = cfg?.organization_uri
  if (!org) throw new Error('No hay organization_uri en calendly_config: corre antes /api/admin/calendly/setup')

  // Los estados hay que pedirlos por separado: sin filtro Calendly no devuelve las canceladas.
  const events = []
  for (const status of ['active', 'canceled']) {
    events.push(...(await calAll(`/scheduled_events?organization=${encodeURIComponent(org)}&count=100&status=${status}`)))
  }
  console.log(`  ${events.length} reservas en Calendly`)

  // Que agenda es de venta. La de arranque de clientes y la personal de Adrian se
  // guardan para el historial, pero NO tocan el CRM ni cuentan en los numeros.
  const { data: tipos } = await db.from('calendly_event_types').select('uri, name, purpose')
  const purposeByUri = new Map((tipos ?? []).map((t) => [t.uri, t.purpose]))
  const limiteVivo = Date.now() - DIAS_VIVOS * 24 * 60 * 60 * 1000

  for (const ev of events) {
    stats.eventos++
    const invitees = await calAll(`${ev.uri}/invitees?count=100`)
    const hostEmail = (ev.event_memberships ?? [])[0]?.user_email ?? null

    for (const inv of invitees) {
      const answers = answersToObject(inv.questions_and_answers)
      const phone = cleanPhone(findAnswer(answers, 'tel', 'phone', 'movil', 'whatsapp') ?? inv.text_reminder_number)
      const instagram = cleanInstagram(findAnswer(answers, 'instagram', ' ig'))
      const email = inv.email?.toLowerCase().trim() || null
      const fullName = findAnswer(answers, 'nombre completo') || inv.name || email

      // El estado real de la reserva lo manda el invitado: si el cancelo, la
      // reserva esta cancelada aunque el evento siga figurando activo.
      let status = ev.status
      if (inv.status === 'canceled') status = 'canceled'
      if (inv.no_show) status = 'no_show'

      const row = {
        uri: ev.uri,
        name: ev.name,
        start_time: ev.start_time,
        end_time: ev.end_time,
        status,
        location_kind: ev.location?.type ?? null,
        location_uri: ev.location?.location ?? null,
        meeting_url: ev.location?.join_url ?? null,
        event_type_uri: ev.event_type,
        invitee_uri: inv.uri,
        invitee_email: email,
        invitee_name: inv.name ?? null,
        invitee_phone: phone,
        invitee_cancellation_reason: inv.cancellation?.reason ?? null,
        host_email: hostEmail,
        answers,
        utm_source: inv.tracking?.utm_source ?? null,
        utm_medium: inv.tracking?.utm_medium ?? null,
        utm_campaign: inv.tracking?.utm_campaign ?? null,
        utm_content: inv.tracking?.utm_content ?? null,
        synced_from: 'backfill',
        updated_at: new Date().toISOString(),
      }

      const { data: prev } = await db.from('calendly_scheduled_events').select('uri, contact_id').eq('uri', ev.uri).maybeSingle()
      if (prev) stats.actualizados++
      else stats.nuevos++

      if (!email) {
        console.log(`  - ${ev.start_time.slice(0, 16)}  ${inv.name ?? '(sin nombre)'}  sin email: se guarda la reserva, sin contacto`)
        if (!DRY) await db.from('calendly_scheduled_events').upsert(row, { onConflict: 'uri' })
        stats.saltados++
        continue
      }

      // Solo la agenda de VENTA toca el CRM, y solo si la llamada sigue viva.
      const esVenta = purposeByUri.get(ev.event_type) === 'venta'
      const sigueViva = new Date(ev.start_time).getTime() >= limiteVivo
      if (!esVenta || !sigueViva) {
        const motivo = !esVenta
          ? `agenda "${ev.name.trim()}", no es de venta`
          : `llamada de hace mas de ${DIAS_VIVOS} dias`
        // Si el contacto ya existe se enlaza la reserva, pero no se le toca el stage.
        const { data: yaExiste } = await db.from('contacts').select('id').ilike('email', email).maybeSingle()
        row.contact_id = yaExiste?.id ?? null
        if (!DRY) await db.from('calendly_scheduled_events').upsert(row, { onConflict: 'uri' })
        stats.soloHistorial++
        console.log(`  - ${ev.start_time.slice(0, 16)}  ${status.padEnd(8)}  ${(inv.name ?? '').padEnd(24).slice(0, 24)} ${email.padEnd(34)} solo historial: ${motivo}`)
        continue
      }

      // ---- Contacto ----
      const { data: contact } = await db
        .from('contacts')
        .select('id, stage, phone, instagram_username, pipeline_id')
        .ilike('email', email)
        .maybeSingle()

      let contactId = contact?.id ?? null
      let accion = ''

      if (contact) {
        const nextStage = status === 'canceled'
          ? contact.stage                       // una cancelada del pasado no reescribe su historia
          : resolveAutoStage(contact.stage, 'agendado')
        const patch = { updated_at: new Date().toISOString() }
        if (nextStage !== contact.stage) patch.stage = nextStage
        if (!contact.phone && phone) patch.phone = phone
        if (!contact.instagram_username && instagram) patch.instagram_username = instagram
        if (status !== 'canceled') patch.last_call_at = ev.start_time

        if (Object.keys(patch).length > 1) {
          if (!DRY) await db.from('contacts').update(patch).eq('id', contact.id)
          if (patch.stage) stats.contactosMovidos++
          accion = `${contact.stage} -> ${nextStage}` + (patch.phone ? ' +tel' : '') + (patch.instagram_username ? ' +ig' : '')
        } else {
          accion = 'sin cambios'
        }
      } else if (status !== 'canceled') {
        // Quien agenda sin venir de ningun funnel cae en el embudo General.
        const { data: pipeline } = await db.from('pipelines').select('id').eq('slug', 'general').maybeSingle()
        const insert = {
          full_name: fullName,
          email,
          phone,
          instagram_username: instagram,
          slug: `${slugify(fullName)}_${Math.random().toString(36).slice(2, 8)}`,
          stage: 'agendado',
          pipeline_id: pipeline?.id ?? null,
          origin: 'calendly_direct',
          source: 'calendly_direct',
          last_call_at: ev.start_time,
        }
        if (!DRY) {
          const { data: created, error } = await db.from('contacts').insert(insert).select('id').single()
          if (error) throw new Error(`No se pudo crear el contacto ${email}: ${error.message}`)
          contactId = created.id
        }
        stats.contactosCreados++
        accion = 'contacto NUEVO en General, agendado'
      } else {
        accion = 'cancelada y sin contacto: no se crea nada'
      }

      row.contact_id = contactId
      if (!DRY) {
        const { error } = await db.from('calendly_scheduled_events').upsert(row, { onConflict: 'uri' })
        if (error) throw new Error(`No se pudo guardar la reserva ${ev.uri}: ${error.message}`)
      }

      // ---- Journey, sin duplicar ----
      if (contactId && status !== 'canceled') {
        const { data: already } = await db
          .from('contact_journey_events')
          .select('id')
          .eq('contact_id', contactId)
          .eq('type', 'call_booked')
          .contains('data', { calendly_uri: ev.uri })
          .maybeSingle()
        if (!already) {
          if (!DRY) {
            await db.from('contact_journey_events').insert({
              contact_id: contactId,
              type: 'call_booked',
              title: 'Agendó llamada (Calendly)',
              data: { source: 'calendly', calendly_uri: ev.uri, start_time: ev.start_time, synced_from: 'backfill' },
            })
          }
          stats.journey++
        }
      }

      console.log(`  - ${ev.start_time.slice(0, 16)}  ${status.padEnd(8)}  ${(inv.name ?? '').padEnd(24).slice(0, 24)} ${email.padEnd(34)} ${accion}`)
    }
  }

  console.log('\n  Resumen')
  console.log(`    reservas vistas      ${stats.eventos}`)
  console.log(`    guardadas nuevas     ${stats.nuevos}`)
  console.log(`    ya existian          ${stats.actualizados}`)
  console.log(`    contactos creados    ${stats.contactosCreados}`)
  console.log(`    contactos movidos    ${stats.contactosMovidos}`)
  console.log(`    eventos de historial ${stats.journey}`)
  console.log(`    solo historial       ${stats.soloHistorial}  (otra agenda o llamada vieja)`)
  console.log(`    sin email            ${stats.saltados}`)
  console.log(DRY ? '\n  No se escribio nada (modo prueba).\n' : '\n  Hecho. Cero correos y cero notificaciones enviadas.\n')
}

main().catch((e) => {
  console.error('\n  FALLO:', e.message, '\n')
  process.exit(1)
})
