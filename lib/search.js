/**
 * Substring search across the Markdown files of one project.
 *
 * This module sits beside `lib/workspace.js` and reuses the same rules: only
 * Markdown files are looked at, dot-prefixed entries and `node_modules`/`.git`
 * are skipped, and every visited target is re-checked with `fs.contains` so a
 * symlink cannot walk the search outside the project root.
 *
 * The result is a flat list of line hits rather than whole files: a search panel
 * only ever renders one line per match, and shipping whole files would push
 * megabytes of text through the Remote boundary for no gain. Each hit carries a
 * window of at most `WINDOW_CHARS` characters around the match, with `…` marking
 * a cut end, plus a `column` that is already relative to that window so the
 * Client can highlight it without re-deriving the arithmetic.
 *
 * I/O failures are deliberately not translated here: the Remote method wraps
 * whatever escapes into the `notes/*` envelope, and inventing codes at this
 * layer would hide the real reason (a permission error is not a "search failed"
 * bug in the search code).
 */

import { isIgnoredEntry, isMarkdownFile } from './pure.js'
import { MAX_FILE_BYTES } from './workspace.js'

/** Stop after this many Markdown files: a search must never hang the Host. */
export const MAX_SCANNED_FILES = 400

/** Stop after this many line hits; the panel shows a "narrow the query" hint. */
export const MAX_HITS = 200

/** Characters in one hit's context window, ellipses included. */
export const WINDOW_CHARS = 240

const ELLIPSIS = '…'

/**
 * Slice one line around a match.
 *
 * The window is centred on the match and never shorter than the match itself.
 * Both cut ends get an ellipsis, and those characters are taken out of the
 * window budget rather than added to it, so `text.length <= WINDOW_CHARS`
 * always holds.
 *
 * @param {string} text the source line, without its line terminator
 * @param {number} at 0-based index of the match in `text`
 * @param {number} length length of the matched text
 */
function clipLine(text, at, length) {
  if (text.length <= WINDOW_CHARS) return { text, column: at }
  if (length >= WINDOW_CHARS) {
    // A query longer than the window: keep the match itself and cut the tail.
    return { text: `${text.slice(at, at + WINDOW_CHARS - 1)}${ELLIPSIS}`, column: 0 }
  }
  const sliceFor = (capacity) => {
    let start = Math.max(0, at - Math.floor((capacity - length) / 2))
    const end = Math.min(text.length, start + capacity)
    if (end - start < capacity) start = Math.max(0, end - capacity)
    return { start, end }
  }
  let capacity = WINDOW_CHARS
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { start, end } = sliceFor(capacity)
    const lead = start > 0
    const trail = end < text.length
    const wanted = WINDOW_CHARS - (lead ? 1 : 0) - (trail ? 1 : 0)
    if (wanted === capacity) {
      return {
        text: `${lead ? ELLIPSIS : ''}${text.slice(start, end)}${trail ? ELLIPSIS : ''}`,
        column: at - start + (lead ? 1 : 0),
      }
    }
    capacity = wanted
  }
  // Unreachable in practice; keep a correct window rather than throw.
  const { start, end } = sliceFor(WINDOW_CHARS - 2)
  return { text: `${ELLIPSIS}${text.slice(start, end)}${ELLIPSIS}`, column: at - start + 1 }
}

/** The lines of a document, without their `\n`, `\r\n` or `\r` terminators. */
function linesOf(content) {
  return content.split(/\r\n|\r|\n/)
}

function joinRelative(parent, name) {
  return parent === '' ? name : `${parent}/${name}`
}

/** Deterministic order, so the same tree always yields the same result list. */
function compareChildren(left, right) {
  if (left.type !== right.type) return left.type === 'directory' ? -1 : 1
  return left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })
}

/**
 * Search every Markdown file below `rootPath` for a case-insensitive substring.
 *
 * @param {object} fs the `ctx.fs` service
 * @param {string} rootPath absolute project root
 * @param {string} query the text to look for
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ query: string, hits: Array<{ path: string, line: number, column: number, text: string }>, scanned: number, matched: number, truncated: boolean }>}
 */
export async function searchProject(fs, rootPath, query, options = {}) {
  const signal = options.signal
  const needle = typeof query === 'string' ? query.trim() : ''
  if (needle === '') {
    return { query: '', hits: [], scanned: 0, matched: 0, truncated: false }
  }

  const haystack = needle.toLowerCase()
  const rootTarget = await fs.resolve(rootPath)
  const hits = []
  let scanned = 0
  let matched = 0
  let truncated = false

  /** @type {Array<{ target: object, relative: string }>} */
  const queue = [{ target: rootTarget, relative: '' }]
  let cursor = 0

  while (cursor < queue.length) {
    const directory = queue[cursor]
    cursor += 1
    const children = await fs.listDir(directory.target, signal)
    children.sort(compareChildren)

    for (const child of children) {
      if (isIgnoredEntry(child.name)) continue
      if (!fs.contains(rootTarget, child.target)) continue

      if (child.type === 'directory') {
        queue.push({ target: child.target, relative: joinRelative(directory.relative, child.name) })
        continue
      }
      if (child.type !== 'file') continue
      if (!isMarkdownFile(child.name)) continue

      if (scanned >= MAX_SCANNED_FILES) {
        truncated = true
        cursor = queue.length
        break
      }
      scanned += 1

      const stats = await fs.stat(child.target, signal)
      if (stats === undefined || stats.type !== 'file') continue
      if (stats.size > MAX_FILE_BYTES) continue

      const content = await fs.readText(child.target, signal)
      const relative = joinRelative(directory.relative, child.name)
      let lineNumber = 0
      let fileMatched = false

      for (const line of linesOf(content)) {
        lineNumber += 1
        const at = line.toLowerCase().indexOf(haystack)
        if (at === -1) continue
        fileMatched = true
        const window = clipLine(line, at, needle.length)
        hits.push({ path: relative, line: lineNumber, column: window.column, text: window.text })
        if (hits.length >= MAX_HITS) {
          truncated = true
          break
        }
      }

      if (fileMatched) matched += 1
      if (truncated) {
        cursor = queue.length
        break
      }
    }
  }

  return { query, hits, scanned, matched, truncated }
}
