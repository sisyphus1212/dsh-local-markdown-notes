/**
 * Real-Git tests for the read-only Git layer.
 *
 * Every test builds its own repository under the OS temporary directory and
 * removes it afterwards. Nothing here touches a user's notes folder: the only
 * writes are commits inside that throw-away directory.
 *
 * `ctx.subprocess` is replaced by an adapter over `node:child_process` that
 * exposes exactly the shape `lib/git.js` consumes: `handle.collected.stdout
 * .readFrom(0)` and an awaitable `handle.done`.
 */

import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  initRepository,
  readBlame,
  readDiff,
  readStatus,
  readToplevel,
  resolveGitBinary,
} from '../lib/git.js'

/** An adapter with the same observable contract as `ctx.subprocess`. */
const subprocess = {
  spawn(request) {
    const child = spawn(request.argv[0], request.argv.slice(1), {
      cwd: request.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    const buffers = { stdout: '', stderr: '' }
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      buffers.stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      buffers.stderr += chunk
    })
    const done = new Promise((resolve) => {
      child.on('close', (code, signal) => resolve({ exitCode: code ?? 0, signal: signal ?? null }))
      child.on('error', () => resolve({ exitCode: 127, signal: null }))
    })
    return {
      done,
      collected: {
        stdout: { readFrom: () => ({ text: buffers.stdout, nextOffset: buffers.stdout.length, lossy: false }) },
        stderr: { readFrom: () => ({ text: buffers.stderr, nextOffset: buffers.stderr.length, lossy: false }) },
      },
      kill: () => child.kill(),
    }
  },
}

/** Whether a usable `git` is on PATH for this machine. */
function gitAvailable() {
  try {
    execFileSync(resolveGitBinary(), ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const GIT = gitAvailable()

/**
 * Git prints long paths while `mkdtempSync` can hand back an 8.3 short path
 * (`C:\Users\MARS~1.LIA\...`), so both sides are canonicalised before comparing.
 *
 * `realpathSync.native` is required: the plain JavaScript `realpathSync` leaves
 * an 8.3 short segment untouched, while the native one expands it (measured on
 * this host: `C:\Users\MARS~1.LIA\AppData\Local\Temp\rp-…` → `C:\Users\mars.liao\…`).
 */
function canonical(value) {
  if (value === undefined) return undefined
  try {
    return realpathSync.native(value).replace(/\\/g, '/').toLowerCase()
  } catch {
    return value.replace(/\\/g, '/').toLowerCase()
  }
}

/** Run git synchronously to set a fixture up; only used to build state. */
function fixture(cwd, ...args) {
  execFileSync(resolveGitBinary(), args, {
    cwd,
    stdio: 'ignore',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Notes Test',
      GIT_AUTHOR_EMAIL: 'notes@example.test',
      GIT_COMMITTER_NAME: 'Notes Test',
      GIT_COMMITTER_EMAIL: 'notes@example.test',
      GIT_CONFIG_NOSYSTEM: '1',
    },
  })
}

async function withRepository(run) {
  const created = realpathSync(mkdtempSync(join(tmpdir(), 'notes-git-test-')))
  try {
    return await run(created)
  } finally {
    rmSync(created, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
}

test('readToplevel reports the directory itself after git init', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    const toplevel = await readToplevel(subprocess, root, undefined)
    assert.ok(toplevel !== undefined)
    assert.equal(canonical(toplevel), canonical(root))
  }),
)

test('readToplevel reports the parent repository for a nested directory', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    const nested = join(root, 'notes')
    mkdirSync(nested)
    const toplevel = await readToplevel(subprocess, nested, undefined)
    assert.equal(canonical(toplevel), canonical(root))
  }),
)

test('readStatus lists untracked Markdown files', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    writeFileSync(join(root, 'a.md'), '# a\n')
    const { entries } = await readStatus(subprocess, root, undefined)
    assert.equal(entries.length, 1)
    assert.equal(entries[0].path, 'a.md')
    assert.equal(entries[0].kind, 'untracked')
  }),
)

test('readStatus reports a modified tracked file', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    writeFileSync(join(root, 'a.md'), '# a\n')
    fixture(root, 'add', 'a.md')
    fixture(root, 'commit', '-m', 'first')
    writeFileSync(join(root, 'a.md'), '# a\nmore\n')
    const { entries } = await readStatus(subprocess, root, undefined)
    const modified = entries.find((entry) => entry.path === 'a.md')
    assert.ok(modified !== undefined)
    assert.equal(modified.kind, 'modified')
  }),
)

