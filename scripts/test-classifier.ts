/**
 * Test del classifier con fixtures sintéticos.
 *
 * Uso:
 *   OPENROUTER_API_KEY=sk-... npx tsx scripts/test-classifier.ts
 *
 * Valida que:
 *   - Ejemplo 1 (sales_discovery con 2 team + 1 externo) → scope=external, tipo=sales_*
 *   - Ejemplo 2 (daily con 4 team) → scope=internal, tipo=team_daily
 *   - Ejemplo 3 (partner) → scope=external, tipo=partner
 *
 * NO hace llamadas a Fathom; usa NormalizedMeeting fabricadas en memoria.
 */

import { classifyMeeting } from '../src/features/meetings/services/classifier'
import type { NormalizedMeeting } from '../src/features/meetings/types/fathom'

const TEAM = ['Marco', 'Adrián', 'JP', 'Álex', 'Patrick', 'Steven']

function fixtureSalesDiscovery(): NormalizedMeeting {
  return {
    recording_id: 1001,
    title: 'Call con Ricky Gómez',
    started_at: '2026-04-19T16:30:00Z',
    ended_at: '2026-04-19T17:12:00Z',
    duration_seconds: 42 * 60,
    share_url: 'https://fathom.video/share/fixture-1001',
    recording_url: 'https://fathom.video/calls/1001',
    transcript_language: 'es',
    invitees_domain_hint: 'one_or_more_external',
    calendar_invitees: [
      { name: 'Ricky Gómez', email: 'ricky@gmail.com', is_external: true },
      { name: 'Adrián Villanueva', email: 'adrian@capitalhub.es', is_external: false },
    ],
    fathom_summary_text: null,
    fathom_action_items: [],
    transcript_lines: [],
    transcript_text: [
      '[00:00:08] Adrián: Hola Ricky, arranquemos. Cuéntame en qué punto estás.',
      '[00:00:22] Ricky: Llevo seis meses probando cursos de trading, no he facturado un duro.',
      '[00:02:45] Ricky: Necesito algo que me dé resultados medibles, no más promesas.',
      '[00:08:10] Adrián: Te explico el modelo: Media Buying para empresas que pagan por traerles leads.',
      '[00:20:30] Ricky: Me interesa. ¿Cómo arrancamos?',
      '[00:22:00] Adrián: Te paso el material y el lunes hacemos la segunda call para ajustar la propuesta.',
    ].join('\n'),
  }
}

function fixtureTeamDaily(): NormalizedMeeting {
  return {
    recording_id: 1002,
    title: 'Daily equipo Capital Hub',
    started_at: '2026-04-19T10:00:00Z',
    ended_at: '2026-04-19T10:28:00Z',
    duration_seconds: 28 * 60,
    share_url: 'https://fathom.video/share/fixture-1002',
    recording_url: 'https://fathom.video/calls/1002',
    transcript_language: 'es',
    invitees_domain_hint: 'only_internal',
    calendar_invitees: [
      { name: 'Marco Antonio', email: 'marco@capitalhub.es', is_external: false },
      { name: 'Adrián Villanueva', email: 'adrian@capitalhub.es', is_external: false },
      { name: 'JP', email: 'jp@capitalhub.es', is_external: false },
      { name: 'Álex', email: 'alex@capitalhub.es', is_external: false },
    ],
    fathom_summary_text: null,
    fathom_action_items: [],
    transcript_lines: [],
    transcript_text: [
      '[00:00:05] Adrián: Arrancamos. 1000€ en ads, cerramos una de 2990€ pero fue tráfico caliente.',
      '[00:03:10] Marco: La caída del VSL está en el primer minuto. Solo 2 de 87 llegan al final.',
      '[00:12:20] JP: Hago hoy el Google Doc con guiones de VSL y ads.',
      '[00:18:40] Adrián: Regrabo el VSL mañana, 3-4 minutos, directo al grano.',
      '[00:22:00] Marco: No escalamos adspend hasta cerrar una venta en frío.',
      '[00:26:30] Álex: Los roles de Discord ya desplegados.',
    ].join('\n'),
  }
}

