#!/usr/bin/env node
/**
 * VIGILANTE · prohibido escribir a mano la lista de productos que se venden.
 *
 * POR QUE EXISTE (2026-08-18):
 * La lista vivia escrita a mano en el endpoint de registrar venta:
 *   const PRODUCTS = ["IA Integrator", "Media Buyer Digital", "Comercial Closing"]
 * El 2026-07-30 Clipper sustituyo a Media Buyer en el catalogo, pero nadie
 * toco esa linea. Durante 19 dias Clipper NO SE PODIA VENDER, y quien comprara
 * "Media Buyer Digital" entraba a la App y veia la formacion VACIA sin ningun
 * error. No salto ninguna alarma porque no habia ninguna.
 *
 * Esta es la alarma. El catalogo real (tabla `routes`) es la unica fuente.
 */

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const C = { rojo: '\x1b[31m', verde: '\x1b[32m', gris: '\x1b[90m', fin: '\x1b[0m' }

// Los nombres de producto reales. Si aparecen DENTRO de un array escrito a
// mano en el codigo, es una segunda lista que se va a desincronizar.
const NOMBRES = ['IA Integrator', 'Comercial Closing', 'Clipper', 'Media Buyer']

// Archivos donde SI puede aparecer el nombre (documentacion, el propio
// vigilante, y las migraciones, que son historia y no se re-ejecutan).
const EXENTOS = [
  /^docs\//,
  /^scripts\/check-productos\.mjs$/,
  /^supabase\/migrations\//,
  /^\.claude\//,
  /^STATE\.md$/,
]

let archivos = []
try {
  archivos = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
    .split('\n')
    .filter((f) => f && /\.(ts|tsx)$/.test(f))
} catch {
  process.exit(0) // sin git no hay nada que vigilar
}

const fallos = []

for (const archivo of archivos) {
  if (EXENTOS.some((r) => r.test(archivo))) continue
  let texto
  try {
    texto = readFileSync(archivo, 'utf8')
  } catch {
    continue
  }

  const lineas = texto.split('\n')
  lineas.forEach((linea, i) => {
    // Solo molesta si el nombre esta dentro de comillas Y en la misma linea hay
    // un corchete o una coma con otra comilla: la firma de una lista a mano.
    const enComillas = NOMBRES.some((n) => new RegExp(`["'\`]\\s*${n}`, 'i').test(linea))
    if (!enComillas) return
    if (/^\s*(\/\/|\*|\/\*)/.test(linea)) return // comentario: se permite
    const pareceLista = /\[|\]|,\s*["'`]/.test(linea)
    if (pareceLista) {
      fallos.push({ archivo, linea: i + 1, texto: linea.trim().slice(0, 90) })
    }
  })
}

if (fallos.length) {
  console.error(`\n${C.rojo}✗ Hay una lista de productos escrita a mano.${C.fin}\n`)
  for (const f of fallos) {
    console.error(`  ${f.archivo}:${f.linea}`)
    console.error(`    ${C.gris}${f.texto}${C.fin}`)
  }
  console.error(`\n  Los productos que se venden salen del CATALOGO, no de una lista aqui.`)
  console.error(`  Usa: import { getProductosVendibles } from "@/lib/catalogo/productos"\n`)
  console.error(`  ${C.gris}Esto existe porque una lista a mano dejo a Clipper sin poder venderse`)
  console.error(`  durante 19 dias, y a quien comprara Media Buyer con la pantalla vacia.${C.fin}\n`)
  process.exit(1)
}

console.log(`${C.verde}✓${C.fin} productos: ninguna lista escrita a mano ${C.gris}(${archivos.length} archivos)${C.fin}`)
