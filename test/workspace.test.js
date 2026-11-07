/**
 * Behavioural tests for the project-scoped file helpers, driven by a fake `fs`
 * that mimics `@deepseek-ai/dsh-fs-local` closely enough to exercise the paths
 * that matter: containment, Markdown filtering, size limits and the mapping from
 * an expected version to the storage primitive's expectation object.
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeRelativePath } from '../lib/pure.js'
import { createEntry, readFile, listEntries, resolveEntry, writeFile } from '../lib/workspace.js'

/** A minimal in-memory filesystem: paths are plain POSIX-ish strings. */
function fakeFs(initial, options = {}) {
  const files = new Map(Object.entries(initial))
  const directories = new Set(options.directories ?? ['C:/notes'])
  const links = new Map(Object.entries(options.links ?? {}))
  const writes = []
  const mkdirs = []
  const normalise = (value) => {
    const trimmed = String(value).replace(/\\/g, '/').replace(/\/+$/, '')
    return trimmed === '' ? '/' : trimmed
  }
  const deref = (value) => {
    let current = normalise(value)
    for (let hop = 0; hop < 8; hop += 1) {
      if (!links.has(current)) return current
      current = normalise(links.get(current))
    }
    return current
  }
  let version = 1
  return {
    writes,
    resolve(path) {
      const resolved = deref(path)
      return { targetKey: resolved, displayPath: resolved }
    },
    contains(parent, child) {
      const outer = deref(parent.targetKey ?? parent)
      const inner = deref(child.targetKey ?? child)
      return inner === outer || inner.startsWith(`${outer}/`)
    },
    // Mirrors the Host contract: an opaque key plus a separate subprocess path.
    // `options.processPath` lets a test prove the two are never confused.
    processPath(target) {
      const key = String(target.targetKey ?? target)
      return options.processPath === undefined ? key : options.processPath(key)
    },
    async stat(target) {
      const key = deref(target.targetKey ?? target)
      if (files.has(key)) {
        const content = files.get(key)
        return { version: `v-${content.length}-${version}`, type: 'file', size: content.length }
      }
      if (directories.has(key)) return { version: 'dir', type: 'directory', size: 0 }
      return undefined
    },
    async listDir(target) {
      const key = deref(target.targetKey ?? target)
      const prefix = key === '/' ? '/' : `${key}/`
      const seen = new Map()
      for (const file of files.keys()) {
        if (!file.startsWith(prefix)) continue
        const rest = file.slice(prefix.length)
        const [head, ...tail] = rest.split('/')
        seen.set(head, tail.length === 0 ? 'file' : 'directory')
      }
      for (const directory of directories) {
        if (!directory.startsWith(prefix) || directory === key) continue
        const rest = directory.slice(prefix.length)
        const [head, ...tail] = rest.split('/')
        if (tail.length === 0) seen.set(head, 'directory')
      }
      return [...seen].map(([name, type]) => {
        const child = `${prefix}${name}`
        const content = files.get(child)
        return {
          name,
          type,
          target: { targetKey: child, displayPath: child },
          ...(content === undefined ? {} : { version: `v-${content.length}-${version}`, size: content.length }),
        }
      })
    },
    async readText(target) {
      const key = deref(target.targetKey ?? target)
      if (!files.has(key)) throw new Error(`ENOENT ${key}`)
      return files.get(key)
    },
    async writeText(target, content, expected) {
      const key = deref(target.targetKey ?? target)
      const exists = files.has(key)
      if (expected.kind === 'createIfAbsent' && exists) {
        const error = new Error(`cannot create ${key}: something is already there`)
        error.code = 'FS_ALREADY_EXISTS'
        throw error
      }
      if (expected.kind === 'replaceIfVersion') {
        if (!exists) {
          const error = new Error(`cannot write ${key}: file changed since it was read`)
          error.code = 'FS_STALE_VERSION'
          throw error
        }
        const actual = `v-${files.get(key).length}-${version}`
        if (actual !== expected.version) {
          const error = new Error(`cannot write ${key}: file changed since it was read`)
          error.code = 'FS_STALE_VERSION'
          throw error
        }
      }
      writes.push({ key, content, expected })
      const before = files.get(key)
      files.set(key, content)
      version += 1
      return {
        operation: exists ? 'update' : 'create',
        version: `v-${content.length}-${version}`,
        before,
        after: content,
      }
    },
    async mkdir(target, mkdirOptions = {}) {
      const key = deref(target.targetKey ?? target)
      if (files.has(key) || directories.has(key)) {
        if (mkdirOptions.recursive === true) return undefined
        const error = new Error(`EEXIST: file already exists, mkdir '${key}'`)
        error.code = 'EEXIST'
        throw error
      }
      const parentKey = key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : key
      if (parentKey !== key && !directories.has(parentKey)) {
        const error = new Error(`ENOENT: no such file or directory, mkdir '${key}'`)
        error.code = 'ENOENT'
        throw error
      }
      mkdirs.push(key)
      directories.add(key)
      return undefined
    },
    mkdirs,
  }
}

