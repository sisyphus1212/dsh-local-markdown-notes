import assert from 'node:assert/strict'
import { test } from 'node:test'

import { MAX_HITS, MAX_SCANNED_FILES, WINDOW_CHARS, searchProject } from '../lib/search.js'
import { MAX_FILE_BYTES } from '../lib/workspace.js'

/**
 * A filesystem double shaped exactly like the one `lib/workspace.js` tests use:
 * absolute POSIX-looking keys, a synchronous `resolve`, string-prefix
 * containment, and async `stat`/`listDir`/`readText`. It also records every
 * call, which is how the "an empty query reads nothing" test can prove the
 * short circuit instead of guessing from the result.
 */
function fakeFs(initial, options = {}) {
  const files = new Map(Object.entries(initial))
  const explicitDirs = new Set(options.directories ?? [])
  const links = new Map(Object.entries(options.links ?? {}))
  const sizes = new Map(Object.entries(options.sizes ?? {}))
  const calls = { listDir: [], stat: [], readText: [] }

  const normalise = (value) => String(value).replace(/\\/g, '/').replace(/\/+$/, '') || '/'
  const deref = (value) => {
    let current = normalise(value)
    for (let hop = 0; hop < 8; hop += 1) {
      const next = links.get(current)
      if (next === undefined) return current
      current = normalise(next)
    }
    return current
  }
  const resolve = (path) => {
    const targetKey = deref(path)
    return { targetKey, displayPath: targetKey }
  }
  const contains = (parent, child) => {
    const outer = deref(parent?.targetKey ?? parent)
    const inner = deref(child?.targetKey ?? child)
    return inner === outer || inner.startsWith(`${outer}/`)
  }
  const allDirs = () => {
    const set = new Set(explicitDirs)
    for (const path of [...files.keys(), ...links.keys()]) {
      const parts = normalise(path).split('/')
      for (let index = 1; index < parts.length; index += 1) set.add(parts.slice(0, index).join('/'))
    }
    return set
  }

  async function stat(target, signal) {
    const id = deref(target?.targetKey ?? target)
    calls.stat.push({ target: id, signal })
    if (files.has(id)) {
      const content = files.get(id)
      const size = sizes.get(id) ?? content.length
      return { version: `v-${content.length}`, type: 'file', size }
    }
    if (allDirs().has(id)) return { version: 'dir', type: 'directory', size: 0 }
    return undefined
  }

  async function listDir(target, signal) {
    const id = deref(target?.targetKey ?? target)
    calls.listDir.push({ target: id, signal })
    const prefix = id === '/' ? '/' : `${id}/`
    const found = new Map()
    for (const [path, content] of files) {
      if (!path.startsWith(prefix)) continue
      const rest = path.slice(prefix.length)
      if (rest === '') continue
      const [head, ...tail] = rest.split('/')
      if (tail.length > 0) continue
      found.set(head, {
        name: head,
        type: 'file',
        target: resolve(path),
        version: `v-${content.length}`,
        size: sizes.get(path) ?? content.length,
      })
    }
    for (const path of allDirs()) {
      if (!path.startsWith(prefix)) continue
      const rest = path.slice(prefix.length)
      if (rest === '' || rest.includes('/')) continue
      if (!found.has(rest)) {
        found.set(rest, { name: rest, type: 'directory', target: resolve(`${prefix}${rest}`) })
      }
    }
    for (const path of links.keys()) {
      if (!path.startsWith(prefix)) continue
      const rest = path.slice(prefix.length)
      if (rest === '' || rest.includes('/')) continue
      found.set(rest, { name: rest, type: 'file', target: resolve(path) })
    }
    return [...found.values()]
  }

  async function readText(target, signal) {
    const id = deref(target?.targetKey ?? target)
    calls.readText.push({ target: id, signal })
    if (!files.has(id)) throw new Error(`ENOENT ${id}`)
    return files.get(id)
  }

  return { calls, resolve, contains, stat, listDir, readText }
}

const ROOT = 'C:/notes'

test('an empty or non-string query returns an empty result without touching disk', async () => {
  for (const query of ['', '   ', '\n\t ', undefined, null, 42, {}, ['a']]) {
    const fs = fakeFs({ [`${ROOT}/a.md`]: 'needle' })
    const result = await searchProject(fs, ROOT, query)
    assert.deepEqual(result, { query: '', hits: [], scanned: 0, matched: 0, truncated: false })
    assert.deepEqual(fs.calls, { listDir: [], stat: [], readText: [] }, `${String(query)} must not read`)
  }
})

