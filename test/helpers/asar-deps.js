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

import { cpSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
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
 * a refresh.
 *
 * @param {string} asarPath archive to read
 * @param {string} depsRoot directory that becomes a `node_modules` parent
 * @returns {{files: number, bytes: number, missing: string[], cached: boolean}}
 */
export function extractDeps(asarPath, depsRoot) {
  const marker = join(depsRoot, '.complete')
  if (existsSync(marker)) {
    const stat = JSON.parse(readFileSync(marker, 'utf8'))
    const samePackages =
      Array.isArray(stat.packages) &&
      stat.packages.length === PACKAGES.length &&
      stat.packages.every((name, index) => name === PACKAGES[index])
    if (samePackages) return { files: stat.files, bytes: stat.bytes, missing: [], cached: true }
  }

  const { buffer, dataOffset, files } = readDirectory(asarPath)
  const prefixes = PACKAGES.map((name) => `dsh/node_modules/${name}/`)
  const seen = new Set()
  let written = 0
  let bytes = 0

  for (const [key, entry] of walk(files)) {
    const prefix = prefixes.find((candidate) => key.startsWith(candidate))
    if (prefix === undefined) continue
    if (entry.unpacked === true) continue
    if (typeof entry.offset !== 'string') continue
    const start = dataOffset + Number(entry.offset)
    const target = join(depsRoot, 'node_modules', key.slice('dsh/node_modules/'.length))
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
    const target = join(depsRoot, 'node_modules', name)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(source, target, { recursive: true, force: true })
    const measured = measureTree(target)
    seen.add(`dsh/node_modules/${name}/`)
    written += measured.files
    bytes += measured.bytes
  }

  const missing = PACKAGES.filter((name) => !seen.has(`dsh/node_modules/${name}/`))
  if (missing.length === 0) {
    writeFileSync(marker, JSON.stringify({ files: written, bytes, packages: PACKAGES }))
  }
  return { files: written, bytes, missing, cached: false }
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
