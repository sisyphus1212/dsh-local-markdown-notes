import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(here, '..', 'client.js'), 'utf8')

const NS = 'local-markdown-notes'
const MOUNT_LOG = '[notes] remote mount failed'

/** Evaluate client.js against a minimal ModuleLoader/document/locale/slots double. */
function loadClient() {
  let loaded = null
  const styles = []
  const logs = []

  const document = {
    createElement() {
      return { dataset: {}, textContent: '' }
    },
    head: { append(element) { styles.push(element) } },
  }
  styles.remove = () => {}

  const window = {
    __ModuleLoader__: {
      load(definition) { loaded = definition },
    },
  }

  const consoleDouble = {
    error(...args) { logs.push(args) },
    warn() {},
    log() {},
  }

  const sandbox = { window, document, console: consoleDouble, setTimeout, clearTimeout }
  sandbox.globalThis = sandbox
  vm.runInNewContext(source, sandbox, { filename: 'client.js' })

  assert.ok(loaded !== null, 'client.js must call window.__ModuleLoader__.load')
  assert.equal(loaded.id, '@local/local-markdown-notes')

  const react = {
    createElement(type, props, ...children) {
      return { type, props: props ?? {}, children }
    },
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: () => {},
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useRef: (initial) => ({ current: initial }),
    Fragment: 'fragment',
  }

  const plugin = loaded.factory((id) => {
    if (id === 'react') return react
    throw new Error(`unexpected require(${id})`)
  })

  return { plugin, styles, logs }
}

/**
 * Minimal Cordis-ish ctx that records every registration.
 *
 * `$mount` is async, exactly like `api-gateway`'s, so these tests exercise the
 * real sequencing: `remote.notes` only exists once the mount has resolved.
 */
function fakeCtx(options = {}) {
  const { mountFails = null, namespace = undefined } = options
  const record = {
    effects: [],
    locales: [],
    slots: [],
    mounts: [],
    injected: [],
    unmounts: 0,
  }

  const ctx = {
    effect(factory, label) {
      record.effects.push({ label, dispose: factory() })
      return () => {}
    },
    locale: {
      register(namespace, dictionaries) {
        record.locales.push({ namespace, dictionaries })
        return () => {}
      },
      bind(namespace) {
        return (key) => `${namespace}:${key}`
      },
    },
    remote: {
      async $mount(contribution) {
        record.mounts.push(contribution)
        if (mountFails !== null) throw mountFails
        return () => {
          record.unmounts += 1
        }
      },
    },
    slots: {
      inject(name, factory) {
        record.injected.push(name)
        return factory()
      },
      register(options, component) {
        record.slots.push({ options, component })
        return () => {}
      },
    },
    get(name) {
      return name === 'remote.notes' ? namespace : undefined
    },
  }

  return { ctx, record }
}

/** The `{api, t}` the main slot hands the panel component. */
function mainInjection(record) {
  const main = record.slots.find((slot) => slot.options.name === 'main')
  assert.ok(main, 'main registration exists')
  return main.options.inject()
}

/** Every primitive leaf of a react-double element tree, in order. */
function leaves(node) {
  if (node === null || node === undefined || node === false) return []
  if (Array.isArray(node)) return node.flatMap((child) => leaves(child))
  if (typeof node !== 'object') return [String(node)]
  return (node.children ?? []).flatMap((child) => leaves(child))
}

test('client bundle loads through the module loader with the package id', () => {
  const { plugin } = loadClient()
  assert.equal(typeof plugin.apply, 'function')
  assert.ok(Array.isArray(plugin.inject))
  assert.deepEqual([...plugin.inject], ['slots', 'locale', 'remote'])
})

test('client apply registers the locale dictionary, style, remote mount and both slots', async () => {
  const { plugin, styles } = loadClient()
  const { ctx, record } = fakeCtx()

  await plugin.apply(ctx)

  assert.equal(record.locales.length, 1)
  assert.equal(record.locales[0].namespace, NS)
  assert.ok(Object.keys(record.locales[0].dictionaries.zh).length > 30)
  assert.ok(Object.keys(record.locales[0].dictionaries.en).length > 30)

  assert.equal(styles.length, 1, 'one <style> element is appended')
  assert.ok(styles[0].textContent.includes('.lmn-root'))

  assert.equal(record.mounts.length, 1)
  assert.equal(record.mounts[0].package, '@local/local-markdown-notes')
  assert.equal(record.mounts[0].descriptors.length, 9)

  assert.deepEqual([...record.injected], ['sidebar.panellist', 'main'])
  assert.equal(record.slots.length, 2)
})

