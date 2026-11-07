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

/** The do-nothing react double: `useState` never re-renders, effects never run. */
function createStaticReact() {
  return {
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
}

/**
 * Evaluate client.js against a minimal ModuleLoader/document/locale/slots double.
 *
 * Pass `react` to drive the panel with a stateful hooks runtime instead of the
 * static double; the returned `window` lets a test replace `setTimeout` so the
 * 180 ms blame debounce runs synchronously.
 */
function loadClient(options = {}) {
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

  const react = options.react ?? createStaticReact()

  const plugin = loaded.factory((id) => {
    if (id === 'react') return react
    throw new Error(`unexpected require(${id})`)
  })

  return { plugin, styles, logs, window }
}

/**
 * A hooks runtime that can actually re-render, so a test can click a tree node
 * and inspect the result. Only the surface client.js uses is implemented;
 * state lives in a flat slot array, which is sound because the panel calls its
 * hooks in a fixed order on every render.
 */
function createHookRuntime() {
  const slots = []
  let cursor = 0
  let root = null
  let tree = null
  let rendering = false
  let scheduled = false
  const initialEffects = []

  function render() {
    scheduled = false
    rendering = true
    cursor = 0
    try {
      tree = root()
    } finally {
      rendering = false
    }
    const jobs = initialEffects.splice(0)
    for (const job of jobs) job()
  }

  function schedule() {
    if (rendering || scheduled) return
    scheduled = true
    queueMicrotask(render)
  }

  const react = {
    createElement(type, props, ...children) {
      return { type, props: props ?? {}, children }
    },
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      const setState = (next) => {
        const value = typeof next === 'function' ? next(slots[index]) : next
        if (Object.is(value, slots[index])) return
        slots[index] = value
        schedule()
      }
      return [slots[index], setState]
    },
    useEffect(fn) {
      const index = cursor++
      if (index in slots) return
      slots[index] = true
      initialEffects.push(fn)
    },
    // Identity-stable callbacks and memo values are not what the tests observe,
    // so both simply evaluate eagerly on every render.
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useRef(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = { current: initial }
      return slots[index]
    },
    Fragment: 'fragment',
  }

  return {
    react,
    /** Mount a component and run its first-pass effects. */
    mount(component) {
      root = component
      render()
    },
    /** Current element tree. */
    tree() {
      return tree
    },
    /** Let every pending microtask (async api call, state update) settle. */
    async flush(ticks = 50) {
      for (let i = 0; i < ticks; i += 1) await Promise.resolve()
      render()
      for (let i = 0; i < ticks; i += 1) await Promise.resolve()
    },
  }
}

/** Replace the sandbox timers with a queue a test can drain deterministically. */
function installTimerQueue(windowDouble) {
  const queue = []
  windowDouble.setTimeout = (fn) => {
    queue.push(fn)
    return queue.length
  }
  windowDouble.clearTimeout = () => {}
  return {
    async run() {
      while (queue.length > 0) {
        const job = queue.shift()
        job()
        for (let i = 0; i < 20; i += 1) await Promise.resolve()
      }
    },
  }
}

/** Every element carrying `className` as one of its classes, in document order. */
function findAll(node, className, found = []) {
  if (node === null || node === undefined || node === false) return found
  if (Array.isArray(node)) {
    for (const child of node) findAll(child, className, found)
    return found
  }
  if (typeof node !== 'object') return found
  const own = node.props?.className
  if (typeof own === 'string' && own.split(/\s+/).includes(className)) found.push(node)
  for (const child of node.children ?? []) findAll(child, className, found)
  return found
}

/** The first element whose classes include every name in `classNames`. */
function findOne(node, ...classNames) {
  const elements = []
  const walk = (value) => {
    if (value === null || value === undefined || value === false) return
    if (Array.isArray(value)) {
      for (const child of value) walk(child)
      return
    }
    if (typeof value !== 'object') return
    const own = value.props?.className
    if (typeof own === 'string') {
      const classes = own.split(/\s+/)
      if (classNames.every((name) => classes.includes(name))) elements.push(value)
    }
    for (const child of value.children ?? []) walk(child)
  }
  walk(node)
  return elements[0]
}

/** Text of one element as rendered, joined for easy `includes` assertions. */
function textsOf(node) {
  return leaves(node).join('')
}

/** Mount the panel with a stateful runtime and a working fake namespace. */
async function mountPanel(options) {
  const { namespace, timers = true } = options
  const runtime = createHookRuntime()
  const client = loadClient({ react: runtime.react })
  const { ctx, record } = fakeCtx({ namespace })
  await client.plugin.apply(ctx)

  const main = record.slots.find((slot) => slot.options.name === 'main')
  assert.ok(main, 'main registration exists')
  const { api, t } = main.options.inject()

  const timerQueue = timers ? installTimerQueue(client.window) : null
  runtime.mount(() => main.component({ api, t }))
  await runtime.flush()

  return { ...client, runtime, record, ctx, api, t, timerQueue }
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
  assert.equal(record.mounts[0].descriptors.length, 10)

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
      'createEntry',
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

test('the stylesheet only references theme tokens the host actually declares', async () => {
  const { plugin, styles } = loadClient()
  const { ctx } = fakeCtx()
  await plugin.apply(ctx)

  const css = styles[0].textContent

  // The host declares 114 --dsw-alias-* tokens; none of these four exist, so a
  // reference silently falls back to the literal and breaks the dark theme.
  for (const undeclared of [
    '--dsw-alias-label-inverted',
    '--dsw-alias-static-red-50',
    '--dsw-alias-static-red-900',
    '--dsw-alias-static-red-400-a12',
  ]) {
    assert.ok(
      !css.includes(undeclared),
      `${undeclared} is not declared by the host and must not be referenced`,
    )
  }

  const primary = css.split('\n').find((line) => line.startsWith('.lmn-btn-primary{'))
  assert.ok(primary, 'the primary button rule exists')
  assert.ok(
    primary.includes('var(--dsw-alias-label-primary-foreground'),
    `the primary button foreground must follow the theme: ${primary}`,
  )

  const banner = css.split('\n').find((line) => line.startsWith('.lmn-error{'))
  assert.ok(banner, 'the error banner rule exists')
  assert.ok(
    banner.includes('var(--dsw-alias-state-error-primary'),
    `the error banner must use the host error token: ${banner}`,
  )
})

/**
 * Specificity of a single simple selector, computed the way a browser does for
 * class/pseudo-class selectors: (classes + pseudo-classes) outrank a bare class.
 */
function classSpecificity(selector) {
  return (selector.match(/\.[A-Za-z0-9_-]+|:[A-Za-z-]+/g) ?? []).length
}

test('the primary button keeps a readable background on hover', async () => {
  const { plugin, styles } = loadClient()
  const { ctx } = fakeCtx()
  await plugin.apply(ctx)

  const rules = styles[0].textContent
    .split('\n')
    // `.lmn-btn:hover{...}` and `.lmn-btn.lmn-btn-primary:hover{...}` both match
    // the primary button, so index order is the tiebreaker.
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.includes(':hover'))

  const generic = rules.find(({ line }) => line.startsWith('.lmn-btn:hover{'))
  const primary = rules.find(({ line }) => line.startsWith('.lmn-btn.lmn-btn-primary:hover{'))

  assert.ok(generic, 'the generic button hover rule exists')
  assert.ok(primary, 'the primary button needs its own hover rule')

  // `.lmn-btn:hover` is (0,2,0); the primary rule must beat it, never lose to it,
  // otherwise the background flips to the light layer while the text stays white.
  assert.ok(
    classSpecificity('.lmn-btn.lmn-btn-primary:hover') >
      classSpecificity('.lmn-btn:hover'),
    'the primary hover selector must outrank the generic one',
  )
  assert.ok(
    primary.index > generic.index,
    'the primary hover rule must be declared after the generic one',
  )
  assert.ok(
    primary.line.includes('var(--dsw-alias-button-primary-hover'),
    `the hovered primary button must use the host primary-hover token: ${primary.line}`,
  )
  // Setting only the background lets the foreground fall back to whatever wins
  // in the other theme, so the hover rule must pin the readable pair itself.
  assert.ok(
    primary.line.includes('color:var(--dsw-alias-label-primary-foreground'),
    `the hovered primary button must keep its themed foreground: ${primary.line}`,
  )

  const focus = styles[0].textContent
    .split('\n')
    .find((line) => line.startsWith('.lmn-btn.lmn-btn-primary:focus-visible{'))
  assert.ok(focus, 'keyboard focus needs the same self-consistent rule')
  assert.ok(
    focus.includes('color:var(--dsw-alias-label-primary-foreground'),
    `focused primary button must keep its themed foreground: ${focus}`,
  )
})

