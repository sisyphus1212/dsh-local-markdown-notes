/**
 * The Host half of the notes Remote surface.
 *
 * `NotesRemote` is a Cordis Service that carries the `typertRemote` binding (via
 * `TypertRemoteService`) plus a prototype marker list supplied by
 * `lib/contract.js`. The already-composed `typertGateway` discovers it from the
 * root service table and serves each marked method at `notes/<method>`, deriving
 * wire names from the method signatures themselves — which is why every method
 * below names its parameters exactly as `contract.js` declares them, uses no
 * defaults or destructuring, and puts `signal` last when it accepts
 * cancellation.
 *
 * @module @local/local-markdown-notes/lib/service
 */

import { realpathSync } from 'node:fs'
import { domainTable as storageDomainTable } from '@deepseek-ai/dsh-storage-domain'
import { RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

import { NAMESPACE, remoteMarkers } from './contract.js'
import { initRepository, readBaseline, readBlame, readDiff, readStatus, readToplevel } from './git.js'
import { normalizeRelativePath, projectIdFor } from './pure.js'
import { searchProject } from './search.js'
import { ProjectStore, defineNotesDomain } from './store.js'
import {
  createEntry,
  deleteEntry,
  listEntries,
  readFile,
  renameEntry,
  writeFile,
} from './workspace.js'

/**
 * The prototype key the Typert protocol reads to find Remote methods. Hand-set
 * here because this plugin is plain JavaScript and is not compiled with the
 * decorator transform; the gateway only ever reads this property, so a manual
 * descriptor is equivalent to `@Remote(...)` on each method.
 */
const REMOTE_METHOD_DESCRIPTOR = '@deepseek-ai/dsh-typert-protocol/remote-methods'

/** Codes must look like `<domain>/<reason>` to survive the gateway envelope. */
const CODE_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+$/

/**
 * Upstream codes that already carry meaning the Client branches on. They do not
 * match `CODE_PATTERN`, so before this map they were silently replaced by the
 * fallback code and the Client's `notes/stale` branch was unreachable — a stale
 * save looked like a generic failure and the user kept overwriting.
 */
const CODE_ALIASES = Object.freeze({
  FS_STALE_VERSION: 'notes/stale',
  FS_NOT_FOUND: 'notes/not-found',
  FS_ALREADY_EXISTS: 'notes/exists',
  FS_NOT_A_DIRECTORY: 'notes/not-a-directory',
  FS_NOT_OBSERVED: 'notes/exists',
})

function codedError(code, message) {
  return Object.assign(new Error(message), { code })
}

/**
 * Turn any thrown error into a `RemoteError`, so the Client receives a stable
 * code instead of an opaque internal failure.
 *
 * @param {unknown} error
 * @param {string} fallbackCode
 */
function remoteFailure(error, fallbackCode) {
  if (error instanceof RemoteError) return error
  const source = error ?? {}
  const raw = typeof source.code === 'string' ? source.code : ''
  const code = CODE_ALIASES[raw] ?? (CODE_PATTERN.test(raw) ? raw : fallbackCode)
  const message = typeof source.message === 'string' ? source.message : String(error)
  return new RemoteError(code, message, {})
}

class NotesRemote extends TypertRemoteService {
  /**
   * @param {object} ctx plugin context
   * @param {ProjectStore} store project registry
   */
  constructor(ctx, store) {
    super(ctx, 'notesRemote', { namespace: NAMESPACE })
    this.store = store
  }

  async listProjects(signal) {
    try {
      if (signal !== undefined) signal.throwIfAborted()
      return { projects: this.store.list() }
    } catch (error) {
      throw remoteFailure(error, 'notes/internal')
    }
  }

  async importProject(signal) {
    try {
      const rootPath = await this.pickDirectory(signal)
      if (rootPath === null) return { canceled: true, project: null }
      return { canceled: false, project: await this.registerProject(rootPath, signal) }
    } catch (error) {
      throw remoteFailure(error, 'notes/import-failed')
    }
  }

  async removeProject(projectId) {
    try {
      if (typeof projectId !== 'string' || projectId === '') {
        throw codedError('notes/bad-project-id', 'projectId is required')
      }
      if (this.store.get(projectId) === undefined) return { removed: false, projectId }
      await this.store.remove(projectId)
      return { removed: true, projectId }
    } catch (error) {
      throw remoteFailure(error, 'notes/internal')
    }
  }

  async listEntries(projectId, relativePath, signal) {
    try {
      const record = this.require(projectId)
      const relative = relativePath === undefined || relativePath === null ? '' : relativePath
      return await listEntries(this.ctx.fs, record.rootPath, relative, signal)
    } catch (error) {
      throw remoteFailure(error, 'notes/list-failed')
    }
  }

  async readFile(projectId, relativePath, signal) {
    try {
      const record = this.require(projectId)
      return await readFile(this.ctx.fs, record.rootPath, relativePath, signal)
    } catch (error) {
      throw remoteFailure(error, 'notes/read-failed')
    }
  }

  async writeFile(projectId, relativePath, content, expectedVersion, signal) {
    try {
      const record = this.require(projectId)
      const version = expectedVersion === undefined ? null : expectedVersion
      return await writeFile(
        this.ctx.fs,
        record.rootPath,
        relativePath,
        content,
        version,
        signal,
      )
    } catch (error) {
      throw remoteFailure(error, 'notes/write-failed')
    }
  }

  async gitStatus(projectId, signal) {
    try {
      const record = this.require(projectId)
      const status = await readStatus(this.ctx.subprocess, record.rootPath, signal)
      return { projectId: record.id, rootPath: record.rootPath, ...status }
    } catch (error) {
      throw remoteFailure(error, 'notes/git-failed')
    }
  }

  async gitDiff(projectId, relativePath, signal) {
    try {
      const record = this.require(projectId)
      const relative = relativePath === undefined || relativePath === null || relativePath === ''
        ? undefined
        : this.relativeTo(relativePath)
      const diff = await readDiff(this.ctx.subprocess, record.rootPath, relative, signal)
      return { projectId: record.id, path: relative ?? null, ...diff }
    } catch (error) {
      throw remoteFailure(error, 'notes/git-failed')
    }
  }

  async gitBaseline(projectId, relativePath, signal) {
    try {
      const record = this.require(projectId)
      const relative = this.relativeTo(relativePath)
      const baseline = await readBaseline(this.ctx.subprocess, record.rootPath, relative, signal)
      return { projectId: record.id, path: relative, ...baseline }
    } catch (error) {
      throw remoteFailure(error, 'notes/git-failed')
    }
  }

  async gitBlame(projectId, relativePath, line, signal) {
    try {
      const record = this.require(projectId)
      const relative = this.relativeTo(relativePath)
      const lineNumber = Number(line)
      if (!Number.isInteger(lineNumber) || lineNumber < 1) {
        throw codedError('notes/bad-line', 'line must be a positive integer')
      }
      const blame = await readBlame(
        this.ctx.subprocess,
        record.rootPath,
        relative,
        lineNumber,
        signal,
      )
      return { projectId: record.id, path: relative, line: lineNumber, ...blame }
    } catch (error) {
      throw remoteFailure(error, 'notes/git-failed')
    }
  }

  /**
   * Create one empty file or one directory, refusing to touch anything that
   * already exists.
   *
   * @param {string} projectId
   * @param {string} relativePath
   * @param {'file' | 'directory'} kind
   * @param {AbortSignal | undefined} signal
   */
  async createEntry(projectId, relativePath, kind, signal) {
    try {
      const record = this.require(projectId)
      return await createEntry(this.ctx.fs, record.rootPath, relativePath, kind, { signal })
    } catch (error) {
      throw remoteFailure(error, 'notes/write-failed')
    }
  }

  /**
   * Remove one file or one empty directory. The workspace helper refuses to
   * delete a folder that still has children, so a stray click cannot take a
   * subtree with it.
   *
   * @param {string} projectId
   * @param {string} relativePath
   * @param {AbortSignal | undefined} signal
   */
  async deleteEntry(projectId, relativePath, signal) {
    try {
      const record = this.require(projectId)
      const relative = this.relativeTo(relativePath)
      return await deleteEntry(this.ctx.fs, record.rootPath, relative, { signal })
    } catch (error) {
      throw remoteFailure(error, 'notes/delete-failed')
    }
  }

  /**
   * Rename one file or one directory in place. The destination must stay inside
   * the same project and must not already exist.
   *
   * @param {string} projectId
   * @param {string} fromPath
   * @param {string} toPath
   * @param {AbortSignal | undefined} signal
   */
  async renameEntry(projectId, fromPath, toPath, signal) {
    try {
      const record = this.require(projectId)
      const from = this.relativeTo(fromPath)
      const to = this.relativeTo(toPath)
      return await renameEntry(this.ctx.fs, record.rootPath, from, to, { signal })
    } catch (error) {
      throw remoteFailure(error, 'notes/rename-failed')
    }
  }

  /**
   * Search every Markdown file of one project for a substring.
   *
   * The scan itself lives in `lib/search.js`; this method only resolves the
   * project root and turns any escaped failure into the Remote envelope.
   *
   * @param {string} projectId
   * @param {string} query
   * @param {AbortSignal | undefined} signal
   */
  async searchNotes(projectId, query, signal) {
    try {
      const record = this.require(projectId)
      return await searchProject(this.ctx.fs, record.rootPath, query, { signal })
    } catch (error) {
      throw remoteFailure(error, 'notes/search-failed')
    }
  }

  /**
   * The stored project, or a coded failure the panel can render.
   * @param {string} projectId
   */
  require(projectId) {
    if (typeof projectId !== 'string' || projectId === '') {
      throw codedError('notes/bad-project-id', 'projectId is required')
    }
    const record = this.store.get(projectId)
    if (record === undefined) {
      throw codedError('notes/unknown-project', `unknown project "${projectId}"`)
    }
    return record
  }

  /**
   * Validate a client-supplied path as project-relative without touching disk.
   * The workspace helpers repeat the containment check on the real target.
   *
   * @param {string} relativePath
   */
  relativeTo(relativePath) {
    const relative = normalizeRelativePath(relativePath)
    if (relative === '') {
      throw codedError('notes/bad-relative-path', 'a file path is required')
    }
    return relative
  }

  /**
   * Ask the OS for a directory. Returns null when the user cancels the dialog.
   * @param {AbortSignal | undefined} signal
   */
  async pickDirectory(signal) {
    const picker = this.ctx.directoryPicker
    if (picker === undefined) {
      throw codedError('notes/picker-unavailable', 'no directory picker is available on this host')
    }
    const capability = picker.capability()
    if (capability.kind !== 'native') {
      throw codedError(
        'notes/picker-unavailable',
        `this host only offers the "${String(capability.kind)}" directory picker`,
      )
    }
    const picked = await capability.pick(signal)
    return picked === null ? null : picked
  }

  /**
   * Register a picked directory as a project. `git init` runs only when the
   * directory itself is not already the top of a repository: a parent
   * repository is never reused, and nothing outside the directory is touched.
   *
   * @param {string} rootPath
   * @param {AbortSignal | undefined} signal
   */
  async registerProject(rootPath, signal) {
    const fs = this.ctx.fs
    const target = await fs.resolve(rootPath, signal === undefined ? undefined : { signal })
    const stats = await fs.stat(target, signal)
    if (stats === undefined) {
      throw codedError('notes/not-found', `"${rootPath}" no longer exists`)
    }
    if (stats.type !== 'directory') {
      throw codedError('notes/not-directory', `"${rootPath}" is not a directory`)
    }
    const repository = await readToplevel(this.ctx.subprocess, rootPath, signal)
    if (repository === undefined || !samePath(repository, rootPath)) {
      await initRepository(this.ctx.subprocess, rootPath, signal)
    }
    const now = Date.now()
    const id = projectIdFor(rootPath)
    const existing = this.store.get(id)
    const record = {
      id,
      name: basename(rootPath) || rootPath,
      rootPath,
      gitInitialized: true,
      createdAt: existing === undefined ? now : existing.createdAt,
      updatedAt: now,
    }
    return await this.store.put(record)
  }
}

/**
 * Normalize separators before comparing, so `C:/a` and `C:\a` agree.
 *
 * The picked directory arrives from the native directory picker while the
 * repository root arrives from `git rev-parse`, and the two can spell the same
 * directory differently: Git always reports the long form
 * (`C:/Users/mars.liao/...`) while a caller may hold the 8.3 short form
 * (`C:/Users/MARS~1.LIA/...`). Comparing the raw strings would then look like
 * "different directory", and `registerProject` would run `git init` inside a
 * directory that is already its own repository. Resolving a symlink is not
 * enough for that case, so an unresolvable path simply falls back to its
 * normalized text.
 */
function samePath(left, right) {
  const normalize = (value) => value.replace(/[\\/]+/g, '/').replace(/\/+$/, '').toLowerCase()
  const resolve = (value) => {
    try {
      return normalize(realpathSync.native(value))
    } catch {
      return normalize(value)
    }
  }
  return resolve(left) === resolve(right)
}

function basename(value) {
  const trimmed = value.replace(/[\\/]+$/, '')
  const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  return index === -1 ? trimmed : trimmed.slice(index + 1)
}

/**
 * Install the prototype marker list once per class.
 * @param {typeof NotesRemote} klass
 */
export function markRemoteMethods(klass) {
  Object.defineProperty(klass.prototype, REMOTE_METHOD_DESCRIPTOR, {
    configurable: true,
    enumerable: false,
    writable: false,
    value: Object.freeze({ version: 1, methods: Object.freeze(remoteMarkers()) }),
  })
  return klass
}

/**
 * Open the project registry in the Host's existing storage stack (never by
 * inserting another storage provider row) and bind the Remote service.
 *
 * @param {object} ctx plugin context
 */
export async function createNotesRemote(ctx) {
  const domain = await ctx.storageDomain.open(defineNotesDomain(storageDomainTable))
  const store = new ProjectStore(domain.table('projects'))
  const remote = new NotesRemote(ctx, store)
  return { remote, store, domain }
}

export { NotesRemote }
