/**
 * 纯逻辑层：路径包含性、相对路径校验、Markdown 过滤、git 输出解析。
 *
 * 本文件不 import 任何 Host 服务，也不做 I/O，因此可以用 `node --test` 直接测。
 * 所有路径一律按当前平台的 `node:path` 语义处理（Windows 下是 win32），
 * 但相对路径的「词法」校验与平台无关：分隔符同时接受 `/` 与 `\`，
 * 输出统一成 `/`，供 git 与 UI 使用。
 */
import path from 'node:path'

/** Markdown 扩展名白名单（大小写不敏感）。 */
const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown', '.mdown', '.mkd', '.mdx'])

/** 目录里不展示、也不参与递归的条目。 */
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules'])

/**
 * 判断文件名是否是 Markdown。只按扩展名判断，不看内容。
 * @param {string} name 文件名或相对路径
 * @returns {boolean}
 */
export function isMarkdownFile(name) {
  if (typeof name !== 'string' || name.length === 0) return false
  return MARKDOWN_EXTENSIONS.has(path.extname(name).toLowerCase())
}

/**
 * 判断目录条目是否应被跳过（`.git`、`node_modules`、隐藏点目录）。
 * @param {string} name
 * @returns {boolean}
 */
export function isIgnoredEntry(name) {
  if (typeof name !== 'string' || name.length === 0) return true
  if (IGNORED_DIRECTORIES.has(name)) return true
  return name.startsWith('.')
}

/**
 * 归一化用户/客户端给的相对路径。
 *
 * 规则（全部是拒绝式校验，不做静默纠正）：
 * - 空串表示根目录本身，允许；
 * - 绝对路径（含 Windows 盘符、UNC、前导 `/` 或 `\`）一律拒绝；
 * - 任何一段是 `..` 一律拒绝（不允许上跳）；
 * - `.` 段被剔除；
 * - 输出统一用 `/` 分隔，无前导/尾随分隔符。
 *
 * @param {string} input
 * @returns {string} 归一化后的相对路径（可为空串）
 * @throws {TypeError} 输入非法时抛出，`code` 为 `notes/bad-relative-path`
 */
export function normalizeRelativePath(input) {
  if (typeof input !== 'string') throw badPath('relative path must be a string')
  const trimmed = input.trim()
  if (trimmed.length === 0) return ''
  if (trimmed.startsWith('/') || trimmed.startsWith('\\')) throw badPath(`absolute path is not allowed: ${input}`)
  if (/^[A-Za-z]:/.test(trimmed)) throw badPath(`drive-qualified path is not allowed: ${input}`)
  if (trimmed.startsWith('\\\\') || trimmed.startsWith('//')) throw badPath(`UNC path is not allowed: ${input}`)
  const segments = trimmed.split(/[\\/]+/)
  const kept = []
  for (const segment of segments) {
    if (segment.length === 0 || segment === '.') continue
    if (segment === '..') throw badPath(`parent traversal is not allowed: ${input}`)
    kept.push(segment)
  }
  return kept.join('/')
}

function badPath(message) {
  const error = new Error(message)
  error.code = 'notes/bad-relative-path'
  return error
}

/**
 * 把相对路径拼到根目录上，并保证结果仍在根目录内。
 *
 * 这是 Host 侧唯一的路径出口：所有文件读写都必须经过它，
 * 而不是把客户端传来的路径直接 `path.join`。
 *
 * @param {string} root 已规范化（真实路径）的项目根目录
 * @param {string} relative 相对路径（`normalizeRelativePath` 的产物）
 * @returns {string} 绝对路径
 * @throws {TypeError} 越界时抛出，`code` 为 `notes/outside-root`
 */
export function resolveInside(root, relative) {
  if (typeof root !== 'string' || root.length === 0) throw badPath('root must be a non-empty string')
  const normalized = normalizeRelativePath(relative)
  const base = path.resolve(root)
  const target = normalized.length === 0 ? base : path.resolve(base, ...normalized.split('/'))
  if (!containsPath(base, target)) {
    const error = new Error(`path escapes project root: ${relative}`)
    error.code = 'notes/outside-root'
    throw error
  }
  return target
}

/**
 * 判断 `child` 是否等于 `parent` 或位于 `parent` 之下。
 *
 * 用 `path.relative` 而不是字符串前缀比较：前缀比较会把 `C:\a\bc` 误判成在 `C:\a\b` 内。
 * 大小写按平台语义（Windows 下 `path.relative` 已不敏感）。
 *
 * @param {string} parent
 * @param {string} child
 * @returns {boolean}
 */
export function containsPath(parent, child) {
  if (typeof parent !== 'string' || typeof child !== 'string') return false
  if (parent.length === 0 || child.length === 0) return false
  const from = path.resolve(parent)
  const to = path.resolve(child)
  const rel = path.relative(from, to)
  if (rel === '') return true
  if (path.isAbsolute(rel)) return false
  return !rel.split(path.sep).includes('..')
}

/** git porcelain v1 里 XY 状态的两种维度：工作区与暂存区。 */
const STATUS_LABELS = Object.freeze({
  M: 'modified',
  A: 'added',
  D: 'deleted',
  R: 'renamed',
  C: 'copied',
  U: 'conflicted',
  '?': 'untracked',
  '!': 'ignored',
  ' ': 'unmodified',
})

