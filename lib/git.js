/**
 * Read-only Git access for the notes Host half.
 *
 * Every call runs through `ctx.subprocess` (the composed subprocess runtime), in
 * the project root as cwd, with stdin closed and bounded output. Nothing here can
 * mutate a repository: only `status`, `diff`, `blame`, `rev-parse` and `init`.
 */

import { existsSync } from 'node:fs'
import { delimiter, join } from 'node:path'

import { parseBlamePorcelain, parsePorcelainStatus, blameAtLine, toFailure } from './pure.js'

/** Upper bound for any single Git invocation. */
export const GIT_MAX_BYTES = 4 * 1024 * 1024
export const GIT_GRACE_MS = 2_000
export const GIT_TIMEOUT_MS = 20_000

/** Resolved once per process; see `resolveGitBinary`. */
let resolvedGitBinary

/**
 * Absolute path of the `git` executable, in forward-slash form.
 *
 * Why this exists — two measured defects on this Windows host, both of which
 * silently swallow Git's output rather than failing loudly:
 *
 * 1. A *bare* program name (`spawn('git', ...)`) loses stdout entirely:
 *    `{code: 0, stdout: '', stderr: ''}` for `--version`, and
 *    `fatal: write failure on 'stdout': Bad file descriptor` with exit 128 for
 *    `log` / `commit`, while `status` / `diff` / `blame` "succeed" with zero
 *    bytes. The same binary invoked by absolute path prints normally.
 * 2. A *backslash* absolute path (`C:\Program Files\Git\cmd\git.exe`) fails the
 *    same way, while the identical path with forward slashes
 *    (`C:/Program Files/Git/cmd/git.exe`) works.
 *
 * So the resolved path is returned with `/` separators on every platform, which
 * is also valid input for POSIX. `DSH_GIT_BINARY` overrides the search when a
 * deployment ships Git somewhere else.
 */
export function resolveGitBinary() {
  if (resolvedGitBinary !== undefined) return resolvedGitBinary
  const portable = (value) => value.replace(/\\/g, '/')
  const override = process.env.DSH_GIT_BINARY
  if (override !== undefined && override !== '') {
    resolvedGitBinary = portable(override)
    return resolvedGitBinary
  }
  const executable = process.platform === 'win32' ? 'git.exe' : 'git'
  for (const directory of (process.env.PATH ?? '').split(delimiter)) {
    if (directory === '') continue
    const candidate = join(directory, executable)
    if (!existsSync(candidate)) continue
    resolvedGitBinary = portable(candidate)
    return resolvedGitBinary
  }
  resolvedGitBinary = 'git'
  return resolvedGitBinary
}

/**
 * @param {object} subprocess the `ctx.subprocess` service
 * @param {string} cwd repository root (absolute)
 * @param {string[]} args Git arguments, program name excluded
 * @param {AbortSignal | undefined} signal caller lifetime
 * @returns {Promise<{code: number | null, stdout: string, stderr: string}>}
 */
export async function runGit(subprocess, cwd, args, signal) {
  const handle = subprocess.spawn({
    argv: [resolveGitBinary(), ...args],
    cwd,
    stdio: {
      stdin: 'ignore',
      stdout: { maxBytes: GIT_MAX_BYTES },
      stderr: { maxBytes: 64 * 1024 },
    },
    graceMs: GIT_GRACE_MS,
    ...(signal === undefined ? {} : { signal }),
  })
  const outcome = await handle.done
  const stdout = handle.collected.stdout?.readFrom(0)?.text ?? ''
  const stderr = handle.collected.stderr?.readFrom(0)?.text ?? ''
  return { code: outcome.exitCode, stdout, stderr }
}

/**
 * Run Git and turn a non-zero exit into a coded failure that keeps Git's own
 * wording, so the panel can show the real reason instead of a guess.
 *
 * @param {object} subprocess
 * @param {string} cwd
 * @param {string[]} args
 * @param {AbortSignal | undefined} signal
 */