test('hits carry 1-based line numbers and slash-separated project paths', async () => {
  const fs = fakeFs({
    [`${ROOT}/a.md`]: '# Title\nbody line\nthe needle sits here\n',
    [`${ROOT}/sub/deep.md`]: 'first needle\nsecond line\nthird needle\n',
    [`${ROOT}/quiet.md`]: 'nothing to see\n',
  })
  const result = await searchProject(fs, ROOT, 'needle')

  assert.equal(result.query, 'needle')
  assert.equal(result.matched, 2, 'two files contain the needle')
  assert.equal(result.truncated, false)
  assert.deepEqual(
    result.hits.map((hit) => [hit.path, hit.line]),
    [
      ['a.md', 3],
      ['sub/deep.md', 1],
      ['sub/deep.md', 3],
    ],
  )
  for (const hit of result.hits) {
    assert.ok(!hit.path.includes('\\'), 'paths travel with forward slashes')
    assert.equal(typeof hit.text, 'string')
    assert.ok(hit.column >= 0 && hit.column < hit.text.length)
  }
  assert.equal(result.hits[0].text, 'the needle sits here')
  assert.equal(result.hits[0].column, 4)
})

test('matching ignores case while the emitted text keeps the original spelling', async () => {
  const fs = fakeFs({ [`${ROOT}/readme.md`]: '# Title\nno match on this line\n' })
  const result = await searchProject(fs, ROOT, 'TITLE')

  assert.equal(result.hits.length, 1)
  assert.equal(result.hits[0].line, 1)
  assert.equal(result.hits[0].text, '# Title', 'the source casing survives')
  assert.equal(result.hits[0].column, 2, 'the column is the offset of the match inside the window')
  assert.equal(result.hits[0].text.slice(result.hits[0].column, result.hits[0].column + 5), 'Title')
})

test('ignored directories, dot entries and non-Markdown files are never read', async () => {
  const fs = fakeFs({
    [`${ROOT}/keep.md`]: 'needle here\n',
    [`${ROOT}/.git/config.md`]: 'needle in git\n',
    [`${ROOT}/node_modules/pkg/readme.md`]: 'needle in node_modules\n',
    [`${ROOT}/.hidden.md`]: 'needle in a dotfile\n',
    [`${ROOT}/notes.txt`]: 'needle in plain text\n',
    [`${ROOT}/script.js`]: 'needle in code\n',
  })
  const result = await searchProject(fs, ROOT, 'needle')

  assert.deepEqual(result.hits.map((hit) => hit.path), ['keep.md'])
  assert.equal(result.matched, 1)
  assert.deepEqual(fs.calls.readText.map((entry) => entry.target), [`${ROOT}/keep.md`])
})

test(`hit collection stops at MAX_HITS (${MAX_HITS}) and reports truncation`, async () => {
  const lines = Array.from({ length: MAX_HITS + 40 }, (_, index) => `line ${index + 1} needle`)
  const fs = fakeFs({ [`${ROOT}/many.md`]: `${lines.join('\n')}\n` })
  const result = await searchProject(fs, ROOT, 'needle')

  assert.equal(result.truncated, true)
  assert.equal(result.hits.length, MAX_HITS)
  assert.equal(result.hits.at(-1).line, MAX_HITS, 'the first MAX_HITS lines are the ones kept')
})

test('a file over MAX_FILE_BYTES is skipped but still counted as scanned', async () => {
  const fs = fakeFs(
    {
      [`${ROOT}/huge.md`]: 'needle\n',
      [`${ROOT}/small.md`]: 'needle\n',
    },
    { sizes: { [`${ROOT}/huge.md`]: MAX_FILE_BYTES + 1 } },
  )
  const result = await searchProject(fs, ROOT, 'needle')

  assert.equal(result.scanned, 2, 'the oversized file still counts as scanned')
  assert.deepEqual(result.hits.map((hit) => hit.path), ['small.md'])
  assert.deepEqual(fs.calls.readText.map((entry) => entry.target), [`${ROOT}/small.md`], 'no read of the huge file')
})