// ---------------------------------------------------------------------------
// Explorer tree
// ---------------------------------------------------------------------------

const PROJECT = { id: 'p1', name: 'ovs学习', rootPath: 'D:\dpu 资料\ovs学习' }

/**
 * A namespace backed by a directory map, so a test can watch the lazy loading
 * of one folder and the Git panes without a Host.
 */
function treeNamespace(options = {}) {
  const { entriesByPath = {}, blameFails = false, blameEntries = [], diff } = options
  const calls = []
  const namespace = {
    async listProjects() {
      calls.push(['listProjects'])
      return { ok: true, value: { projects: [PROJECT] } }
    },
    async listEntries(projectId, relativePath) {
      calls.push(['listEntries', projectId, relativePath])
      const entries = entriesByPath[relativePath ?? '']
      if (entries === undefined) throw Object.assign(new Error(`no such dir ${relativePath}`), { code: 'notes/enoent' })
      return { ok: true, value: { path: relativePath ?? '', entries } }
    },
    async readFile(projectId, relativePath) {
      calls.push(['readFile', projectId, relativePath])
      return { ok: true, value: { path: relativePath, version: 'v1', content: 'one\ntwo\nthree\n' } }
    },
    async writeFile() {
      throw new Error('writeFile must not run in these tests')
    },
    async createEntry(projectId, relativePath, kind) {
      calls.push(['createEntry', projectId, relativePath, kind])
      if (options.createFails) {
        throw Object.assign(new Error('already exists'), { code: 'notes/exists' })
      }
      // Creating a real entry makes the parent list one item longer.
      const parent = relativePath.includes('/') ? relativePath.slice(0, relativePath.lastIndexOf('/')) : ''
      const bucket = entriesByPath[parent]
      if (bucket !== undefined && kind === 'file') {
        bucket.push({ path: relativePath, name: relativePath.slice(relativePath.lastIndexOf('/') + 1), type: 'file' })
      }
      return { ok: true, value: { path: relativePath, kind } }
    },
    async gitStatus(projectId) {
      calls.push(['gitStatus', projectId])
      return { ok: true, value: { entries: [] } }
    },
    async gitDiff(projectId, relativePath) {
      calls.push(['gitDiff', projectId, relativePath])
      return { ok: true, value: diff ?? { diff: '', note: 'no-commits' } }
    },
    async gitBlame(projectId, relativePath, line) {
      calls.push(['gitBlame', projectId, relativePath, line])
      if (blameFails) {
        throw Object.assign(new Error('no such ref: HEAD'), { code: 'notes/no-commits' })
      }
      return { ok: true, value: { line, entries: blameEntries } }
    },
    async removeProject() {
      return { ok: true, value: { removed: true } }
    },
  }
  return { namespace, calls }
}

/** The create buttons rendered inline on the folder row that names `label` ('': the project root). */
function rowActions(panel, label) {
  const row = findAll(panel.runtime.tree(), 'lmn-row').find((item) =>
    label === '' ? String(item.props.className).includes('lmn-row-root') : textsOf(item).includes(label),
  )
  assert.ok(row, `the folder row ${label === '' ? '<root>' : label} renders`)
  return findAll(row, 'lmn-iconbtn')
}

/** The buttons in the section header, which now only holds the import action. */
function headerButtons(panel) {
  const head = findOne(panel.runtime.tree(), 'lmn-side-head')
  assert.ok(head, 'the section header renders')
  return findAll(head, 'lmn-iconbtn')
}

/** Click one rendered element by reference and let the resulting work settle. */
async function click(runtime, element) {
  assert.ok(element, 'the element to click exists')
  element.props.onClick({ stopPropagation() {}, currentTarget: element })
  await runtime.flush()
}

test('the explorer renders one tree: the project row is the root node', async () => {
  const { namespace, calls } = treeNamespace({ entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] } })
  const panel = await mountPanel({ namespace })

  const tree = panel.runtime.tree()
  const side = findOne(tree, 'lmn-side')
  assert.ok(side, 'the sidebar renders')

  // A single header and no `..` row: navigation is the tree itself.
  assert.equal(findAll(tree, 'lmn-side-head').length, 1, 'exactly one section header')
  assert.ok(!textsOf(side).includes('..'), 'the ".." row is gone')
  assert.equal(findAll(side, 'lmn-note').length, 0, 'no empty placeholder in the tree while projects exist')

  // The project is the top-level node; its path lives in the row tooltip instead
  // of a second line, the way the Explorer lists a folder without its path.
  const roots = findAll(tree, 'lmn-node')
  assert.equal(roots.length, 1, 'one root node per project')
  assert.equal(findAll(tree, 'lmn-item-sub').length, 0, 'the root row does not repeat its path')
  const rootRow = findAll(tree, 'lmn-row')[0]
  assert.equal(rootRow.props.title, PROJECT.rootPath, 'the path stays reachable as a tooltip')

  // Collapsed first: an unrotated caret glyph, and the file is not rendered.
  assert.equal(rootRow.props['aria-expanded'], 'false', 'the collapsed root is announced as collapsed')
  assert.equal(countType(findOne(rootRow, 'lmn-chevron'), 'svg'), 1, 'the caret is an svg glyph')
  assert.ok(!textsOf(side).includes('常用命令.md'), 'children stay hidden while collapsed')

  await click(panel.runtime, rootRow)

  const expanded = panel.runtime.tree()
  assert.equal(
    findAll(expanded, 'lmn-row')[0].props['aria-expanded'],
    'true',
    'expanding flips the announced state',
  )
  assert.ok(textsOf(findOne(expanded, 'lmn-side')).includes('常用命令.md'), 'the child renders in place')
  assert.equal(findAll(expanded, 'lmn-node').length, 2, 'root plus the expanded child')
  assert.ok(
    calls.some((call) => call[0] === 'listEntries' && call[2] === ''),
    'opening the project loads its root directory',
  )
  assert.ok(
    !calls.some((call) => call[0] === 'listEntries' && call[2] !== ''),
    'no other directory is fetched just by expanding the root',
  )
})

test('a folder loads its children lazily and caches them across collapse', async () => {
  const { namespace, calls } = treeNamespace({
    entriesByPath: {
      '': [{ path: 'sub', name: 'sub', type: 'directory' }],
      sub: [{ path: 'sub/deep.md', name: 'deep.md', type: 'file' }],
    },
  })
  const panel = await mountPanel({ namespace })

  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])
  const folderItem = findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes('sub'))
  assert.ok(folderItem, 'the nested folder row exists')

  await click(panel.runtime, folderItem)
  assert.ok(textsOf(findOne(panel.runtime.tree(), 'lmn-side')).includes('deep.md'), 'the folder expands in place')
  assert.equal(
    calls.filter((call) => call[0] === 'listEntries' && call[2] === 'sub').length,
    1,
    'the folder was fetched once',
  )

  // Collapse then expand again: the cache answers, so the Host is not hit twice.
  const rowFor = () =>
    findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes('sub'))
  await click(panel.runtime, rowFor())
  assert.ok(!textsOf(findOne(panel.runtime.tree(), 'lmn-side')).includes('deep.md'), 'collapsing hides children')
  await click(panel.runtime, rowFor())
  assert.ok(textsOf(findOne(panel.runtime.tree(), 'lmn-side')).includes('deep.md'), 're-expanding restores them')
  assert.equal(
    calls.filter((call) => call[0] === 'listEntries' && call[2] === 'sub').length,
    1,
    're-expanding a cached folder makes no second request',
  )
})