export async function runGitOrThrow(subprocess, cwd, args, signal) {
  const result = await runGit(subprocess, cwd, args, signal)
  if (result.code === 0) return result
  const detail = (result.stderr || result.stdout).trim() || `git ${args[0]} failed`
  const error = new Error(detail)
  error.code = 'notes/git-failed'
  throw error
}

/**
 * `git status --porcelain=v1 -z`, parsed into the panel's file list.
 *
 * @param {object} subprocess
 * @param {string} cwd
 * @param {AbortSignal | undefined} signal
 */
export async function readStatus(subprocess, cwd, signal) {
  const { stdout } = await runGitOrThrow(
    subprocess,
    cwd,
    ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames'],
    signal,
  )
  return { entries: parsePorcelainStatus(stdout) }
}

/**
 * Working-tree diff against HEAD. A repository without commits has no HEAD to
 * compare with, so that specific failure is reported as an empty diff instead of
 * an error the panel cannot act on.
 *
 * @param {object} subprocess
 * @param {string} cwd
 * @param {string | undefined} relativePath
 * @param {AbortSignal | undefined} signal
 */
export async function readDiff(subprocess, cwd, relativePath, signal) {
  const pathspec = relativePath === undefined ? [] : ['--', relativePath]
  const result = await runGit(
    subprocess,
    cwd,
    ['diff', '--no-color', '--no-ext-diff', 'HEAD', ...pathspec],
    signal,
  )
  if (result.code === 0) return { diff: result.stdout, truncated: false }
  const detail = (result.stderr || result.stdout).trim()
  if (/ambiguous argument 'HEAD'|unknown revision|bad revision/.test(detail)) {
    return { diff: '', truncated: false, note: 'no commits yet' }
  }
  const error = new Error(detail || 'git diff failed')
  error.code = 'notes/git-failed'
  throw error
}

/**
 * Blame one line of one file.
 *
 * @param {object} subprocess
 * @param {string} cwd
 * @param {string} relativePath
 * @param {number} line
 * @param {AbortSignal | undefined} signal
 */
export async function readBlame(subprocess, cwd, relativePath, line, signal) {
  const result = await runGit(
    subprocess,
    cwd,
    ['blame', '--porcelain', `-L`, `${line},${line}`, '--', relativePath],
    signal,
  )
  if (result.code !== 0) {
    const detail = (result.stderr || result.stdout).trim()
    const error = new Error(detail || 'git blame failed')
    if (/no such ref: HEAD|ambiguous argument 'HEAD'|unknown revision|bad revision/.test(detail)) {
      error.code = 'notes/no-commits'
    } else if (/no such path|no such file|does not exist|has only \d+ lines/.test(detail)) {
      error.code = 'notes/not-tracked'
    } else {
      error.code = 'notes/git-failed'
    }
    throw error
  }
  const entry = blameAtLine(parseBlamePorcelain(result.stdout), line)
  if (entry === undefined) {
    const error = new Error(`git blame returned no entry for ${relativePath}:${line}`)
    error.code = 'notes/blame-empty'
    throw error
  }
  return { entries: [entry] }
}

/**
 * `git rev-parse --show-toplevel` — used only to decide whether the picked
 * directory is already its own repository.
 *
 * @param {object} subprocess
 * @param {string} cwd
 * @param {AbortSignal | undefined} signal
 */
export async function readToplevel(subprocess, cwd, signal) {
  const result = await runGit(subprocess, cwd, ['rev-parse', '--show-toplevel'], signal)
  if (result.code !== 0) return undefined
  return result.stdout.trim() || undefined
}

/**
 * Run `git init` exactly once, in the picked directory itself.
 *
 * @param {object} subprocess
 * @param {string} cwd
 * @param {AbortSignal | undefined} signal
 */
export async function initRepository(subprocess, cwd, signal) {
  const result = await runGit(subprocess, cwd, ['init', '--quiet'], signal)
  if (result.code !== 0) {
    const detail = (result.stderr || result.stdout).trim() || 'git init failed'
    throw toFailure(Object.assign(new Error(detail), { code: 'notes/git-init-failed' }))
  }
  return true
}
