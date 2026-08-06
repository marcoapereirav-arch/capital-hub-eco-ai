#!/usr/bin/env node
/**
 * CANDADO DE LAYOUT del OS.
 *
 * Regla: toda pantalla del OS que pinta <ShellHeader> tiene que pintar también
 * <PageContainer>. Sin él, el contenido no tiene ancho máximo ni márgenes estándar y se
 * pega a los bordes de la aplicación en pantallas anchas.
 *
 * Por qué existe este archivo: ese bug se arregló a mano varias veces (mayo, junio,
 * julio de 2026) y volvió cada vez, porque no había nada que lo impidiera y la mayoría
 * de las pantallas viejas son el mal ejemplo que se copia. Marco, 31-jul-2026: "ya estoy
 * un poco cansado de repetir esto, ¿cómo puedes hacer para que esto nunca ocurra?".
 *
 * Corre en `predev` y en `prebuild`: si una pantalla NUEVA rompe la regla, ni arranca
 * en local ni se despliega.
 *
 * DEUDA CONOCIDA: las pantallas de abajo ya estaban rotas antes del candado. Están
 * listadas a propósito, a la vista, para que se arreglen cuando se toque cada una. NO
 * añadir nada nuevo a esta lista: si tu pantalla falla, ponle <PageContainer>.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
const SCAN = ["src/app", "src/features"]

const DEUDA_CONOCIDA = new Set([
  // Resueltas el 2026-08-06 al rehacer el CRM (no volver a anadirlas):
  //   src/app/(main)/crm/tags/page.tsx       -> ya usa <PageContainer>
  //   src/features/crm/components/crm-tabs-header.tsx -> ya no pinta <ShellHeader>
  "src/app/(main)/dashboard/page.tsx",
  "src/app/(main)/instagram/page.tsx",
  "src/app/(main)/integrations/page.tsx",
  "src/app/(main)/invitaciones/page.tsx",
  "src/app/(main)/manychat/page.tsx",
  "src/app/(main)/mision/page.tsx",
  "src/features/board/components/board-page.tsx",
  "src/features/content-intel/components/content-intel-page.tsx",
  "src/features/crm/components/crm-page.tsx",
  "src/features/webs/components/webs-page.tsx",
])

/** Quita comentarios para no confundir una mención en la documentación con JSX real. */
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
    } else if (e.endsWith(".tsx")) {
      out.push(p)
    }
  }
  return out
}

const rotas = []
const deudaResuelta = []

for (const base of SCAN) {
  for (const file of walk(join(ROOT, base))) {
    const rel = relative(ROOT, file)
    const code = stripComments(readFileSync(file, "utf8"))

    if (!/<ShellHeader[\s/>]/.test(code)) continue
    const tienePageContainer = /<PageContainer[\s/>]/.test(code)

    if (!tienePageContainer && !DEUDA_CONOCIDA.has(rel)) rotas.push(rel)
    if (tienePageContainer && DEUDA_CONOCIDA.has(rel)) deudaResuelta.push(rel)
  }
}

if (deudaResuelta.length) {
  console.log("\n  Deuda de layout resuelta. Quita estas líneas de DEUDA_CONOCIDA en scripts/check-layout.mjs:")
  for (const f of deudaResuelta) console.log(`    ${f}`)
  console.log("")
}

if (rotas.length) {
  console.error("\n\x1b[31m  CANDADO DE LAYOUT: pantalla sin <PageContainer>\x1b[0m\n")
  for (const f of rotas) console.error(`    ${f}`)
  console.error(`
  Una pantalla del OS que pinta <ShellHeader> tiene que pintar también <PageContainer>.
  Sin él se pega a los bordes de la aplicación en pantallas anchas.

  Arreglo:

    import { PageContainer } from "@/components/ui/page-container"

    <ShellHeader title="..." />
    <PageContainer>
      ...el contenido...
    </PageContainer>

  Anchos: <PageContainer> normal · <PageContainer wide> para kanbans y gráficas
  · <PageContainer narrow> para lectura.

  Knowledge: docs/sops/producto/47-reglas-ui-contraste-legibilidad.md
`)
  process.exit(1)
}

console.log("  Layout OK: todas las pantallas nuevas respetan los márgenes del OS.")
