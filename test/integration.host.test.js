/**
 * Host integration tests.
 *
 * These drive the real `NotesRemote` against:
 * - the REAL filesystem provider (`@deepseek-ai/dsh-fs-local`), so writes and
 *   reads touch actual files with real versions;
 * - the REAL subprocess runtime (`@deepseek-ai/dsh-subprocess-local`), so git
 *   commands are actual `git` processes;
 * - only storage (in-memory) and the directory picker (stub) are substituted.
 *
 * Every fixture lives under `os.tmpdir()` with an `lmn-it-` prefix and is
 * removed in `finally`. Nothing under the workspace or a user directory is
 * ever created, read for its contents, or written.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { after, describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  createHostContext,
  createMemoryStorageDomain,
  makeTempDir,
  prepareDeps,
  recordSpawn,
  removeTempDir,
} from './helpers/host.js'
import { readStatus } from '../lib/git.js'
import { resolveGitBinary } from '../lib/git.js'
import { projectIdFor } from '../lib/pure.js'

const GIT = resolveGitBinary()
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Notes Integration',
  GIT_AUTHOR_EMAIL: 'notes@example.test',
  GIT_COMMITTER_NAME: 'Notes Integration',
  GIT_COMMITTER_EMAIL: 'notes@example.test',
  GIT_CONFIG_NOSYSTEM: '1',
}

/** The temporary roots this file created, removed once the file finishes. */
const roots = new Set()

after(() => {
  for (const dir of roots) removeTempDir(dir)
  roots.clear()
})

/**
 * Run a real git command for fixture setup and expectations.
 * @param {string} cwd
 * @param {string[]} args
 */
function git(cwd, args) {
  const result = spawnSync(GIT, args, { cwd, encoding: 'utf8', env: GIT_ENV })
  if (result.error !== undefined && result.error !== null) throw result.error
  return { code: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
}

/**
 * Run git and fail loudly when it does not succeed.
 * @param {string} cwd
 * @param {string[]} args
 */
function gitOk(cwd, args) {
  const result = git(cwd, args)
  assert.equal(result.code, 0, `git ${args.join(' ')} failed: ${result.stderr}`)
  return result.stdout.trim()
}

/**
 * A named temporary project directory, registered for cleanup.
 * @param {string} label
 */
function tempProject(label) {
  const dir = makeTempDir(label)
  roots.add(dir)
  return dir
}

/**
 * Create a repository with one commit containing `file`.
 * @param {string} dir
 * @param {string} file
 * @param {string} content
 */
function commitFile(dir, file, content) {
  gitOk(dir, ['init', '--quiet'])
  writeFileSync(join(dir, file), content)
  gitOk(dir, ['add', '--', file])
  gitOk(dir, ['commit', '--quiet', '-m', `add ${file}`])
  return gitOk(dir, ['rev-parse', 'HEAD'])
}

/** Snapshot the relative paths inside a directory tree. */
function treeFiles(root) {
  const found = []
  const walk = (current, prefix) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const next = prefix === '' ? entry.name : `${prefix}/${entry.name}`
      if (entry.isDirectory()) {
        found.push(`${next}/`)
        walk(join(current, entry.name), next)
      } else {
        found.push(next)
      }
    }
  }
  walk(root, '')
  return found.sort()
}

const hasGit = GIT !== null && existsSync(GIT)

