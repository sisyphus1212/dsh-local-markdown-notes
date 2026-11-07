/**
 * Build a Host-side plugin context backed by the REAL filesystem and the REAL
 * subprocess runtime, so integration tests exercise production code paths
 * instead of doubles.
 *
 * Only two things are substituted:
 * - the storage domain facility (an in-memory one, so no user data directory is
 *   touched and every run starts empty);
 * - the directory picker (a scriptable stub, so no native dialog can open).
 *
 * @module test/helpers/host
 */

import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { extractDeps, installResolver, locateAppAsar } from './asar-deps.js'

const SCRATCH = join(tmpdir(), 'lmn-it-deps')

/**
 * Make the asar-shipped Host packages importable, extracting them once.
 *
 * @returns {{depsRoot: string, stats: object}}
 */
export function prepareDeps() {
  const asar = locateAppAsar()
  if (asar === null) {
    throw new Error(
      'the packaged Harness app.asar was not found; set DSH_APP_ASAR to its path',
    )
  }
  mkdirSync(SCRATCH, { recursive: true })
  const stats = extractDeps(asar, SCRATCH)
  installResolver(SCRATCH)
  return { depsRoot: SCRATCH, stats }
}

/**
 * An in-memory stand-in for the Host storage domain facility.
 *
 * Mirrors the shape the real facility produces: `open(spec)` returns a domain
 * whose `table(name)` exposes synchronous reads and asynchronous writes, and
 * whose `close()` is idempotent.
 */
export function createMemoryStorageDomain() {
  /** @type {Map<string, object>} */
  const open = new Map()

  return {
    /** Domain names currently open, for assertions. */
    get openDomains() {
      return [...open.keys()]
    },
    /**
     * @param {{name: string, version: number, tables: Record<string, {valueSchema: {parse: Function}}>}} spec
     */
    async open(spec) {
      if (open.has(spec.name)) {
        throw Object.assign(new Error(`domain '${spec.name}' is already open`), {
          code: 'already-open',
        })
      }
      /** @type {Map<string, object>} */
      const tables = new Map()
      for (const [tableName, tableSpec] of Object.entries(spec.tables)) {
        /** @type {Map<string, unknown>} */
        const records = new Map()
        tables.set(tableName, {
          get(key) {
            return records.get(key)
          },
          has(key) {
            return records.has(key)
          },
          entries() {
            return [...records.entries()][Symbol.iterator]()
          },
          keys() {
            return [...records.keys()][Symbol.iterator]()
          },
          async put(key, raw) {
            const parsed = tableSpec.valueSchema.parse(raw)
            records.set(key, parsed)
            return parsed
          },
          async delete(key) {
            const existed = records.delete(key)
            return existed
          },
          async update(key, mutate) {
            const parsed = tableSpec.valueSchema.parse(mutate(records.get(key)))
            records.set(key, parsed)
            return parsed
          },
        })
      }
      const domain = {
        name: spec.name,
        tables,
        table(name) {
          const found = tables.get(name)
          if (found === undefined) {
            throw new Error(`domain '${spec.name}' declares no table '${name}'`)
          }
          return found
        },
        close() {
          open.delete(spec.name)
          return Promise.resolve()
        },
      }
      open.set(spec.name, domain)
      return domain
    },
  }
}

/**
 * A directory-picker stub that opens no dialog.
 *
 * `calls` counts every `pick()` attempt so a test can prove the production path
 * never touched it. `answer` may be reassigned to simulate a selection (an
 * absolute path) or a cancellation (`null`).
 */
export function createPickerStub() {
  const stub = {
    calls: 0,
    capabilities: 0,
    /** @type {string | null} */
    answer: null,
    /** @type {string} */
    kind: 'native',
    capability() {
      stub.capabilities += 1
      return {
        kind: stub.kind,
        pick: async () => {
          stub.calls += 1
          return stub.answer
        },
      }
    },
  }
  return stub
}

/**
 * Assemble a live Host context around the real filesystem and subprocess.
 *
 * Both are the production providers: `LocalFileSystem` and
 * `LocalSubprocessRuntime` from the packaged Harness. Passing
 * `{subprocess: false}` skips the real runtime and provides `subprocess`
 * directly, which is how a test observes the exact argv the plugin runs.
 *
 * @param {{subprocess?: boolean}} [options]
 * @returns {Promise<{
 *   ctx: object,
 *   picker: ReturnType<typeof createPickerStub>,
 *   storage: ReturnType<typeof createMemoryStorageDomain>,
 *   remote: object,
 *   store: object,
 *   domain: object,
 *   dispose: () => Promise<void>,
 * }>}
 */
export async function createHostContext(options = {}) {
  const useRealSubprocess = options.subprocess !== false

  // The product module imports `@deepseek-ai/*` at module scope, so the
  // resolution hook has to be installed before it is imported.
  prepareDeps()

  const { createNotesRemote, NotesRemote, markRemoteMethods } = await import(
    '../../lib/service.js'
  )
  const cordis = await import('@deepseek-ai/cordis')
  const fsLocal = await import('@deepseek-ai/dsh-fs-local')
  const subprocessLocal = await import('@deepseek-ai/dsh-subprocess-local')

  const ctx = new cordis.Context()
  const storage = createMemoryStorageDomain()
  const picker = createPickerStub()

  const fs = new fsLocal.LocalFileSystem(ctx, {
    cwd: process.cwd(),
    diffBasisMaxBytes: 8 * 1024 * 1024,
  })
  const subprocess = useRealSubprocess
    ? new subprocessLocal.LocalSubprocessRuntime(ctx)
    : undefined

  ctx.reflect.provide('storageDomain', storage)
  ctx.reflect.provide('directoryPicker', picker)

  markRemoteMethods(NotesRemote)
  const { remote, store, domain } = await createNotesRemote(ctx)

  return {
    ctx,
    picker,
    storage,
    fs,
    subprocess,
    remote,
    store,
    domain,
    async dispose() {
      await domain.close()
    },
  }
}

/**
 * Record every argv the plugin runs, over the real subprocess runtime.
 *
 * The returned façade is what the plugin sees as `ctx.subprocess`; each
 * `spawn` call is recorded and then delegated to a real runtime on the same
 * context, so the production Git calls still execute for real.
 *
 * @param {object} runtime a real `SubprocessRuntime`
 */
export function recordSpawn(runtime) {
  /** @type {Array<{argv: string[], cwd: string}>} */
  const calls = []
  return {
    calls,
    spawn(spec) {
      calls.push({ argv: spec.argv.slice(), cwd: spec.cwd })
      return runtime.spawn(spec)
    },
  }
}

/**
 * Create a fresh, real temporary directory for one test.
 *
 * @param {string} label short, filesystem-safe label placed in the name
 * @returns {string} absolute path (long form, so git and the plugin agree)
 */
export function makeTempDir(label) {
  const dir = join(
    tmpdir(),
    `lmn-it-${label}-${process.pid.toString(36)}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
  )
  mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * Remove a directory tree created by {@link makeTempDir}.
 * @param {string} dir
 */
export function removeTempDir(dir) {
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
}
