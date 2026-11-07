import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'

import {
  blameAtLine,
  containsPath,
  isIgnoredEntry,
  isMarkdownFile,
  normalizeProjectId,
  normalizeRelativePath,
  parseBlamePorcelain,
  parsePorcelainStatus,
  projectIdFor,
  resolveInside,
  shortHash,
  toFailure,
} from '../lib/pure.js'

test('isMarkdownFile accepts markdown extensions case-insensitively', () => {
  for (const name of ['a.md', 'A.MD', 'b.markdown', 'c.mdown', 'd.mkd', 'e.mdx', 'docs/x.md']) {
    assert.equal(isMarkdownFile(name), true, name)
  }
  for (const name of ['a.txt', 'b.md.txt', 'c', '', 'md', 'x.md.bak']) {
    assert.equal(isMarkdownFile(name), false, name)
  }
})

test('isIgnoredEntry skips dot entries and churn directories', () => {
  assert.equal(isIgnoredEntry('.git'), true)
  assert.equal(isIgnoredEntry('.obsidian'), true)
  assert.equal(isIgnoredEntry('node_modules'), true)
  assert.equal(isIgnoredEntry(''), true)
  assert.equal(isIgnoredEntry('notes'), false)
})

test('normalizeRelativePath collapses separators and dot segments', () => {
  assert.equal(normalizeRelativePath(''), '')
  assert.equal(normalizeRelativePath('.'), '')
  assert.equal(normalizeRelativePath('docs/a.md'), 'docs/a.md')
  assert.equal(normalizeRelativePath('docs\\a.md'), 'docs/a.md')
  assert.equal(normalizeRelativePath('./docs//a.md'), 'docs/a.md')
  assert.equal(normalizeRelativePath('  docs/a.md  '), 'docs/a.md')
})

test('normalizeRelativePath rejects escapes', () => {
  const cases = [
    ['/etc/passwd', 'notes/bad-relative-path'],
    ['\\windows\\system32', 'notes/bad-relative-path'],
    ['C:/Users/x', 'notes/bad-relative-path'],
    ['//server/share', 'notes/bad-relative-path'],
    ['docs/../secret.md', 'notes/bad-relative-path'],
    ['..', 'notes/bad-relative-path'],
    [42, 'notes/bad-relative-path'],
  ]
  for (const [input, code] of cases) {
    assert.throws(() => normalizeRelativePath(input), (error) => error.code === code, String(input))
  }
})

test('containsPath uses segment semantics, not string prefixes', () => {
  const root = path.resolve('C:/workspace/proj')
  assert.equal(containsPath(root, root), true)
  assert.equal(containsPath(root, path.join(root, 'a.md')), true)
  assert.equal(containsPath(root, path.join(root, 'docs', 'a.md')), true)
  assert.equal(containsPath(root, path.resolve('C:/workspace/proj2/a.md')), false)
  assert.equal(containsPath(root, path.resolve('C:/workspace')), false)
  assert.equal(containsPath(root, path.resolve('C:/other/a.md')), false)
})

test('resolveInside keeps paths inside the root and refuses escapes', () => {
  const root = path.resolve('C:/workspace/proj')
  assert.equal(resolveInside(root, 'a.md'), path.join(root, 'a.md'))
  assert.equal(resolveInside(root, 'docs/b.md'), path.join(root, 'docs', 'b.md'))
  assert.equal(resolveInside(root, ''), root)
  // lexical escape is rejected before touching the filesystem
  assert.throws(() => resolveInside(root, '../x.md'), (error) => error.code === 'notes/bad-relative-path')
})

test('parsePorcelainStatus reads NUL separated records', () => {
  const raw = [' M docs/a.md', 'A  docs/b.md', '?? docs/c.md', '!! build/x.md', 'D  docs/d.md'].join('\u0000') + '\u0000'
  const entries = parsePorcelainStatus(raw)
  assert.equal(entries.length, 5)
  assert.deepEqual(entries[0], { path: 'docs/a.md', index: ' ', worktree: 'M', kind: 'modified' })
  assert.equal(entries[1].kind, 'added')
  assert.equal(entries[2].kind, 'untracked')
  assert.equal(entries[3].kind, 'ignored')
  assert.equal(entries[4].kind, 'deleted')
})

