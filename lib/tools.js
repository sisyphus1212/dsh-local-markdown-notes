/**
 * Agent-facing tools for the notes plugin.
 *
 * Every tool delegates to the very same `NotesRemote` methods the panel calls,
 * so a note written in conversation and a note written in the panel go through
 * one path: the same containment check, the same 4 MiB ceiling, and the same
 * version token, so the two callers can never drift apart or silently clobber
 * each other.
 *
 * @module @local/local-markdown-notes/lib/tools
 */

/** Shared wording so every tool explains the project parameter the same way. */
const PROJECT_PARAM = {
  type: 'string',
  description:
    '笔记文件夹的名称或 id。只有一个已导入文件夹时可以省略。先用 notes_projects 查看有哪些文件夹。',
}

const PATH_PARAM = {
  type: 'string',
  description: '相对文件夹根目录的 Markdown 路径，例如 "roadmap/2026.md"。',
}

function renderText(value) {
  return [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }]
}

/** The crash-free JSON output envelope every tool above shares. */
const OUTPUT = Object.freeze({
  schema: { type: 'object', additionalProperties: true },
  render(_args, value) {
    return renderText(value)
  },
})

function fail(message) {
  return new Error(message)
}

/**
 * Turn a user-typed folder reference into a stored project.
 *
 * Conversation callers name a folder ("ovs学习"); the panel holds ids. Accept
 * either, and refuse to guess when the reference is ambiguous — a wrong guess
 * would write into the wrong folder.
 *
 * @param {{ listProjects: (signal?: AbortSignal) => Promise<{ projects: Array<{id: string, name: string, rootPath: string}> }> }} remote
 * @param {unknown} wanted
 */
async function pickProject(remote, wanted) {
  const { projects } = await remote.listProjects()
  if (!Array.isArray(projects) || projects.length === 0) {
    throw fail('还没有导入任何笔记文件夹。请先在左侧「本地笔记」面板点「导入文件夹」。')
  }
  const raw = wanted === undefined || wanted === null ? '' : String(wanted).trim()
  if (raw === '') {
    if (projects.length === 1) return projects[0]
    throw fail(
      `现在有多个笔记文件夹（${projects.map((item) => item.name).join('、')}），请用 project 参数指定其中一个。`,
    )
  }
  const byId = projects.find((item) => item.id === raw)
  if (byId !== undefined) return byId
  const needle = raw.toLowerCase()
  const byName = projects.filter((item) => item.name.toLowerCase() === needle)
  if (byName.length === 1) return byName[0]
  const partial = projects.filter((item) => item.name.toLowerCase().includes(needle))
  if (partial.length === 1) return partial[0]
  if (partial.length > 1) {
    throw fail(
      `「${raw}」匹配到多个笔记文件夹（${partial.map((item) => item.name).join('、')}），请写得更具体。`,
    )
  }
  throw fail(
    `找不到笔记文件夹「${raw}」。现有：${projects.map((item) => item.name).join('、')}。`,
  )
}

/** Flatten an entry tree into `notes_list` output rows. */
function flatten(entries, depth, out) {
  for (const entry of entries) {
    out.push({
      path: entry.path,
      type: entry.type,
      ...(entry.size === undefined ? {} : { size: entry.size }),
      depth,
    })
  }
  return out
}

/**
 * The six tools, in the order a conversation tends to reach for them.
 *
 * @param {{ listProjects: Function, listEntries: Function, readFile: Function, writeFile: Function, searchNotes: Function }} remote
 */
