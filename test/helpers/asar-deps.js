/**
 * Give a plain `node --test` process access to the Host service packages that
 * this plugin imports at module scope (`@deepseek-ai/dsh-storage-domain`,
 * `@deepseek-ai/dsh-typert-protocol`) plus the real providers the integration
 * test wants to exercise (`@deepseek-ai/dsh-fs-local`,
 * `@deepseek-ai/dsh-subprocess-local`).
 *
 * Those packages are shipped inside the packaged Harness (`app.asar`) and have
 * no unpacked copy on disk, so a test cannot resolve them from
 * `node_modules`. This helper reads the asar directory table, extracts exactly
 * the measured import closure into a scratch directory, and installs a
 * resolution hook that maps the bare specifiers onto it.
 *
 * Nothing here mutates the product package or the user's workspace: the only
 * writes go to the caller-provided scratch directory.
 *
 * @module test/helpers/asar-deps
 */

import {
  closeSync,
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'

/**
 * The import closure of the four seed packages, measured from the packaged
 * application (declared dependencies plus every bare specifier found in their
 * sources). Extracting by prefix keeps nested `node_modules` subtrees that
 * ship inside a package, which is how `dsh-typert-protocol` carries zod.
 */
export const PACKAGES = [
  '@deepseek-ai/cordis',
  '@deepseek-ai/cordis-plugin-include',
  '@deepseek-ai/cordis-plugin-loader',
  '@deepseek-ai/cosmokit',
  '@deepseek-ai/dsh-brand',
  '@deepseek-ai/dsh-fs',
  '@deepseek-ai/dsh-fs-local',
  '@deepseek-ai/dsh-fs-patch',
  '@deepseek-ai/dsh-http-proxy',
  '@deepseek-ai/dsh-lazy-require',
  '@deepseek-ai/dsh-llm',
  '@deepseek-ai/dsh-sandbox',
  '@deepseek-ai/dsh-scope',
  '@deepseek-ai/dsh-session',
  '@deepseek-ai/dsh-storage',
  '@deepseek-ai/dsh-storage-domain',
  '@deepseek-ai/dsh-subprocess',
  '@deepseek-ai/dsh-subprocess-local',
  '@deepseek-ai/dsh-timeout',
  '@deepseek-ai/dsh-typert-protocol',
  '@deepseek-ai/dsh-util-crypto',
  '@deepseek-ai/dsh-util-values',
  '@deepseek-ai/dsh-win32-process',
  '@deepseek-ai/schemastery',
  '@koromix/koffi-win32-x64',
  '@standard-schema/spec',
  'argparse',
  'chokidar',
  'js-yaml',
  'koffi',
  'node-addon-api',
  'node-addon-native-custom-loader',
  'node-addon-require-builtin',
  'node-addon-require-builtin-win32-x64-msvc',
  'node-pty',
  'readdirp',
  'undici',
  'zod',
]

/**
 * Default install location of the packaged application on Windows.
 */
export const DEFAULT_ASAR = join(
  process.env.LOCALAPPDATA ?? 'C:\\Users\\Public\\AppData\\Local',
  'Programs',
  'DeepSeek Harness',
  'resources',
  'app.asar',
)

/**
 * Locate the packaged application archive.
 *
 * `DSH_APP_ASAR` wins so the test can be pointed at another install without
 * editing it; otherwise the default Windows location is used.
 *
 * @returns {string | null} absolute path, or null when nothing was found
 */
export function locateAppAsar() {
  const candidates = [process.env.DSH_APP_ASAR, DEFAULT_ASAR]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate !== '' && existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

/**
 * Read the asar directory table.
 *
 * The archive starts with a pickle: a uint32 payload length at offset 8, the
 * directory-table byte length at offset 12, and the JSON table itself from
 * offset 16. Entry `offset` values are decimal strings relative to the end of
 * the table, and `unpacked` entries carry no offset at all.
 *
 * @param {string} asarPath
 */
function readDirectory(asarPath) {
  const buffer = readFileSync(asarPath)
  const headerSize = buffer.readUInt32LE(12)
  const header = JSON.parse(buffer.toString('utf8', 16, 16 + headerSize))
  return { buffer, dataOffset: 16 + headerSize, files: header.files }
}

/**
 * Walk the asar tree, yielding `[entryKey, entry]` pairs.
 *
 * @param {Record<string, any>} files
 * @param {string} [prefix]
 */
function* walk(files, prefix = '') {
  for (const [name, entry] of Object.entries(files)) {
    const key = prefix === '' ? name : `${prefix}/${name}`
    if (entry && typeof entry === 'object' && entry.files !== undefined) {
      yield* walk(entry.files, key)
    } else {
      yield [key, entry]
    }
  }
}

/**
 * The unpacked sibling directory of an archive (`app.asar` → `app.asar.unpacked`).
 *
 * Electron stores native and otherwise unpackable packages there instead of
 * inside the archive, so the extracted closure is only complete once those
 * subtrees are copied across as well.
 *
 * @param {string} asarPath
 */
function unpackedRootFor(asarPath) {
  return asarPath.endsWith('.asar') ? `${asarPath}.unpacked` : `${asarPath}.unpacked`
}

/**
 * Count the files and bytes below a directory.
 * @param {string} root
 * @returns {{files: number, bytes: number}}
 */
function measureTree(root) {
  let files = 0
  let bytes = 0
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) {
      const nested = measureTree(path)
      files += nested.files
      bytes += nested.bytes
    } else if (entry.isFile()) {
      files += 1
      bytes += statSync(path).size
    }
  }
  return { files, bytes }
}

