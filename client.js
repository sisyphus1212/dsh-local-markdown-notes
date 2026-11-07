window.__ModuleLoader__.load({
  id: '@local/local-markdown-notes',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'local-markdown-notes'
    const PANEL_ID = 'local-markdown-notes'
    const SLOT_ORDER = 20

    const ZH = {
      'panel.title': '本地笔记',
      'panel.import': '导入文件夹',
      'panel.importing': '正在选择…',
      'panel.empty': '还没有导入任何文件夹。',
      'panel.emptyHint': '导入一个本机文件夹，里面放 Markdown 文件即可。第一次导入会在该文件夹内初始化 Git 仓库。',
      'panel.projects': '文件夹',
      'panel.files': '文件',
      'panel.emptyDir': '这个文件夹是空的。',
      'panel.save': '保存',
      'panel.saving': '保存中…',
      'panel.saved': '已保存',
      'panel.reload': '重新载入',
      'panel.remove': '移除',
      'panel.staleTitle': '文件已在磁盘上变化',
      'panel.staleBody': '这个文件在你编辑期间被改动过。重新载入会丢弃当前编辑。',
      'panel.staleReload': '重新载入',
      'panel.git': 'Git',
      'panel.gitEmpty': '工作区干净。',
      'panel.diff': '差异',
      'panel.diffEmpty': '没有可显示的差异。',
      'panel.blame': 'Blame',
      'panel.blameHint': '把光标放到某一行查看提交信息。',
      'panel.noFile': '从左侧选择一个 Markdown 文件。',
      'panel.noProject': '先导入或选择一个文件夹。',
      'panel.pickProject': '从左侧选择一个文件夹。',
      'panel.noCommits': '仓库还没有提交，差异与 blame 暂不可用。',
      'panel.loading': '载入中…',
      'panel.error': '出错了',
      'panel.modified': '已修改',
      'panel.untracked': '未跟踪',
      'panel.added': '新增',
      'panel.deleted': '删除',
      'panel.renamed': '重命名',
      'panel.conflicted': '冲突',
      'panel.ignored': '已忽略',
      'panel.unmodified': '未改动',
      'panel.modifiedDirty': '有未保存改动',
      'panel.uncommitted': '未提交',
      'panel.blameAuthor': '作者',
      'panel.blameDate': '日期',
      'panel.blameCommit': '提交',
      'panel.blameSummary': '说明',
      'panel.newFile': '新建文件',
      'panel.newFolder': '新建文件夹',
      'panel.rootDir': '根目录',
      'panel.namePlaceholder': '名称',
      'panel.previewEmpty': '这个文件还没有内容。',
      'panel.edit': '编辑',
      'panel.preview': '预览',
      'panel.untitledName': '未命名',
    }

    const EN = {
      'panel.title': 'Local notes',
      'panel.import': 'Import folder',
      'panel.importing': 'Choosing…',
      'panel.empty': 'No folder imported yet.',
      'panel.emptyHint': 'Import a local folder holding Markdown files. The first import initialises a Git repository inside that folder.',
      'panel.projects': 'Folders',
      'panel.files': 'Files',
      'panel.emptyDir': 'This folder is empty.',
      'panel.save': 'Save',
      'panel.saving': 'Saving…',
      'panel.saved': 'Saved',
      'panel.reload': 'Reload',
      'panel.remove': 'Remove',
      'panel.staleTitle': 'The file changed on disk',
      'panel.staleBody': 'This file changed while you were editing it. Reloading discards your edits.',
      'panel.staleReload': 'Reload',
      'panel.git': 'Git',
      'panel.gitEmpty': 'Working tree clean.',
      'panel.diff': 'Diff',
      'panel.diffEmpty': 'Nothing to show.',
      'panel.blame': 'Blame',
      'panel.blameHint': 'Put the cursor on a line to see its commit.',
      'panel.noFile': 'Pick a Markdown file on the left.',
      'panel.noProject': 'Import or select a folder first.',
      'panel.pickProject': 'Pick a folder on the left.',
      'panel.noCommits': 'This repository has no commits yet, so diff and blame are unavailable.',
      'panel.loading': 'Loading…',
      'panel.error': 'Something went wrong',
      'panel.modified': 'Modified',
      'panel.untracked': 'Untracked',
      'panel.added': 'Added',
      'panel.deleted': 'Deleted',
      'panel.renamed': 'Renamed',
      'panel.conflicted': 'Conflicted',
      'panel.ignored': 'Ignored',
      'panel.unmodified': 'Unchanged',
      'panel.modifiedDirty': 'Unsaved changes',
      'panel.uncommitted': 'Uncommitted',
      'panel.blameAuthor': 'Author',
      'panel.blameDate': 'Date',
      'panel.blameCommit': 'Commit',
      'panel.blameSummary': 'Summary',
      'panel.newFile': 'New file',
      'panel.newFolder': 'New folder',
      'panel.rootDir': 'Root',
      'panel.namePlaceholder': 'Name',
      'panel.previewEmpty': 'This file is still empty.',
      'panel.edit': 'Edit',
      'panel.preview': 'Preview',
      'panel.untitledName': 'Untitled',
    }

    const STYLE = `
.lmn-root{display:flex;height:100%;min-height:0;background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary,CanvasText);font-size:13px;line-height:18px}
.lmn-side{width:260px;flex:0 0 260px;border-right:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));display:flex;flex-direction:column;min-height:0}
.lmn-side-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 8px 8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.lmn-side-title{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-secondary,#61666b)}
.lmn-btn{font:inherit;color:inherit;cursor:pointer;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));background:var(--dsw-alias-bg-layer-2,transparent);padding:3px 8px}
.lmn-btn:hover{background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.04))}
.lmn-btn[disabled]{opacity:.5;cursor:default}
.lmn-btn-primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#0f1115));color:var(--dsw-alias-label-primary-foreground,#fff);border-color:transparent}
.lmn-btn.lmn-btn-primary:hover{background:var(--dsw-alias-button-primary-hover,#43454a);color:var(--dsw-alias-label-primary-foreground,#fff)}
.lmn-btn.lmn-btn-primary:focus-visible{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#0f1115));color:var(--dsw-alias-label-primary-foreground,#fff);border-color:transparent}
.lmn-list{overflow:auto;min-height:0;padding:0}
.lmn-tree{display:flex;flex-direction:column;padding:0 0 6px}
.lmn-node{display:block;min-width:0}
.lmn-row{position:relative;display:flex;align-items:center;gap:3px;height:22px;padding-right:4px;cursor:pointer;user-select:none;border-radius:3px}
.lmn-row:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.045))}
.lmn-row.is-selected{background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.08))}
.lmn-chevron{flex:0 0 16px;width:16px;height:16px;display:grid;place-items:center;color:var(--dsw-alias-label-secondary,#61666b)}
.lmn-icon{flex:0 0 16px;width:16px;height:16px;display:grid;place-items:center;color:var(--dsw-alias-label-secondary,#61666b)}
.lmn-name{flex:1;min-width:0;font-size:13px;line-height:22px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lmn-name-root{font-size:11px;font-weight:600;letter-spacing:.05em}
.lmn-remove{flex:0 0 auto;opacity:0;transition:opacity .1s;padding:0 4px;line-height:16px;font:inherit;font-size:12px;background:none;border:0;border-radius:4px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer}
.lmn-row:hover .lmn-remove,.lmn-remove:focus-visible{opacity:1}
.lmn-iconbtn{flex:0 0 auto;display:grid;place-items:center;width:22px;height:22px;padding:0;background:none;border:0;border-radius:4px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer}
.lmn-iconbtn:hover{background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.06));color:var(--dsw-alias-label-primary,CanvasText)}
.lmn-iconbtn[disabled]{opacity:.4;cursor:default}
.lmn-main{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0}
.lmn-toolbar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.lmn-path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:var(--dsw-alias-label-secondary,#61666b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.lmn-editor{flex:1;min-height:0;display:flex;flex-direction:column}
.lmn-editor textarea{flex:1;min-height:0;resize:none;border:0;outline:none;padding:12px 14px;background:transparent;color:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:20px;tab-size:2}
.lmn-bottom{flex:0 0 auto;border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));max-height:44%;display:flex;flex-direction:column;min-height:0}
.lmn-tabs{display:flex;gap:4px;padding:6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.lmn-tab{font:inherit;color:var(--dsw-alias-label-secondary,#61666b);background:none;border:0;border-radius:6px;padding:3px 8px;cursor:pointer}
.lmn-tab[aria-selected="true"]{color:inherit;background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.08))}
.lmn-pane{overflow:auto;min-height:0;padding:8px 12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word}
.lmn-note{padding:10px 12px;color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px}
.lmn-error{margin:8px 12px;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-state-error-primary,#ec1313);border:1px solid var(--dsw-alias-state-error-primary,#ec1313)}
.lmn-status{display:flex;flex-direction:column;gap:2px}
.lmn-status button{font:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:inherit;text-align:left;background:none;border:0;border-radius:6px;padding:2px 6px;cursor:pointer}
.lmn-status button:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04))}
.lmn-badge{display:inline-block;min-width:60px;color:var(--dsw-alias-label-tertiary,#81858c)}
.lmn-empty-center{flex:1;display:grid;place-items:center;padding:24px;text-align:center;color:var(--dsw-alias-label-tertiary,#81858c)}
.lmn-empty-center h3{margin:0 0 6px;font-size:14px;color:var(--dsw-alias-label-primary,CanvasText)}
.lmn-kv{display:flex;gap:6px}
.lmn-kv b{font-weight:600}
.lmn-blame-bar{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:6px 12px 0;min-width:0}
.lmn-blame-chip{position:relative;display:inline-flex;align-items:center;max-width:100%;min-width:0;padding:2px 8px;border-radius:6px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));color:var(--dsw-alias-label-secondary,#61666b);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px;outline:none;cursor:default}
.lmn-blame-chip-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lmn-blame-chip:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l2,rgba(0,0,0,.1))}
.lmn-blame-chip.is-uncommitted{color:var(--dsw-alias-label-tertiary,#81858c);font-style:italic}
.lmn-blame-card{display:none;position:absolute;top:calc(100% + 6px);left:0;z-index:20;min-width:240px;max-width:360px;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));box-shadow:0 6px 24px rgba(0,0,0,.18);color:var(--dsw-alias-label-primary,CanvasText);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word;text-align:left;cursor:auto}
.lmn-blame-chip:hover .lmn-blame-card,.lmn-blame-chip:focus-within .lmn-blame-card{display:block}
.lmn-blame-card b{font-weight:600;color:var(--dsw-alias-label-secondary,#61666b);margin-right:4px}
.lmn-actions{display:flex;align-items:center;gap:2px;padding:2px 6px 2px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.045));min-width:0}
.lmn-actions-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px}
.lmn-create{display:flex;align-items:center;gap:4px;padding:2px 6px;min-width:0}
.lmn-create input{flex:1;min-width:0;font:inherit;font-size:12px;color:inherit;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:6px;padding:2px 6px;outline:none}
.lmn-create input:focus{border-color:var(--dsw-alias-brand-primary,#0f1115)}
.lmn-indent{position:absolute;top:0;bottom:0;width:1px;background:var(--dsw-alias-border-l1,rgba(0,0,0,.07));pointer-events:none}
.lmn-seg{display:inline-flex;align-items:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:8px;overflow:hidden}
.lmn-seg button{font:inherit;color:var(--dsw-alias-label-secondary,#61666b);background:none;border:0;padding:3px 10px;cursor:pointer}
.lmn-seg button[aria-pressed="true"]{color:var(--dsw-alias-label-primary,CanvasText);background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.08))}
.lmn-seg button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04))}
.lmn-render{flex:1;min-height:0;overflow:auto;padding:12px 14px;color:var(--dsw-alias-label-primary,CanvasText);font-size:13px;line-height:20px;word-break:break-word}
.lmn-render>*:first-child{margin-top:0}
.lmn-render h1,.lmn-render h2,.lmn-render h3,.lmn-render h4,.lmn-render h5,.lmn-render h6{margin:16px 0 8px;line-height:1.3;font-weight:600}
.lmn-render h1{font-size:22px}
.lmn-render h2{font-size:19px}
.lmn-render h3{font-size:17px}
.lmn-render h4{font-size:15px}
.lmn-render h5{font-size:14px}
.lmn-render h6{font-size:13px;color:var(--dsw-alias-label-secondary,#61666b)}
.lmn-render p{margin:8px 0}
.lmn-render a{color:var(--dsw-alias-link,#1667d9);text-decoration:none}
.lmn-render a:hover{text-decoration:underline}
.lmn-render ul,.lmn-render ol{margin:8px 0;padding-left:22px}
.lmn-render li{margin:2px 0}
.lmn-render blockquote{margin:8px 0;padding:2px 12px;border-left:3px solid var(--dsw-alias-border-l3,rgba(0,0,0,.16));color:var(--dsw-alias-label-secondary,#61666b)}
.lmn-render hr{margin:14px 0;border:0;border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12))}
.lmn-render pre{margin:10px 0;padding:10px 12px;border-radius:8px;overflow:auto;background:var(--dsw-alias-markdown-code-block,rgba(0,0,0,.04));border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word}
.lmn-render pre code{background:none;border:0;padding:0;font-size:inherit}
.lmn-render code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;padding:1px 4px;border-radius:4px;background:var(--dsw-alias-markdown-inline-code,rgba(0,0,0,.06))}
.lmn-render table{margin:10px 0;border-collapse:collapse;font-size:12px}
.lmn-render th,.lmn-render td{border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));padding:4px 8px;text-align:left;vertical-align:top}
.lmn-render th{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));font-weight:600}
.lmn-render-empty{padding:10px 12px;color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px}
`

    /**
     * The Remote contribution this half mounts.
     *
     * The browser bundle cannot import `lib/contract.js` (it is loaded by the
     * web module loader, not by Node), so the descriptor list is spelled out
     * here. It must stay byte-for-byte in step with the Host's `remoteMarkers()`
     * in `lib/contract.js`: same order, same wire names, `signal` never a
     * parameter. Every parameter carries a strict codec because
     * `api-gateway`'s `requireStrictInputs` rejects anything else at mount time.
     */
    const PACKAGE = '@local/local-markdown-notes'
    const NAMESPACE = 'notes'
    /**
     * The Host Cordis Service key (`super(ctx, 'notesRemote', …)` in
     * lib/service.js). `api-gateway` validates it as a nonempty invocation
     * segment and resolves the receiver with `ctx.get(descriptor.service)`, so
     * every descriptor must carry it.
     */
    const SERVICE = 'notesRemote'
    const SCHEMA = Object.freeze({})

    function strictCodec(typeSymbol) {
      return { mode: 'strict', typeSymbol, create: () => SCHEMA, schema: SCHEMA }
    }

    function descriptor(method, params, result) {
      return {
        id: `${PACKAGE}#${NAMESPACE}/${method}`,
        service: SERVICE,
        namespace: NAMESPACE,
        method,
        invocation: { kind: 'direct' },
        parameters: params.map((name) => ({
          name,
          wire: name,
          source: 'json',
          codec: strictCodec('notes.Unknown'),
        })),
        result: strictCodec(result),
      }
    }

    const METHODS = [
      ['listProjects', [], 'notes.ProjectList'],
      ['importProject', [], 'notes.Project'],
      ['removeProject', ['projectId'], 'notes.Removed'],
      ['listEntries', ['projectId', 'relativePath'], 'notes.EntryList'],
      ['readFile', ['projectId', 'relativePath'], 'notes.FileContent'],
      ['writeFile', ['projectId', 'relativePath', 'content', 'expectedVersion'], 'notes.FileContent'],
      ['gitStatus', ['projectId'], 'notes.GitStatus'],
      ['gitDiff', ['projectId', 'relativePath'], 'notes.GitDiff'],
      ['gitBlame', ['projectId', 'relativePath', 'line'], 'notes.BlameEntry'],
      ['createEntry', ['projectId', 'relativePath', 'kind'], 'notes.CreatedEntry'],
    ]

    function buildContribution() {
      return {
        package: PACKAGE,
        descriptors: METHODS.map(([method, params, result]) => descriptor(method, params, result)),
      }
    }

    /** `Error.stack` can be huge; the panel is a single line, so cap it. */
    const FAILURE_TEXT_LIMIT = 800

    function failureText(error) {
      if (error === null || error === undefined) return ''
      const lines = []
      const code = error.code
      if (code !== undefined && code !== null && code !== '') lines.push(`code=${String(code)}`)
      const message = error.message ?? String(error)
      lines.push(`message=${String(message)}`)
      const stack = typeof error.stack === 'string' ? error.stack : ''
      if (stack !== '') {
        const first = stack.split('\n').slice(0, 3).join(' | ')
        lines.push(`stack=${first}`)
      }
      return lines.join(' ').slice(0, FAILURE_TEXT_LIMIT)
    }

    /**
     * The rejection `remote.$mount` produced, if it rejected.
     *
     * `ctx.remote.$mount` is async and only registers `remote.<namespace>`
     * once it resolves, so a swallowed rejection shows up much later as the
     * misleading `namespace "notes" is not mounted`. Keeping the original
     * error here lets the panel and the console name the real cause.
     */
    let mountFailure = null

    function recordMountFailure(error) {
      mountFailure = failureText(error)
      console.error('[notes] remote mount failed:', failureText(error), error)
    }

    /**
     * Thin facade over the mounted `notes` Remote namespace. Every call returns
     * the decoded value or throws an Error carrying the Host's `code`.
     */
    function createApi(ctx) {
      async function call(method, args) {
        const namespace = ctx.get('remote.notes')
        if (namespace === undefined) {
          const detail = mountFailure === null ? '' : ` — remote.$mount rejected: ${mountFailure}`
          const error = new Error(`remote namespace "notes" is not mounted${detail}`)
          error.code = 'notes/remote-unavailable'
          throw error
        }
        const outcome = await namespace[method](...args)
        if (!outcome.ok) {
          const error = new Error(outcome.error.message ?? outcome.error.code)
          error.code = outcome.error.code
          throw error
        }
        return outcome.value
      }
      return {
        /**
         * The recorded `remote.$mount` rejection, one line, or `null`.
         *
         * The panel starts with this in its error banner so a half-mounted
         * deployment shows the real cause instead of the first call's generic
         * "is not mounted".
         */
        mountFailure: () => mountFailure,
        // Every Remote descriptor is strict, so all declared parameters must be
        // present in the call; `null` is the "not supplied" value for the
        // optional ones.
        listProjects: () => call('listProjects', []),
        importProject: () => call('importProject', []),
        removeProject: (projectId) => call('removeProject', [projectId]),
        listEntries: (projectId, relativePath) => call('listEntries', [projectId, relativePath ?? '']),
        readFile: (projectId, relativePath) => call('readFile', [projectId, relativePath]),
        writeFile: (projectId, relativePath, content, expectedVersion) =>
          call('writeFile', [projectId, relativePath, content, expectedVersion ?? null]),
        gitStatus: (projectId) => call('gitStatus', [projectId]),
        gitDiff: (projectId, relativePath) => call('gitDiff', [projectId, relativePath ?? null]),
        gitBlame: (projectId, relativePath, line) => call('gitBlame', [projectId, relativePath, line]),
        createEntry: (projectId, relativePath, kind) =>
          call('createEntry', [projectId, relativePath, kind]),
      }
    }

    const KIND_LABEL = {
      modified: 'panel.modified',
      added: 'panel.added',
      deleted: 'panel.deleted',
      renamed: 'panel.renamed',
      copied: 'panel.added',
      conflicted: 'panel.conflicted',
      untracked: 'panel.untracked',
      ignored: 'panel.ignored',
      unmodified: 'panel.unmodified',
    }

    function PanelIcon({ size }) {
      const px = typeof size === 'number' ? size : 20
      return h(
        'svg',
        {
          width: px,
          height: px,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        },
        h('path', { d: 'M4 4.5A1.5 1.5 0 0 1 5.5 3H10l2 2.5h6.5A1.5 1.5 0 0 1 20 7v11.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5Z' }),
        h('path', { d: 'M8 11h8M8 14.5h5' }),
      )
    }

    /** Cache key for one tree node: a directory is identified by project + path. */
    function treeKey(projectId, relativePath) {
      return `${projectId}:${relativePath ?? ''}`
    }

    /**
     * Pick the blame entry that describes the cursor's line, for the inline chip.
     *
     * `git blame -L n,n` answers with whatever line range it resolved to, so the
     * entry's own `finalLine` (or `line`) is the authority; the requested line is
     * only a fallback when the answer does not name one.
     */
    function pickLineEntry(value, line) {
      const entries = Array.isArray(value?.entries) ? value.entries : []
      if (entries.length === 0) return null
      const matching = entries.find((entry) => (entry.finalLine ?? entry.line) === line)
      const picked = matching ?? entries[0] ?? null
      // git answers for a working-tree line with an all-zero sha ("Not Committed
      // Yet") instead of omitting the entry, so an uncommitted line still yields
      // an entry; report it as uncommitted rather than as a bogus 000000000 commit.
      return picked !== null && isUncommittedEntry(picked) ? null : picked
    }

    /** Whether a blame entry describes a line that has no commit yet. */
    function isUncommittedEntry(entry) {
      const sha = String(entry?.sha ?? '')
      return /^0+$/.test(sha) || entry?.author === 'Not Committed Yet'
    }

    /** The `YYYY-MM-DD` day of a blame author time, which git reports in seconds. */
    function blameDay(authorTime) {
      if (authorTime === undefined || authorTime === null) return ''
      const millis = Number(authorTime) * 1000
      return Number.isFinite(millis) ? new Date(millis).toISOString().slice(0, 10) : ''
    }

    /** The directory that contains `relative`, or `''` for a top-level entry. */
    function parentOf(relative) {
      const text = String(relative ?? '')
      const cut = text.lastIndexOf('/')
      return cut === -1 ? '' : text.slice(0, cut)
    }

    /** Join a directory and a name into one project-relative path. */
    function joinRelative(directory, name) {
      const base = String(directory ?? '')
      return base === '' ? name : `${base}/${name}`
    }

    /**
     * Turn the inline name box into the name the Host should create.
     *
     * A file whose name does not end in `.md` gets the suffix appended, because
     * this panel only edits Markdown; an empty name means "cancel", which the
     * caller reports by not calling the Host at all.
     */
    function normalizeNewName(raw, kind) {
      const trimmed = String(raw ?? '').trim()
      if (trimmed === '') return ''
      if (kind === 'directory') return trimmed
      return /\.md$/i.test(trimmed) ? trimmed : `${trimmed}.md`
    }

    // --- Markdown renderer -------------------------------------------------
    // The preview is built from React elements, never from HTML strings, so a
    // note's contents can never become markup the browser executes.

    const MD_FENCE = /^\s*(```|~~~)/
    const MD_HEADING = /^(#{1,6})\s+(.*)$/
    const MD_RULE = /^\s*([-*_])(\s*\1){2,}\s*$/
    const MD_QUOTE = /^\s*>\s?(.*)$/
    const MD_BULLET = /^\s*[-*+]\s+(.*)$/
    const MD_ORDERED = /^\s*\d+[.)]\s+(.*)$/
    const MD_TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/
    const MD_INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(\[[^\]]+\]\([^)\s]+\))/g

    /** Split one line of Markdown into text, code, strong, em and link leaves. */
    function renderInline(text, keyPrefix) {
      const out = []
      let last = 0
      let index = 0
      MD_INLINE.lastIndex = 0
      let match = MD_INLINE.exec(text)
      while (match !== null) {
        if (match.index > last) out.push(text.slice(last, match.index))
        const token = match[0]
        const key = `${keyPrefix}:${index}`
        index += 1
        if (token.startsWith('`')) {
          out.push(h('code', { key }, token.slice(1, -1)))
        } else if (token.startsWith('**')) {
          out.push(h('strong', { key }, token.slice(2, -2)))
        } else if (token.startsWith('[')) {
          const cut = token.indexOf('](')
          out.push(
            h('a', { key, href: token.slice(cut + 2, -1), target: '_blank', rel: 'noreferrer' },
              token.slice(1, cut)),
          )
        } else {
          out.push(h('em', { key }, token.slice(1, -1)))
        }
        last = match.index + token.length
        match = MD_INLINE.exec(text)
      }
      if (last < text.length) out.push(text.slice(last))
      return out
    }

    /** Split one table row into trimmed cells. */
    function tableCells(row) {
      return row
        .replace(/^\s*\|/, '')
        .replace(/\|\s*$/, '')
        .split('|')
        .map((cell) => cell.trim())
    }

    /**
     * Render a Markdown draft into React children.
     *
     * Everything unrecognised falls through to a paragraph of literal text, so
     * an unknown construct is shown as written rather than dropped.
     */
    function renderMarkdown(source) {
      const lines = String(source ?? '').split(/\r?\n/)
      const blocks = []
      let index = 0
      let counter = 0
      const nextKey = () => `md${counter++}`

      while (index < lines.length) {
        const line = lines[index]

        const fence = MD_FENCE.exec(line)
        if (fence !== null) {
          const marker = fence[1]
          const body = []
          index += 1
          while (index < lines.length && lines[index].trim() !== marker) {
            body.push(lines[index])
            index += 1
          }
          index += 1
          blocks.push(h('pre', { key: nextKey() }, h('code', null, body.join('\n'))))
          continue
        }

        if (line.trim() === '') {
          index += 1
          continue
        }

        const heading = MD_HEADING.exec(line)
        if (heading !== null) {
          const level = heading[1].length
          blocks.push(h(`h${level}`, { key: nextKey() }, renderInline(heading[2], nextKey())))
          index += 1
          continue
        }

        if (MD_RULE.test(line)) {
          blocks.push(h('hr', { key: nextKey() }))
          index += 1
          continue
        }

        if (MD_QUOTE.test(line)) {
          const body = []
          while (index < lines.length) {
            const quoted = MD_QUOTE.exec(lines[index])
            if (quoted === null) break
            body.push(quoted[1])
            index += 1
          }
          blocks.push(h('blockquote', { key: nextKey() }, renderInline(body.join('\n'), nextKey())))
          continue
        }

        if (line.includes('|') && index + 1 < lines.length && MD_TABLE_SEP.test(lines[index + 1])) {
          const head = tableCells(line)
          index += 2
          const rows = []
          while (index < lines.length && lines[index].includes('|') && lines[index].trim() !== '') {
            rows.push(tableCells(lines[index]))
            index += 1
          }
          blocks.push(
            h(
              'table',
              { key: nextKey() },
              h(
                'thead',
                null,
                h('tr', null, head.map((cell, column) =>
                  h('th', { key: `h${column}` }, renderInline(cell, `th${column}`)))),
              ),
              h(
                'tbody',
                null,
                rows.map((row, rowIndex) =>
                  h('tr', { key: `r${rowIndex}` }, row.map((cell, column) =>
                    h('td', { key: `c${column}` }, renderInline(cell, `td${rowIndex}.${column}`))))),
              ),
            ),
          )
          continue
        }

        if (MD_BULLET.test(line) || MD_ORDERED.test(line)) {
          const ordered = MD_ORDERED.test(line) && !MD_BULLET.test(line)
          const items = []
          while (index < lines.length) {
            const item = ordered ? MD_ORDERED.exec(lines[index]) : MD_BULLET.exec(lines[index])
            if (item === null) break
            items.push(item[1])
            index += 1
          }
          blocks.push(
            h(
              ordered ? 'ol' : 'ul',
              { key: nextKey() },
              items.map((item, itemIndex) =>
                h('li', { key: `l${itemIndex}` }, renderInline(item, `li${itemIndex}`))),
            ),
          )
          continue
        }

        const body = []
        while (index < lines.length) {
          const current = lines[index]
          if (
            current.trim() === '' ||
            MD_FENCE.test(current) ||
            MD_HEADING.test(current) ||
            MD_RULE.test(current) ||
            MD_QUOTE.test(current) ||
            MD_BULLET.test(current) ||
            MD_ORDERED.test(current)
          ) {
            break
          }
          body.push(current)
          index += 1
        }
        if (body.length === 0) {
          // Nothing consumed: emit the line literally so the loop always advances.
          body.push(lines[index])
          index += 1
        }
        blocks.push(h('p', { key: nextKey() }, renderInline(body.join('\n'), nextKey())))
      }

      return blocks
    }

    function App({ api, t }) {
      const [projects, setProjects] = React.useState([])
      const [project, setProject] = React.useState(null)
      const [openDirs, setOpenDirs] = React.useState({})
      const [children, setChildren] = React.useState({})
      const [file, setFile] = React.useState(null)
      const [draft, setDraft] = React.useState('')
      const [status, setStatus] = React.useState(null)
      const [busy, setBusy] = React.useState(null)
      const [error, setError] = React.useState(null)
      const [notice, setNotice] = React.useState(null)
      const [tab, setTab] = React.useState('status')
      const [diff, setDiff] = React.useState(null)
      const [diffPath, setDiffPath] = React.useState(null)
      const [blame, setBlame] = React.useState(null)
      const [cursorLine, setCursorLine] = React.useState(null)
      const [lineEntry, setLineEntry] = React.useState(null)
      const [viewTarget, setViewTarget] = React.useState('')
      const [creating, setCreating] = React.useState(null)
      const [viewMode, setViewMode] = React.useState('edit')

      const report = React.useCallback((caught) => {
        setError({ message: caught?.message ?? String(caught), code: caught?.code ?? '' })
        setBusy(null)
      }, [])

      const refreshProjects = React.useCallback(async () => {
        try {
          const value = await api.listProjects()
          setProjects(Array.isArray(value?.projects) ? value.projects : [])
          setError(null)
        } catch (caught) {
          report(caught)
        }
      }, [api, report])

      const loadPath = React.useCallback(
        async (target, relative) => {
          if (target === null) return null
          try {
            const value = await api.listEntries(target.id, relative ?? '')
            const entries = Array.isArray(value?.entries) ? value.entries : []
            setChildren((current) => ({ ...current, [treeKey(target.id, relative ?? '')]: entries }))
            setError(null)
            return entries
          } catch (caught) {
            report(caught)
            return null
          }
        },
        [api, report],
      )

      const toggleDir = React.useCallback(
        async (target, relative) => {
          if (target === null) return
          const key = treeKey(target.id, relative)
          if (openDirs[key] === true) {
            setOpenDirs((current) => ({ ...current, [key]: false }))
            return
          }
          setOpenDirs((current) => ({ ...current, [key]: true }))
          setViewTarget(relative)
          // Lazy: only the first expand of a directory hits the Host.
          if (children[key] === undefined) await loadPath(target, relative)
        },
        [children, loadPath, openDirs],
      )

      const refreshStatus = React.useCallback(
        async (target) => {
          if (target === null) {
            setStatus(null)
            return
          }
          try {
            setStatus(await api.gitStatus(target.id))
            setError(null)
          } catch (caught) {
            setStatus(null)
            report(caught)
          }
        },
        [api, report],
      )

      React.useEffect(() => {
        void refreshProjects()
      }, [refreshProjects])

      const openProject = React.useCallback(
        async (target) => {
          setProject(target)
          setFile(null)
          setDraft('')
          setBlame(null)
          setCursorLine(null)
          setLineEntry(null)
          setDiff(null)
          setDiffPath(null)
          setNotice(null)
          setCreating(null)
          setViewTarget('')
          // Expanding the root is what makes the tree show anything: the root
          // node is the project itself, so '' is its directory.
          setOpenDirs((current) => ({ ...current, [treeKey(target.id, '')]: true }))
          await loadPath(target, '')
          await refreshStatus(target)
        },
        [loadPath, refreshStatus],
      )

      const openFile = React.useCallback(
        async (target, relative) => {
          try {
            setBusy('read')
            const value = await api.readFile(target.id, relative)
            setFile({ path: value.path, version: value.version, content: value.content })
            setDraft(value.content)
            setBlame(null)
            setCursorLine(null)
            setLineEntry(null)
            setNotice(null)
            setViewTarget(parentOf(value.path))
            setError(null)
          } catch (caught) {
            report(caught)
          } finally {
            setBusy(null)
          }
        },
        [api, report],
      )

      const save = React.useCallback(async () => {
        if (project === null || file === null) return
        try {
          setBusy('save')
          const value = await api.writeFile(project.id, file.path, draft, file.version)
          setFile({ path: value.path, version: value.version, content: value.content })
          setDraft(value.content)
          setNotice('panel.saved')
          setError(null)
          await refreshStatus(project)
        } catch (caught) {
          if (caught?.code === 'FS_STALE_VERSION' || caught?.code === 'notes/stale') {
            setNotice('panel.staleTitle')
          }
          report(caught)
        } finally {
          setBusy(null)
        }
      }, [api, draft, file, project, refreshStatus, report])

      const importFolder = React.useCallback(async () => {
        try {
          setBusy('import')
          const value = await api.importProject()
          if (value?.canceled !== true && value?.project) {
            await refreshProjects()
            await openProject(value.project)
          }
          setError(null)
        } catch (caught) {
          report(caught)
        } finally {
          setBusy(null)
        }
      }, [api, openProject, refreshProjects, report])

      const removeProject = React.useCallback(
        async (target) => {
          try {
            await api.removeProject(target.id)
            if (project !== null && project.id === target.id) {
              setProject(null)
              // Drop every cached directory of the removed project.
              const prefix = `${target.id}:`
              setChildren((current) =>
                Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(prefix))),
              )
              setOpenDirs((current) =>
                Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(prefix))),
              )
              setFile(null)
              setDraft('')
              setBlame(null)
              setCursorLine(null)
              setLineEntry(null)
              setDiff(null)
              setDiffPath(null)
              setStatus(null)
            }
            await refreshProjects()
          } catch (caught) {
            report(caught)
          }
        },
        [api, project, refreshProjects, report],
      )

      /** Open the inline name box under the directory that is currently in view. */
      const beginCreate = React.useCallback(
        (kind) => {
          setCreating({
            target: viewTarget,
            kind,
            value: kind === 'file' ? `${t('panel.untitledName')}.md` : '',
          })
          setNotice(null)
        },
        [t, viewTarget],
      )

      const cancelCreate = React.useCallback(() => {
        setCreating(null)
      }, [])

      /**
       * Create the entry the inline box names, then reveal it.
       *
       * An empty name cancels without touching the Host; a file name without a
       * `.md` suffix gets one, because every entry this panel opens is Markdown.
       */
      const confirmCreate = React.useCallback(async () => {
        if (creating === null || project === null) return
        const { target, kind, value } = creating
        const name = normalizeNewName(value, kind)
        if (name === '') {
          setCreating(null)
          return
        }
        const relative = joinRelative(target, name)
        try {
          setBusy('create')
          const created = await api.createEntry(project.id, relative, kind)
          const createdPath = created?.path ?? relative
          setCreating(null)
          const directory = parentOf(createdPath)
          setViewTarget(directory)
          setOpenDirs((current) => ({ ...current, [treeKey(project.id, directory)]: true }))
          await loadPath(project, directory)
          if (kind === 'file') {
            await openFile(project, createdPath)
          } else {
            setOpenDirs((current) => ({ ...current, [treeKey(project.id, createdPath)]: true }))
            await loadPath(project, createdPath)
          }
          await refreshStatus(project)
          setError(null)
        } catch (caught) {
          report(caught)
        } finally {
          setBusy(null)
        }
      }, [api, creating, loadPath, openFile, project, refreshStatus, report])

      const loadDiff = React.useCallback(
        async (target, relative) => {
          try {
            setBusy('diff')
            const value = await api.gitDiff(target.id, relative)
            setDiff(value)
            setDiffPath(relative ?? null)
            setTab('diff')
            setError(null)
          } catch (caught) {
            report(caught)
          } finally {
            setBusy(null)
          }
        },
        [api, report],
      )

      const blameTimer = React.useRef(null)
      const blameSeq = React.useRef(0)

      const onSelectLine = React.useCallback(
        (event) => {
          if (project === null || file === null) return
          const position = event.currentTarget.selectionStart ?? 0
          const line = draft.slice(0, position).split('\n').length
          setCursorLine(line)
          if (blameTimer.current !== null) window.clearTimeout(blameTimer.current)
          const seq = (blameSeq.current += 1)
          blameTimer.current = window.setTimeout(async () => {
            blameTimer.current = null
            try {
              const value = await api.gitBlame(project.id, file.path, line)
              if (seq !== blameSeq.current) return
              setBlame(value)
              setLineEntry(pickLineEntry(value, line))
              setTab('blame')
              setError(null)
            } catch (caught) {
              if (seq !== blameSeq.current) return
              // A repository without commits still answers, so the Blame tab must
              // open and explain itself instead of leaving the previous tab frozen.
              setBlame({ line, entries: [], note: caught?.code ?? 'notes/git-failed' })
              setLineEntry(null)
              setTab('blame')
            }
          }, 180)
        },
        [api, draft, file, project],
      )

      const dirty = file !== null && draft !== (file.content ?? draft) && busy !== 'save'

      /**
       * VS Code draws its disclosure caret as a rotated glyph rather than a text
       * character, so it sits on the row's optical centre and keeps a fixed gutter.
       */
      const chevron = (isDirectory, open) =>
        h(
          'span',
          { className: 'lmn-chevron', 'aria-hidden': 'true' },
          isDirectory
            ? h(
                'svg',
                { viewBox: '0 0 16 16', width: 16, height: 16 },
                h('path', {
                  d: 'M6 3.5 10.5 8 6 12.5',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 1.4,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  transform: open ? 'rotate(90 8 8)' : undefined,
                }),
              )
            : null,
        )

      /** Per-extension colours, in the spirit of a VS Code icon theme. */
      const ICON_COLORS = {
        md: '#519aba', markdown: '#519aba', mdx: '#519aba',
        json: '#cbcb41', jsonc: '#cbcb41', yml: '#cbcb41', yaml: '#cbcb41',
        js: '#cbcb41', mjs: '#cbcb41', cjs: '#cbcb41', jsx: '#519aba',
        ts: '#519aba', tsx: '#519aba', vue: '#41b883', svelte: '#ff3e00',
        css: '#519aba', scss: '#ca6f9c', less: '#519aba',
        html: '#e37933', htm: '#e37933', xml: '#e37933',
        py: '#3572a5', sh: '#89e051', bash: '#89e051', zsh: '#89e051',
        go: '#519aba', rs: '#dea584', c: '#5998c5', h: '#5998c5',
        cpp: '#519aba', java: '#cc3e44', toml: '#9c4221', ini: '#9c4221',
        png: '#a074c4', jpg: '#a074c4', jpeg: '#a074c4', gif: '#a074c4',
        svg: '#ffb13b', pdf: '#cc3e44', zip: '#8a9199',
      }
      const fileColor = (name) => {
        const lower = String(name ?? '').toLowerCase()
        if (lower.startsWith('.')) return '#8a9199'
        if (lower.startsWith('readme')) return '#519aba'
        const dot = lower.lastIndexOf('.')
        if (dot < 0) return '#8a9199'
        return ICON_COLORS[lower.slice(dot + 1)] ?? '#8a9199'
      }

      const fileGlyph = (name) =>
        h(
          'span',
          { className: 'lmn-icon', style: { color: fileColor(name) }, 'aria-hidden': 'true' },
          h(
            'svg',
            { viewBox: '0 0 16 16', width: 16, height: 16 },
            h('path', {
              d: 'M9.5 1.5h-5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V4.5z',
              fill: 'currentColor',
              opacity: 0.16,
            }),
            h('path', {
              d: 'M9.5 1.5h-5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V4.5zM9.5 1.5v3h3',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.1,
              strokeLinejoin: 'round',
            }),
          ),
        )

      const folderGlyph = (open) =>
        h(
          'span',
          { className: 'lmn-icon', 'aria-hidden': 'true' },
          h(
            'svg',
            { viewBox: '0 0 16 16', width: 16, height: 16 },
            open
              ? h('path', {
                  d: 'M1.5 5.4h13l-1.5 6.4a1 1 0 0 1-1 .8H2.6a1 1 0 0 1-1-.8z',
                  fill: 'currentColor',
                  opacity: 0.2,
                })
              : null,
            h('path', {
              d: open
                ? 'M1.5 5.4V3.5a.9.9 0 0 1 .9-.9h3l1.3 1.4h5.4a.9.9 0 0 1 .9.9v.5'
                : 'M1.8 3.4a.9.9 0 0 1 .9-.9h3l1.3 1.4h5.2a.9.9 0 0 1 .9.9v7.5a.9.9 0 0 1-.9.9H2.7a.9.9 0 0 1-.9-.9z',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.1,
              strokeLinejoin: 'round',
            }),
          ),
        )

      /** A compact square icon button, the way the Explorer header carries its actions. */
      const iconButton = (kind, label, onClick) =>
        h(
          'button',
          {
            className: 'lmn-iconbtn',
            title: label,
            'aria-label': label,
            disabled: busy === 'create',
            onClick,
          },
          h(
            'svg',
            { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true' },
            h('path', {
              d:
                kind === 'newFile'
                  ? 'M9.5 1.5h-5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V4.5zM9.5 1.5v3h3M8 8v4M6 10h4'
                  : 'M1.8 3.4a.9.9 0 0 1 .9-.9h3l1.3 1.4h5.2a.9.9 0 0 1 .9.9v7.5a.9.9 0 0 1-.9.9H2.7a.9.9 0 0 1-.9-.9zM8 7.6v4M6 9.6h4',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.1,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }),
          ),
        )

      /** Children of one directory, rendered one indent step deeper. */
      const childNodes = (target, relative, depth) => {
        const key = treeKey(target.id, relative)
        const known = children[key]
        const pending =
          relative !== '' &&
          creating !== null &&
          project !== null &&
          project.id === target.id &&
          creating.target === relative
            ? [createRow(depth)]
            : []
        if (known === undefined) return [h('div', { key: `${key}:loading`, className: 'lmn-note' }, t('panel.loading'))]
        if (known.length === 0) {
          return pending.length > 0
            ? pending
            : [h('div', { key: `${key}:empty`, className: 'lmn-note' }, t('panel.emptyDir'))]
        }
        return [...pending, ...known.map((entry) => treeNode(target, entry, depth))]
      }

      /** The inline name box, shown at the indentation of the directory it targets. */
      const createRow = (depth) => {
        const finish = () => void confirmCreate()
        return h(
          'div',
          { key: 'create', className: 'lmn-create', style: { paddingLeft: (8 + depth * 10) + 'px' } },
          h('input', {
            autoFocus: true,
            value: creating === null ? '' : creating.value,
            placeholder: t('panel.namePlaceholder'),
            'aria-label': creating === null ? t('panel.namePlaceholder') : creating.kind,
            onChange: (event) => {
              const value = event.target.value
              setCreating((current) => (current === null ? current : { ...current, value }))
            },
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void confirmCreate()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                cancelCreate()
              }
            },
            onBlur: () => cancelCreate(),
            onKeyUp: () => {},
          }),
          h('button', { className: 'lmn-btn', onMouseDown: (event) => event.preventDefault(), onClick: finish }, '✓'),
        )
      }

      /** One file or folder inside a project, expanded in place. */
      const treeNode = (target, entry, depth) => {
        const relative = entry.path
        const isDirectory = entry.type === 'directory'
        const open = isDirectory && openDirs[treeKey(target.id, relative)] === true
        const selected = !isDirectory && file !== null && file.path === relative
        // One hairline per enclosing level, so depth reads without counting gaps.
        const guides = []
        for (let level = 1; level <= depth; level += 1) {
          guides.push(
            h('span', {
              key: 'guide' + level,
              className: 'lmn-indent',
              style: { left: (8 + (level - 1) * 10 + 6) + 'px' },
              'aria-hidden': 'true',
            }),
          )
        }
        const activate = () =>
          isDirectory ? void toggleDir(target, relative) : void openFile(target, relative)
        const row = h(
          'div',
          {
            className: selected ? 'lmn-row is-selected' : 'lmn-row',
            style: { paddingLeft: (8 + depth * 10) + 'px' },
            title: relative,
            role: 'treeitem',
            'aria-selected': selected ? 'true' : 'false',
            'aria-expanded': isDirectory ? (open ? 'true' : 'false') : undefined,
            onClick: activate,
          },
          guides,
          chevron(isDirectory, open),
          isDirectory ? folderGlyph(open) : fileGlyph(entry.name),
          h('span', { className: 'lmn-name' }, entry.name),
        )
        return h(
          'div',
          { key: relative, className: 'lmn-node' },
          row,
          open ? childNodes(target, relative, depth + 1) : null,
        )
      }

      /** Top-level node: the imported folder itself, minus the redundant path line. */
      const projectNode = (item) => {
        const active = project !== null && project.id === item.id
        const open = openDirs[treeKey(item.id, '')] === true
        const row = h(
          'div',
          {
            className: active ? 'lmn-row lmn-row-root is-selected' : 'lmn-row lmn-row-root',
            style: { paddingLeft: '8px' },
            title: item.rootPath,
            role: 'treeitem',
            'aria-selected': active ? 'true' : 'false',
            'aria-expanded': open ? 'true' : 'false',
            onClick: () => void openProject(item),
          },
          chevron(true, open),
          folderGlyph(open),
          h('span', { className: 'lmn-name lmn-name-root' }, item.name.toUpperCase()),
          h(
            'button',
            {
              className: 'lmn-remove',
              title: t('panel.remove'),
              'aria-label': t('panel.remove'),
              onClick: (event) => {
                event.stopPropagation()
                void removeProject(item)
              },
            },
            'x',
          ),
        )
        return h(
          'div',
          { key: item.id, className: 'lmn-node' },
          row,
          open ? childNodes(item, '', 1) : null,
        )
      }

      const actions =
        project === null
          ? null
          : h(
              'div',
              { className: 'lmn-actions' },
              h('span', { className: 'lmn-actions-label', title: project.rootPath }, viewTarget === '' ? t('panel.rootDir') : viewTarget),
              iconButton('newFile', t('panel.newFile'), () => beginCreate('file')),
              iconButton('newFolder', t('panel.newFolder'), () => beginCreate('directory')),
            )

      const side = h(
        'aside',
        { className: 'lmn-side' },
        h(
          'div',
          { className: 'lmn-side-head' },
          h('span', { className: 'lmn-side-title' }, t('panel.projects')),
          h(
            'button',
            {
              className: 'lmn-btn lmn-btn-primary',
              disabled: busy === 'import',
              onClick: () => void importFolder(),
            },
            busy === 'import' ? t('panel.importing') : t('panel.import'),
          ),
        ),
        actions,
        creating !== null && creating.target === '' ? createRow(0) : null,
        h(
          'div',
          { className: 'lmn-list lmn-tree' },
          projects.length === 0
            ? h('div', { className: 'lmn-note' }, t('panel.empty'))
            : projects.map((item) => projectNode(item)),
        ),
      )

      /**
       * The GitLens-style chip above the editor: the commit that last touched the
       * cursor's line, with the full commit card revealed by CSS on hover or focus.
       */
      const blameBar =
        cursorLine === null
          ? null
          : h(
              'div',
              { className: 'lmn-blame-bar' },
              lineEntry === null
                ? h(
                    'div',
                    { className: 'lmn-blame-chip is-uncommitted', tabIndex: 0 },
                    h('span', { className: 'lmn-blame-chip-text' }, t('panel.uncommitted')),
                  )
                : h(
                    'div',
                    { className: 'lmn-blame-chip', tabIndex: 0 },
                    h(
                      'span',
                      { className: 'lmn-blame-chip-text' },
                      `L${lineEntry.finalLine ?? lineEntry.line} · ${String(lineEntry.sha ?? '').slice(0, 9)} · ${lineEntry.author ?? '?'} · ${blameDay(lineEntry.authorTime)}`,
                    ),
                    h(
                      'div',
                      { className: 'lmn-blame-card' },
                      h('div', null, h('b', null, t('panel.blameAuthor')), lineEntry.author ?? '?'),
                      h(
                        'div',
                        null,
                        h('b', null, t('panel.blameDate')),
                        blameDay(lineEntry.authorTime) || '?',
                      ),
                      h(
                        'div',
                        null,
                        h('b', null, t('panel.blameCommit')),
                        String(lineEntry.sha ?? ''),
                      ),
                      h('div', null, h('b', null, t('panel.blameSummary')), lineEntry.summary ?? ''),
                    ),
                  ),
            )

      const editor =
        file === null
          ? h(
              'div',
              { className: 'lmn-empty-center' },
              h(
                'div',
                null,
                h(
                  'h3',
                  null,
                  project !== null
                    ? t('panel.noFile')
                    : projects.length === 0
                      ? t('panel.empty')
                      : t('panel.pickProject'),
                ),
                h('p', null, project === null && projects.length === 0 ? t('panel.emptyHint') : ''),
              ),
            )
          : h(
              'div',
              { className: 'lmn-editor' },
              blameBar,
              viewMode === 'preview'
                ? draft === ''
                  ? h('div', { className: 'lmn-render-empty' }, t('panel.previewEmpty'))
                  : h('div', { className: 'lmn-render' }, renderMarkdown(draft))
                : h('textarea', {
                    value: draft,
                    spellCheck: false,
                    onChange: (event) => {
                      setDraft(event.target.value)
                      setNotice(null)
                    },
                    onKeyUp: (event) => void onSelectLine(event),
                    onClick: (event) => void onSelectLine(event),
                    'aria-label': file.path,
                  }),
            )

      const statusPane =
        project === null
          ? h('div', { className: 'lmn-note' }, t('panel.noProject'))
          : status === null
            ? h('div', { className: 'lmn-note' }, t('panel.loading'))
            : status.entries.length === 0
              ? h('div', { className: 'lmn-note' }, t('panel.gitEmpty'))
              : h(
                  'div',
                  { className: 'lmn-status' },
                  status.entries.map((entry) =>
                    h(
                      'button',
                      {
                        key: `${entry.path}:${entry.kind}`,
                        onClick: () => void loadDiff(project, entry.path),
                        title: entry.path,
                      },
                      h('span', { className: 'lmn-badge' }, t(KIND_LABEL[entry.kind] ?? 'panel.modified')),
                      entry.path,
                      entry.from === undefined ? null : ` ← ${entry.from}`,
                    ),
                  ),
                )

      const diffPane =
        diff === null
          ? h('div', { className: 'lmn-note' }, t('panel.diffEmpty'))
          : h(
              'div',
              null,
              diffPath === null ? null : h('div', { className: 'lmn-note' }, diffPath),
              h('div', { className: 'lmn-pane' }, diff.diff === '' ? t('panel.diffEmpty') : diff.diff),
              diff.note === undefined ? null : h('div', { className: 'lmn-note' }, t('panel.noCommits')),
            )

      const blamePane =
        blame === null
          ? h('div', { className: 'lmn-note' }, t('panel.blameHint'))
          : h(
              'div',
              null,
              (blame.entries ?? []).length === 0
                ? h('div', { className: 'lmn-note' }, t('panel.noCommits'))
                : h(
                    'div',
                    { className: 'lmn-pane' },
                    (blame.entries ?? [])
                      .map((entry) =>
                        [
                          `L${entry.finalLine ?? entry.line}`,
                          String(entry.sha ?? '').slice(0, 9),
                          entry.author ?? '?',
                          entry.authorTime === undefined
                            ? ''
                            : new Date(Number(entry.authorTime) * 1000).toISOString().slice(0, 10),
                          entry.summary ?? '',
                        ].join('  '),
                      )
                      .join('\n'),
                  ),
            )

      return h(
        'div',
        { className: 'lmn-root' },
        side,
        h(
          'div',
          { className: 'lmn-main' },
          h(
            'div',
            { className: 'lmn-toolbar' },
            h('span', { className: 'lmn-path' }, file === null ? (project?.rootPath ?? '') : file.path),
            h(
              'div',
              { className: 'lmn-seg', role: 'group', 'aria-label': `${t('panel.edit')} / ${t('panel.preview')}` },
              h(
                'button',
                {
                  className: 'lmn-btn',
                  'aria-pressed': viewMode === 'edit' ? 'true' : 'false',
                  onClick: () => setViewMode('edit'),
                },
                t('panel.edit'),
              ),
              h(
                'button',
                {
                  className: 'lmn-btn',
                  'aria-pressed': viewMode === 'preview' ? 'true' : 'false',
                  onClick: () => setViewMode('preview'),
                },
                t('panel.preview'),
              ),
            ),
            notice === 'panel.staleTitle' ? h('span', { className: 'lmn-note' }, t('panel.staleTitle')) : null,
            notice === 'panel.saved' ? h('span', { className: 'lmn-note' }, t('panel.saved')) : null,
            dirty ? h('span', { className: 'lmn-note' }, t('panel.modifiedDirty')) : null,
            h(
              'button',
              {
                className: 'lmn-btn',
                disabled: file === null || busy === 'read',
                onClick: () => file !== null && project !== null && void openFile(project, file.path),
              },
              t('panel.reload'),
            ),
            h(
              'button',
              {
                className: 'lmn-btn lmn-btn-primary',
                disabled: file === null || busy === 'save',
                onClick: () => void save(),
              },
              busy === 'save' ? t('panel.saving') : t('panel.save'),
            ),
          ),
          error === null
            ? null
            : h('div', { className: 'lmn-error' }, `${t('panel.error')} — ${error.code || ''} ${error.message}`),
          editor,
          h(
            'div',
            { className: 'lmn-bottom' },
            h(
              'div',
              { className: 'lmn-tabs' },
              ['status', 'diff', 'blame'].map((key) =>
                h(
                  'button',
                  {
                    key,
                    className: 'lmn-tab',
                    'aria-selected': tab === key ? 'true' : 'false',
                    onClick: () => {
                      setTab(key)
                      // Opening Diff with nothing loaded yet would show an empty pane
                      // forever; fetch once so the tab can explain itself.
                      if (key === 'diff' && diff === null && project !== null) {
                        void loadDiff(project, file?.path ?? '')
                      }
                    },
                  },
                  key === 'status' ? t('panel.git') : key === 'diff' ? t('panel.diff') : t('panel.blame'),
                ),
              ),
            ),
            tab === 'status' ? statusPane : tab === 'diff' ? diffPane : blamePane,
          ),
        ),
      )
    }

    return {
      inject: ['slots', 'locale', 'remote'],
      async apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'local-markdown-notes: dictionaries')
        const t = ctx.locale.bind(NS)

        ctx.effect(() => {
          const style = document.createElement('style')
          style.dataset.plugin = PANEL_ID
          style.textContent = STYLE
          document.head.append(style)
          return () => style.remove()
        }, 'local-markdown-notes: styles')

        // `ctx.remote.$mount` is async and only exposes `remote.<namespace>`
        // once it resolves, so it must be awaited before anything may call the
        // API. A rejection means the namespace will never appear: record the
        // real error and stop here instead of mounting a panel that can only
        // fail with a misleading "is not mounted".
        let disposeRemote = null
        try {
          disposeRemote = await ctx.remote.$mount(buildContribution())
        } catch (error) {
          recordMountFailure(error)
          const failure = new Error(`notes remote mount failed: ${mountFailure}`)
          failure.code = error?.code ?? 'notes/remote-mount-failed'
          failure.cause = error
          throw failure
        }

        ctx.effect(
          () => () => {
            if (typeof disposeRemote === 'function') disposeRemote()
          },
          'local-markdown-notes: unmount notes Remote',
        )

        const api = createApi(ctx)

        ctx.effect(
          () =>
            ctx.slots.inject('sidebar.panellist', () =>
              ctx.slots.register(
                {
                  name: 'sidebar.panellist',
                  id: PANEL_ID,
                  order: SLOT_ORDER,
                  label: () => t('panel.title'),
                  locale: NS,
                },
                PanelIcon,
              ),
            ),
          'local-markdown-notes: sidebar entry',
        )

        ctx.effect(
          () =>
            ctx.slots.inject('main', () =>
              ctx.slots.register(
                {
                  name: 'main',
                  key: PANEL_ID,
                  locale: NS,
                  inject: () => ({ api, t }),
                },
                App,
              ),
            ),
          'local-markdown-notes: main panel',
        )

      },
    }
  },
})
