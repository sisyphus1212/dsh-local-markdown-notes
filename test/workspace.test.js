/**
 * Behavioural tests for the project-scoped file helpers, driven by a fake `fs`
 * that mimics `@deepseek-ai/dsh-fs-local` closely enough to exercise the paths
 * that matter: containment, Markdown filtering, size limits and the mapping from
 * an expected version to the storage primitive's expectation object.
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeRelativePath } from '../lib/pure.js'
import { readFile, listEntries, resolveEntry, writeFile } from '../lib/workspace.js'

/** A minimal in-memory filesystem: paths are plain POSIX-ish strings. */
function fakeFs(initial, options = {}) {
  const files = new Map(Object.entries(initial))
  const directories = new Set(options.directories ?? ['C:/notes'])
  const links = new Map(Object.entries(options.links ?? {}))
  const writes = []
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
