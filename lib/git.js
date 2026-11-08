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

/**
 * Config pinned on every invocation, before the subcommand.
 *
 * `core.quotepath` defaults to `true`, so Git escapes any non-ASCII byte in a
 * path it prints and the panel showed
 * `diff --git "a/\345\270\270\347\224\250..." "b/\345\270\270..."` instead of the
 * note's own name. Turning it off makes `status`, `diff`, `show` and `blame`
 * print the path as UTF-8, which is what this panel always wants — the names it
 * deals with are the user's own filenames, not shell-escaped tokens. Passed as
 * `-c` rather than by writing the user's `.gitconfig`, so nothing on disk changes.
 */
export const GIT_CONFIG_ARGS = Object.freeze(['-c', 'core.quotepath=false'])

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
    argv: [resolveGitBinary(), ...GIT_CONFIG_ARGS, ...args],
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
 * The whole file drawn as new, compared with an empty baseline.
 *
 * Why this exists: `git diff HEAD -- <path>` says nothing about a file Git has
 * no baseline for. In a repository whose first commit has not been made yet it
 * fails with `bad revision 'HEAD'`; once a commit exists but the file was never
 * `git add`ed it silently prints an empty diff with exit 0. Both cases used to
 * read as "nothing changed", so a note that is entirely new showed no change
 * bars at all.
 *
 * `--no-index` compares two paths on disk instead of the index, so pairing the
 * file with `/dev/null` yields `@@ -0,0 +1,N @@` and one `+` line per line of
 * the note. Exit code 1 is `--no-index`'s normal "these differ" result, not a
 * failure, and the path is passed through unchanged so the header keeps the
 * note's own name.
 *
 * @param {object} subprocess
 * @param {string} cwd
 * @param {string} relativePath
 * @param {AbortSignal | undefined} signal
 * @returns {Promise<{diff: string, truncated: boolean} | undefined>}
 */
async function readAsNewFile(subprocess, cwd, relativePath, signal) {
  const result = await runGit(
    subprocess,
    cwd,
    ['diff', '--no-index', '--no-color', '--no-ext-diff', '--', '/dev/null', relativePath],
    signal,
  )
  if (result.code === 0 || result.code === 1) return { diff: result.stdout, truncated: false }
  return undefined
}

/**
 * Whether Git already tracks this path. An untracked or ignored file exits 1 and
 * says so; anything else is a real failure worth ignoring here, because the
 * caller only uses this to choose a baseline.
 *
 * @param {object} subprocess
 * @param {string} cwd
 * @param {string} relativePath
 * @param {AbortSignal | undefined} signal
 */
async function isTracked(subprocess, cwd, relativePath, signal) {
  const result = await runGit(subprocess, cwd, ['ls-files', '--error-unmatch', '--', relativePath], signal)
  return result.code === 0
}

/**
 * Whether `.gitignore` keeps this path out of the repository entirely.
 *
 * @param {object} subprocess
 * @param {string} cwd
 * @param {string} relativePath
 * @param {AbortSignal | undefined} signal
 */
async function isIgnored(subprocess, cwd, relativePath, signal) {
  const result = await runGit(subprocess, cwd, ['check-ignore', '--quiet', '--', relativePath], signal)
  return result.code === 0
}

/**
 * The best answer for a note Git has no baseline for: the file drawn as new, or
 * empty when the file is not part of the repository at all.
 *
 * `readAsNewFile` alone would also draw an ignored file, which is why the ignore
 * check lives here and every caller goes through it.
 *
 * @param {object} subprocess
 * @param {string} cwd
 * @param {string} relativePath
 * @param {AbortSignal | undefined} signal
 * @returns {Promise<{diff: string, truncated: boolean}>}
 */
async function readWithoutBaseline(subprocess, cwd, relativePath, signal) {
  if (await isIgnored(subprocess, cwd, relativePath, signal)) return { diff: '', truncated: false }
  return (await readAsNewFile(subprocess, cwd, relativePath, signal)) ?? { diff: '', truncated: false }
}

/**
 * Working-tree diff against HEAD.
 *
 * A note with no baseline — never committed, or committed-then-deleted history —
 * still has to render its change bars, so an empty or unusable diff against HEAD
 * falls back to drawing the file as new. Two situations are deliberately left
 * alone: a whole-repository diff in a repository without commits keeps its
 * `no commits yet` note (there is no single file to draw), and a file Git
 * ignores is left undecorated (it is not part of the repository at all).
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

  if (result.code === 0) {
    // An empty diff on a named path means either "unchanged" or "never
    // tracked". Only the second one has lines to show.
    if (result.stdout !== '' || relativePath === undefined) {
      return { diff: result.stdout, truncated: false }
    }
    if (await isTracked(subprocess, cwd, relativePath, signal)) {
      return { diff: '', truncated: false }
    }
    return readWithoutBaseline(subprocess, cwd, relativePath, signal)
  }

  const detail = (result.stderr || result.stdout).trim()
  if (/ambiguous argument 'HEAD'|unknown revision|bad revision/.test(detail)) {
    // No commit yet: every tracked and untracked file is new in full, but a
    // whole-repository diff has no file to draw.
    if (relativePath !== undefined) return readWithoutBaseline(subprocess, cwd, relativePath, signal)
    return { diff: '', truncated: false, note: 'no commits yet' }
  }
  const error = new Error(detail || 'git diff failed')
  error.code = 'notes/git-failed'
  throw error
}

/**
 * The text this file has in HEAD, for comparing an unsaved buffer against the
 * committed version the way an editor's quick-diff gutter does.
 *
 * Returns `content: null` when the file is not part of the repository at all
 * (`.gitignore`d), which means "draw nothing". Every other case returns text:
 * the file as committed, an empty string when Git has no baseline for it yet
 * (never committed, or a repository without commits), so the whole buffer reads
 * as newly added — the same answer `readWithoutBaseline` gives for the diff.
 *
 * @param {object} subprocess
 * @param {string} cwd
 * @param {string} relativePath
 * @param {AbortSignal | undefined} signal
 * @returns {Promise<{content: string | null, tracked: boolean}>}
 */
export async function readBaseline(subprocess, cwd, relativePath, signal) {
  if (await isIgnored(subprocess, cwd, relativePath, signal)) {
    return { content: null, tracked: false }
  }
  if (!(await isTracked(subprocess, cwd, relativePath, signal))) {
    return { content: '', tracked: false }
  }
  const result = await runGit(subprocess, cwd, ['show', `HEAD:${relativePath}`], signal)
  if (result.code === 0) return { content: result.stdout, tracked: true }

  const detail = (result.stderr || result.stdout).trim()
  if (
    /invalid object name|bad revision|unknown revision|ambiguous argument 'HEAD'|no commits yet|does not exist in|exists on disk, but not in/.test(
      detail,
    )
  ) {
    // Tracked in the index but absent from HEAD: the buffer is all new.
    return { content: '', tracked: false }
  }
  const error = new Error(detail || 'git show failed')
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