test('listEntries keeps Markdown files and drops other files', async () => {
  const fs = fakeFs({
    'C:/notes/a.md': '# a',
    'C:/notes/b.txt': 'b',
    'C:/notes/c.markdown': '# c',
    'C:/notes/.git/config': 'x',
    'C:/notes/node_modules/x.md': 'x',
    'C:/notes/sub/d.mdx': '# d',
  })
  const listed = await listEntries(fs, 'C:/notes', '', undefined)
  assert.deepEqual(
    listed.entries.map((entry) => [entry.name, entry.type]),
    [
      ['sub', 'directory'],
      ['a.md', 'file'],
      ['c.markdown', 'file'],
    ],
  )
  assert.equal(listed.entries[1].path, 'a.md')
  assert.equal(listed.entries[0].path, 'sub')
})

test('listEntries sorts directories first and files naturally', async () => {
  const fs = fakeFs({ 'C:/notes/2.md': '', 'C:/notes/10.md': '', 'C:/notes/1.md': '' })
  const listed = await listEntries(fs, 'C:/notes', '', undefined)
  assert.deepEqual(
    listed.entries.map((entry) => entry.name),
    ['1.md', '2.md', '10.md'],
  )
})

test('readFile returns content with the version token from stat', async () => {
  const fs = fakeFs({ 'C:/notes/note.md': '# hi' })
  const read = await readFile(fs, 'C:/notes', 'note.md', undefined)
  assert.equal(read.content, '# hi')
  assert.equal(read.path, 'note.md')
  assert.match(read.version, /^v-4-/)
})

test('readFile refuses non-Markdown paths and missing files', async () => {
  const fs = fakeFs({ 'C:/notes/note.txt': 'x' })
  await assert.rejects(() => readFile(fs, 'C:/notes', 'note.txt', undefined), /not a Markdown file/)
  await assert.rejects(() => readFile(fs, 'C:/notes', 'gone.md', undefined), /no longer exists/)
})

test('resolveEntry refuses a path that escapes the root', async () => {
  const fs = fakeFs({ 'C:/notes/note.md': '' })
  await assert.rejects(() => resolveEntry(fs, 'C:/notes', '../secret.md'), /outside the project root|parent traversal is not allowed/)
  await assert.rejects(() => resolveEntry(fs, 'C:/notes', 'sub/../../secret.md'), /outside the project root|parent traversal is not allowed/)
})

test('resolveEntry refuses a symlink that leaves the root', async () => {
  const fs = fakeFs(
    { 'C:/elsewhere/secret.md': '# secret' },
    { directories: ['C:/notes'], links: { 'C:/notes/link.md': 'C:/elsewhere/secret.md' } },
  )
  await assert.rejects(() => resolveEntry(fs, 'C:/notes', 'link.md'), /outside the project root/)
})

test('resolveEntry accepts the root itself and nested children', async () => {
  const fs = fakeFs({ 'C:/notes/sub/a.md': '' })
  const root = await resolveEntry(fs, 'C:/notes', '', undefined)
  assert.equal(root.relative, '')
  const nested = await resolveEntry(fs, 'C:/notes', normalizeRelativePath('./sub/a.md'), undefined)
  assert.equal(nested.relative, 'sub/a.md')
})

test('writeFile maps a null version to createIfAbsent', async () => {
  const fs = fakeFs({})
  const saved = await writeFile(fs, 'C:/notes', 'new.md', '# new', null, undefined)
  assert.equal(saved.operation, 'create')
  assert.equal(fs.writes.length, 1)
  assert.deepEqual(fs.writes[0].expected, { kind: 'createIfAbsent' })
})

test('writeFile maps a version to replaceIfVersion and rejects a stale one', async () => {
  const fs = fakeFs({ 'C:/notes/note.md': '# old' })
  const read = await readFile(fs, 'C:/notes', 'note.md', undefined)
  const saved = await writeFile(fs, 'C:/notes', 'note.md', '# new', read.version, undefined)
  assert.equal(saved.operation, 'update')
  assert.deepEqual(fs.writes[0].expected, { kind: 'replaceIfVersion', version: read.version })
  await assert.rejects(
    () => writeFile(fs, 'C:/notes', 'note.md', '# newer', read.version, undefined),
    /file changed since it was read/,
  )
})

test('writeFile refuses content above the size limit', async () => {
  const fs = fakeFs({})
  const huge = 'x'.repeat(4 * 1024 * 1024 + 1)
  await assert.rejects(() => writeFile(fs, 'C:/notes', 'big.md', huge, null, undefined), /4.194.304-byte|byte limit/)
})

test('writeFile refuses non-string content', async () => {
  const fs = fakeFs({})
  await assert.rejects(() => writeFile(fs, 'C:/notes', 'x.md', 42, null, undefined), /content must be a string/)
})