function fixturePartner(): NormalizedMeeting {
  return {
    recording_id: 1003,
    title: 'Reunión con agencia de vídeo',
    started_at: '2026-04-19T12:00:00Z',
    ended_at: '2026-04-19T12:35:00Z',
    duration_seconds: 35 * 60,
    share_url: 'https://fathom.video/share/fixture-1003',
    recording_url: 'https://fathom.video/calls/1003',
    transcript_language: 'es',
    invitees_domain_hint: 'one_or_more_external',
    calendar_invitees: [
      { name: 'Adrián Villanueva', email: 'adrian@capitalhub.es', is_external: false },
      { name: 'Marco Antonio', email: 'marco@capitalhub.es', is_external: false },
      { name: 'Laura Ibáñez', email: 'laura@videoagency.es', is_external: true },
    ],
    fathom_summary_text: null,
    fathom_action_items: [],
    transcript_lines: [],
    transcript_text: [
      '[00:01:00] Laura: Os propongo tres formatos para el próximo sprint: A más cinematográfico, B más directo, C tipo entrevista.',
      '[00:15:00] Adrián: El B nos encaja más, va directo al punto.',
      '[00:18:00] Marco: De acuerdo con Adrián, vamos con el B.',
      '[00:25:00] Laura: Os mando el presupuesto detallado mañana.',
      '[00:28:00] Adrián: Perfecto, lo revisamos y cerramos el viernes.',
    ].join('\n'),
  }
}

interface TestCase {
  name: string
  fixture: NormalizedMeeting
  expected: {
    scope: 'external' | 'internal'
    tipoStartsWith?: string
    tipoEq?: string
  }
}

const TESTS: TestCase[] = [
  {
    name: 'sales_discovery (1 externo + 1 team)',
    fixture: fixtureSalesDiscovery(),
    expected: { scope: 'external', tipoStartsWith: 'sales_' },
  },
  {
    name: 'team_daily (4 team, contenido operativo)',
    fixture: fixtureTeamDaily(),
    expected: { scope: 'internal', tipoEq: 'team_daily' },
  },
  {
    name: 'partner (2 team + 1 externo, agencia)',
    fixture: fixturePartner(),
    expected: { scope: 'external', tipoEq: 'partner' },
  },
]

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('✗ OPENROUTER_API_KEY no está en el entorno')
    process.exit(1)
  }

  let passed = 0
  let failed = 0

  for (const t of TESTS) {
    process.stdout.write(`\n▶ ${t.name}\n`)
    try {
      const result = await classifyMeeting({
        meeting: t.fixture,
        teamMemberNames: TEAM,
      })

      const scopeOk = result.scope === t.expected.scope
      const tipoOk = t.expected.tipoEq
        ? result.tipo === t.expected.tipoEq
        : t.expected.tipoStartsWith
          ? result.tipo.startsWith(t.expected.tipoStartsWith)
          : true

      const markOk = (v: boolean) => (v ? '✓' : '✗')
      console.log(`  ${markOk(scopeOk)} scope=${result.scope} (esperado ${t.expected.scope})`)
      console.log(
        `  ${markOk(tipoOk)} tipo=${result.tipo} (esperado ${t.expected.tipoEq ?? t.expected.tipoStartsWith + '*'})`,
      )
      console.log(`  · resultado=${result.resultado}, funnel_stage=${result.funnel_stage}`)
      console.log(`  · participants=${result.participants.length}`)
      console.log(`  · resumen: ${result.resumen.slice(0, 120)}...`)

      if (scopeOk && tipoOk) passed++
      else {
        failed++
        console.log(`  FULL RESULT: ${JSON.stringify(result, null, 2)}`)
      }
    } catch (err) {
      failed++
      console.error(`  ✗ ERROR:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\n=== ${passed}/${TESTS.length} passed ===`)
  process.exit(failed === 0 ? 0 : 1)
}

main()
