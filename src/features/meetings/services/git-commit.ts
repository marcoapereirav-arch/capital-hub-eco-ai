import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { projectRoot } from '../lib/paths'

const exec = promisify(execFile)

export interface GitCommitResult {
  commitSha: string | null
  stdout: string
  stderr: string
  status: 'committed' | 'nothing_to_commit' | 'failed'
  error?: string
}

/**
 * Stage docs/ y commitea con mensaje. Idempotente:
 * - Si no hay cambios → status='nothing_to_commit' sin error.
 * - Si falla → status='failed' con error. No throw.
 * NO usa shell concat (execFile con args array).
 * NO pasa --no-verify ni --no-gpg-sign.
 */
export async function gitCommitDocs(
  message: string,
  paths: string[] = ['docs/'],
): Promise<GitCommitResult> {
  const cwd = projectRoot()
  try {
    await exec('git', ['add', ...paths], { cwd })
  } catch (err) {
    return errResult('git add failed', err)
  }

  // Check if there's anything staged
  try {
    const { stdout } = await exec('git', ['diff', '--cached', '--name-only'], { cwd })
    if (!stdout.trim()) {
      return {
        commitSha: null,
        stdout: '',
        stderr: '',
        status: 'nothing_to_commit',
      }
    }
  } catch (err) {
    return errResult('git diff --cached failed', err)
  }

  try {
    const { stdout, stderr } = await exec(
      'git',
      ['commit', '-m', message],
      { cwd },
    )
    const { stdout: shaOut } = await exec('git', ['rev-parse', 'HEAD'], { cwd })
    return {
      commitSha: shaOut.trim(),
      stdout,
      stderr,
      status: 'committed',
    }
  } catch (err) {
    return errResult('git commit failed', err)
  }
}

function errResult(context: string, err: unknown): GitCommitResult {
  const message = err instanceof Error ? err.message : String(err)
  const stderr =
    typeof err === 'object' && err && 'stderr' in err ? String((err as { stderr: unknown }).stderr) : ''
  return {
    commitSha: null,
    stdout: '',
    stderr,
    status: 'failed',
    error: `${context}: ${message}`,
  }
}
