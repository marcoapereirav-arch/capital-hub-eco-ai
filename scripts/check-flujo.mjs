#!/usr/bin/env node
/**
 * check:flujo — vigilante de EL WORKFLOW (dev → rama → dev → main).
 *
 * POR QUE EXISTE
 * El 2026-07-25 se escribio en AGENTS.md una linea: "toda rama de feature/fix
 * nace de `dev`". Nadie construyo la pieza que la ejecuta: el skill /publicar
 * unia la rama directo a `main` y no nombraba `dev` ni una vez. Resultado:
 * `dev` nacio ese dia y no recibio NADA en un mes entero. El primer commit
 * que le faltaba era, literalmente, la regla que la creo.
 *
 * Y ademas, los 4 sitios que explican como se trabaja decian cosas distintas:
 * los manuales del Eter enseñaban 4 sitios SIN `dev`, y GitFlow_Explicado.md
 * afirmaba que produccion se despliega con `vercel --prod` (falso desde el
 * 2026-07-25).
 *
 * La leccion: una regla escrita en un documento no se ejecuta sola.
 * Este script es la maquina que la vigila.
 *
 * QUE COMPRUEBA
 *   1. `dev` no se ha quedado atras de `main`.
 *   2. Los skills del flujo (/publicar, /cerrar, /primer) nombran `dev`.
 *   3. Los documentos que explican el flujo dicen todos lo mismo.
 *   4. Nadie ha vuelto a colar afirmaciones ya derogadas.
 *
 * Enganchado a `prebuild`. Si falla, el despliegue no sale.
 */

import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'

const RAIZ = process.cwd()
const problemas = []

const leer = (p) => (existsSync(join(RAIZ, p)) ? readFileSync(join(RAIZ, p), 'utf8') : null)
const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

/* 1 · dev no puede quedarse atras de main ------------------------------- */

const avisos = []
const hayDev = git('rev-parse --verify dev') !== null
if (hayDev) {
  const atras = git('rev-list --count dev..main')
  if (atras && Number(atras) > 0) {
    problemas.push(
      `\`dev\` esta ${atras} commit(s) por detras de \`main\`.\n` +
        `   Toda rama nueva nace de \`dev\`: si esta atrasada, nace de una foto vieja.\n` +
        `   Arreglo: git checkout dev && git merge main --ff-only && git checkout -`
    )
  }
} else if (git('rev-parse --verify HEAD') !== null) {
  // Proyecto recien clonado: todavia no tiene `dev`. Se avisa, NO se bloquea:
  // tumbar el primer build de alguien que acaba de empezar es un estorbo.
  avisos.push(
    `Todavia no existe la rama \`dev\`, y EL WORKFLOW la necesita (dev → rama → dev → main).\n` +
      `   Crearla es un segundo:  git branch dev main`
  )
}

/* 1-bis · carpetas de chat huerfanas ------------------------------------ */

// Un chat = una rama = una carpeta. Si un chat se cerro mal, su carpeta se
// queda ahi. No es un error (no se pierde nada), pero hay que recogerla.
const wtSalida = git('worktree list --porcelain') || ''
const worktrees = []
{
  let actual = {}
  for (const l of wtSalida.split('\n')) {
    if (l.startsWith('worktree ')) actual = { ruta: l.slice(9) }
    else if (l.startsWith('branch ')) {
      actual.rama = l.slice(7).replace('refs/heads/', '')
      worktrees.push(actual)
    } else if (l === '') actual = {}
  }
}
const chats = worktrees.slice(1).filter((w) => w.rama && !['dev', 'main'].includes(w.rama))
const huerfanas = chats.filter((w) => {
  const pendiente = git(`log --oneline dev..${w.rama}`)
  return pendiente === '' // su trabajo ya esta en dev → se puede recoger
})
if (huerfanas.length > 0) {
  avisos.push(
    `Hay ${huerfanas.length} carpeta(s) de chat ya publicadas sin recoger:\n` +
      huerfanas.map((w) => `      - ${w.ruta}  (${w.rama})`).join('\n') +
      `\n   Recogerlas:  npm run chat:cerrar -- --limpiar`
  )
}

/* 2 · los skills del flujo tienen que nombrar dev ------------------------ */

const SKILLS = ['publicar', 'cerrar', 'primer']
for (const s of SKILLS) {
  const t = leer(`.claude/skills/${s}/SKILL.md`)
  if (t === null) continue // el skill puede no existir en un proyecto concreto
  const menciones = (t.match(/\bdev\b/g) || []).length
  if (menciones < 3) {
    problemas.push(
      `El skill \`/${s}\` casi no nombra \`dev\` (${menciones} veces).\n` +
        `   Es la maquina que ejecuta el flujo: si no lo nombra, no lo hace.\n` +
        `   Fue exactamente el fallo del 2026-07-25 (/publicar unia la rama directo a main).`
    )
  }
}

/* 3 · los documentos del flujo dicen todos lo mismo ---------------------- */

// Solo las reglas y los .md del Entrenamiento del Eter (los 3 productos que
// explican como se trabaja) + GitFlow_Explicado. Los manuales viejos de Vibe
// Coding (`Manual_VibeCoding_*`, `Manual_Git_NVISION`) NO entran: el pack del
// Eter los reemplazo y no son la fuente de nada.
const DOCS = ['AGENTS.md']
for (const d of DOCS) {
  const t = leer(d)
  if (t === null) continue
  if (!/\bdev\b/.test(t)) {
    problemas.push(
      `\`${d}\` explica como se trabaja pero NO menciona \`dev\`.\n` +
        `   Todos los documentos del flujo tienen que decir lo mismo: dev → rama → dev → main.`
    )
  }
}

/* 4 · afirmaciones ya derogadas ----------------------------------------- */

const DEROGADO = [
  { patron: /vercel --prod/i, que: 'produccion NO se despliega con `vercel --prod` (derogado el 2026-07-25: se publica subiendo a `main`)' },
  { patron: /directo a `?main`?/i, que: 'nada va directo a `main`: siempre pasa por `dev`' },
]
for (const d of DOCS) {
  const t = leer(d)
  if (t === null) continue
  for (const { patron, que } of DEROGADO) {
    // se permite si va acompañado de PROHIBIDO / NUNCA / derogad* en la misma linea
    const lineas = t.split('\n').filter((l) => patron.test(l) && !/PROHIBID|NUNCA|derogad|Prohibido|jamas|jamás/i.test(l))
    if (lineas.length) {
      problemas.push(`\`${d}\` dice algo ya derogado: ${que}\n   Linea: "${lineas[0].trim().slice(0, 110)}"`)
    }
  }
}

/* ----------------------------------------------------------------------- */

if (problemas.length > 0) {
  console.error('\n\x1b[31m✗ check:flujo — EL WORKFLOW no se esta cumpliendo\x1b[0m\n')
  problemas.forEach((p, i) => console.error(`   ${i + 1}. ${p}\n`))
  console.error(
    '   EL WORKFLOW: dev → rama → dev → main → la web.\n' +
      '   Fuente: la regla de fabrica `EL WORKFLOW` en AGENTS.md.\n'
  )
  process.exit(1)
}

if (avisos.length > 0) {
  console.warn('\n\x1b[33m! check:flujo — aviso\x1b[0m\n')
  avisos.forEach((a) => console.warn(`   ${a}\n`))
}

console.log('✓ check:flujo — skills y documentos coherentes con EL WORKFLOW.')
