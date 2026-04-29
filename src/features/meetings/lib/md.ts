import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { absPath, assertWriteAllowed } from './paths'

export type Frontmatter = Record<string, unknown>

export function composeMarkdown(frontmatter: Frontmatter, body: string): string {
  return matter.stringify(body, frontmatter)
}

function hashBody(body: string): string {
  return createHash('sha256').update(body).digest('hex')
}

export interface WriteResult {
  relativePath: string
  absolutePath: string
  changed: boolean
}

/**
 * Escribe un .md si el contenido difiere del existente.
 * Bloquea escrituras a docs/Manual_Proyecto_Capital_Hub.md.
 */
export async function writeMarkdownIfChanged(
  relativePath: string,
  content: string,
): Promise<WriteResult> {
  assertWriteAllowed(relativePath)

  const abs = absPath(relativePath)
  await fs.mkdir(path.dirname(abs), { recursive: true })

  const newHash = hashBody(content)

  let existingHash: string | null = null
  try {
    const prev = await fs.readFile(abs, 'utf8')
    existingHash = hashBody(prev)
  } catch {
    // File doesn't exist; fall through to write.
  }

  if (existingHash === newHash) {
    return { relativePath, absolutePath: abs, changed: false }
  }

  await fs.writeFile(abs, content, 'utf8')
  return { relativePath, absolutePath: abs, changed: true }
}

/**
 * Append idempotente: si la línea ya está en el archivo, no añade.
 * Usado para logs commercial/operational.
 */
export async function appendLineIfAbsent(
  relativePath: string,
  line: string,
): Promise<WriteResult> {
  assertWriteAllowed(relativePath)

  const abs = absPath(relativePath)
  await fs.mkdir(path.dirname(abs), { recursive: true })

  let existing = ''
  try {
    existing = await fs.readFile(abs, 'utf8')
  } catch {
    existing = ''
  }

  if (existing.includes(line.trim())) {
    return { relativePath, absolutePath: abs, changed: false }
  }

  const sep = existing.endsWith('\n') || existing === '' ? '' : '\n'
  const next = existing + sep + line + (line.endsWith('\n') ? '' : '\n')
  await fs.writeFile(abs, next, 'utf8')
  return { relativePath, absolutePath: abs, changed: true }
}

export async function fileExists(relativePath: string): Promise<boolean> {
  try {
    await fs.stat(absPath(relativePath))
    return true
  } catch {
    return false
  }
}

export async function readFileSafe(relativePath: string): Promise<string | null> {
  try {
    return await fs.readFile(absPath(relativePath), 'utf8')
  } catch {
    return null
  }
}