test('the indentation grows by one step per depth level', async () => {
  const { namespace } = treeNamespace({
    entriesByPath: {
      '': [{ path: 'sub', name: 'sub', type: 'directory' }],
      sub: [{ path: 'sub/deep.md', name: 'deep.md', type: 'file' }],
    },
  })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])
  const folderItem = findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes('sub'))
  await click(panel.runtime, folderItem)

  const rows = findAll(panel.runtime.tree(), 'lmn-row')
  const indents = rows.map((row) => row.props.style.paddingLeft)
  assert.equal(indents[0], '8px', 'the root row uses the base padding')
  assert.equal(indents[1], '18px', 'depth 1 indents by one 10px step')
  assert.equal(indents[2], '28px', 'depth 2 indents by another step')
})

test('the remove control is only revealed on hover or focus', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [] } })
  const panel = await mountPanel({ namespace })
  await panel.plugin.apply(fakeCtx().ctx)

  const css = panel.styles[0].textContent
  assert.ok(/\.lmn-remove\{[^}]*opacity:0/.test(css), 'the remove button starts hidden')
  assert.ok(
    /\.lmn-row:hover \.lmn-remove/.test(css) && /\.lmn-remove:focus-visible/.test(css),
    'hover and keyboard focus both reveal it',
  )
  assert.ok(findAll(panel.runtime.tree(), 'lmn-remove').length === 1, 'the control still exists in the DOM')
})

// ---------------------------------------------------------------------------
// Defect A: a Git-less project must still open the Blame tab
// ---------------------------------------------------------------------------

test('a blame failure still switches to the Blame tab so the pane can explain', async () => {
  const { namespace } = treeNamespace({
    entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] },
    blameFails: true,
  })
  const panel = await mountPanel({ namespace })

  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])
  const fileItem = findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes('常用命令.md'))
  await click(panel.runtime, fileItem)

  const textarea = findOne(panel.runtime.tree(), 'lmn-editor')
  const area = (function seek(node) {
    if (node === null || node === undefined) return null
    if (typeof node !== 'object') return null
    if (node.type === 'textarea') return node
    for (const child of node.children ?? []) {
      const hit = seek(child)
      if (hit !== null) return hit
    }
    return null
  })(textarea)
  assert.ok(area, 'the editor renders a textarea')

  area.props.onKeyUp({ currentTarget: { selectionStart: 4 } })
  await panel.timerQueue.run()
  await panel.runtime.flush()

  const activeTab = findAll(panel.runtime.tree(), 'lmn-tab').find(
    (tab) => tab.props['aria-selected'] === 'true',
  )
  assert.ok(activeTab, 'one tab is selected')
  assert.equal(textsOf(activeTab), `${NS}:panel.blame`, 'a failed blame still opens the Blame tab')
  const pane = textsOf(findOne(panel.runtime.tree(), 'lmn-bottom'))
  assert.ok(pane.includes(`${NS}:panel.noCommits`), `the pane explains the empty blame: ${pane}`)
})

// ---------------------------------------------------------------------------
// Defect B: opening the Diff tab with nothing loaded must fetch once
// ---------------------------------------------------------------------------

test('opening the Diff tab loads a diff instead of showing a permanent empty pane', async () => {
  const { namespace, calls } = treeNamespace({
    entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] },
  })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])

  const diffTab = findAll(panel.runtime.tree(), 'lmn-tab').find(
    (tab) => textsOf(tab) === `${NS}:panel.diff`,
  )
  assert.ok(diffTab, 'the Diff tab exists')
  assert.ok(!calls.some((call) => call[0] === 'gitDiff'), 'no diff is loaded before the tab is opened')

  await click(panel.runtime, diffTab)

  assert.ok(calls.some((call) => call[0] === 'gitDiff'), 'opening the tab requests a diff')
  // The fetched diff is empty and carries the reason, so the pane states the
  // real Git condition instead of the bare "nothing to show" placeholder.
  const bottom = textsOf(findOne(panel.runtime.tree(), 'lmn-bottom'))
  assert.ok(
    bottom.includes(`${NS}:panel.noCommits`),
    `the pane reports the real Git state: ${bottom}`,
  )
  assert.ok(
    !bottom.includes(`${NS}:panel.loading`),
    `the pane must not be stuck loading after the diff arrives: ${bottom}`,
  )

  // A second click must not refetch: the diff is already loaded. Re-resolve the
  // tab first, the way a user clicks the element React just re-rendered.
  const before = calls.filter((call) => call[0] === 'gitDiff').length
  const again = findAll(panel.runtime.tree(), 'lmn-tab').find(
    (tab) => textsOf(tab) === `${NS}:panel.diff`,
  )
  await click(panel.runtime, again)
  assert.equal(
    calls.filter((call) => call[0] === 'gitDiff').length,
    before,
    're-opening the Diff tab does not request again',
  )
})

// ---------------------------------------------------------------------------
// The cursor line's commit is shown next to the editor, not only in the tab
// ---------------------------------------------------------------------------

/** Depth-first search for the first rendered node of one element type. */
function seekType(node, type) {
  if (node === null || node === undefined) return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = seekType(child, type)
      if (hit !== null) return hit
    }
    return null
  }
  if (typeof node !== 'object') return null
  if (node.type === type) return node
  for (const child of node.children ?? []) {
    const hit = seekType(child, type)
    if (hit !== null) return hit
  }
  return null
}

/** Count every rendered node of one element type, depth first. */
function countType(node, type) {
  if (node === null || node === undefined) return 0
  if (Array.isArray(node)) {
    let nested = 0
    for (const child of node) nested += countType(child, type)
    return nested
  }
  if (typeof node !== 'object') return 0
  let total = node.type === type ? 1 : 0
  for (const child of node.children ?? []) total += countType(child, type)
  return total
}

/** Open the project, open the single file, and put the cursor at `offset`. */
async function openFileAt(panel, offset) {
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])
  const fileItem = findAll(panel.runtime.tree(), 'lmn-row').find((item) =>
    textsOf(item).includes('常用命令.md'),
  )
  await click(panel.runtime, fileItem)
  const area = seekType(findOne(panel.runtime.tree(), 'lmn-editor'), 'textarea')
  assert.ok(area, 'the editor renders a textarea')
  area.props.onKeyUp({ currentTarget: { selectionStart: offset } })
  await panel.timerQueue.run()
  await panel.runtime.flush()
  return area
}

const BLAME_ENTRY = {
  finalLine: 2,
  line: 2,
  sha: '8ebd47bbc746c55f4130d1ff5fa0753cf54e7b24',
  author: 'E2E Fixture',
  authorTime: 1794046229,
  summary: 'docs: first fixture commit',
}

