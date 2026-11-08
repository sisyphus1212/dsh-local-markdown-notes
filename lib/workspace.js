/**
 * Project-scoped file access for the notes Host half.
 *
 * Every path coming from the Client is a project-relative Markdown path. It is
 * joined onto the stored project root and then checked twice: `resolveInside`
 * rejects lexical escapes (`..`, absolute paths, drive letters) before touching
 * disk, and `fs.contains` re-checks the real resolved target afterwards so a
 * symlink that points out of the project cannot be used to read or write outside
 * it.
 */

import { mkdir } from 'node:fs/promises'

import {
  isIgnoredEntry,
  isMarkdownFile,
  normalizeRelativePath,
  resolveInside,
  toFailure,
} from './pure.js'

/** Refuse absurd files rather than handing them to the editor. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024

/** The `fs` service cannot create a directory, so the Host process does it. */
const defaultMkdir = (path, mkdirOptions) => mkdir(path, mkdirOptions)

/**
 * The sandbox fence for every write this plugin performs.
 *
 * `fs.writeText` and friends take a per-call policy; omitting it lets the
 * sandboxing backend fall back to the session's own policy, whose workspace root
 * is the agent workspace — so an imported folder on another drive is refused even
 * though the user explicitly imported it. The imported folder *is* the boundary
 * this plugin may write inside, so it becomes both the workspace root and the one
 * additional writable root. The mode stays `workspace-write`: the fence is the
 * folder, not the whole machine.
 *
 * @param {string} rootPath absolute project root
 */
export function writePolicyFor(rootPath) {
  return { mode: 'workspace-write', workspaceRoot: rootPath, additionalWritableRoots: [rootPath] }
}

function fail(code, message, extra) {
  const error = new Error(message)
  error.code = code
  if (extra !== undefined) error.details = extra
  return error
}

/**
 * Resolve a project-relative path, guaranteeing the result stays inside `rootPath`.
 *
 * @param {object} fs the `ctx.fs` service
 * @param {string} rootPath absolute project root
 * @param {string} relativePath client-supplied project-relative path
 */
export async function resolveEntry(fs, rootPath, relativePath) {
  const relative = normalizeRelativePath(relativePath)
  const lexical = resolveInside(rootPath, relative)
  const rootTarget = await fs.resolve(rootPath)
  if (lexical === resolveInside(rootPath, '')) return { target: rootTarget, rootTarget, relative }
  const target = await fs.resolve(lexical)
  if (!fs.contains(rootTarget, target)) {
    throw fail('notes/outside-root', `refusing to touch "${relative}": outside the project root`)
  }
  return { target, rootTarget, relative }
}

/**
 * List one directory of a project: directories and Markdown files only.
 *
 * @param {object} fs
 * @param {string} rootPath
 * @param {string} relativePath
 * @param {AbortSignal | undefined} signal
 */
export async function listEntries(fs, rootPath, relativePath, signal) {
  const { target, relative } = await resolveEntry(fs, rootPath, relativePath)
  const stats = await fs.stat(target, signal)
  if (stats === undefined) throw fail('notes/not-found', `"${relative}" no longer exists`)
  if (stats.type !== 'directory') throw fail('notes/not-directory', `"${relative}" is not a directory`)
  const children = await fs.listDir(target, signal)
  const entries = []
  for (const child of children) {
    if (isIgnoredEntry(child.name)) continue
    if (child.type === 'directory') {
      entries.push({ name: child.name, path: joinRelative(relative, child.name), type: 'directory' })
      continue
    }
    if (child.type !== 'file') continue
    if (!isMarkdownFile(child.name)) continue
    entries.push({
      name: child.name,
      path: joinRelative(relative, child.name),
      type: 'file',
      ...(child.size === undefined ? {} : { size: child.size }),
    })
  }
  entries.sort(compareEntries)
  return { path: relative, entries }
}

function joinRelative(parent, name) {
  return parent === '' ? name : `${parent}/${name}`
}

function compareEntries(left, right) {
  if (left.type !== right.type) return left.type === 'directory' ? -1 : 1
  return left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })
}

/**
 * Read one Markdown file together with the version token needed to save it.
 *
 * @param {object} fs
 * @param {string} rootPath
 * @param {string} relativePath
 * @param {AbortSignal | undefined} signal
 */
export async function readFile(fs, rootPath, relativePath, signal) {
  const { target, relative } = await resolveEntry(fs, rootPath, relativePath)
  if (!isMarkdownFile(relative)) {
    throw fail('notes/not-markdown', `"${relative}" is not a Markdown file`)
  }
  const stats = await fs.stat(target, signal)
  if (stats === undefined) throw fail('notes/not-found', `"${relative}" no longer exists`)
  if (stats.type !== 'file') throw fail('notes/not-a-file', `"${relative}" is not a file`)
  if (stats.size > MAX_FILE_BYTES) {
    throw fail('notes/too-large', `"${relative}" is ${stats.size} bytes, larger than the ${MAX_FILE_BYTES}-byte limit`)
  }
  const content = await fs.readText(target, signal)
  return { path: relative, content, version: stats.version, size: stats.size }
}