export function buildNotesTools(remote) {
  return [
    {
      name: 'notes_projects',
      description:
        '列出用户已经导入「本地笔记」面板的文件夹（每个文件夹就是一个本地 Git 项目）。写笔记前先用它确认目标文件夹。',
      parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
      output: OUTPUT,
      async execute() {
        const { projects } = await remote.listProjects()
        return {
          projects: (projects ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            rootPath: item.rootPath,
          })),
        }
      },
    },
    {
      name: 'notes_list',
      description:
        '列出某个笔记文件夹里的子目录、Markdown 文件和图片附件（图片的 type 为 asset）。递归展开整个文件夹；不传 path 时从根目录开始。',
      parameters: {
        type: 'object',
        properties: {
          project: PROJECT_PARAM,
          path: {
            type: 'string',
            description: '要列出的子目录（相对文件夹根目录）。省略或留空表示根目录。',
          },
          recursive: {
            type: 'boolean',
            description: '是否递归展开所有子目录，默认 false（只列一层）。',
          },
        },
        required: [],
        additionalProperties: false,
      },
      output: OUTPUT,
      async execute(args) {
        const project = await pickProject(remote, args.project)
        const start = typeof args.path === 'string' ? args.path : ''
        const rows = flatten((await remote.listEntries(project.id, start)).entries, 0, [])
        if (args.recursive !== true) return { project: project.name, path: start, entries: rows }

        // Depth-first walk; each directory's own children are fetched lazily so a
        // huge folder never loads more than one listing at a time.
        const queue = rows.filter((row) => row.type === 'directory').map((row) => ({ row, depth: 0 }))
        const all = rows.slice()
        while (queue.length > 0) {
          const { row, depth } = queue.shift()
          if (depth > 12) continue
          const listing = await remote.listEntries(project.id, row.path)
          for (const child of listing.entries) {
            all.push({ ...child, depth: depth + 1 })
            if (child.type === 'directory') queue.push({ row: { path: child.path }, depth: depth + 1 })
          }
        }
        return { project: project.name, path: start, entries: all }
      },
    },
    {
      name: 'notes_read',
      description:
        '读取一篇笔记的完整 Markdown 原文。返回的 version 在改写这篇笔记时必须原样传回 notes_write，用于检测并发修改。',
      parameters: {
        type: 'object',
        properties: {
          project: PROJECT_PARAM,
          path: { ...PATH_PARAM, description: '要读取的 Markdown 文件路径。' },
        },
        required: ['path'],
        additionalProperties: false,
      },
      output: OUTPUT,
      async execute(args) {
        const project = await pickProject(remote, args.project)
        const file = await remote.readFile(project.id, args.path)
        return {
          project: project.name,
          path: file.path,
          version: file.version,
          size: file.size,
          content: file.content,
        }
      },
    },
    {
      name: 'notes_write',
      description:
        '写入一篇笔记（新建或整篇覆盖）。新建时不传 expectedVersion；改写已有笔记前必须先 notes_read 拿到 version 并原样传回，否则会被并发保护拒绝。',
      parameters: {
        type: 'object',
        properties: {
          project: PROJECT_PARAM,
          path: { ...PATH_PARAM, description: '要写入的 Markdown 文件路径。' },
          content: { type: 'string', description: '完整的 Markdown 正文。' },
          expectedVersion: {
            type: 'string',
            description: '改写已有笔记时，notes_read 返回的 version。新建笔记时省略。',
          },
        },
        required: ['path', 'content'],
        additionalProperties: false,
      },
      output: OUTPUT,
      async execute(args) {
        const project = await pickProject(remote, args.project)
        const expected = typeof args.expectedVersion === 'string' && args.expectedVersion !== ''
          ? args.expectedVersion
          : null
        const result = await remote.writeFile(project.id, args.path, args.content, expected)
        return {
          project: project.name,
          path: result.path,
          operation: result.operation,
          version: result.version,
          size: Buffer.byteLength(result.content, 'utf8'),
        }
      },
    },
    {
      name: 'notes_append',
      description:
        '在一篇笔记末尾追加内容；笔记还不存在时自动新建。适合「帮我在某篇笔记里加一条」这类请求，不需要先读版本。',
      parameters: {
        type: 'object',
        properties: {
          project: PROJECT_PARAM,
          path: { ...PATH_PARAM, description: '要追加的 Markdown 文件路径。' },
          text: { type: 'string', description: '要追加的 Markdown 片段，会另起一段。' },
        },
        required: ['path', 'text'],
        additionalProperties: false,
      },
      output: OUTPUT,
      async execute(args) {
        const project = await pickProject(remote, args.project)
        const addition = typeof args.text === 'string' ? args.text : ''
        if (addition === '') throw fail('text 不能为空。')

        let current = null
        try {
          current = await remote.readFile(project.id, args.path)
        } catch (error) {
          // A brand-new note is the expected branch, not a failure: only a
          // missing file falls through to create, anything else is real.
          if (!(error instanceof Error) || error.code !== 'notes/not-found') throw error
        }

        const base = current === null ? '' : current.content
        const separator = base === '' ? '' : base.endsWith('\n\n') ? '' : base.endsWith('\n') ? '\n' : '\n\n'
        const trimmed = addition.replace(/\s+$/, '')
        const next = `${base}${separator}${trimmed}\n`
        const result = await remote.writeFile(
          project.id,
          args.path,
          next,
          current === null ? null : current.version,
        )
        return {
          project: project.name,
          path: result.path,
          operation: result.operation,
          version: result.version,
          appended: trimmed.length,
        }
      },
    },
    {
      name: 'notes_search',
      description: '在笔记文件夹里按关键词搜索，返回命中的文件、行号和该行内容。',
      parameters: {
        type: 'object',
        properties: {
          project: PROJECT_PARAM,
          query: { type: 'string', description: '搜索关键词，大小写不敏感。' },
        },
        required: ['query'],
        additionalProperties: false,
      },
      output: OUTPUT,
      async execute(args) {
        const project = await pickProject(remote, args.project)
        const result = await remote.searchNotes(project.id, args.query)
        return {
          project: project.name,
          query: result.query,
          hits: result.hits,
          scanned: result.scanned,
          matched: result.matched,
          truncated: result.truncated,
        }
      },
    },
  ]
}

/**
 * Register the tools on the Host tool table.
 *
 * `ctx.inject` keeps the plugin mountable on a profile where the tool table is
 * absent, and `scope.effect` ties each registration to this context so a
 * disable/enable cycle never leaves a duplicate name behind.
 *
 * @param {object} ctx plugin context
 * @param {ReturnType<typeof buildNotesTools> extends never ? never : any} remote
 */
export function registerNotesTools(ctx, remote) {
  const tools = buildNotesTools(remote)
  ctx.inject(['tools'], (scope) => {
    for (const tool of tools) {
      scope.effect(() => scope.tools.register(tool))
    }
  })
  return tools.map((tool) => tool.name)
}