test('the stylesheet hides the commit card and reveals it on hover or focus', async () => {
  const { plugin, styles } = loadClient()
  const { ctx } = fakeCtx()
  await plugin.apply(ctx)

  const css = styles[0].textContent

  assert.ok(
    /\.lmn-blame-card\{[^}]*display:none/.test(css),
    'the commit card starts hidden',
  )
  assert.ok(
    /\.lmn-blame-chip:hover \.lmn-blame-card[^{]*\{[^}]*display:block/.test(css),
    'hovering the chip reveals the card',
  )
  assert.ok(
    /\.lmn-blame-chip:focus-within \.lmn-blame-card[^{]*\{[^}]*display:block/.test(css),
    'focusing the chip reveals the card too, so it is keyboard reachable',
  )
  assert.ok(
    /\.lmn-blame-card\{[^}]*z-index:20/.test(css),
    'the card floats above the textarea it covers',
  )
})

test('the card is not clipped by the chip it hangs below', async () => {
  const { plugin, styles } = loadClient()
  const { ctx } = fakeCtx()
  await plugin.apply(ctx)

  const css = styles[0].textContent
  const chipRule = /\.lmn-blame-chip\{([^}]*)\}/.exec(css)
  assert.ok(chipRule, 'the chip has a rule')
  assert.ok(
    !/overflow\s*:/.test(chipRule[1]),
    `the chip must not clip, or it cuts off the card hanging below it: ${chipRule[1]}`,
  )
  assert.ok(
    /\.lmn-blame-chip-text\{[^}]*overflow:hidden[^}]*text-overflow:ellipsis/.test(css),
    'the ellipsis moves to an inner span, so a long chip still truncates',
  )

  // The card hangs below the chip's own box, so it must escape the chip.
  const { namespace } = treeNamespace({
    entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] },
    blameEntries: [BLAME_ENTRY],
  })
  const panel = await mountPanel({ namespace })
  await openFileAt(panel, 5)

  const chip = findOne(panel.runtime.tree(), 'lmn-blame-chip')
  const card = findOne(panel.runtime.tree(), 'lmn-blame-card')
  assert.ok(chip && card, 'both the chip and the card render')
  const textSpan = findOne(chip, 'lmn-blame-chip-text')
  assert.ok(textSpan, 'the chip text lives in its own truncating span')
  assert.equal(
    findAll(textSpan, 'lmn-blame-card').length,
    0,
    'the card hangs outside the truncating span, so that span cannot clip it',
  )
})


test('the blame chip summarises the cursor line and carries the full commit card', async () => {
  const { namespace, calls } = treeNamespace({
    entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] },
    blameEntries: [BLAME_ENTRY],
  })
  const panel = await mountPanel({ namespace })

  // Line 2 is "two", so offset 5 sits inside it.
  await openFileAt(panel, 5)

  assert.ok(
    calls.some((call) => call[0] === 'gitBlame' && call[3] === 2),
    'the cursor line is the line blamed',
  )

  const bar = findOne(panel.runtime.tree(), 'lmn-blame-bar')
  assert.ok(bar, 'a blame bar renders above the editor')
  const chip = findOne(panel.runtime.tree(), 'lmn-blame-chip')
  assert.ok(chip, 'the bar holds a chip')
  assert.equal(
    textsOf(chip).split('L')[0],
    '',
    'the chip text starts with the line number',
  )
  assert.ok(
    textsOf(chip).includes('L2'),
    `the chip names the line: ${textsOf(chip)}`,
  )
  assert.ok(
    textsOf(chip).includes('8ebd47bbc'),
    `the chip shortens the commit sha to nine characters: ${textsOf(chip)}`,
  )
  assert.ok(
    textsOf(chip).includes('E2E Fixture'),
    `the chip names the author: ${textsOf(chip)}`,
  )
  assert.ok(
    textsOf(chip).includes('2026-11-07'),
    `the chip shows the commit day: ${textsOf(chip)}`,
  )

  const card = findOne(panel.runtime.tree(), 'lmn-blame-card')
  assert.ok(card, 'the chip contains the detail card')
  const cardText = textsOf(card)
  assert.ok(
    cardText.includes('8ebd47bbc746c55f4130d1ff5fa0753cf54e7b24'),
    `the card carries the full sha: ${cardText}`,
  )
  assert.ok(
    cardText.includes('docs: first fixture commit'),
    `the card carries the commit summary: ${cardText}`,
  )
  assert.equal(
    chip.props.tabIndex,
    0,
    'the chip is focusable so the card can be revealed without a mouse',
  )
})

test('a line with no commit history shows no blame bar at all', async () => {
  const { namespace } = treeNamespace({
    entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] },
  })
  const panel = await mountPanel({ namespace })
  await openFileAt(panel, 5)

  const tree = panel.runtime.tree()
  assert.equal(findOne(tree, 'lmn-blame-bar'), undefined, 'nothing to attribute means no bar')
  assert.equal(findAll(tree, 'lmn-blame-chip').length, 0, 'no placeholder chip')
  assert.equal(findAll(tree, 'lmn-blame-card').length, 0, 'no card to hover')
})

test('both locales name the card labels', () => {
  const zh = source.slice(source.indexOf('const ZH = {'), source.indexOf('const EN = {'))
  const en = source.slice(source.indexOf('const EN = {'), source.indexOf('const STYLE ='))

  for (const key of ['panel.blameAuthor', 'panel.blameDate', 'panel.blameCommit', 'panel.blameSummary']) {
    assert.ok(zh.includes(`'${key}'`), `the Chinese dictionary has ${key}`)
    assert.ok(en.includes(`'${key}'`), `the English dictionary has ${key}`)
  }
})

// git describes a working-tree line it cannot attribute with an all-zero sha and
// the author "Not Committed Yet", so such an entry must not read as a real commit.
const ZERO_SHA_ENTRY = {
  finalLine: 2,
  line: 2,
  sha: '0000000000000000000000000000000000000000',
  author: 'Not Committed Yet',
  authorTime: 1794050650,
  summary: 'Version of 常用命令.md from 常用命令.md',
}

test('an all-zero blame sha renders no chip at all', async () => {
  const { namespace } = treeNamespace({
    entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] },
    blameEntries: [ZERO_SHA_ENTRY],
  })
  const panel = await mountPanel({ namespace })
  await openFileAt(panel, 5)

  const tree = panel.runtime.tree()
  assert.equal(findOne(tree, 'lmn-blame-bar'), undefined, 'an all-zero entry has nothing to show')
  assert.equal(findAll(tree, 'lmn-blame-chip').length, 0, 'no chip to read as a commit')
  assert.equal(findAll(tree, 'lmn-blame-card').length, 0, 'and no card to hover')
})

test('a committed line beside an all-zero line still names its own commit', async () => {
  const zeroOnLineThree = { ...ZERO_SHA_ENTRY, finalLine: 3, line: 3 }
  const { namespace } = treeNamespace({
    entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] },
    blameEntries: [BLAME_ENTRY, zeroOnLineThree],
  })
  const panel = await mountPanel({ namespace })

  // Offset 5 sits inside line 2, the committed one.
  await openFileAt(panel, 5)

  const chip = findOne(panel.runtime.tree(), 'lmn-blame-chip')
  assert.ok(chip, 'the chip renders for the committed line')
  const text = textsOf(chip)
  assert.ok(text.includes('L2'), `the committed line keeps its own line number: ${text}`)
  assert.ok(text.includes('8ebd47bbc'), `the committed line still names its sha: ${text}`)
  assert.ok(text.includes('E2E Fixture'), `the committed line still names its author: ${text}`)
  assert.ok(!text.includes('000000000'), `the zero-sha line did not win: ${text}`)
  assert.ok(findOne(panel.runtime.tree(), 'lmn-blame-card'), 'the commit card is present')
})

// ---------------------------------------------------------------------------
// VS Code style creating: an actions row, an inline name field, and the tree
// ---------------------------------------------------------------------------

/** Drive one keystroke through a rendered element's onKeyDown handler. */
async function press(runtime, element, key) {
  assert.ok(element, `the element that receives ${key} exists`)
  let prevented = false
  element.props.onKeyDown({
    key,
    preventDefault() {
      prevented = true
    },
    stopPropagation() {},
  })
  await runtime.flush()
  return prevented
}