test('readDiff shows the working-tree change for one path', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    writeFileSync(join(root, 'a.md'), '# a\n')
    fixture(root, 'add', 'a.md')
    fixture(root, 'commit', '-m', 'first')
    writeFileSync(join(root, 'a.md'), '# a\nmore\n')
    const diff = await readDiff(subprocess, root, 'a.md', undefined)
    assert.match(diff.diff, /\+more/)
    assert.match(diff.diff, /a\.md/)
  }),
)

test('readDiff tolerates a repository without commits', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    writeFileSync(join(root, 'a.md'), '# a\n')
    const diff = await readDiff(subprocess, root, undefined, undefined)
    assert.equal(diff.diff, '')
    assert.equal(diff.note, 'no commits yet')
  }),
)

test('readDiff draws a never-committed note as entirely new', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    writeFileSync(join(root, 'a.md'), 'one\ntwo\n')
    // The change bars need one `+` line per line of the note; an empty diff
    // would leave a brand new note looking untouched.
    const diff = await readDiff(subprocess, root, 'a.md', undefined)
    assert.match(diff.diff, /^diff --git a\/a\.md b\/a\.md$/m)
    assert.match(diff.diff, /^@@ -0,0 \+1,2 @@$/m)
    assert.match(diff.diff, /^\+one$/m)
    assert.match(diff.diff, /^\+two$/m)
    assert.equal(diff.note, undefined, 'a drawable file is not reported as missing its baseline')
  }),
)

test('readDiff draws an untracked note as new even when other commits exist', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    writeFileSync(join(root, 'tracked.md'), 'x\n')
    fixture(root, 'add', 'tracked.md')
    fixture(root, 'commit', '-m', 'first')
    writeFileSync(join(root, 'fresh.md'), 'a\nb\nc\n')
    // `git diff HEAD -- fresh.md` exits 0 with no output here, which used to
    // read as "unchanged".
    const diff = await readDiff(subprocess, root, 'fresh.md', undefined)
    assert.match(diff.diff, /^@@ -0,0 \+1,3 @@$/m)
    assert.match(diff.diff, /^\+c$/m)
  }),
)

test('readDiff leaves a tracked but unchanged note undecorated', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    writeFileSync(join(root, 'a.md'), 'one\n')
    fixture(root, 'add', 'a.md')
    fixture(root, 'commit', '-m', 'first')
    const diff = await readDiff(subprocess, root, 'a.md', undefined)
    assert.equal(diff.diff, '', 'an unchanged tracked file has nothing to draw')
    assert.equal(diff.note, undefined)
  }),
)

test('readDiff leaves an ignored note undecorated', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    writeFileSync(join(root, '.gitignore'), 'ignored.md\n')
    writeFileSync(join(root, 'ignored.md'), 'nope\n')
    // Ignored files are not part of the repository, so they are not "new".
    const diff = await readDiff(subprocess, root, 'ignored.md', undefined)
    assert.equal(diff.diff, '')
  }),
)

test('readBlame returns the commit that introduced a line', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    writeFileSync(join(root, 'a.md'), 'one\ntwo\n')
    fixture(root, 'add', 'a.md')
    fixture(root, 'commit', '-m', 'introduce two lines')
    const blame = await readBlame(subprocess, root, 'a.md', 2, undefined)
    assert.equal(blame.entries.length, 1)
    assert.equal(blame.entries[0].finalLine, 2)
    assert.match(blame.entries[0].author, /Notes Test/)
    assert.match(blame.entries[0].summary, /introduce two lines/)
    assert.equal(blame.entries[0].sha.length, 40)
  }),
)

test('readBlame refuses a path that is not tracked', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    writeFileSync(join(root, 'tracked.md'), 'x\n')
    fixture(root, 'add', 'tracked.md')
    fixture(root, 'commit', '-m', 'track one file')
    writeFileSync(join(root, 'untracked.md'), 'y\n')
    await assert.rejects(
      () => readBlame(subprocess, root, 'untracked.md', 1, undefined),
      (error) => error.code === 'notes/not-tracked',
    )
  }),
)

test('readBlame reports a repository without commits separately', { skip: !GIT }, () =>
  withRepository(async (root) => {
    await initRepository(subprocess, root, undefined)
    writeFileSync(join(root, 'a.md'), 'one\n')
    await assert.rejects(
      () => readBlame(subprocess, root, 'a.md', 1, undefined),
      (error) => error.code === 'notes/no-commits',
    )
  }),
)
