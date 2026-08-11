#!/usr/bin/env node
/**
 * EL CANDADO DE AFILIADOS.
 *
 * Marco (2026-08-07): "tienes terminantemente prohibido ponerlo solo a test de
 * personalidad... si yo creo diez, tengo que tener la opcion de seleccionar el funnel que
 * quiera, y tu tienes que anadirlo".
 *
 * Una regla escrita en un documento no se cumple sola. Esto la ejecuta. Comprueba tres
 * cosas, y si alguna falla, la construccion se para:
 *
 *   1. La lista de funnels que se puede enlazar SALE del catalogo unico del OS.
 *      Si alguien la escribe a mano, el dia que se cree un funnel nuevo no aparecera.
 *
 *   2. Todo funnel que recoge leads del publico pasa por la pieza unica de atribucion.
 *      Sin esto, un funnel nuevo nace sin saber quien trajo al lead, y falla EN SILENCIO:
 *      el lead se guarda igual, solo que sin fuente, y el afiliado se queda sin su lead.
 *      Ya paso: de cinco funnels, tres no guardaban nada.
 *
 *   3. Nadie construye un link de afiliado por su cuenta. Se hace en un solo sitio,
 *      `construirLinkDeAfiliado`, que es quien sabe el dominio publico correcto.
 *
 * Se engancha a `prebuild`, igual que los otros candados del proyecto.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = process.cwd()
const SRC = join(RAIZ, 'src')

const MODULO_FUNNELS = join(SRC, 'lib', 'afiliados', 'funnels.ts')
const MODULO_ATRIBUCION = join(SRC, 'lib', 'atribucion', 'atribucion.ts')
const CARPETA_OPTINS = join(SRC, 'app', 'api', 'optin')

/** Archivos a los que SI se les permite construir el link (son los duenos de esa logica). */
const PUEDEN_CONSTRUIR_LINK = new Set([
  relative(RAIZ, MODULO_FUNNELS),
  join('src', 'lib', 'utm', 'utm-capture.ts'),
  join('src', 'lib', 'utm', 'UtmCapture.tsx'),
])

const fallos = []

function archivosDe(carpeta, extensiones = ['.ts', '.tsx']) {
  if (!existsSync(carpeta)) return []
  const salida = []
  for (const entrada of readdirSync(carpeta)) {
    if (entrada === 'node_modules' || entrada.startsWith('.')) continue
    const ruta = join(carpeta, entrada)
    if (statSync(ruta).isDirectory()) salida.push(...archivosDe(ruta, extensiones))
    else if (extensiones.some((e) => entrada.endsWith(e))) salida.push(ruta)
  }
  return salida
}

/* ── 1 · la lista de funnels sale del catalogo ───────────────────────── */

if (!existsSync(MODULO_FUNNELS)) {
  fallos.push(
    'Falta src/lib/afiliados/funnels.ts.\n' +
      '   Es el unico sitio que decide a que funnels puede apuntar un link de afiliado.'
  )
} else {
  const texto = readFileSync(MODULO_FUNNELS, 'utf8')
  if (!texto.includes('FUNNEL_CATALOG')) {
    fallos.push(
      'src/lib/afiliados/funnels.ts ya no lee FUNNEL_CATALOG.\n' +
        '   La lista de funnels tiene que salir del catalogo unico del OS, no escribirse a\n' +
        '   mano: si se escribe a mano, un funnel nuevo NO aparecera en Afiliados.'
    )
  }
}

/* ── 2 · todo opt-in publico pasa por la atribucion ──────────────────── */

if (!existsSync(MODULO_ATRIBUCION)) {
  fallos.push('Falta src/lib/atribucion/atribucion.ts, la pieza unica de atribucion.')
}

for (const ruta of archivosDe(CARPETA_OPTINS)) {
  if (!ruta.endsWith('route.ts')) continue
  const texto = readFileSync(ruta, 'utf8')
  if (!texto.includes('@/lib/atribucion/atribucion')) {
    fallos.push(
      `${relative(RAIZ, ruta)} recoge leads y NO usa la pieza unica de atribucion.\n` +
        '   Anade: import { camposAtribucionNuevo, camposAtribucionExistente,\n' +
        '           etiquetarAtribucion, normalizarFuente } from "@/lib/atribucion/atribucion"\n' +
        '   Sin eso el lead se guarda sin saber quien lo trajo, y no falla: solo desaparece\n' +
        '   de los numeros de Afiliados.'
    )
  }
}

/* ── 3 · el link se construye en un solo sitio ───────────────────────── */

/** Quita comentarios: una explicacion que menciona utm_source no construye ningun link. */
function sinComentarios(texto) {
  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
}

// Las dos formas reales de construir el link: interpolar el slug en una plantilla, o
// ponerlo con la API de URL. Cualquiera de las dos, fuera de su sitio, es el fallo.
const CONSTRUYE_LINK = [/utm_source=\$\{/, /searchParams\.set\(\s*["'`]utm_source["'`]/]

for (const ruta of archivosDe(SRC)) {
  const rel = relative(RAIZ, ruta)
  if (PUEDEN_CONSTRUIR_LINK.has(rel)) continue
  const texto = sinComentarios(readFileSync(ruta, 'utf8'))
  if (CONSTRUYE_LINK.some((p) => p.test(texto))) {
    fallos.push(
      `${rel} construye un link con utm_source por su cuenta.\n` +
        '   Usa construirLinkDeAfiliado() de "@/lib/afiliados/funnels": es quien sabe el\n' +
        '   dominio publico correcto (ch.capitalhubapp.com, no el del OS) y el funnel elegido.'
    )
  }
}

/* ── resultado ───────────────────────────────────────────────────────── */

if (fallos.length) {
  console.error('\n\x1b[31mCANDADO DE AFILIADOS: ' + fallos.length + ' problema(s)\x1b[0m\n')
  for (const f of fallos) console.error('  · ' + f + '\n')
  console.error('Sin esto, un funnel nuevo nace sin atribucion y nadie se entera.\n')
  process.exit(1)
}

console.log('\x1b[32m✓ Afiliados:\x1b[0m la lista de funnels sale del catalogo, los opt-in atribuyen y el link se construye en un solo sitio.')
