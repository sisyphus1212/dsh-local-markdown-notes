import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildNotesTools, registerNotesTools } from '../lib/tools.js'

const PROJECTS = [
  { id: 'p-ovs', name: 'ovs学习', rootPath: 'D:\\dpu 资料\\ovs学习', gitInitialized: true },
  { id: 'p-work', name: '工作笔记', rootPath: 'C:\\work\\notes', gitInitialized: true },
]

/**
 * A stand-in for `NotesRemote` that records every call, so the tests can assert
 * both the delegation target and the exact arguments a tool forwarded.
 */
function fakeRemote(overrides = {}) {
  const calls = []
  const record = (method) => async (...args) => {
    calls.push({ method, args })
    const handler = overrides[method]
    if (handler !== undefined) return handler(...args)
    return { projects: PROJECTS }
  }
  return {
    calls,
    listProjects: record('listProjects'),
    listEntries: record('listEntries'),
    readFile: record('readFile'),
    writeFile: record('writeFile'),
    searchNotes: record('searchNotes'),
  }
}

function byName(tools, name) {
  const tool = tools.find((entry) => entry.name === name)
  assert.ok(tool !== undefined, `${name} is missing`)
  return tool
}

test('every tool declares a JSON-Schema object with the required keys', () => {
  const tools = buildNotesTools(fakeRemote())
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ['notes_projects', 'notes_list', 'notes_read', 'notes_write', 'notes_append', 'notes_search'],
  )
  assert.equal(new Set(tools.map((tool) => tool.name)).size, tools.length, 'tool names must be unique')

  for (const tool of tools) {
    assert.equal(typeof tool.description, 'string')
    assert.ok(tool.description.length > 10, `${tool.name} needs a useful description`)
    assert.equal(tool.parameters.type, 'object')
    assert.equal(tool.parameters.additionalProperties, false)
    assert.equal(typeof tool.execute, 'function')
    assert.equal(typeof tool.output.render, 'function')
    assert.equal(tool.output.schema.type, 'object')

    for (const required of tool.parameters.required ?? []) {
      assert.ok(
        Object.hasOwn(tool.parameters.properties, required),
        `${tool.name} requires "${required}" but does not declare it`,
      )
    }
  }
})

test('notes_projects reports the imported folders without touching a file', async () => {
  const remote = fakeRemote()
  const tool = byName(buildNotesTools(remote), 'notes_projects')
  const result = await tool.execute({})

  assert.deepEqual(
    result.projects.map((item) => item.name),
    ['ovs学习', '工作笔记'],
  )
  assert.deepEqual(remote.calls.map((call) => call.method), ['listProjects'])
})

test('a single folder needs no project argument', async () => {
  const remote = fakeRemote({ listProjects: async () => ({ projects: [PROJECTS[0]] }) })
  const tool = byName(buildNotesTools(remote), 'notes_read')
  await tool.execute({ path: 'a.md' })
  assert.deepEqual(remote.calls.at(-1), { method: 'readFile', args: ['p-ovs', 'a.md'] })
})

test('several folders require an explicit project instead of guessing', async () => {
  const tool = byName(buildNotesTools(fakeRemote()), 'notes_read')
  await assert.rejects(() => tool.execute({ path: 'a.md' }), /多个笔记文件夹/)
})

test('an ambiguous partial name is refused rather than resolved to the first match', async () => {
  const remote = fakeRemote({
    listProjects: async () => ({
      projects: [
        { id: 'p1', name: '工作笔记 2025', rootPath: 'C:\\a' },
        { id: 'p2', name: '工作笔记 2026', rootPath: 'C:\\b' },
      ],
    }),
  })
  const tool = byName(buildNotesTools(remote), 'notes_read')
  await assert.rejects(() => tool.execute({ path: 'a.md', project: '工作笔记' }), /多个笔记文件夹（工作笔记 2025、工作笔记 2026）/)
})