/**
 * Read the completion marker, if it was written by this exact package list.
 *
 * @param {string} depsRoot
 * @returns {{files: number, bytes: number} | null}
 */
function readMarker(depsRoot) {
  const marker = join(depsRoot, '.complete')
  if (!existsSync(marker)) return null
  try {
    const stat = JSON.parse(readFileSync(marker, 'utf8'))
    const samePackages =
      Array.isArray(stat.packages) &&
      stat.packages.length === PACKAGES.length &&
      stat.packages.every((name, index) => name === PACKAGES[index])
    if (!samePackages) return null
    return { files: stat.files, bytes: stat.bytes }
  } catch {
    return null
  }
}

/**
 * Sleep without a busy loop, for lock retries.
 * @param {number} ms
 */
function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/**
 * Take a cross-process lock next to `depsRoot`.
 *
 * `node --test` runs test files in separate processes, and each of them calls
 * {@link extractDeps}. Without a lock two processes copy the unpacked native
 * packages into the same destination and the second one fails with
 * `EPIPE, The process cannot access the file because it is being used by
 * another process`.
 *
 * The lock is a `wx`-created file next to the deps root; the holder removes it
 * on release. A stale lock from a crashed run is reclaimed after
 * {@link LOCK_TIMEOUT_MS}.
 *
 * @param {string} depsRoot
 * @returns {() => void} release function
 */
function acquireLock(depsRoot) {
  const lockPath = `${depsRoot}.lock`
  const deadline = Date.now() + LOCK_TIMEOUT_MS
  for (;;) {
    try {
      mkdirSync(dirname(lockPath), { recursive: true })
      closeSync(openSync(lockPath, 'wx'))
      return () => {
        try {
          rmSync(lockPath, { force: true })
        } catch {
          // A concurrent release already removed it; nothing to do.
        }
      }
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      if (Date.now() > deadline) {
        // The holder died without releasing: reclaim rather than hang forever.
        rmSync(lockPath, { force: true })
        continue
      }
      sleep(LOCK_RETRY_MS)
    }
  }
}

/** How long a process waits for another one to finish extracting. */
const LOCK_TIMEOUT_MS = 120000

/** Delay between lock attempts. */
const LOCK_RETRY_MS = 50

/**
 * Extract the measured package closure out of an asar archive.
 *
 * Packages that Electron left unpacked (native addons such as `koffi`, which
 * `@deepseek-ai/dsh-fs-local` lazy-imports on the atomic-replace write path)
 * have no offset in the archive and are copied from the sibling
 * `app.asar.unpacked` directory instead.
 *
 * Extraction is skipped when every package is already present under
 * `depsRoot` and the marker was written by the same package list, so repeated
 * runs reuse the first extraction while a newly added package still triggers
 * a refresh. Concurrent callers are serialized by a lock, and the result is
 * published with a single rename so no reader can ever observe a half-written
 * tree.
 *
 * @param {string} asarPath archive to read
 * @param {string} depsRoot directory that becomes a `node_modules` parent
 * @returns {{files: number, bytes: number, missing: string[], cached: boolean}}
 */