/**
 * Save an edited Markdown file.
 *
 * `expectedVersion` is the version returned by `readFile`. `undefined`/`null`
 * means "this file is new": the write then fails if something already exists at
 * that path, so a save can never silently clobber a file the user never read.
 *
 * @param {object} fs
 * @param {string} rootPath
 * @param {string} relativePath
 * @param {string} content
 * @param {string | null | undefined} expectedVersion
 * @param {AbortSignal | undefined} signal
 */
export async function writeFile(fs, rootPath, relativePath, content, expectedVersion, signal) {
  if (typeof content !== 'string') {
    throw fail('notes/bad-content', 'content must be a string')
  }
  if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) {
    throw fail('notes/too-large', `content exceeds the ${MAX_FILE_BYTES}-byte limit`)
  }
  const { target, relative } = await resolveEntry(fs, rootPath, relativePath)
  if (!isMarkdownFile(relative)) {
    throw fail('notes/not-markdown', `"${relative}" is not a Markdown file`)
  }
  const expected =
    expectedVersion === undefined || expectedVersion === null
      ? { kind: 'createIfAbsent' }
      : { kind: 'replaceIfVersion', version: expectedVersion }
  const result = await fs.writeText(target, content, expected, signal, writePolicyFor(rootPath))
  return {
    path: relative,
    content: result.after ?? content,
    version: result.version,
    operation: result.operation,
  }
}

/** The two things the explorer is allowed to create. */
export const ENTRY_KINDS = Object.freeze(['file', 'directory'])

/**
 * Create one empty file or one directory inside a project.
 *
 * The Host `fs` service reads, lists and writes files but cannot create a
 * directory, so the directory branch goes through an injected `mkdir`. Both
 * branches are non-recursive: a missing parent is `notes/not-found` rather than
 * a silent chain of new directories, and an occupied path is `notes/exists`
 * rather than a silent overwrite.
 *
 * @param {object} fs the `ctx.fs` service
 * @param {string} rootPath absolute project root
 * @param {string} relativePath client-supplied project-relative path
 * @param {'file' | 'directory'} kind
 * @param {{ signal?: AbortSignal, mkdir?: (path: string, options: { recursive: boolean }) => Promise<unknown> }} [options]
 */
export async function createEntry(fs, rootPath, relativePath, kind, options = {}) {
  if (!ENTRY_KINDS.includes(kind)) {
    throw fail('notes/bad-kind', `kind must be "file" or "directory", not ${JSON.stringify(kind)}`)
  }
  const { target, rootTarget, relative } = await resolveEntry(fs, rootPath, relativePath)
  if (relative === '') {
    throw fail('notes/bad-relative-path', 'a path below the project root is required')
  }
  const signal = options.signal
  const existing = await fs.stat(target, signal)
  if (existing !== undefined) throw fail('notes/exists', `"${relative}" already exists`)

  const parentRelative = relative.split('/').slice(0, -1).join('/')
  const parentTarget = parentRelative === '' ? rootTarget : await fs.resolve(resolveInside(rootPath, parentRelative))
  if (!fs.contains(rootTarget, parentTarget)) {
    throw fail('notes/outside-root', `refusing to touch "${relative}": outside the project root`)
  }
  const parent = await fs.stat(parentTarget, signal)
  if (parent === undefined || parent.type !== 'directory') {
    throw fail('notes/not-found', `the folder "${parentRelative}" does not exist`)
  }

  if (kind === 'file') {
    await fs.writeText(target, '', { kind: 'createIfAbsent' }, signal, writePolicyFor(rootPath))
  } else {
    const makeDirectory = options.mkdir ?? defaultMkdir
    try {
      // `targetKey` is opaque: hand the subprocess path the contract publishes.
      await makeDirectory(fs.processPath(target), { recursive: false })
    } catch (error) {
      if (error !== null && typeof error === 'object' && error.code === 'EEXIST') {
        throw fail('notes/exists', `"${relative}" already exists`)
      }
      if (error !== null && typeof error === 'object' && error.code === 'ENOENT') {
        throw fail('notes/not-found', `the folder "${parentRelative}" does not exist`)
      }
      throw error
    }
  }
  return { path: relative, kind }
}

/**
 * Translate a thrown Host error into the shape the panel renders.
 * @param {unknown} error
 * @param {string} fallbackCode
 */
export function asFailure(error, fallbackCode) {
  return toFailure(error, fallbackCode)
}

export { isIgnoredEntry }