/**
 * 解析 `git status --porcelain=v1 -z --untracked-files=all` 的输出。
 *
 * `-z` 模式用 NUL 分隔；重命名/复制条目在其后紧跟一个原路径，
 * 因此要按 record 数组消费而不是按行。
 *
 * @param {string} output
 * @returns {Array<{path: string, index: string, worktree: string, kind: string, from?: string}>}
 */
export function parsePorcelainStatus(output) {
  if (typeof output !== 'string' || output.length === 0) return []
  const records = output.split('\u0000')
  const entries = []
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i]
    if (record.length < 4) continue
    const index = record[0]
    const worktree = record[1]
    const filePath = record.slice(3)
    const code = pickStatusCode(index, worktree)
    const entry = { path: toPosix(filePath), index, worktree, kind: STATUS_LABELS[code] ?? 'unknown' }
    if (code === 'R' || code === 'C') {
      const from = records[i + 1]
      if (typeof from === 'string' && from.length > 0) {
        entry.from = toPosix(from)
        i += 1
      }
    }
    entries.push(entry)
  }
  return entries
}

function pickStatusCode(index, worktree) {
  // 未跟踪/忽略只在 X 位出现 `?`/`!`，此时 Y 位是空格。
  if (index === '?' || index === '!') return index
  // 冲突态统一按 U。
  if (index === 'U' || worktree === 'U') return 'U'
  // 工作区有变化优先展示工作区，否则展示暂存区。
  if (worktree !== ' ' && worktree !== '') return worktree
  return index
}

function toPosix(value) {
  return value.split('\\').join('/')
}

/**
 * 解析 `git blame --line-porcelain` 的输出，返回逐行的 blame 记录。
 *
 * porcelain 每条记录以 40/64 位 sha + 行号起头，随后是 `key value` 元数据行，
 * 记录之间用空行分隔；`previous` 给出上一版 sha，`filename` 给出提交里的文件名。
 * 只保留 UI 要展示的字段。
 *
 * @param {string} output
 * @returns {Array<{sha: string, line: number, finalLine: number, author: string, authorTime: number, summary: string}>}
 */
export function parseBlamePorcelain(output) {
  if (typeof output !== 'string' || output.length === 0) return []
  const lines = output.split('\n')
  const result = []
  let current = null
  for (const raw of lines) {
    if (raw.length === 0) {
      if (current !== null) {
        result.push(current)
        current = null
      }
      continue
    }
    const header = /^([0-9a-f]{7,64}) (\d+) (\d+)(?: (\d+))?$/.exec(raw)
    if (header !== null) {
      if (current !== null) result.push(current)
      current = {
        sha: header[1],
        line: Number(header[2]),
        finalLine: Number(header[3]),
        author: '',
        authorTime: 0,
        summary: '',
      }
      continue
    }
    if (current === null) continue
    const space = raw.indexOf(' ')
    if (space <= 0) continue
    const key = raw.slice(0, space)
    const value = raw.slice(space + 1)
    if (key === 'author') current.author = value
    else if (key === 'author-time') current.authorTime = Number(value) || 0
    else if (key === 'summary') current.summary = value
  }
  if (current !== null) result.push(current)
  return result
}

/**
 * 在 blame 记录里找某一行的那一份，找不到返回 `undefined`。
 * @param {Array<object>} entries `parseBlamePorcelain` 的结果
 * @param {number} line 1 基行号
 */
export function blameAtLine(entries, line) {
  if (!Array.isArray(entries)) return undefined
  return entries.find((entry) => entry.finalLine === line)
}

/**
 * 校验项目 id：只允许字母数字与 `-`/`_`，避免被当作路径使用。
 * @param {string} value
 * @returns {string}
 */
export function normalizeProjectId(value) {
  const id = typeof value === 'string' ? value.trim() : ''
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id)) {
    const error = new Error(`invalid project id: ${JSON.stringify(value)}`)
    error.code = 'notes/bad-project-id'
    throw error
  }
  return id
}

/**
 * 由目录绝对路径生成稳定的项目 id：末段名小写净化 + 路径哈希后缀。
 * 同一目录总是得到同一个 id，不同目录即使同名也不会撞。
 * @param {string} rootPath 绝对路径
 * @returns {string}
 */
export function projectIdFor(rootPath) {
  const resolved = path.resolve(rootPath)
  const base = path.basename(resolved) || 'root'
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'project'
  return `${slug}-${shortHash(resolved)}`
}

/** 32 位 FNV-1a，稳定且无需依赖。 */
export function shortHash(value) {
  let hash = 0x811c9dc5
  const text = String(value).toLowerCase()
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

/**
 * 统一的错误投影：把异常压成 `{code, message}`，供 Remote 返回值使用。
 * @param {unknown} error
 * @param {string} fallbackCode
 */
export function toFailure(error, fallbackCode) {
  const code = typeof error?.code === 'string' && error.code.startsWith('notes/') ? error.code : fallbackCode
  return { code, message: error instanceof Error ? error.message : String(error) }
}