test('the create actions ride on folder rows instead of the section header', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [{ path: 'sub', name: 'sub', type: 'directory' }] } })
  const panel = await mountPanel({ namespace })

  assert.equal(
    findAll(panel.runtime.tree(), 'lmn-actions').length,
    0,
    'no second header row exists to appear and disappear',
  )
  assert.equal(
    headerButtons(panel).length,
    0,
    'the section header carries no create buttons, so nothing shifts when a project opens',
  )

  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])

  assert.equal(headerButtons(panel).length, 0, 'the header stays bare after a project opens')
  assert.deepEqual(
    rowActions(panel, '').map((button) => button.props.title),
    [`${NS}:panel.newFile`, `${NS}:panel.newFolder`],
    'the open project row offers both create actions',
  )
  assert.deepEqual(
    rowActions(panel, 'sub').map((button) => button.props.title),
    [`${NS}:panel.newFile`, `${NS}:panel.newFolder`],
    'every folder row offers both create actions',
  )
})

test('clicking the open project row folds it instead of reopening it', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [{ path: 'a.md', name: 'a.md', type: 'file' }] } })
  const panel = await mountPanel({ namespace })

  const rootRow = () => findAll(panel.runtime.tree(), 'lmn-row').find((row) => row.props['aria-expanded'] !== undefined && String(row.props.className).includes('lmn-row-root'))

  await click(panel.runtime, rootRow())
  assert.equal(rootRow().props['aria-expanded'], 'true', 'the first click opens the project')
  assert.ok(textsOf(findOne(panel.runtime.tree(), 'lmn-side')).includes('a.md'), 'its children are visible')

  await click(panel.runtime, rootRow())
  assert.equal(rootRow().props['aria-expanded'], 'false', 'the second click folds the same project')
  assert.ok(!textsOf(findOne(panel.runtime.tree(), 'lmn-side')).includes('a.md'), 'its children are hidden again')
})

test('a folded folder is no longer where a new entry is created', async () => {
  const calls = []
  const { entriesByPath } = {
    entriesByPath: {
      '': [{ path: 'sub', name: 'sub', type: 'directory' }],
      sub: [{ path: 'sub/deep.md', name: 'deep.md', type: 'file' }],
    },
  }
  const built = treeNamespace({ entriesByPath })
  built.namespace.createEntry = async (projectId, relativePath, kind) => {
    calls.push(['createEntry', projectId, relativePath, kind])
    return { ok: true, value: { path: relativePath, kind } }
  }
  const panel = await mountPanel({ namespace: built.namespace })

  const rowNamed = (name) =>
    findAll(panel.runtime.tree(), 'lmn-row').find((row) => textsOf(row).includes(name))

  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])
  await click(panel.runtime, rowNamed('sub'))
  assert.equal(rowNamed('sub').props['aria-expanded'], 'true', 'the folder opened')

  await click(panel.runtime, rowNamed('sub'))
  assert.equal(rowNamed('sub').props['aria-expanded'], 'false', 'the folder folded again')

  await click(panel.runtime, rowActions(panel, '')[0])
  let input = seekType(findOne(panel.runtime.tree(), 'lmn-create'), 'input')
  input.props.onChange({ target: { value: 'fresh' } })
  await panel.runtime.flush()
  input = seekType(findOne(panel.runtime.tree(), 'lmn-create'), 'input')
  await press(panel.runtime, input, 'Enter')

  assert.ok(
    calls.some((call) => call[2] === 'fresh.md'),
    `the new file lands at the root, not in the folded folder: ${JSON.stringify(calls)}`,
  )
})

test('no create action exists before a project is open', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [] } })
  const panel = await mountPanel({ namespace })

  assert.equal(
    findAll(panel.runtime.tree(), 'lmn-iconbtn').length,
    0,
    'with nothing imported there is no folder row to hang a create action on',
  )
  assert.equal(
    findOne(panel.runtime.tree(), 'lmn-create'),
    undefined,
    'and no field opens on its own',
  )
})

test('the new-file action opens an inline name field prefilled with an untitled .md name', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [] } })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])

  await click(panel.runtime, rowActions(panel, '')[0])

  const row = findOne(panel.runtime.tree(), 'lmn-create')
  assert.ok(row, 'the inline field appears directly under the folder row it was opened from')
  const input = seekType(row, 'input')
  assert.ok(input, 'the inline field is an input')
  assert.equal(
    input.props.value,
    `${NS}:panel.untitledName.md`,
    'the name defaults to an untitled markdown file',
  )
  assert.equal(
    input.props.placeholder,
    'untitled.md',
    'the placeholder shows the markdown file the panel creates by default',
  )
})

test('confirming a new file at the root calls createEntry with a .md path', async () => {
  const { namespace, calls } = treeNamespace({ entriesByPath: { '': [] } })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])

  await click(panel.runtime, rowActions(panel, '')[0])
  let input = seekType(findOne(panel.runtime.tree(), 'lmn-create'), 'input')
  input.props.onChange({ target: { value: 'readme' } })
  await panel.runtime.flush()

  input = seekType(findOne(panel.runtime.tree(), 'lmn-create'), 'input')
  assert.equal(input.props.value, 'readme', 'the typed name is held while typing')

  const prevented = await press(panel.runtime, input, 'Enter')
  assert.ok(prevented, 'Enter is claimed by the field instead of submitting a form')
  assert.ok(
    calls.some(
      (call) =>
        call[0] === 'createEntry' && call[1] === 'p1' && call[2] === 'readme.md' && call[3] === 'file',
    ),
    `createEntry receives the markdown path: ${JSON.stringify(calls)}`,
  )
  assert.equal(findAll(panel.runtime.tree(), 'lmn-create').length, 0, 'the field closes after creating')
})

test('a folder row action swallows the row click so the row does not toggle underneath it', async () => {
  const { namespace } = treeNamespace({
    entriesByPath: {
      '': [{ path: 'sub', name: 'sub', type: 'directory' }],
      sub: [],
    },
  })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])

  const rowFor = (name) =>
    findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes(name))

  assert.equal(rowFor('sub').props['aria-expanded'], 'false', 'the folder starts folded')

  const stopped = []
  const button = rowActions(panel, 'sub')[0]
  button.props.onClick({ stopPropagation: () => stopped.push(true), currentTarget: button })
  await panel.runtime.flush()

  assert.deepEqual(stopped, [true], 'the icon claims the click before the row can act on it')
  assert.equal(
    rowFor('sub').props['aria-expanded'],
    'true',
    'the folder opens because the field needs somewhere visible to sit, not because the row was clicked',
  )
})

test('a folder row action creates a markdown file inside that folder by default', async () => {
  const { namespace, calls } = treeNamespace({
    entriesByPath: {
      '': [{ path: 'sub', name: 'sub', type: 'directory' }],
      sub: [],
    },
  })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])

  await click(panel.runtime, rowActions(panel, 'sub')[0])

  const input = seekType(findOne(panel.runtime.tree(), 'lmn-create'), 'input')
  assert.equal(
    input.props.value,
    `${NS}:panel.untitledName.md`,
    'the name already ends in .md so confirming it needs no typing',
  )
  await press(panel.runtime, input, 'Enter')

  assert.ok(
    calls.some(
      (call) =>
        call[0] === 'createEntry' &&
        call[2] === `sub/${NS}:panel.untitledName.md` &&
        call[3] === 'file',
    ),
    `the default markdown file lands in the folder the action was on: ${JSON.stringify(calls)}`,
  )
})

test('opening the field on a folder that was never listed loads its children', async () => {
  const { namespace, calls } = treeNamespace({
    entriesByPath: {
      '': [{ path: 'sub', name: 'sub', type: 'directory' }],
      sub: [{ path: 'sub/deep.md', name: 'deep.md', type: 'file' }],
    },
  })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])

  assert.ok(
    !calls.some((call) => call[0] === 'listEntries' && call[2] === 'sub'),
    'the folder stays unloaded until something reveals it',
  )

  await click(panel.runtime, rowActions(panel, 'sub')[0])

  assert.ok(
    calls.some((call) => call[0] === 'listEntries' && call[2] === 'sub'),
    `revealing the folder fetches its children: ${JSON.stringify(calls)}`,
  )
  const texts = textsOf(findOne(panel.runtime.tree(), 'lmn-side'))
  assert.ok(
    !texts.includes(`${NS}:panel.loading`),
    `the loading placeholder is replaced by the real entries: ${texts}`,
  )
  assert.ok(texts.includes('deep.md'), 'the fetched child renders under the folder')
  assert.equal(findAll(panel.runtime.tree(), 'lmn-create').length, 1, 'the field is still open')
})

