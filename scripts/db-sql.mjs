#!/usr/bin/env node
/**
 * Aplicar SQL a la base de datos real sin depender del MCP de Supabase.
 *
 * POR QUE EXISTE (2026-08-07)
 * Las migraciones se aplicaban a mano con el MCP de Supabase. Cuando ese MCP no esta
 * autorizado en la sesion (pasa en sesiones no interactivas y al abrir un chat nuevo),
 * el archivo de migracion se escribe pero NUNCA llega a la base de datos: el codigo
 * queda apuntando a columnas que no existen y el fallo aparece mucho despues, en
 * produccion. Con esto la migracion se aplica igual, siempre, desde el terminal.
 *
 * USO
 *   node scripts/db-sql.mjs supabase/migrations/20260807150000_lo_que_sea.sql
 *   node scripts/db-sql.mjs --query "select count(*) from public.contacts"
 *
 * Usa la Management API de Supabase con SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF,
 * que ya estan en .env.local. No pide nada por chat ni escribe credenciales en ningun
 * sitio.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from 'dotenv'

config({ path: '.env.local' })
config({ path: '.env' })

const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = process.env.SUPABASE_PROJECT_REF

if (!token || !ref) {
  console.error(
    'Faltan SUPABASE_ACCESS_TOKEN o SUPABASE_PROJECT_REF en .env.local.\n' +
      'Sin eso no hay forma de aplicar SQL desde aqui.'
  )
  process.exit(1)
}

const args = process.argv.slice(2)
let sql = ''

const iQuery = args.indexOf('--query')
if (iQuery >= 0) {
  sql = args[iQuery + 1] || ''
} else if (args[0]) {
  sql = readFileSync(resolve(args[0]), 'utf8')
}

if (!sql.trim()) {
  console.error('Uso: node scripts/db-sql.mjs <archivo.sql> | --query "<sql>"')
  process.exit(1)
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})

const texto = await res.text()

if (!res.ok) {
  console.error(`\nFALLO (${res.status}):\n${texto}\n`)
  process.exit(1)
}

try {
  const json = JSON.parse(texto)
  console.log(JSON.stringify(json, null, 1))
} catch {
  console.log(texto)
}