test('parsePorcelainStatus consumes the paired path of a rename', () => {
  const raw = ['R  docs/new.md', 'docs/old.md', 'M  keep.md'].join('\u0000')
  const entries = parsePorcelainStatus(raw)
  assert.equal(entries.length, 2)
  assert.equal(entries[0].kind, 'renamed')
  assert.equal(entries[0].path, 'docs/new.md')
  assert.equal(entries[0].from, 'docs/old.md')
  assert.equal(entries[1].path, 'keep.md')
})

test('parsePorcelainStatus marks conflicts', () => {
  const entries = parsePorcelainStatus('UU docs/a.md\u0000AU docs/b.md\u0000')
  assert.equal(entries.length, 2)
  assert.equal(entries[0].kind, 'conflicted')
  assert.equal(entries[1].kind, 'conflicted')
})

test('parsePorcelainStatus tolerates empty output', () => {
  assert.deepEqual(parsePorcelainStatus(''), [])
  assert.deepEqual(parsePorcelainStatus(undefined), [])
})

test('parseBlamePorcelain extracts per-line metadata', () => {
  const raw = [
    '0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f 1 1 2',
    'author Alice',
    'author-mail <alice@example.com>',
    'author-time 1700000000',
    'author-tz +0800',
    'summary add notes',
    'filename docs/a.md',
    '\tfirst line',
    '0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f 2 2',
    'author Bob',
    'author-time 1700000100',
    'summary second commit',
    '\tsecond line',
    '1111111111111111111111111111111111111111 3 3 1',
    'author Alice',
    'author-time 1700000200',
    'summary third',
    '\tthird line',
    '',
  ].join('\n')
  const entries = parseBlamePorcelain(raw)
  assert.equal(entries.length, 3)
  assert.deepEqual(entries[0], {
    sha: '0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f',
    line: 1,
    finalLine: 1,
    author: 'Alice',
    authorTime: 1700000000,
    summary: 'add notes',
  })
  assert.equal(entries[1].finalLine, 2)
  assert.equal(entries[2].sha, '1111111111111111111111111111111111111111')
})

test('parseBlamePorcelain keeps 64 character object ids', () => {
  const sha = 'a'.repeat(64)
  const entries = parseBlamePorcelain(`${sha} 1 1\n\ta\n`)
  assert.equal(entries.length, 1)
  assert.equal(entries[0].sha, sha)
})

test('parseBlamePorcelain tolerates empty output', () => {
  assert.deepEqual(parseBlamePorcelain(''), [])
  assert.deepEqual(parseBlamePorcelain(undefined), [])
})

test('blameAtLine selects by final line number', () => {
  const entries = parseBlamePorcelain(
    ['aaa1111 1 1', 'author A', '\tx', 'bbb2222 4 7', 'author B', '\ty', ''].join('\n'),
  )
  assert.equal(blameAtLine(entries, 7).author, 'B')
  assert.equal(blameAtLine(entries, 1).author, 'A')
  assert.equal(blameAtLine(entries, 99), undefined)
  assert.equal(blameAtLine(undefined, 1), undefined)
})

test('normalizeProjectId validates the id shape', () => {
  assert.equal(normalizeProjectId('notes-abc123'), 'notes-abc123')
  assert.equal(normalizeProjectId('  A_b-9  '), 'A_b-9')
  for (const bad of ['', '../x', 'a/b', 'a b', '-lead', 7]) {
    assert.throws(() => normalizeProjectId(bad), (error) => error.code === 'notes/bad-project-id', String(bad))
  }
})

test('projectIdFor is stable and path-unique', () => {
  const a = projectIdFor('C:/workspace/Notes')
  const b = projectIdFor('C:/workspace/Notes')
  const c = projectIdFor('D:/workspace/Notes')
  assert.equal(a, b)
  assert.notEqual(a, c)
  assert.match(a, /^notes-[0-9a-f]{8}$/)
  assert.equal(normalizeProjectId(a), a)
})

test('shortHash is deterministic and case-insensitive', () => {
  assert.equal(shortHash('ABC'), shortHash('abc'))
  assert.match(shortHash('x'), /^[0-9a-f]{8}$/)
  assert.notEqual(shortHash('x'), shortHash('y'))
})

test('toFailure only surfaces notes/ codes', () => {
  const own = Object.assign(new Error('bad'), { code: 'notes/outside-root' })
  assert.deepEqual(toFailure(own, 'notes/internal'), { code: 'notes/outside-root', message: 'bad' })
  const foreign = Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
  assert.deepEqual(toFailure(foreign, 'notes/internal'), { code: 'notes/internal', message: 'ENOENT' })
  assert.deepEqual(toFailure('boom', 'notes/internal'), { code: 'notes/internal', message: 'boom' })
})