test('creating inside a folder prefixes the selected folder and a directory keeps its name', async () => {
  const { namespace, calls } = treeNamespace({
    entriesByPath: {
      '': [{ path: 'sub', name: 'sub', type: 'directory' }],
      sub: [],
    },
  })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])

  const folderItem = findAll(panel.runtime.tree(), 'lmn-row').find((item) =>
    textsOf(item).includes('sub'),
  )
  await click(panel.runtime, folderItem)

  await click(panel.runtime, rowActions(panel, 'sub')[1])
  let input = seekType(findOne(panel.runtime.tree(), 'lmn-create'), 'input')
  input.props.onChange({ target: { value: 'notes' } })
  await panel.runtime.flush()
  input = seekType(findOne(panel.runtime.tree(), 'lmn-create'), 'input')
  await press(panel.runtime, input, 'Enter')

  assert.ok(
    calls.some(
      (call) =>
        call[0] === 'createEntry' &&
        call[2] === 'sub/notes' &&
        call[3] === 'directory',
    ),
    `a folder inside sub keeps its plain name: ${JSON.stringify(calls)}`,
  )
})

test('Escape cancels the inline field without creating anything', async () => {
  const { namespace, calls } = treeNamespace({ entriesByPath: { '': [] } })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])

  await click(panel.runtime, rowActions(panel, '')[0])
  assert.ok(findOne(panel.runtime.tree(), 'lmn-create'), 'the field is open before Escape')

  const input = seekType(findOne(panel.runtime.tree(), 'lmn-create'), 'input')
  await press(panel.runtime, input, 'Escape')

  assert.equal(findAll(panel.runtime.tree(), 'lmn-create').length, 0, 'Escape closes the field')
  assert.equal(
    calls.filter((call) => call[0] === 'createEntry').length,
    0,
    'no entry is created when the name field is cancelled',
  )
})

test('an empty name is cancelled instead of creating an unnamed entry', async () => {
  const { namespace, calls } = treeNamespace({ entriesByPath: { '': [] } })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])

  await click(panel.runtime, rowActions(panel, '')[0])
  let input = seekType(findOne(panel.runtime.tree(), 'lmn-create'), 'input')
  input.props.onChange({ target: { value: '   ' } })
  await panel.runtime.flush()

  input = seekType(findOne(panel.runtime.tree(), 'lmn-create'), 'input')
  await press(panel.runtime, input, 'Enter')

  assert.equal(
    calls.filter((call) => call[0] === 'createEntry').length,
    0,
    'whitespace never reaches the Host as a file name',
  )
  assert.equal(findAll(panel.runtime.tree(), 'lmn-create').length, 0, 'the field still closes')
})

test('a folder row reports its expanded state and swaps its icon', async () => {
  const { namespace } = treeNamespace({
    entriesByPath: {
      '': [{ path: 'sub', name: 'sub', type: 'directory' }],
      sub: [],
    },
  })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])

  const rowFor = () =>
    findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes('sub'))

  const closed = rowFor()
  assert.equal(closed.props['aria-expanded'], 'false', 'a collapsed folder announces it is collapsed')
  assert.equal(
    countType(findOne(closed, 'lmn-icon'), 'path'),
    1,
    'a collapsed folder draws the plain folder glyph',
  )
  assert.ok(textsOf(closed).includes('sub'), 'the folder keeps its name')

  await click(panel.runtime, closed)

  const open = rowFor()
  assert.equal(open.props['aria-expanded'], 'true', 'an expanded folder announces it is expanded')
  assert.equal(
    countType(findOne(open, 'lmn-icon'), 'path'),
    2,
    'an expanded folder adds the open tint',
  )

  const file = findAll(panel.runtime.tree(), 'lmn-row').find((item) =>
    textsOf(item).includes('deep'),
  )
  assert.equal(file, undefined, 'the empty folder has no children to show')
})

test('each depth level adds one indent guide line to the row', async () => {
  const { namespace } = treeNamespace({
    entriesByPath: {
      '': [{ path: 'sub', name: 'sub', type: 'directory' }],
      sub: [{ path: 'sub/deep.md', name: 'deep.md', type: 'file' }],
    },
  })
  const panel = await mountPanel({ namespace })
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])
  await click(
    panel.runtime,
    findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes('sub')),
  )

  const rows = findAll(panel.runtime.tree(), 'lmn-row')
  assert.equal(rows.length, 3, 'project row, folder row and file row')
  assert.equal(findAll(rows[0], 'lmn-indent').length, 0, 'the project root has no guide line')
  assert.equal(findAll(rows[1], 'lmn-indent').length, 1, 'depth 1 has one guide line')
  assert.equal(findAll(rows[2], 'lmn-indent').length, 2, 'depth 2 has two guide lines')

  const guides = findAll(rows[2], 'lmn-indent')
  assert.deepEqual(
    guides.map((guide) => guide.props.style.left),
    ['14px', '24px'],
    'the guide lines follow the same 10px step as the padding',
  )
})

test('the preview toggle renders markdown as elements and replaces the textarea', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] } })
  const panel = await mountPanel({ namespace })

  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])
  await click(
    panel.runtime,
    findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes('常用命令.md')),
  )

  const markdown = [
    '# Title',
    '',
    'Some **bold**, `code` and a [link](https://example.com).',
    '',
    '- one',
    '- two',
    '',
    '| a | b |',
    '| --- | --- |',
    '| 1 | 2 |',
    '',
    '~~strike~~ stays literal',
    '',
  ].join('\n')
  let area = seekType(findOne(panel.runtime.tree(), 'lmn-editor'), 'textarea')
  area.props.onChange({ target: { value: markdown } })
  await panel.runtime.flush()

  const seg = findOne(panel.runtime.tree(), 'lmn-seg')
  assert.ok(seg, 'the toolbar carries a view toggle')
  const buttons = findAll(seg, 'lmn-btn')
  assert.equal(buttons.length, 2, 'editing and preview are the only two modes')
  assert.deepEqual(
    buttons.map((button) => textsOf(button)),
    [`${NS}:panel.edit`, `${NS}:panel.preview`],
    'both modes are labelled from the dictionary',
  )
  assert.equal(buttons[0].props['aria-pressed'], 'true', 'editing is the default mode')

  await click(panel.runtime, buttons[1])

  const tree = panel.runtime.tree()
  assert.equal(
    seekType(findOne(tree, 'lmn-editor'), 'textarea'),
    null,
    'preview hides the textarea',
  )
  const render = findOne(tree, 'lmn-render')
  assert.ok(render, 'preview renders the markdown into a body')
  assert.equal(countType(render, 'h1'), 1, 'an ATX heading becomes an h1')
  assert.equal(textsOf(seekType(render, 'h1')), 'Title')
  assert.equal(countType(render, 'strong'), 1, 'bold text becomes strong')
  assert.equal(countType(render, 'code'), 1, 'inline code becomes a code element')
  const link = seekType(render, 'a')
  assert.ok(link, 'a link becomes an anchor')
  assert.equal(link.props.href, 'https://example.com')
  assert.equal(link.props.rel, 'noreferrer', 'an external link cannot reach window.opener')
  assert.equal(countType(render, 'li'), 2, 'bullets become list items')
  const table = seekType(render, 'table')
  assert.ok(table, 'a GFM table becomes a table element')
  assert.equal(countType(table, 'th'), 2, 'the header row keeps both cells')
  assert.equal(countType(table, 'td'), 2, 'the body row keeps both cells')
  assert.ok(
    textsOf(render).includes('~~strike~~ stays literal'),
    'markup the renderer does not know is shown as written, never dropped',
  )
  assert.ok(
    !JSON.stringify(render).includes('dangerouslySetInnerHTML'),
    'the renderer never injects raw HTML',
  )
})

