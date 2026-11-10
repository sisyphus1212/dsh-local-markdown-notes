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

/**
 * Stop after this many Markdown files.
 *
 * This is a runaway guard, not a page size: a project is normally a few thousand
 * notes, and the Client reports `truncated` so an incomplete answer is never
 * passed off as complete.
 */
export const MAX_SCANNED_FILES = 2000

/** Stop after this many line hits; the panel shows a "narrow the query" hint. */
export const MAX_HITS = 200

/** Characters in one hit's context window, ellipses included. */
export const WINDOW_CHARS = 240

/**
 * Markdown files read at the same time.
 *
 * Every `ctx.fs` call is a round trip, so a search costs two per file and a
 * serial walk of a large tree spends nearly all of its time waiting. Four in
 * flight is where that stops paying: measured on a 1141-file vault, four took
 * 2.6s against 6.9s serial, while eight and sixteen were slower than four.
 */
const SCAN_CONCURRENCY = 4

/**
 * Directories listed at the same time while walking the tree.
 *
 * The walk, not the reading, is what a search spends its time on: every
 * `fs.listDir` is a round trip, and the tree of a large vault has hundreds of
 * directories. On a 1141-file vault over a network mount a serial walk took
 * 157s for 799 directories; four lanes took 61s, while eight and sixteen were
 * no better. Lanes only ever run within one depth level, so the collected order
 * stays the breadth-first order a serial walk produces.
 */
const WALK_CONCURRENCY = 4

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
 * The walk happens in two passes. The first only lists directories and collects
 * the files in breadth-first order; the second reads them a batch at a time and
 * merges the batch back in that order. Reading concurrently is what makes a
 * large vault answer in seconds instead of tens of them, and merging in walk
 * order keeps the result identical to a serial walk — which matters because
 * both caps below decide *which* files are covered. The first pass overlaps
 * sibling directories too (`WALK_CONCURRENCY`), because on a network mount the
 * listing round trips dominate everything else.
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

  /** @type {Array<{ target: object, relative: string }>} */
  const candidates = []

  // One depth level at a time, so the file order below is still the order a
  // serial walk would produce; only the listing of sibling directories overlaps.
  let level = [{ target: rootTarget, relative: '' }]

  while (level.length > 0) {
    /** @type {Array<{ target: object, relative: string }>} */
    const next = []

    for (let start = 0; start < level.length; start += WALK_CONCURRENCY) {
      const lane = level.slice(start, start + WALK_CONCURRENCY)
      const listings = await Promise.all(lane.map((directory) => fs.listDir(directory.target, signal)))

      for (let index = 0; index < lane.length; index += 1) {
        const directory = lane[index]
        const children = listings[index]
        children.sort(compareChildren)

        for (const child of children) {
          if (isIgnoredEntry(child.name)) continue
          if (!fs.contains(rootTarget, child.target)) continue

          if (child.type === 'directory') {
            next.push({ target: child.target, relative: joinRelative(directory.relative, child.name) })
            continue
          }
          if (child.type !== 'file') continue
          if (!isMarkdownFile(child.name)) continue

          candidates.push({ target: child.target, relative: joinRelative(directory.relative, child.name) })
        }
      }
    }

    level = next
  }

  const hits = []
  let scanned = 0
  let matched = 0
  let truncated = candidates.length > MAX_SCANNED_FILES
  const budget = Math.min(candidates.length, MAX_SCANNED_FILES)

  for (let start = 0; start < budget && hits.length < MAX_HITS; start += SCAN_CONCURRENCY) {
    const batch = candidates.slice(start, Math.min(budget, start + SCAN_CONCURRENCY))
    // `stat` before `readText`, once per file: an oversized file costs a stat
    // and no read at all.
    const reads = await Promise.all(
      batch.map(async (file) => {
        const stats = await fs.stat(file.target, signal)
        if (stats === undefined || stats.type !== 'file') return { file, lines: null }
        if (stats.size > MAX_FILE_BYTES) return { file, lines: null }
        return { file, lines: linesOf(await fs.readText(file.target, signal)) }
      }),
    )

    for (const read of reads) {
      scanned += 1
      if (read.lines === null) continue
      let lineNumber = 0
      let fileMatched = false

      for (const line of read.lines) {
        lineNumber += 1
        const at = line.toLowerCase().indexOf(haystack)
        if (at === -1) continue
        fileMatched = true
        const window = clipLine(line, at, needle.length)
        hits.push({ path: read.file.relative, line: lineNumber, column: window.column, text: window.text })
        if (hits.length >= MAX_HITS) break
      }

      if (fileMatched) matched += 1
      if (hits.length >= MAX_HITS) {
        truncated = true
        break
      }
    }
  }

  return { query, hits, scanned, matched, truncated }
}