test('createEntry writes an empty file through the createIfAbsent primitive', async () => {
  const fs = fakeFs({})
  const created = await createEntry(fs, 'C:/notes', 'fresh.md', 'file', {})
  assert.deepEqual(created, { path: 'fresh.md', kind: 'file' })
  assert.equal(fs.writes.length, 1)
  assert.deepEqual(fs.writes[0].expected, { kind: 'createIfAbsent' })
  assert.equal(fs.writes[0].content, '')
  assert.equal(await fs.readText({ targetKey: 'C:/notes/fresh.md' }), '')
})

test('createEntry creates a nested file when its parent folder already exists', async () => {
  const fs = fakeFs({}, { directories: ['C:/notes', 'C:/notes/sub'] })
  const created = await createEntry(fs, 'C:/notes', 'sub/deep.md', 'file', {})
  assert.deepEqual(created, { path: 'sub/deep.md', kind: 'file' })
  assert.equal(fs.writes[0].key, 'C:/notes/sub/deep.md')
})

test('createEntry makes a directory through the injected mkdir', async () => {
  const fs = fakeFs({})
  const calls = []
  const created = await createEntry(fs, 'C:/notes', 'sub', 'directory', {
    mkdir: async (path, mkdirOptions) => {
      calls.push([path, mkdirOptions])
      return fs.mkdir({ targetKey: path }, mkdirOptions)
    },
  })
  assert.deepEqual(created, { path: 'sub', kind: 'directory' })
  assert.deepEqual(calls, [['C:/notes/sub', { recursive: false }]])
  const stat = await fs.stat({ targetKey: 'C:/notes/sub' })
  assert.equal(stat.type, 'directory')
  assert.equal(fs.writes.length, 0, 'directories must not go through writeText')
})

test('createEntry hands mkdir the subprocess path, never the opaque target key', async () => {
  // The Host contract says the target key is opaque: a sandboxed or remote
  // backend may use keys that are NOT openable paths. `processPath` is the only
  // value a subprocess may receive, so this fake makes the two deliberately
  // different and asserts the injected mkdir sees the subprocess path.
  const fs = fakeFs({}, { processPath: (key) => `P:\\${key.replace(/[^A-Za-z0-9]/g, '_')}` })
  const calls = []
  await createEntry(fs, 'C:/notes', 'sub', 'directory', {
    mkdir: async (path, mkdirOptions) => {
      calls.push([path, mkdirOptions])
    },
  })
  const resolved = await fs.resolve('C:/notes/sub')
  assert.notEqual(resolved.targetKey, fs.processPath(resolved), 'the fake must keep the two apart')
  assert.deepEqual(calls, [[fs.processPath(resolved), { recursive: false }]])
  assert.notEqual(calls[0][0], resolved.targetKey)
})

test('createEntry refuses a path that already exists, file or directory', async () => {
  const fs = fakeFs({ 'C:/notes/taken.md': '# taken' }, { directories: ['C:/notes', 'C:/notes/taken-dir'] })
  await assert.rejects(
    () => createEntry(fs, 'C:/notes', 'taken.md', 'file', {}),
    (error) => error.code === 'notes/exists',
  )
  await assert.rejects(
    () => createEntry(fs, 'C:/notes', 'taken-dir', 'directory', {}),
    (error) => error.code === 'notes/exists',
  )
  assert.equal(fs.writes.length, 0)
  assert.equal(fs.mkdirs.length, 0)
})

test('createEntry refuses a missing parent folder', async () => {
  const fs = fakeFs({})
  await assert.rejects(
    () => createEntry(fs, 'C:/notes', 'gone/deep.md', 'file', {}),
    (error) => error.code === 'notes/not-found',
  )
  await assert.rejects(
    () => createEntry(fs, 'C:/notes', 'gone/deep', 'directory', {}),
    (error) => error.code === 'notes/not-found',
  )
  assert.equal(fs.writes.length, 0)
  assert.equal(fs.mkdirs.length, 0)
})

test('createEntry rejects a traversal and the project root itself', async () => {
  const fs = fakeFs({})
  await assert.rejects(
    () => createEntry(fs, 'C:/notes', '../secret.md', 'file', {}),
    (error) => error.code === 'notes/bad-relative-path',
  )
  await assert.rejects(
    () => createEntry(fs, 'C:/notes', '', 'file', {}),
    (error) => error.code === 'notes/bad-relative-path',
  )
  assert.equal(fs.writes.length, 0)
})

test('createEntry refuses an unknown kind before touching the filesystem', async () => {
  const fs = fakeFs({})
  await assert.rejects(
    () => createEntry(fs, 'C:/notes', 'x.md', 'symlink', {}),
    (error) => error.code === 'notes/bad-kind',
  )
  assert.equal(fs.writes.length, 0)
  assert.equal(fs.mkdirs.length, 0)
})
