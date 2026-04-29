import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { AVATAR_PATH, BRAND_PLAYBOOK_PATH } from '../constants'
import { ContentIntelError } from '../lib/errors'

export interface BrandContext {
  playbook: { text: string; hash: string }
  avatar: { text: string; hash: string }
}

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

async function readRepoFile(relativePath: string): Promise<string> {
  const fullPath = path.join(process.cwd(), relativePath)
  try {
    return await fs.readFile(fullPath, 'utf8')
  } catch (err) {
    throw new ContentIntelError(
      'brand_context_read_failed',
      `No se pudo leer ${relativePath}. Verifica que exista en el repo.`,
      err,
    )
  }
}

/**
 * Lee fresco los docs de brand y avatar en cada generación.
 * Si el usuario edita esos archivos, el próximo guion usa la nueva versión sin redeploy.
 * El texto completo se guarda embebido en ci_scripts para reproducibilidad 100%.
 */
export async function loadBrandContext(): Promise<BrandContext> {
  const [playbookText, avatarText] = await Promise.all([
    readRepoFile(BRAND_PLAYBOOK_PATH),
    readRepoFile(AVATAR_PATH),
  ])

  return {
    playbook: { text: playbookText, hash: sha256(playbookText) },
    avatar: { text: avatarText, hash: sha256(avatarText) },
  }
}