test('a long line is clipped to a window that still contains the match', async () => {
  const line = `${'a'.repeat(500)}needle${'b'.repeat(500)}`
  const fs = fakeFs({ [`${ROOT}/long.md`]: `${line}\n` })
  const result = await searchProject(fs, ROOT, 'needle')

  assert.equal(result.hits.length, 1)
  const [hit] = result.hits
  assert.ok(hit.text.length <= WINDOW_CHARS, `window is ${hit.text.length} chars, cap is ${WINDOW_CHARS}`)
  assert.ok(hit.text.startsWith('…'), 'a clipped head is marked')
  assert.ok(hit.text.endsWith('…'), 'a clipped tail is marked')
  assert.ok(hit.column >= 0 && hit.column < hit.text.length)
  assert.equal(hit.text.slice(hit.column, hit.column + 'needle'.length), 'needle')
  assert.equal(hit.line, 1)
})

test('a path leaving the root through a link is skipped instead of searched', async () => {
  const fs = fakeFs(
    { [`${ROOT}/inside.md`]: 'needle inside\n', 'C:/elsewhere/secret.md': 'needle outside\n' },
    { links: { [`${ROOT}/escape.md`]: 'C:/elsewhere/secret.md' } },
  )
  const result = await searchProject(fs, ROOT, 'needle')

  assert.deepEqual(result.hits.map((hit) => hit.path), ['inside.md'])
  assert.ok(!fs.calls.readText.some((entry) => entry.target === 'C:/elsewhere/secret.md'))
})

test('the signal reaches every filesystem call', async () => {
  const fs = fakeFs({ [`${ROOT}/a.md`]: 'needle\n', [`${ROOT}/sub/b.md`]: 'needle again\n' })
  const controller = new AbortController()
  const { signal } = controller
  await searchProject(fs, ROOT, 'needle', { signal })

  assert.ok(fs.calls.listDir.length > 0)
  assert.ok(fs.calls.stat.length > 0)
  assert.ok(fs.calls.readText.length > 0)
  for (const entry of [...fs.calls.listDir, ...fs.calls.stat]) assert.equal(entry.signal, signal)
  for (const entry of fs.calls.readText) assert.equal(entry.signal, signal)
})

test('the scan cap is exported and bounded', () => {
  assert.equal(MAX_SCANNED_FILES, 2000)
  assert.equal(MAX_HITS, 200)
  assert.equal(WINDOW_CHARS, 240)
})

test('sibling directories are listed at the same time, never more than four', async () => {
  const files = {}
  for (const folder of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) files[`${ROOT}/${folder}/note.md`] = `needle in ${folder}\n`
  const fs = fakeFs(files)

  const original = fs.listDir
  const real = fs.listDir.bind(fs)
  let inFlight = 0
  let peak = 0
  fs.listDir = async (target, signal) => {
    inFlight += 1
    peak = Math.max(peak, inFlight)
    // A macrotask is what gives the lanes a chance to actually overlap; a
    // microtask-only yield would let every listing finish before the next starts.
    await new Promise((resolve) => setTimeout(resolve, 5))
    try {
      return await real(target, signal)
    } finally {
      inFlight -= 1
    }
  }

  const result = await searchProject(fs, ROOT, 'needle')

  assert.equal(result.matched, 7)
  assert.ok(peak > 1, `the walk overlapped sibling listings (peak ${peak})`)
  assert.ok(peak <= 4, `the walk never opened more than four lanes (peak ${peak})`)
  assert.ok(original !== fs.listDir)
})

test('the walk keeps breadth-first order and one file per path', async () => {
  const fs = fakeFs({
    [`${ROOT}/a.md`]: 'needle\n',
    [`${ROOT}/a/deep.md`]: 'needle\n',
    [`${ROOT}/a/b/deeper.md`]: 'needle\n',
    [`${ROOT}/b.md`]: 'needle\n',
    [`${ROOT}/b/deep.md`]: 'needle\n',
  })
  const result = await searchProject(fs, ROOT, 'needle')

  assert.deepEqual(
    result.hits.map((hit) => hit.path),
    ['a.md', 'b.md', 'a/deep.md', 'b/deep.md', 'a/b/deeper.md'],
    'files of one depth come before the next depth, each depth sorted by name',
  )
  assert.equal(result.matched, 5)
})