test('apply awaits the Remote mount before registering the panel and disposes it on teardown', async () => {
  const { plugin } = loadClient()
  const { ctx, record } = fakeCtx()

  let mountStarted = false
  const originalMount = ctx.remote.$mount
  ctx.remote.$mount = async (contribution) => {
    mountStarted = true
    // Slots must not exist yet: the namespace appears only on resolve.
    assert.equal(record.slots.length, 0, 'slots must not register before $mount resolves')
    return originalMount(contribution)
  }

  await plugin.apply(ctx)

  assert.equal(mountStarted, true, '$mount must run inside apply')
  assert.equal(record.slots.length, 2, 'slots register only after a successful mount')

  const teardown = record.effects.find((effect) => effect.label === 'local-markdown-notes: unmount notes Remote')
  assert.ok(teardown, 'the mount disposer is owned by an effect')
  teardown.dispose()
  assert.equal(record.unmounts, 1, 'teardown unmounts the Remote')
})

test('a resolved mount yields an api that reaches the remote.notes namespace', async () => {
  const { plugin } = loadClient()
  const calls = []
  const namespace = {
    async listProjects() {
      calls.push(['listProjects'])
      return { ok: true, value: { projects: [{ id: 'p1', name: 'Notes' }] } }
    },
    async writeFile(...args) {
      calls.push(['writeFile', ...args])
      return { ok: true, value: { version: 'v2' } }
    },
  }
  const { ctx, record } = fakeCtx({ namespace })

  await plugin.apply(ctx)
  const { api } = mainInjection(record)

  assert.equal(api.mountFailure(), null)
  assert.deepEqual(await api.listProjects(), { projects: [{ id: 'p1', name: 'Notes' }] })
  assert.deepEqual(await api.writeFile('p1', 'a.md', 'x', undefined), { version: 'v2' })
  assert.deepEqual(calls, [
    ['listProjects'],
    ['writeFile', 'p1', 'a.md', 'x', null],
  ])
})

test('a rejected mount rejects apply, logs it and carries the original text', async () => {
  const { plugin, logs } = loadClient()
  const rejection = new TypeError("Cannot read properties of undefined (reading 'length')")
  rejection.code = 'typert/invalid-invocation'
  const { ctx, record } = fakeCtx({ mountFails: rejection })

  await assert.rejects(
    () => plugin.apply(ctx),
    (error) => {
      assert.match(error.message, /notes remote mount failed/)
      assert.match(error.message, /Cannot read properties of undefined \(reading 'length'\)/)
      assert.match(error.message, /typert\/invalid-invocation/)
      assert.equal(error.code, 'typert/invalid-invocation', 'the Host code survives')
      assert.equal(error.cause, rejection)
      return true
    },
  )

  assert.equal(record.slots.length, 0, 'no panel is mounted when the namespace never appears')
  assert.equal(record.locales.length, 1, 'the dictionary still registered before the mount')

  const logged = logs.filter((args) => String(args[0]).startsWith(MOUNT_LOG))
  assert.equal(logged.length, 1, `exactly one "${MOUNT_LOG}" console.error`)
  assert.match(String(logged[0][1]), /reading 'length'/, 'the log carries the original message')
})

test('a missing namespace names the recorded mount rejection', async () => {
  const { plugin } = loadClient()
  const rejection = new Error('typert: generated Remote has no strict codec')
  const { ctx, record } = fakeCtx({ mountFails: rejection })

  await assert.rejects(() => plugin.apply(ctx), /notes remote mount failed/)

  // A second context that mounts fine, then loses the namespace: the api must
  // still describe the recorded mount instead of only saying "is not mounted".
  // `mountFailure` is bundle state, so the earlier rejection is still known.
  const ok = fakeCtx({ namespace: {} })
  await plugin.apply(ok.ctx)
  const { api } = mainInjection(ok.record)
  ok.ctx.get = () => undefined

  await assert.rejects(
    () => api.listProjects(),
    (error) => {
      assert.equal(error.code, 'notes/remote-unavailable')
      assert.match(error.message, /is not mounted/)
      assert.match(error.message, /generated Remote has no strict codec/, 'the mount rejection is appended')
      return true
    },
  )
  assert.equal(record.slots.length, 0)
})