describe('host integration: real filesystem', { skip: !hasGit && 'git is unavailable' }, () => {
  test('registerProject creates the repository inside the picked directory only', async () => {
    const host = await createHostContext()
    const dir = tempProject('register')
    try {
      writeFileSync(join(dir, 'note.md'), '# note\n')
      const record = await host.remote.registerProject(dir)

      assert.equal(record.id, projectIdFor(dir))
      assert.equal(record.gitInitialized, true)
      assert.equal(record.rootPath, dir)
      assert.equal(existsSync(join(dir, '.git')), true, 'git init must create dir/.git')
      assert.equal(existsSync(join(dir, '.git', 'HEAD')), true)

      const listed = await host.remote.listProjects()
      assert.equal(listed.projects.length, 1)
      assert.equal(listed.projects[0].id, record.id)
    } finally {
      await host.dispose()
    }
  })

  test('listEntries lists directories first and hides non-Markdown and dot entries', async () => {
    const host = await createHostContext()
    const dir = tempProject('list')
    try {
      writeFileSync(join(dir, 'alpha.md'), '# a\n')
      writeFileSync(join(dir, 'notes.txt'), 'not markdown\n')
      writeFileSync(join(dir, '.hidden.md'), '# hidden\n')
      writeFileSync(join(dir, 'zeta.md'), '# z\n')
      writeFileSync(join(dir, 'beta.markdown'), '# b\n')
      const { mkdirSync } = await import('node:fs')
      mkdirSync(join(dir, 'sub'), { recursive: true })
      mkdirSync(join(dir, 'node_modules'), { recursive: true })
      writeFileSync(join(dir, 'sub', 'inner.md'), '# inner\n')

      const project = await host.remote.registerProject(dir)
      const listing = await host.remote.listEntries(project.id, '')

      assert.deepEqual(
        listing.entries.map((entry) => entry.path),
        ['sub', 'alpha.md', 'beta.markdown', 'zeta.md'],
      )
      assert.deepEqual(
        listing.entries.map((entry) => entry.type),
        ['directory', 'file', 'file', 'file'],
      )
    } finally {
      await host.dispose()
    }
  })

  test('readFile and writeFile go through the real fs provider and report real versions', async () => {
    const host = await createHostContext()
    const dir = tempProject('rw')
    try {
      writeFileSync(join(dir, 'doc.md'), '# original\n')
      const project = await host.remote.registerProject(dir)

      const read = await host.remote.readFile(project.id, 'doc.md')
      assert.equal(read.content, '# original\n')
      assert.equal(read.size, '# original\n'.length)
      assert.match(read.version, /^\d+:\d+:\d+:\d+:\d+$/)

      const created = await host.remote.writeFile(project.id, 'fresh.md', '# fresh\n', null)
      assert.equal(created.operation, 'create')
      assert.equal(readFileSync(join(dir, 'fresh.md'), 'utf8'), '# fresh\n')

      const updated = await host.remote.writeFile(
        project.id,
        'doc.md',
        '# rewritten\n',
        read.version,
      )
      assert.equal(updated.operation, 'update')
      assert.notEqual(updated.version, read.version)
      assert.equal(readFileSync(join(dir, 'doc.md'), 'utf8'), '# rewritten\n')
    } finally {
      await host.dispose()
    }
  })

  test('createEntry makes a real file and a real directory on disk', async () => {
    const host = await createHostContext()
    const dir = tempProject('create-entry')
    try {
      const project = await host.remote.registerProject(dir)

      const file = await host.remote.createEntry(project.id, 'fresh.md', 'file')
      assert.deepEqual(file, { path: 'fresh.md', kind: 'file' })
      assert.equal(readFileSync(join(dir, 'fresh.md'), 'utf8'), '')

      const folder = await host.remote.createEntry(project.id, 'chapters', 'directory')
      assert.deepEqual(folder, { path: 'chapters', kind: 'directory' })
      assert.ok(statSync(join(dir, 'chapters')).isDirectory())

      const nested = await host.remote.createEntry(project.id, 'chapters/one.md', 'file')
      assert.deepEqual(nested, { path: 'chapters/one.md', kind: 'file' })
      assert.equal(readFileSync(join(dir, 'chapters', 'one.md'), 'utf8'), '')
    } finally {
      await host.dispose()
    }
  })

  test('createEntry refuses an existing entry, a missing folder and a bad kind', async () => {
    const host = await createHostContext()
    const dir = tempProject('create-entry-errors')
    try {
      writeFileSync(join(dir, 'taken.md'), '# taken\n')
      const project = await host.remote.registerProject(dir)

      await assert.rejects(
        () => host.remote.createEntry(project.id, 'taken.md', 'file'),
        (error) => {
          assert.equal(error.code, 'notes/exists')
          return true
        },
      )
      assert.equal(readFileSync(join(dir, 'taken.md'), 'utf8'), '# taken\n')

      await assert.rejects(
        () => host.remote.createEntry(project.id, 'gone/deep.md', 'file'),
        (error) => {
          assert.equal(error.code, 'notes/not-found')
          return true
        },
      )
      assert.equal(existsSync(join(dir, 'gone')), false, 'no parent folder may be created')

      await assert.rejects(
        () => host.remote.createEntry(project.id, 'x.md', 'symlink'),
        (error) => {
          assert.equal(error.code, 'notes/bad-kind')
          return true
        },
      )
    } finally {
      await host.dispose()
    }
  })

  test('a stale version is refused with the plugin alias code notes/stale', async () => {
    const host = await createHostContext()
    const dir = tempProject('stale')
    try {
      writeFileSync(join(dir, 'doc.md'), 'one\n')
      const project = await host.remote.registerProject(dir)
      const read = await host.remote.readFile(project.id, 'doc.md')

      // Someone else changes the file after the read: the save must not win.
      writeFileSync(join(dir, 'doc.md'), 'two\n')

      await assert.rejects(
        () => host.remote.writeFile(project.id, 'doc.md', 'three\n', read.version),
        (error) => {
          assert.equal(error.code, 'notes/stale')
          assert.match(error.message, /file changed since it was read/)
          return true
        },
      )
      assert.equal(readFileSync(join(dir, 'doc.md'), 'utf8'), 'two\n')
    } finally {
      await host.dispose()
    }
  })

  test('paths outside the project root are refused before any write', async () => {
    const host = await createHostContext()
    const dir = tempProject('escape')
    const outside = `${dir}-outside`
    try {
      const { mkdirSync } = await import('node:fs')
      mkdirSync(outside, { recursive: true })
      roots.add(outside)
      const project = await host.remote.registerProject(dir)

      // A `..` segment is rejected while the relative path is normalized, which
      // happens before the path is ever resolved against the project root.
      await assert.rejects(
        () => host.remote.readFile(project.id, '../escape.md'),
        (error) => {
          assert.equal(error.code, 'notes/bad-relative-path')
          assert.match(error.message, /parent traversal is not allowed: \.\.\/escape\.md/)
          return true
        },
      )
      // The same traversal written with backslashes must be refused too: the
      // panel may hand over a Windows-shaped relative path.
      await assert.rejects(
        () => host.remote.readFile(project.id, '..\\escape.md'),
        (error) => {
          assert.equal(error.code, 'notes/bad-relative-path')
          assert.match(error.message, /parent traversal is not allowed: \.\.\\escape\.md/)
          return true
        },
      )
      // An absolute path is refused outright, in both slash directions.
      for (const absolute of [join(outside, 'escape.md'), join(outside, 'escape.md').replace(/\\/g, '/')]) {
        await assert.rejects(
          () => host.remote.readFile(project.id, absolute),
          (error) => {
            assert.equal(error.code, 'notes/bad-relative-path')
            assert.match(error.message, /(drive-qualified|absolute) path is not allowed/)
            return true
          },
        )
      }
      assert.equal(existsSync(join(outside, 'escape.md')), false)

      // A refused path must also never reach the disk through a save.
      await assert.rejects(
        () => host.remote.writeFile(project.id, '../written.md', 'nope\n', null),
        (error) => error.code === 'notes/bad-relative-path',
      )
      assert.equal(existsSync(join(outside, 'written.md')), false)
    } finally {
      await host.dispose()
    }
  })

  test('a symlinked file that resolves outside the root is refused', async (t) => {
    const host = await createHostContext()
    const dir = tempProject('symlink')
    const outside = `${dir}-linked`
    try {
      const { mkdirSync } = await import('node:fs')
      mkdirSync(outside, { recursive: true })
      roots.add(outside)
      writeFileSync(join(outside, 'secret.md'), '# secret\n')
      try {
        symlinkSync(join(outside, 'secret.md'), join(dir, 'link.md'))
      } catch (error) {
        t.skip(`cannot create a symlink here: ${error.code ?? error.message}`)
        return
      }
      const project = await host.remote.registerProject(dir)

      await assert.rejects(
        () => host.remote.readFile(project.id, 'link.md'),
        (error) => {
          assert.equal(error.code, 'notes/outside-root')
          assert.match(error.message, /refusing to touch "link\.md": outside the project root/)
          return true
        },
      )
    } finally {
      await host.dispose()
    }
  })

  test('a missing file and a non-Markdown file are reported with distinct codes', async () => {
    const host = await createHostContext()
    const dir = tempProject('codes')
    try {
      writeFileSync(join(dir, 'plain.txt'), 'x\n')
      const project = await host.remote.registerProject(dir)

      await assert.rejects(
        () => host.remote.readFile(project.id, 'missing.md'),
        (error) => error.code === 'notes/not-found',
      )
      await assert.rejects(
        () => host.remote.readFile(project.id, 'plain.txt'),
        (error) => error.code === 'notes/not-markdown',
      )
      await assert.rejects(
        () => host.remote.listEntries('no-such-project', ''),
        (error) => error.code === 'notes/unknown-project',
      )
    } finally {
      await host.dispose()
    }
  })

  test('importProject honours the picker and touches nothing when it is cancelled', async () => {
    const host = await createHostContext()
    const dir = tempProject('cancel')
    try {
      const cancelled = await host.remote.importProject()
      assert.equal(host.picker.calls, 1)
      assert.equal(cancelled.canceled, true)
      assert.equal(cancelled.project, null)
      assert.equal(existsSync(join(dir, '.git')), false)

      host.picker.answer = dir
      const imported = await host.remote.importProject()
      assert.equal(host.picker.calls, 2)
      assert.equal(imported.canceled, false)
      assert.equal(imported.project.rootPath, dir)
      assert.equal(existsSync(join(dir, '.git')), true)
    } finally {
      await host.dispose()
    }
  })

  test('removeProject forgets a registered directory and keeps the files', async () => {
    const host = await createHostContext()
    const dir = tempProject('remove')
    try {
      writeFileSync(join(dir, 'keep.md'), '# keep\n')
      const project = await host.remote.registerProject(dir)

      assert.deepEqual(await host.remote.removeProject(project.id), {
        removed: true,
        projectId: project.id,
      })
      assert.deepEqual(await host.remote.removeProject(project.id), {
        removed: false,
        projectId: project.id,
      })
      assert.deepEqual((await host.remote.listProjects()).projects, [])
      assert.equal(existsSync(join(dir, 'keep.md')), true)
    } finally {
      await host.dispose()
    }
  })
})