test('the project argument accepts an id, an exact name or one partial match', async () => {
  const remote = fakeRemote({ listEntries: async (_projectId, path) => ({ path, entries: [] }) })
  const tool = byName(buildNotesTools(remote), 'notes_list')

  await tool.execute({ project: 'p-work' })
  await tool.execute({ project: '工作笔记' })
  await tool.execute({ project: '笔记' })
  await tool.execute({ project: '  OVS学习  ' })

  assert.deepEqual(
    remote.calls.filter((call) => call.method === 'listEntries').map((call) => call.args[0]),
    ['p-work', 'p-work', 'p-work', 'p-ovs'],
  )
})

test('an unknown project names the folders that do exist', async () => {
  const tool = byName(buildNotesTools(fakeRemote()), 'notes_list')
  await assert.rejects(() => tool.execute({ project: '不存在' }), /找不到笔记文件夹「不存在」。现有：ovs学习、工作笔记。/)
})

test('no imported folder at all points the user at the import button', async () => {
  const tool = byName(buildNotesTools(fakeRemote({ listProjects: async () => ({ projects: [] }) })), 'notes_list')
  await assert.rejects(() => tool.execute({}), /还没有导入任何笔记文件夹/)
})

test('notes_list returns one level by default and may recurse', async () => {
  const tree = {
    '': [
      { name: 'docs', path: 'docs', type: 'directory' },
      { name: 'a.md', path: 'a.md', type: 'file', size: 12 },
    ],
    docs: [{ name: 'b.md', path: 'docs/b.md', type: 'file', size: 34 }],
  }
  const remote = fakeRemote({
    listProjects: async () => ({ projects: [PROJECTS[0]] }),
    listEntries: async (_projectId, path) => ({ path, entries: tree[path] ?? [] }),
  })
  const tool = byName(buildNotesTools(remote), 'notes_list')

  const flat = await tool.execute({})
  assert.deepEqual(flat.entries.map((entry) => entry.path), ['docs', 'a.md'])
  assert.deepEqual(flat.entries.map((entry) => entry.depth), [0, 0])

  const deep = await tool.execute({ recursive: true })
  assert.deepEqual(deep.entries.map((entry) => entry.path), ['docs', 'a.md', 'docs/b.md'])
  assert.equal(deep.entries.at(-1).depth, 1)
})

test('notes_read forwards the version the writer must send back', async () => {
  const remote = fakeRemote({
    listProjects: async () => ({ projects: [PROJECTS[0]] }),
    readFile: async (_projectId, path) => ({ path, content: '# hi\n', version: 'v7', size: 5 }),
  })
  const tool = byName(buildNotesTools(remote), 'notes_read')
  const result = await tool.execute({ path: 'a.md' })
  assert.deepEqual(result, {
    project: 'ovs学习',
    path: 'a.md',
    version: 'v7',
    size: 5,
    content: '# hi\n',
  })
})

test('notes_write creates without a version and rewrites with one', async () => {
  const remote = fakeRemote({
    listProjects: async () => ({ projects: [PROJECTS[0]] }),
    writeFile: async (_projectId, path, content, expectedVersion) => ({
      path,
      content,
      version: expectedVersion === null ? 'v1' : 'v2',
      operation: expectedVersion === null ? 'create' : 'update',
    }),
  })
  const tool = byName(buildNotesTools(remote), 'notes_write')

  const created = await tool.execute({ path: 'a.md', content: 'hello' })
  assert.equal(created.operation, 'create')
  assert.equal(created.size, 5)
  assert.deepEqual(remote.calls.at(-1).args, ['p-ovs', 'a.md', 'hello', null])

  const updated = await tool.execute({ path: 'a.md', content: 'hello again', expectedVersion: 'v1' })
  assert.equal(updated.operation, 'update')
  assert.equal(updated.version, 'v2')
  assert.deepEqual(remote.calls.at(-1).args, ['p-ovs', 'a.md', 'hello again', 'v1'])
})

test('notes_append creates a missing note instead of failing', async () => {
  const written = []
  const remote = fakeRemote({
    listProjects: async () => ({ projects: [PROJECTS[0]] }),
    readFile: async (_projectId, path) => {
      const error = new Error('missing')
      error.code = 'notes/not-found'
      throw error
    },
    writeFile: async (_projectId, path, content, expectedVersion) => {
      written.push({ path, content, expectedVersion })
      return { path, content, version: 'v1', operation: 'create' }
    },
  })
  const tool = byName(buildNotesTools(remote), 'notes_append')
  const result = await tool.execute({ path: 'new.md', text: '第一条' })

  assert.equal(result.operation, 'create')
  assert.deepEqual(written, [{ path: 'new.md', content: '第一条\n', expectedVersion: null }])
})