export function extractDeps(asarPath, depsRoot) {
  const cached = readMarker(depsRoot)
  if (cached !== null) return { ...cached, missing: [], cached: true }

  const release = acquireLock(depsRoot)
  try {
    // Another process may have finished while this one waited for the lock.
    const settled = readMarker(depsRoot)
    if (settled !== null) return { ...settled, missing: [], cached: true }

    // Build in a staging directory owned by this process, then publish it with
    // one rename: a plain in-place copy would leave the shared root readable
    // in a half-populated state if this process were killed midway.
    const staging = `${depsRoot}.s${process.pid}-${Date.now()}`
    rmSync(staging, { recursive: true, force: true })

    const { buffer, dataOffset, files } = readDirectory(asarPath)
    const prefixes = PACKAGES.map((name) => `dsh/node_modules/${name}/`)
    const seen = new Set()
    let written = 0
    let bytes = 0

    try {
      for (const [key, entry] of walk(files)) {
        const prefix = prefixes.find((candidate) => key.startsWith(candidate))
        if (prefix === undefined) continue
        if (entry.unpacked === true) continue
        if (typeof entry.offset !== 'string') continue
        const start = dataOffset + Number(entry.offset)
        const target = join(staging, 'node_modules', key.slice('dsh/node_modules/'.length))
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, buffer.subarray(start, start + entry.size))
        seen.add(prefix)
        written += 1
        bytes += entry.size
      }

      const unpackedRoot = unpackedRootFor(asarPath)
      for (const name of PACKAGES) {
        const source = join(unpackedRoot, 'dsh', 'node_modules', name)
        if (!existsSync(source)) continue
        const target = join(staging, 'node_modules', name)
        mkdirSync(dirname(target), { recursive: true })
        cpSync(source, target, { recursive: true, force: true })
        const measured = measureTree(target)
        seen.add(`dsh/node_modules/${name}/`)
        written += measured.files
        bytes += measured.bytes
      }

      const missing = PACKAGES.filter((name) => !seen.has(`dsh/node_modules/${name}/`))
      if (missing.length === 0) {
        writeFileSync(
          join(staging, '.complete'),
          JSON.stringify({ files: written, bytes, packages: PACKAGES }),
        )
      }

      // Publish. If an earlier process won the race the staging tree is simply
      // discarded and the winner's tree is reused; a markerless leftover from an
      // older in-place run is replaced, because nothing may read a tree that was
      // never published.
      if (readMarker(depsRoot) !== null) {
        rmSync(staging, { recursive: true, force: true })
      } else {
        rmSync(depsRoot, { recursive: true, force: true })
        renameSync(staging, depsRoot)
      }
      return { files: written, bytes, missing, cached: false }
    } finally {
      // A failed or superseded run must not leave a per-process tree behind.
      rmSync(staging, { recursive: true, force: true })
    }
  } finally {
    release()
  }
}

/**
 * Map bare `@deepseek-ai/*` (and the rest of the closure) onto a deps root.
 *
 * Resolving the rewritten specifier relative to an anchor file inside the deps
 * root is what makes plain node resolution work for both the product files and
 * the extracted packages themselves.
 *
 * @param {string} depsRoot directory created by {@link extractDeps}
 */
export function installResolver(depsRoot) {
  const anchor = pathToFileURL(join(depsRoot, 'anchor.mjs')).href
  const names = new Set(PACKAGES)
  registerHooks({
    resolve(specifier, context, nextResolve) {
      const name = packageNameOf(specifier)
      if (name !== null && names.has(name)) {
        return nextResolve(specifier, { ...context, parentURL: anchor })
      }
      return nextResolve(specifier, context)
    },
  })
  return { anchor, names }
}

/**
 * The package part of a bare specifier, or null for URLs and paths.
 * @param {string} specifier
 */
function packageNameOf(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) {
    return null
  }
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(specifier)) return null
  const parts = specifier.split('/')
  if (specifier.startsWith('@')) return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null
  return parts[0]
}