test('switching to preview and back leaves the draft untouched', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] } })
  const panel = await mountPanel({ namespace })

  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])
  await click(
    panel.runtime,
    findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes('常用命令.md')),
  )

  const typed = '# 草稿\n\n正文 **加粗**\n'
  let area = seekType(findOne(panel.runtime.tree(), 'lmn-editor'), 'textarea')
  area.props.onChange({ target: { value: typed } })
  await panel.runtime.flush()

  const toggle = () => findAll(findOne(panel.runtime.tree(), 'lmn-seg'), 'lmn-btn')
  await click(panel.runtime, toggle()[1])
  assert.ok(findOne(panel.runtime.tree(), 'lmn-render'), 'preview is showing')
  assert.equal(findAll(panel.runtime.tree(), 'lmn-render-empty').length, 0, 'the draft is not empty')

  await click(panel.runtime, toggle()[0])
  area = seekType(findOne(panel.runtime.tree(), 'lmn-editor'), 'textarea')
  assert.ok(area, 'going back restores the textarea')
  assert.equal(area.props.value, typed, 'the draft survived both switches unchanged')
})

test('an empty draft previews as a placeholder rather than an empty body', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] } })
  const panel = await mountPanel({ namespace })

  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])
  await click(
    panel.runtime,
    findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes('常用命令.md')),
  )

  const area = seekType(findOne(panel.runtime.tree(), 'lmn-editor'), 'textarea')
  area.props.onChange({ target: { value: '' } })
  await panel.runtime.flush()
  await click(panel.runtime, findAll(findOne(panel.runtime.tree(), 'lmn-seg'), 'lmn-btn')[1])

  const empty = findOne(panel.runtime.tree(), 'lmn-render-empty')
  assert.ok(empty, 'an empty draft shows the placeholder')
  assert.equal(textsOf(empty), `${NS}:panel.previewEmpty`)
  assert.equal(findAll(panel.runtime.tree(), 'lmn-render').length, 0, 'no empty body is rendered')
})

// ---------------------------------------------------------------------------
// Line numbers: the editing view numbers its lines, the preview never does
// ---------------------------------------------------------------------------

/** Open 常用命令.md and hand back the textarea beside its gutter. */
async function openWithGutter(panel) {
  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])
  await click(
    panel.runtime,
    findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes('常用命令.md')),
  )
  const code = findOne(panel.runtime.tree(), 'lmn-code')
  assert.ok(code, 'the editing view groups the gutter and the text together')
  const gutter = findOne(code, 'lmn-gutter')
  assert.ok(gutter, 'the editing view carries a line-number gutter')
  return { code, gutter, area: seekType(code, 'textarea') }
}

test('the editing view numbers every line of the draft', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] } })
  const panel = await mountPanel({ namespace })
  const { gutter, area } = await openWithGutter(panel)

  // The fixture file is "one\ntwo\nthree\n": three lines of text plus the empty
  // line the trailing newline opens, which VS Code numbers as well.
  assert.deepEqual(
    findAll(gutter, 'lmn-gutter-line').map((line) => textsOf(line)),
    ['1', '2', '3', '4'],
    'the gutter numbers the loaded file',
  )

  area.props.onChange({ target: { value: 'a\nb' } })
  await panel.runtime.flush()
  assert.deepEqual(
    findAll(findOne(panel.runtime.tree(), 'lmn-gutter'), 'lmn-gutter-line').map((line) => textsOf(line)),
    ['1', '2'],
    'the gutter follows the draft as it shrinks',
  )

  seekType(findOne(panel.runtime.tree(), 'lmn-editor'), 'textarea').props.onChange({
    target: { value: 'a\nb\nc\nd\ne' },
  })
  await panel.runtime.flush()
  assert.deepEqual(
    findAll(findOne(panel.runtime.tree(), 'lmn-gutter'), 'lmn-gutter-line').map((line) => textsOf(line)),
    ['1', '2', '3', '4', '5'],
    'the gutter follows the draft as it grows',
  )
})

test('the gutter keeps its numbers out of the accessible name of the text', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] } })
  const panel = await mountPanel({ namespace })
  const { gutter, area } = await openWithGutter(panel)

  assert.equal(gutter.props['aria-hidden'], 'true', 'a screen reader reads the text, not the numbers')
  assert.equal(area.props['aria-label'], '常用命令.md', 'the textarea still names its file')
  assert.equal(
    seekType(findOne(panel.runtime.tree(), 'lmn-doc'), 'textarea').props.value,
    'one\ntwo\nthree\n',
    'the numbers never leak into the editable value',
  )
})

test('scrolling the text carries the gutter with it', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] } })
  const panel = await mountPanel({ namespace })
  const { code, gutter, area } = await openWithGutter(panel)

  // The harness never attaches refs to real nodes, so hand the two ref objects
  // the scrollable stand-ins the handler touches.
  const areaNode = { scrollTop: 140 }
  const gutterNode = { scrollTop: 0 }
  assert.equal(typeof area.props.onScroll, 'function', 'the text reports its scroll offset')
  area.props.ref.current = areaNode
  gutter.props.ref.current = gutterNode
  area.props.onScroll()

  assert.equal(gutterNode.scrollTop, 140, 'the gutter scrolls in step with the text')
  assert.ok(code, 'the two live in one row, so the text keeps the full height')
})

test('the preview shows no line numbers', async () => {
  const { namespace } = treeNamespace({ entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] } })
  const panel = await mountPanel({ namespace })
  const { area } = await openWithGutter(panel)
  area.props.onChange({ target: { value: '# Title\n\nbody\n' } })
  await panel.runtime.flush()

  await click(panel.runtime, findAll(findOne(panel.runtime.tree(), 'lmn-seg'), 'lmn-btn')[1])

  const tree = panel.runtime.tree()
  assert.ok(findOne(tree, 'lmn-render'), 'the preview body is showing')
  assert.equal(findOne(tree, 'lmn-gutter'), undefined, 'rendered markdown has no source lines to number')
  assert.equal(findOne(tree, 'lmn-code'), undefined, 'the editing row is gone entirely')
})

test('the blame chip names the line its commit describes', async () => {
  const { namespace } = treeNamespace({
    entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] },
    blameEntries: [BLAME_ENTRY],
  })
  const panel = await mountPanel({ namespace })

  // Offset 5 sits on line 2 of "one\ntwo\nthree\n".
  await openFileAt(panel, 5)

  const bar = findOne(panel.runtime.tree(), 'lmn-blame-bar')
  assert.ok(bar, 'the blame bar renders for a blamable line')
  const chip = findOne(bar, 'lmn-blame-chip')
  assert.ok(chip, 'the bar carries the chip')
  assert.ok(textsOf(chip).includes('L2'), `the chip names its own line: ${textsOf(chip)}`)
})

// ---------------------------------------------------------------------------
// Code highlighting: a known fence language colours the block, others stay plain
// ---------------------------------------------------------------------------

/** Mount a panel over the one-file fixture and preview `markdown`. */
async function previewing(markdown) {
  const { namespace } = treeNamespace({
    entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] },
  })
  const panel = await mountPanel({ namespace })

  await click(panel.runtime, findAll(panel.runtime.tree(), 'lmn-row')[0])
  await click(
    panel.runtime,
    findAll(panel.runtime.tree(), 'lmn-row').find((item) => textsOf(item).includes('常用命令.md')),
  )
  const area = seekType(findOne(panel.runtime.tree(), 'lmn-editor'), 'textarea')
  area.props.onChange({ target: { value: markdown } })
  await panel.runtime.flush()
  await click(panel.runtime, findAll(findOne(panel.runtime.tree(), 'lmn-seg'), 'lmn-btn')[1])

  const render = findOne(panel.runtime.tree(), 'lmn-render')
  assert.ok(render, 'the preview body is showing')
  return render
}