test('notes_append keeps the existing body and sends its version back', async () => {
  const written = []
  const remote = fakeRemote({
    listProjects: async () => ({ projects: [PROJECTS[0]] }),
    readFile: async (_projectId, path) => ({ path, content: '# 标题\n', version: 'v3', size: 6 }),
    writeFile: async (_projectId, path, content, expectedVersion) => {
      written.push({ path, content, expectedVersion })
      return { path, content, version: 'v4', operation: 'update' }
    },
  })
  const tool = byName(buildNotesTools(remote), 'notes_append')

  await tool.execute({ path: 'a.md', text: '追加一行' })
  assert.deepEqual(written, [{ path: 'a.md', content: '# 标题\n\n追加一行\n', expectedVersion: 'v3' }])

  await tool.execute({ path: 'a.md', text: '再一行' })
  assert.equal(written.at(-1).content, '# 标题\n\n再一行\n', 'the existing body is re-read each call')
})

test('notes_append does not swallow a real read failure', async () => {
  const remote = fakeRemote({
    listProjects: async () => ({ projects: [PROJECTS[0]] }),
    readFile: async () => {
      const error = new Error('outside the project root')
      error.code = 'notes/outside-root'
      throw error
    },
  })
  const tool = byName(buildNotesTools(remote), 'notes_append')
  await assert.rejects(() => tool.execute({ path: '../escape.md', text: 'x' }), /outside the project root/)
})

test('notes_append refuses empty text', async () => {
  const remote = fakeRemote({ listProjects: async () => ({ projects: [PROJECTS[0]] }) })
  const tool = byName(buildNotesTools(remote), 'notes_append')
  await assert.rejects(() => tool.execute({ path: 'a.md', text: '' }), /text 不能为空/)
})

test('notes_search forwards the query and reports coverage', async () => {
  const remote = fakeRemote({
    listProjects: async () => ({ projects: [PROJECTS[0]] }),
    searchNotes: async (_projectId, query) => ({
      query,
      hits: [{ path: 'a.md', line: 2, column: 0, text: 'alpha beta' }],
      scanned: 1,
      matched: 1,
      truncated: false,
    }),
  })
  const tool = byName(buildNotesTools(remote), 'notes_search')
  const result = await tool.execute({ query: 'alpha' })
  assert.deepEqual(remote.calls.at(-1).args, ['p-ovs', 'alpha'])
  assert.equal(result.hits.length, 1)
  assert.equal(result.scanned, 1)
  assert.equal(result.truncated, false)
})

test('registerNotesTools registers each tool inside the tools scope and ties it to the context', () => {
  const registered = []
  const effects = []
  const ctx = {
    inject(services, callback) {
      assert.deepEqual(services, ['tools'])
      callback({
        tools: { register: (tool) => registered.push(tool) },
        // Cordis runs the effect factory immediately and keeps its return value
        // as the disposer, so the fake must call it too.
        effect: (factory) => {
          effects.push(factory)
          return factory()
        },
      })
    },
  }

  const names = registerNotesTools(ctx, fakeRemote())
  assert.equal(names.length, 6)
  assert.deepEqual(registered.map((tool) => tool.name), names)
  assert.equal(effects.length, 6, 'each registration must be owned by a context effect')
})

test('the plugin entry registers the tools next to the remote service', async () => {
  const { readFileSync } = await import('node:fs')
  const { dirname, join } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const here = dirname(fileURLToPath(import.meta.url))
  const source = readFileSync(join(here, '..', 'index.js'), 'utf8')

  assert.match(source, /import \{ registerNotesTools \} from '\.\/lib\/tools\.js'/)
  assert.match(source, /registerNotesTools\(ctx, remote\)/)
  assert.match(source, /const \{ remote, domain \} = await createNotesRemote\(ctx\)/)
})