describe('host integration: real git subprocess', { skip: !hasGit && 'git is unavailable' }, () => {
  test('gitStatus reports real untracked files from git itself', async () => {
    const host = await createHostContext()
    const dir = tempProject('status')
    try {
      writeFileSync(join(dir, 'a.md'), '# a\n')
      const { mkdirSync } = await import('node:fs')
      mkdirSync(join(dir, 'sub'), { recursive: true })
      writeFileSync(join(dir, 'sub', 'b.md'), '# b\n')
      const project = await host.remote.registerProject(dir)

      const status = await host.remote.gitStatus(project.id)
      assert.equal(status.projectId, project.id)
      assert.equal(status.rootPath, dir)
      assert.deepEqual(
        status.entries.map((entry) => `${entry.kind}:${entry.path}`).sort(),
        ['untracked:a.md', 'untracked:sub/b.md'],
      )
    } finally {
      await host.dispose()
    }
  })

  test('gitDiff reports no commits yet, then the real tracked change', async () => {
    const host = await createHostContext()
    const dir = tempProject('diff')
    try {
      writeFileSync(join(dir, 'doc.md'), 'first\n')
      const project = await host.remote.registerProject(dir)

      // With no commit to compare against, the note is drawn as entirely new so
      // the editor still shows where its lines came from.
      const beforeCommit = await host.remote.gitDiff(project.id, 'doc.md')
      assert.match(beforeCommit.diff, /^@@ -0,0 \+1 @@$/m)
      assert.match(beforeCommit.diff, /^\+first$/m)
      assert.equal(beforeCommit.note, undefined)

      // The repository-wide diff has no file to draw, so it keeps the note.
      const wholeRepo = await host.remote.gitDiff(project.id, '')
      assert.equal(wholeRepo.diff, '')
      assert.equal(wholeRepo.note, 'no commits yet')

      gitOk(dir, ['add', '--', 'doc.md'])
      gitOk(dir, ['commit', '--quiet', '-m', 'first'])
      writeFileSync(join(dir, 'doc.md'), 'second\n')

      const diff = await host.remote.gitDiff(project.id, 'doc.md')
      assert.match(diff.diff, /^diff --git a\/doc\.md b\/doc\.md/m)
      assert.match(diff.diff, /^-first$/m)
      assert.match(diff.diff, /^\+second$/m)

      // The same edit must show up as a modification of a tracked file, not as
      // an untracked one.
      const status = await host.remote.gitStatus(project.id)
      assert.deepEqual(
        status.entries.map((entry) => `${entry.kind}:${entry.path}`),
        ['modified:doc.md'],
      )
    } finally {
      await host.dispose()
    }
  })

  test('gitBlame returns the sha of the commit that introduced the line', async () => {
    const host = await createHostContext()
    const dir = tempProject('blame')
    try {
      writeFileSync(join(dir, 'doc.md'), 'alpha\nbeta\n')
      const project = await host.remote.registerProject(dir)
      const sha = commitFile(dir, 'doc.md', 'alpha\nbeta\n')

      const blame = await host.remote.gitBlame(project.id, 'doc.md', 2)
      assert.equal(blame.line, 2)
      assert.equal(blame.path, 'doc.md')
      assert.equal(blame.entries.length, 1)
      assert.equal(blame.entries[0].sha, sha)
      assert.match(blame.entries[0].sha, /^[0-9a-f]{40}$/)
      assert.equal(blame.entries[0].finalLine, 2)
      assert.equal(blame.entries[0].author, 'Notes Integration')
    } finally {
      await host.dispose()
    }
  })

  test('every git method reports notes/unknown-project for an unregistered id', async () => {
    const host = await createHostContext()
    try {
      const calls = [
        () => host.remote.gitStatus('ghost-00000000'),
        () => host.remote.gitDiff('ghost-00000000', 'doc.md'),
        () => host.remote.gitBlame('ghost-00000000', 'doc.md', 1),
        () => host.remote.listEntries('ghost-00000000', ''),
        () => host.remote.readFile('ghost-00000000', 'doc.md'),
        () => host.remote.createEntry('ghost-00000000', 'x.md', 'file'),
      ]
      for (const call of calls) {
        await assert.rejects(call, (error) => {
          assert.equal(error.code, 'notes/unknown-project')
          assert.match(error.message, /unknown project "ghost-00000000"/)
          return true
        })
      }
    } finally {
      await host.dispose()
    }
  })

  test('gitBlame on an uncommitted file reports notes/not-tracked', async () => {
    const host = await createHostContext()
    const dir = tempProject('blame-untracked')
    try {
      writeFileSync(join(dir, 'tracked.md'), 'one\n')
      const project = await host.remote.registerProject(dir)
      commitFile(dir, 'tracked.md', 'one\n')
      writeFileSync(join(dir, 'later.md'), 'two\n')

      await assert.rejects(
        () => host.remote.gitBlame(project.id, 'later.md', 1),
        (error) => {
          assert.equal(error.code, 'notes/not-tracked')
          return true
        },
      )
    } finally {
      await host.dispose()
    }
  })

  test('a directory inside a parent repository gets its own repository and leaves the parent alone', async () => {
    const host = await createHostContext()
    const parent = tempProject('parent')
    try {
      const parentSha = commitFile(parent, 'root.md', '# root\n')
      const child = join(parent, 'notes-space')
      const { mkdirSync } = await import('node:fs')
      mkdirSync(child, { recursive: true })
      writeFileSync(join(child, 'child.md'), '# child\n')
      const before = treeFiles(join(parent, '.git'))

      const project = await host.remote.registerProject(child)

      assert.equal(project.rootPath, child)
      assert.equal(existsSync(join(child, '.git')), true, 'the child needs its own repository')
      assert.deepEqual(treeFiles(join(parent, '.git')), before, 'the parent .git must be untouched')
      assert.equal(gitOk(parent, ['rev-parse', 'HEAD']), parentSha)

      const status = await host.remote.gitStatus(project.id)
      assert.deepEqual(
        status.entries.map((entry) => entry.path),
        ['child.md'],
        'the child repository sees only its own files',
      )
    } finally {
      await host.dispose()
    }
  })

  test('registerProject issues git init only for a directory that is not already a repository root', async () => {
    // The host context already owns a real filesystem; only the subprocess is
    // replaced, by a recording façade that delegates to a real runtime living on
    // its own context, so `git` still executes for real while every argv stays
    // observable.
    const host = await createHostContext({ subprocess: false })
    const cordis = await import('@deepseek-ai/cordis')
    const subprocessLocal = await import('@deepseek-ai/dsh-subprocess-local')
    const real = new subprocessLocal.LocalSubprocessRuntime(new cordis.Context())
    const recorded = recordSpawn(real)
    host.ctx.reflect.provide('subprocess', recorded)

    const dir = tempProject('init-once')
    try {
      gitOk(dir, ['init', '--quiet'])
      recorded.calls.length = 0
      await host.remote.registerProject(dir)
      assert.deepEqual(
        recorded.calls.map((call) => call.argv).filter((argv) => argv.includes('init')),
        [],
        'an existing repository root must not be re-initialized',
      )

      const child = join(dir, 'nested')
      const { mkdirSync } = await import('node:fs')
      mkdirSync(child, { recursive: true })
      recorded.calls.length = 0
      await host.remote.registerProject(child)
      const inits = recorded.calls.filter((call) => call.argv.includes('init'))
      assert.equal(inits.length, 1)
      assert.equal(inits[0].cwd, child, 'git init must run inside the selected directory')
      assert.equal(existsSync(join(child, '.git')), true)
    } finally {
      await host.dispose()
    }
  })
})