test('the sidebar entry id equals the main panel key so the layout can select it', async () => {
  const { plugin } = loadClient()
  const { ctx, record } = fakeCtx()

  await plugin.apply(ctx)

  const sidebar = record.slots.find((slot) => slot.options.name === 'sidebar.panellist')
  const main = record.slots.find((slot) => slot.options.name === 'main')

  assert.ok(sidebar, 'sidebar.panellist registration exists')
  assert.ok(main, 'main registration exists')
  assert.equal(sidebar.options.id, main.options.key)
  assert.equal(sidebar.options.id, NS)
  assert.equal(sidebar.options.locale, NS)
  assert.equal(main.options.locale, NS)
  assert.equal(typeof sidebar.options.label, 'function')
  assert.equal(typeof main.options.inject, 'function')
  assert.deepEqual([...Object.keys(main.options.inject())], ['api', 't'])
})

test('every mounted descriptor carries the notesRemote service key', async () => {
  const { plugin } = loadClient()
  const { ctx, record } = fakeCtx()

  await plugin.apply(ctx)

  for (const descriptor of record.mounts[0].descriptors) {
    assert.equal(descriptor.service, 'notesRemote', `${descriptor.method} must name the Host Service key`)
    assert.notEqual(descriptor.service, '', 'api-gateway requires a nonempty service segment')
    assert.ok(!descriptor.service.includes('#'), 'api-gateway rejects "#" in the service segment')
  }
})

test('every mounted descriptor uses a strict codec on parameters and result', async () => {
  const { plugin } = loadClient()
  const { ctx, record } = fakeCtx()

  await plugin.apply(ctx)

  const contribution = record.mounts[0]
  assert.deepEqual(
    [...contribution.descriptors.map((descriptor) => descriptor.method)],
    [
      'listProjects',
      'importProject',
      'removeProject',
      'listEntries',
      'readFile',
      'writeFile',
      'gitStatus',
      'gitDiff',
      'gitBlame',
    ],
  )

  for (const descriptor of contribution.descriptors) {
    assert.equal(descriptor.namespace, 'notes')
    assert.equal(descriptor.invocation.kind, 'direct')
    assert.equal(descriptor.id, `@local/local-markdown-notes#notes/${descriptor.method}`)
    assert.equal(descriptor.result.mode, 'strict', `${descriptor.method} result must be strict`)
    for (const parameter of descriptor.parameters) {
      assert.equal(parameter.name, parameter.wire)
      assert.equal(parameter.source, 'json')
      assert.equal(parameter.codec.mode, 'strict', `${descriptor.method}.${parameter.wire} must be strict`)
    }
  }
})

test('writeFile descriptor carries the four wire parameters in order', async () => {
  const { plugin } = loadClient()
  const { ctx, record } = fakeCtx()

  await plugin.apply(ctx)

  const write = record.mounts[0].descriptors.find((descriptor) => descriptor.method === 'writeFile')
  assert.deepEqual(
    [...write.parameters.map((parameter) => parameter.wire)],
    ['projectId', 'relativePath', 'content', 'expectedVersion'],
  )
})

/** Render the registered panel with no project selected and return its texts. */
async function renderPanelWithoutProject() {
  const { plugin } = loadClient()
  const { ctx, record } = fakeCtx({ namespace: {} })

  await plugin.apply(ctx)

  const main = record.slots.find((slot) => slot.options.name === 'main')
  assert.ok(main, 'main registration exists')
  const { api, t } = main.options.inject()

  return leaves(main.component({ api, t }))
}

test('the Git tab shows a "no project" state instead of a permanent loading hint', async () => {
  const texts = await renderPanelWithoutProject()

  assert.ok(
    texts.includes(`${NS}:panel.noProject`),
    `the Git tab must explain that no folder is selected: ${JSON.stringify(texts)}`,
  )
  assert.ok(
    !texts.includes(`${NS}:panel.loading`),
    'the Git tab must not claim to be loading while no project exists',
  )
})

test('both dictionaries define the "no project" Git tab hint', async () => {
  const texts = await renderPanelWithoutProject()
  assert.ok(texts.includes(`${NS}:panel.noProject`))

  const { plugin } = loadClient()
  const { ctx, record } = fakeCtx()
  await plugin.apply(ctx)

  const { zh, en } = record.locales[0].dictionaries
  assert.equal(typeof zh['panel.noProject'], 'string')
  assert.equal(typeof en['panel.noProject'], 'string')
  assert.notEqual(zh['panel.noProject'], '')
  assert.notEqual(en['panel.noProject'], '')
})
