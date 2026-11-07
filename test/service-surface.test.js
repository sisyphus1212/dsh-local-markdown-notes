import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { ENDPOINTS, NAMESPACE, PACKAGE, SERVICE, buildContribution, remoteMarkers } from '../lib/contract.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(here, '..', name), 'utf8')

const serviceSource = read('lib/service.js')
const indexSource = read('index.js')

/**
 * The Typert gateway derives wire parameters from each method's SOURCE TEXT
 * (`methodParameterNames()`), not from a schema. A default, destructuring,
 * comment or rest element therefore changes the wire contract silently.
 * This mirrors that parse so a signature regression fails a test instead.
 */
function methodParameters(source, method) {
  const pattern = new RegExp(`\\basync\\s+${method}\\s*\\(([^)]*)\\)`, 'g')
  const matches = [...source.matchAll(pattern)]
  assert.equal(matches.length, 1, `${method} must be declared exactly once`)
  return matches[0][1]
    .split(',')
    .map((parameter) => parameter.trim())
    .filter((parameter) => parameter !== '')
}

const SURFACE = [
  ['listProjects', ['signal']],
  ['importProject', ['signal']],
  ['removeProject', ['projectId']],
  ['listEntries', ['projectId', 'relativePath', 'signal']],
  ['readFile', ['projectId', 'relativePath', 'signal']],
  ['writeFile', ['projectId', 'relativePath', 'content', 'expectedVersion', 'signal']],
  ['gitStatus', ['projectId', 'signal']],
  ['gitDiff', ['projectId', 'relativePath', 'signal']],
  ['gitBlame', ['projectId', 'relativePath', 'line', 'signal']],
]

test('contract exports the notes package identity', () => {
  assert.equal(PACKAGE, '@local/local-markdown-notes')
  assert.equal(NAMESPACE, 'notes')
})

test('remoteMarkers lists exactly the nine wire methods', () => {
  assert.deepEqual(
    remoteMarkers().map((marker) => marker.method),
    SURFACE.map(([method]) => method),
  )
  for (const marker of remoteMarkers()) {
    assert.deepEqual({ ...marker.invocation }, { kind: 'direct' })
  }
})

test('endpoints mirror the namespace and method names', () => {
  assert.deepEqual([...ENDPOINTS], SURFACE.map(([method]) => `notes/${method}`))
})

test('every Host method is async with plain identifier parameters and signal last', () => {
  for (const [method, expected] of SURFACE) {
    const raw = methodParameters(serviceSource, method)
    assert.deepEqual(raw, expected, `${method} wire parameters drifted`)

    for (const parameter of raw) {
      assert.match(
        parameter,
        /^[A-Za-z_$][A-Za-z0-9_$]*$/,
        `${method}: "${parameter}" is not a plain identifier; the gateway only reads source text`,
      )
    }

    if (raw.includes('signal')) {
      assert.equal(raw.at(-1), 'signal', `${method}: signal must be the final parameter`)
      assert.equal(raw.filter((name) => name === 'signal').length, 1, `${method}: signal declared twice`)
    }
  }
})

test('each Host method body routes failures through remoteFailure', () => {
  for (const [method] of SURFACE) {
    const start = serviceSource.indexOf(`async ${method}(`)
    assert.ok(start > -1, `${method} missing from lib/service.js`)
    // The next method declaration (or the class tail) bounds this body.
    const rest = serviceSource.slice(start + 1)
    const nextDeclaration = rest.search(/\n {2}(?:async |static |get |set |\w+\()/)
    const body = nextDeclaration === -1 ? rest : rest.slice(0, nextDeclaration)
    assert.match(body, /catch \(error\)/, `${method} has no catch`)
    assert.match(body, /throw remoteFailure\(error, '[a-z0-9-]+\/[a-z0-9-]+'\)/, `${method} does not throw remoteFailure`)
  }
})

test('the remote marker is installed on the prototype with the protocol key', () => {
  assert.ok(
    serviceSource.includes("const REMOTE_METHOD_DESCRIPTOR = '@deepseek-ai/dsh-typert-protocol/remote-methods'"),
    'marker key must be the exact protocol string',
  )
  assert.match(serviceSource, /Object\.defineProperty\(\s*klass\.prototype,\s*REMOTE_METHOD_DESCRIPTOR/)
  assert.match(serviceSource, /markRemoteMethods/)
})

test('the service registers under the notesRemote key with the notes namespace', () => {
  assert.match(serviceSource, /super\(ctx, 'notesRemote', \{ namespace: NAMESPACE \}\)/)
  assert.match(serviceSource, /class NotesRemote extends TypertRemoteService/)
})

test('SERVICE is the Host Service key, not the wire namespace', () => {
  assert.equal(SERVICE, 'notesRemote')
  assert.notEqual(SERVICE, NAMESPACE, 'the namespace is the wire name; the service key is the registration key')
  assert.ok(SERVICE.length > 0, 'api-gateway requires a nonempty invocation service segment')
  assert.ok(!SERVICE.includes('#'), 'api-gateway rejects "#" in the invocation service segment')
  // `validateBinding` compares descriptor.service against the registration, so a
  // value that does not appear in `super(ctx, <key>, ...)` can never resolve.
  assert.ok(
    serviceSource.includes(`super(ctx, '${SERVICE}',`),
    `lib/service.js must register the service under '${SERVICE}'`,
  )
})

test('buildContribution stamps the service key on every descriptor', () => {
  const contribution = buildContribution()
  assert.equal(contribution.package, PACKAGE)
  assert.equal(contribution.descriptors.length, SURFACE.length)

  for (const descriptor of contribution.descriptors) {
    assert.equal(descriptor.service, SERVICE, `${descriptor.method} is missing its service key`)
    assert.equal(descriptor.service, 'notesRemote')
    assert.equal(descriptor.namespace, NAMESPACE)
    assert.equal(typeof descriptor.service, 'string')
    assert.ok(descriptor.service.length > 0)
    assert.ok(!descriptor.service.includes('#'))
  }
})

test('the project registry opens the domain instead of mounting a provider row', () => {
  assert.match(serviceSource, /await ctx\.storageDomain\.open\(defineNotesDomain\(storageDomainTable\)\)/)
  assert.ok(
    !/ctx\.storage\.mount|storage\.mount\(/.test(serviceSource),
    'must not mount a storage form; that caused the duplicate-mount host exit',
  )
})

test('git is only initialised inside the selected directory', () => {
  const start = serviceSource.indexOf('async registerProject(')
  assert.ok(start > -1, 'registerProject is missing')
  const body = serviceSource.slice(start)
  assert.match(body, /readToplevel\(/)
  assert.match(body, /initRepository\(/)
  const guard = body.indexOf('initRepository(')
  assert.ok(
    body.slice(0, guard).includes('samePath(repository, rootPath)'),
    'initRepository must be guarded by a samePath check on the resolved toplevel',
  )
})

test('the plugin entry declares the services it injects and closes the domain', () => {
  assert.match(indexSource, /export const name = 'local-markdown-notes'/)
  assert.match(indexSource, /export const inject = \[/)
  for (const service of ['storageDomain', 'fs', 'subprocess', 'directoryPicker']) {
    assert.ok(indexSource.includes(`'${service}'`), `index.js must inject ${service}`)
  }
  assert.match(indexSource, /markRemoteMethods\(NotesRemote\)/)
  assert.match(indexSource, /domain\.close\(\)/)
})

