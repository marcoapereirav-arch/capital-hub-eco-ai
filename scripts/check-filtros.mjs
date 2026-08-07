#!/usr/bin/env node
/**
 * CANDADO DEL FILTRO DE FECHAS.
 *
 * Regla: el OS tiene UN solo filtro de fechas, `<PeriodFilter>`
 * (`src/components/ui/period-filter.tsx`). Ninguna pantalla se fabrica el suyo.
 *
 * Por qué existe: la pestaña Campañas de Ads tenía siete botones propios (Hoy, Ayer,
 * 7 días, 14 días, 30 días, Este mes, Mes pasado) con periodos que NO coincidían con los
 * del resto del OS. Consecuencia real: "este mes" daba un número en el dashboard principal
 * y otro distinto en Ads, y no había forma de saber cuál era el bueno.
 *
 * Marco, 2026-08-07: "hay un filtro madre que siempre tiene que estar en todos los lugares
 * en los que haya que poner fecha... debes de anclarlo en un skill o debe estar claro que
 * siempre, siempre, siempre se debe utilizar el mismo patrón".
 *
 * Lo que detecta: listas de periodos escritas a mano. Se reconocen porque juntan varias
 * etiquetas de tiempo ("Hoy", "7 días", "Este mes"...) en el mismo archivo sin importar
 * PeriodFilter.
 *
 * Corre en `predev` y en `prebuild`: una pantalla nueva con su propio filtro ni arranca
 * en local ni se despliega.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
const SCAN = ["src/app", "src/features"]

/** El filtro oficial y las pantallas que legítimamente definen periodos. */
const PERMITIDOS = new Set([
  "src/components/ui/period-filter.tsx",
])

/**
 * Pantallas que hoy tienen periodos propios por un motivo real (no son filtros de fecha
 * de un panel, sino selectores de otra cosa). Si añades algo aquí, explica por qué.
 */
const EXCEPCIONES = new Set([
  // Calendario: define franjas horarias y días de disponibilidad, no un rango de informe.
  "src/features/calendario/components/calendario-admin.tsx",
  // Operaciones: sus etiquetas agrupan TAREAS por vencimiento, no filtran un periodo.
  // Además la pantalla se está retirando en otro chat (Marco, 2026-08-07). Cuando
  // desaparezca, esta línea se puede borrar.
  "src/features/operaciones-dashboard/components/operaciones-dashboard.tsx",
])

const ETIQUETAS = [
  /"Hoy"/, /'Hoy'/,
  /"Ayer"/, /'Ayer'/,
  /"Esta semana"/, /'Esta semana'/,
  /"Este mes"/, /'Este mes'/,
  /"Mes pasado"/, /'Mes pasado'/,
  /"Este año"/, /'Este año'/,
  /\b(7|14|15|30|60|90) días\b/,
  /last_7d|last_14d|last_30d|last_month|this_month|date_preset/,
]

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
}

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const e of entries) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) {
      if (e === "node_modules" || e === ".next") continue
      walk(p, out)
    } else if (e.endsWith(".tsx") || e.endsWith(".ts")) {
      out.push(p)
    }
  }
  return out
}

const culpables = []

for (const base of SCAN) {
  for (const file of walk(join(ROOT, base))) {
    const rel = relative(ROOT, file)
    if (PERMITIDOS.has(rel) || EXCEPCIONES.has(rel)) continue

    const code = stripComments(readFileSync(file, "utf8"))
    if (/PeriodFilter/.test(code)) continue // usa el oficial: correcto

    const golpes = ETIQUETAS.filter((re) => re.test(code)).length
    // Dos o más etiquetas de periodo juntas y sin PeriodFilter = filtro casero.
    if (golpes >= 2) culpables.push({ rel, golpes })
  }
}

if (culpables.length) {
  console.error("\n\x1b[31m  CANDADO DEL FILTRO DE FECHAS: pantalla con periodos propios\x1b[0m\n")
  for (const c of culpables) console.error(`    ${c.rel}`)
  console.error(`
  El OS tiene UN solo filtro de fechas y todas las pantallas usan ese. Dos filtros
  distintos significan que el mismo "este mes" da números distintos según dónde mires.

  Arreglo:

    import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"

    const [rango, setRango] = useState<PeriodRange | null>(null)

    <PeriodFilter value={rango ?? undefined} onChange={setRango} defaultPreset="30d" />

  Y todo lo de la pantalla (números, gráficos, tablas) lee de ese mismo rango.

  Si tu caso de verdad no es un filtro de informe, añádelo a EXCEPCIONES en
  scripts/check-filtros.mjs explicando por qué.

  Knowledge: docs/sops/producto/58-filtro-fechas-unico.md
`)
  process.exit(1)
}

console.log("  Filtros OK: todas las pantallas usan el filtro de fechas del OS.")
