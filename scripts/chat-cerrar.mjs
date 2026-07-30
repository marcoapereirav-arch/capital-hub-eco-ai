#!/usr/bin/env node
/**
 * npm run chat:cerrar [nombre]
 *
 * Cierra el sitio de trabajo de UN chat: borra su carpeta y su rama.
 * SE NIEGA si queda algo sin guardar o sin publicar. Nunca borra trabajo.
 *
 * Sin nombre, cierra el chat de la carpeta en la que estas.
 * Con `--limpiar`, ademas recoge las carpetas huerfanas (chats que se cerraron
 * mal y cuya rama ya esta publicada).
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, dirname, basename, resolve } from 'node:path'

const RAIZ = process.cwd()
const git = (cmd, cwd = RAIZ) =>
  execSync(`git ${cmd}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const gitSilencioso = (cmd, cwd = RAIZ) => {
  try {
    return git(cmd, cwd)
  } catch {
    return null
  }
}
const morir = (msg) => {
  console.error(`\n\x1b[31m✗ ${msg}\x1b[0m\n`)
  process.exit(1)
}

const args = process.argv.slice(2)
const limpiar = args.includes('--limpiar')
const nombreArg = args.filter((a) => !a.startsWith('--'))[0]

// Lista de carpetas de trabajo: [{ruta, rama}]
function worktrees() {
  const salida = gitSilencioso('worktree list --porcelain') || ''
  const out = []
  let actual = {}
  for (const l of salida.split('\n')) {
    if (l.startsWith('worktree ')) actual = { ruta: l.slice(9) }
    else if (l.startsWith('branch ')) {
      actual.rama = l.slice(7).replace('refs/heads/', '')
      out.push(actual)
    } else if (l === '') actual = {}
  }
  return out
}

const principal = worktrees()[0]?.ruta ?? RAIZ

/** Cierra una carpeta de chat. Devuelve true si la cerro. */
function cerrar({ ruta, rama }, { forzarComprobaciones = true } = {}) {
  const nom = basename(ruta)

  if (resolve(ruta) === resolve(principal)) {
    morir('Esa es la carpeta principal del proyecto. No se cierra.')
  }
  if (!rama || rama === 'dev' || rama === 'main') {
    morir(`La carpeta ${nom} tiene puesta \`${rama}\`. No es la rama de un chat.`)
  }

  if (forzarComprobaciones) {
    // 1 · nada sin guardar
    const sucio = gitSilencioso('status --porcelain', ruta)
    if (sucio) {
      morir(
        `El chat "${nom}" tiene ${sucio.split('\n').length} archivo(s) SIN GUARDAR.\n` +
          `   No se borra nada. Guarda o descarta primero.`
      )
    }
    // 2 · nada sin publicar
    const sinPublicar = gitSilencioso(`log --oneline dev..${rama}`, ruta)
    if (sinPublicar) {
      morir(
        `El chat "${nom}" tiene ${sinPublicar.split('\n').length} cambio(s) SIN PUBLICAR:\n` +
          sinPublicar
            .split('\n')
            .map((l) => `      ${l}`)
            .join('\n') +
          `\n   No se borra nada. Publica primero ("publicalo").`
      )
    }
  }

  git(`worktree remove "${ruta}" --force`)
  // `-d` compara con el HEAD actual, no con `dev`, y se niega aunque el trabajo
  // ya este publicado. Aqui ya se comprobo arriba que `dev..rama` esta vacio
  // (nada sin publicar), asi que borrarla es seguro.
  let borrada = gitSilencioso(`branch -d ${rama}`)
  if (!borrada) borrada = gitSilencioso(`branch -D ${rama}`)
  console.log(
    `  ✓ cerrado "${nom}" · carpeta y rama fuera${borrada ? '' : ' (la rama no se pudo borrar: revisala)'}`
  )
  return true
}

/* ── cerrar el que toque ────────────────────────────────────────────── */

const lista = worktrees().slice(1) // el [0] es la carpeta principal

if (limpiar) {
  gitSilencioso('worktree prune')
  const huerfanas = lista.filter(({ rama }) => {
    const pendiente = gitSilencioso(`log --oneline dev..${rama}`)
    return !pendiente // ya esta todo en dev → se puede recoger
  })
  if (!huerfanas.length) {
    console.log('\n✓ No hay carpetas de chat que recoger.\n')
    process.exit(0)
  }
  console.log('\n  Recogiendo carpetas de chats ya publicados:')
  huerfanas.forEach((w) => cerrar(w))
  console.log('')
  process.exit(0)
}

let objetivo
if (nombreArg) {
  objetivo = lista.find((w) => basename(w.ruta) === nombreArg || w.rama === `feature/${nombreArg}`)
  if (!objetivo) morir(`No encuentro el chat "${nombreArg}".\n   Abiertos: ${lista.map((w) => basename(w.ruta)).join(', ') || 'ninguno'}`)
} else {
  objetivo = lista.find((w) => resolve(w.ruta) === resolve(RAIZ))
  if (!objetivo) {
    morir(
      'No estas dentro de la carpeta de un chat.\n' +
        `   Abiertos: ${lista.map((w) => basename(w.ruta)).join(', ') || 'ninguno'}\n` +
        '   Usa: npm run chat:cerrar <nombre>'
    )
  }
}

console.log('')
cerrar(objetivo)
console.log('')