test('a fenced block names its language and colours its JavaScript tokens', async () => {
  const source = ['// note', "const answer = 'yes' + 42", 'run(answer)'].join('\n')
  const render = await previewing(['```js', source, '```', ''].join('\n'))

  const pre = seekType(render, 'pre')
  assert.ok(pre, 'the fence becomes a pre block')
  assert.equal(pre.props['data-lang'], 'js', 'the fence language rides on the block')

  const code = seekType(pre, 'code')
  assert.ok(code, 'the body stays one code element')
  assert.equal(countType(render, 'code'), 1, 'a single fence is still a single code element')

  assert.deepEqual(findAll(code, 'lmn-tok-comment').map(textsOf), ['// note'])
  assert.deepEqual(findAll(code, 'lmn-tok-keyword').map(textsOf), ['const'])
  assert.deepEqual(findAll(code, 'lmn-tok-string').map(textsOf), ["'yes'"])
  assert.deepEqual(findAll(code, 'lmn-tok-number').map(textsOf), ['42'])
  assert.deepEqual(findAll(code, 'lmn-tok-function').map(textsOf), ['run'])

  assert.equal(textsOf(code), source, 'highlighting never rewrites the source')
})

test('an aliased fence language is resolved to its specification', async () => {
  const render = await previewing(['```ts', 'let count: number = 0', '```', ''].join('\n'))
  const code = seekType(seekType(render, 'pre'), 'code')

  assert.equal(seekType(render, 'pre').props['data-lang'], 'ts', 'the alias is kept as written')
  assert.deepEqual(findAll(code, 'lmn-tok-keyword').map(textsOf), ['let'])
  assert.deepEqual(findAll(code, 'lmn-tok-type').map(textsOf), ['number'])
})

test('a non-JavaScript fence uses its own grammar', async () => {
  const source = ['# install', 'echo "done" 7'].join('\n')
  const render = await previewing(['```bash', source, '```', ''].join('\n'))
  const code = seekType(seekType(render, 'pre'), 'code')

  assert.deepEqual(findAll(code, 'lmn-tok-comment').map(textsOf), ['# install'])
  assert.deepEqual(findAll(code, 'lmn-tok-builtin').map(textsOf), ['echo'])
  assert.deepEqual(findAll(code, 'lmn-tok-string').map(textsOf), ['"done"'])
  assert.deepEqual(findAll(code, 'lmn-tok-number').map(textsOf), ['7'])
  assert.equal(textsOf(code), source)
})

test('a case-insensitive grammar still colours an upper-case query', async () => {
  const render = await previewing(['```sql', 'SELECT name FROM users WHERE id = 3', '```', ''].join('\n'))
  const code = seekType(seekType(render, 'pre'), 'code')

  assert.deepEqual(findAll(code, 'lmn-tok-keyword').map(textsOf), ['SELECT', 'FROM', 'WHERE'])
  assert.deepEqual(findAll(code, 'lmn-tok-number').map(textsOf), ['3'])
})

test('an unknown fence language keeps its text and gains no token spans', async () => {
  const source = '++++[>++++<-]'
  const render = await previewing(['```brainfuck', source, '```', ''].join('\n'))

  const pre = seekType(render, 'pre')
  assert.equal(pre.props['data-lang'], 'brainfuck', 'the block still reports what was written')
  const code = seekType(pre, 'code')
  assert.equal(textsOf(code), source, 'the body is shown as written')
  assert.equal(findAll(code, 'lmn-tok-keyword').length, 0, 'nothing is guessed at')
})

test('a fence without a language carries no badge and no colouring', async () => {
  const render = await previewing(['```', 'plain text', '```', ''].join('\n'))
  const pre = seekType(render, 'pre')

  assert.equal(pre.props['data-lang'], undefined, 'no language was written, so none is claimed')
  assert.equal(textsOf(seekType(pre, 'code')), 'plain text')
})

test('the document column uses the full width instead of a fixed centred measure', async () => {
  const { plugin, styles } = loadClient()
  const { ctx } = fakeCtx()
  await plugin.apply(ctx)

  const rule = styles[0].textContent.split('\n').find((line) => line.startsWith('.lmn-doc{'))
  assert.ok(rule, 'the document column rule exists')
  assert.ok(rule.includes('width:100%'), `the column fills the editor: ${rule}`)
  assert.ok(!rule.includes('max-width'), `nothing caps the column width: ${rule}`)
  assert.ok(!rule.includes('margin:0 auto'), `the column is no longer centred: ${rule}`)
})

test('dragging the splitter resizes the bottom pane and keeps the chosen height', async () => {
  const { namespace } = treeNamespace({
    entriesByPath: { '': [{ path: '常用命令.md', name: '常用命令.md', type: 'file' }] },
  })
  const panel = await mountPanel({ namespace })

  const splitter = () => findOne(panel.runtime.tree(), 'lmn-splitter')
  const pane = () => findOne(panel.runtime.tree(), 'lmn-bottom')

  assert.ok(splitter(), 'a splitter sits between the editor and the bottom pane')
  assert.equal(splitter().props.role, 'separator', 'it is announced as a separator')
  assert.equal(splitter().props['aria-label'], `${NS}:panel.resize`, 'the handle carries a label')
  assert.equal(pane().props.style, undefined, 'the pane starts content-sized')

  // The harness never attaches real nodes, so hand the pane ref the geometry the
  // handler measures: an 800px main area with a 200px tall pane in it.
  pane().props.ref.current = {
    getBoundingClientRect: () => ({ height: 200 }),
    parentElement: { getBoundingClientRect: () => ({ height: 800 }) },
  }

  splitter().props.onPointerDown({
    clientY: 600,
    pointerId: 1,
    preventDefault() {},
    currentTarget: { setPointerCapture() {} },
  })
  await panel.runtime.flush()
  assert.equal(splitter().props['data-dragging'], 'true', 'the handle reports the drag')

  // Dragging 150px upwards grows the pane from 200px to 350px.
  splitter().props.onPointerMove({ clientY: 450 })
  await panel.runtime.flush()
  assert.equal(pane().props.style.height, '350px', 'the pane follows the pointer')
  assert.equal(pane().props.style.maxHeight, 'none', 'the 44% cap no longer applies')

  // Dragging past the top clamp stops at the minimum instead of collapsing it.
  splitter().props.onPointerMove({ clientY: 5000 })
  await panel.runtime.flush()
  assert.equal(pane().props.style.height, '60px', 'the pane stops at its minimum height')

  splitter().props.onPointerUp({ pointerId: 1, currentTarget: { releasePointerCapture() {} } })
  await panel.runtime.flush()
  assert.equal(splitter().props['data-dragging'], 'false', 'the drag ends')
  assert.equal(pane().props.style.height, '60px', 'the chosen height stays after release')

  // A pointer move with no drag in flight must not resize anything.
  splitter().props.onPointerMove({ clientY: 100 })
  await panel.runtime.flush()
  assert.equal(pane().props.style.height, '60px', 'a stray move after release is ignored')
})

test('highlighted source can never become executable markup', async () => {
  const source = "const tag = '<img src=x onerror=alert(1)>'"
  const render = await previewing(['```js', source, '```', ''].join('\n'))
  const code = seekType(seekType(render, 'pre'), 'code')

  assert.equal(seekType(code, 'img'), null, 'the markup inside the string stays text')
  assert.ok(textsOf(code).includes('<img src=x onerror=alert(1)>'), 'it is shown verbatim')
  assert.ok(
    !JSON.stringify(render).includes('dangerouslySetInnerHTML'),
    'the highlighted preview is still built from elements',
  )
})