describe('host integration: storage wiring', { skip: !hasGit && 'git is unavailable' }, () => {
  test('the registry opens exactly one domain and validates records on write', async () => {
    prepareDeps()
    const storage = createMemoryStorageDomain()
    const opened = []
    const spy = {
      open(spec) {
        opened.push(spec.name)
        return storage.open(spec)
      },
    }
    const cordis = await import('@deepseek-ai/cordis')
    const fsLocal = await import('@deepseek-ai/dsh-fs-local')
    const subprocessLocal = await import('@deepseek-ai/dsh-subprocess-local')
    const { createNotesRemote, NotesRemote, markRemoteMethods } = await import('../lib/service.js')

    const ctx = new cordis.Context()
    new fsLocal.LocalFileSystem(ctx, { cwd: process.cwd(), diffBasisMaxBytes: 8 * 1024 * 1024 })
    new subprocessLocal.LocalSubprocessRuntime(ctx)
    ctx.reflect.provide('storageDomain', spy)
    ctx.reflect.provide('directoryPicker', {
      capability() {
        return { kind: 'native', pick: async () => null }
      },
    })

    markRemoteMethods(NotesRemote)
    const { domain, store } = await createNotesRemote(ctx)
    try {
      assert.deepEqual(opened, ['local_markdown_notes'])
      assert.equal(domain.name, 'local_markdown_notes')

      await assert.rejects(
        () => store.put({ id: '', name: 'x', rootPath: '/tmp/x' }),
        (error) => {
          assert.match(String(error.message), /id/i)
          return true
        },
      )
      assert.deepEqual(store.list(), [])
    } finally {
      await domain.close()
    }
  })

  test('gitStatus reaches the project root through the real subprocess runtime', async () => {
    const host = await createHostContext()
    const dir = tempProject('realsub')
    try {
      writeFileSync(join(dir, 'one.md'), '1\n')
      const project = await host.remote.registerProject(dir)
      // readStatus is the same helper the Remote uses; calling it directly with
      // ctx.subprocess proves the runtime really spawns git for this project.
      const status = await readStatus(host.ctx.subprocess, project.rootPath)
      assert.deepEqual(
        status.entries.map((entry) => entry.path),
        ['one.md'],
      )
    } finally {
      await host.dispose()
    }
  })
})
