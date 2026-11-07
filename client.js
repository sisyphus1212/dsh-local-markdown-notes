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
    }

    const EN = {
      'panel.title': 'Local notes',
      'panel.import': 'Import folder',
      'panel.importing': 'Choosing…',
      'panel.empty': 'No folder imported yet.',
      'panel.emptyHint': 'Import a local folder holding Markdown files. The first import initialises a Git repository inside that folder.',
      'panel.projects': 'Folders',
      'panel.files': 'Files',
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
    }

    const STYLE = `
.lmn-root{display:flex;height:100%;min-height:0;background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary,CanvasText);font-size:13px;line-height:18px}
.lmn-side{width:260px;flex:0 0 260px;border-right:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));display:flex;flex-direction:column;min-height:0}
.lmn-side-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));font-weight:600}
.lmn-btn{font:inherit;color:inherit;cursor:pointer;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));background:var(--dsw-alias-bg-layer-2,transparent);padding:3px 8px}
.lmn-btn:hover{background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.04))}
.lmn-btn[disabled]{opacity:.5;cursor:default}
.lmn-btn-primary{background:var(--dsw-alias-brand-primary,#0f1115);color:var(--dsw-alias-label-inverted,#fff);border-color:transparent}
.lmn-list{overflow:auto;min-height:0;padding:6px}
.lmn-item{display:flex;align-items:center;gap:6px;width:100%;text-align:left;font:inherit;color:inherit;background:none;border:0;border-radius:8px;padding:5px 8px;cursor:pointer}
.lmn-item:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04))}
.lmn-item[aria-selected="true"]{background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.08))}
.lmn-item-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.lmn-item-sub{color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lmn-main{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0}
.lmn-toolbar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.lmn-path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:var(--dsw-alias-label-secondary,#61666b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.lmn-editor{flex:1;min-height:0;display:flex}
.lmn-editor textarea{flex:1;min-height:0;resize:none;border:0;outline:none;padding:12px 14px;background:transparent;color:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:20px;tab-size:2}
.lmn-bottom{flex:0 0 auto;border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));max-height:44%;display:flex;flex-direction:column;min-height:0}
.lmn-tabs{display:flex;gap:4px;padding:6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.lmn-tab{font:inherit;color:var(--dsw-alias-label-secondary,#61666b);background:none;border:0;border-radius:6px;padding:3px 8px;cursor:pointer}
.lmn-tab[aria-selected="true"]{color:inherit;background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.08))}
.lmn-pane{overflow:auto;min-height:0;padding:8px 12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word}
.lmn-note{padding:10px 12px;color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px}
.lmn-error{margin:8px 12px;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-static-red-50,#fef2f2);color:var(--dsw-alias-static-red-900,#570c0c);border:1px solid var(--dsw-alias-static-red-400-a12,rgba(242,90,90,.12))}
.lmn-status{display:flex;flex-direction:column;gap:2px}
.lmn-status button{font:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:inherit;text-align:left;background:none;border:0;border-radius:6px;padding:2px 6px;cursor:pointer}
.lmn-status button:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04))}
.lmn-badge{display:inline-block;min-width:60px;color:var(--dsw-alias-label-tertiary,#81858c)}
.lmn-empty-center{flex:1;display:grid;place-items:center;padding:24px;text-align:center;color:var(--dsw-alias-label-tertiary,#81858c)}
.lmn-empty-center h3{margin:0 0 6px;font-size:14px;color:var(--dsw-alias-label-primary,CanvasText)}
.lmn-kv{display:flex;gap:6px}
.lmn-kv b{font-weight:600}
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

    function SidebarItem({ project, active, onSelect, onRemove, t }) {
      return h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
        h(
          'button',
          {
            className: 'lmn-item',
            'aria-selected': active ? 'true' : 'false',
            title: project.rootPath,
            onClick: () => onSelect(project),
          },
          h(
            'span',
            { className: 'lmn-item-name' },
            h('span', { style: { display: 'block' } }, project.name),
            h('span', { className: 'lmn-item-sub', style: { display: 'block' } }, project.rootPath),
          ),
        ),
        h(
          'button',
          {
            className: 'lmn-btn',
            title: t('panel.remove'),
            'aria-label': t('panel.remove'),
            onClick: () => onRemove(project),
          },
          '×',
        ),
      )
    }

    function App({ api, t }) {
      const [projects, setProjects] = React.useState([])
      const [project, setProject] = React.useState(null)
      const [folder, setFolder] = React.useState('')
      const [entries, setEntries] = React.useState([])
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

      const refreshEntries = React.useCallback(
        async (target, relative) => {
          if (target === null) return
          try {
            const value = await api.listEntries(target.id, relative ?? '')
            setEntries(Array.isArray(value?.entries) ? value.entries : [])
            setFolder(value?.path ?? '')
            setError(null)
          } catch (caught) {
            report(caught)
          }
        },
        [api, report],
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
          setDiff(null)
          setDiffPath(null)
          setNotice(null)
          await refreshEntries(target, '')
          await refreshStatus(target)
        },
        [refreshEntries, refreshStatus],
      )

      const openFile = React.useCallback(
        async (target, relative) => {
          try {
            setBusy('read')
            const value = await api.readFile(target.id, relative)
            setFile({ path: value.path, version: value.version, content: value.content })
            setDraft(value.content)
            setBlame(null)
            setNotice(null)
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
              setEntries([])
              setFile(null)
              setDraft('')
              setStatus(null)
            }
            await refreshProjects()
          } catch (caught) {
            report(caught)
          }
        },
        [api, project, refreshProjects, report],
      )

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
          if (blameTimer.current !== null) window.clearTimeout(blameTimer.current)
          const seq = (blameSeq.current += 1)
          blameTimer.current = window.setTimeout(async () => {
            blameTimer.current = null
            try {
              const value = await api.gitBlame(project.id, file.path, line)
              if (seq !== blameSeq.current) return
              setBlame(value)
              setTab('blame')
              setError(null)
            } catch (caught) {
              if (seq !== blameSeq.current) return
              setBlame({ line, entries: [], note: caught?.code ?? 'notes/git-failed' })
            }
          }, 180)
        },
        [api, draft, file, project],
      )

      const dirty = file !== null && draft !== (file.content ?? draft) && busy !== 'save'

      const side = h(
        'aside',
        { className: 'lmn-side' },
        h(
          'div',
          { className: 'lmn-side-head' },
          h('span', null, t('panel.projects')),
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
        h(
          'div',
          { className: 'lmn-list' },
          projects.length === 0
            ? h('div', { className: 'lmn-note' }, t('panel.empty'))
            : projects.map((item) =>
                h(SidebarItem, {
                  key: item.id,
                  project: item,
                  active: project !== null && project.id === item.id,
                  onSelect: (target) => void openProject(target),
                  onRemove: (target) => void removeProject(target),
                  t,
                }),
              ),
          project !== null
            ? h(
                'div',
                { style: { marginTop: '10px' } },
                h(
                  'div',
                  { className: 'lmn-side-head', style: { borderTop: 'none', paddingTop: '6px' } },
                  h('span', null, t('panel.files')),
                ),
                h(
                  'button',
                  {
                    className: 'lmn-item',
                    onClick: () => void refreshEntries(project, parentOf(folder)),
                    disabled: folder === '',
                    style: { opacity: folder === '' ? 0.5 : 1 },
                  },
                  h('span', { className: 'lmn-item-name' }, '..'),
                ),
                entries.length === 0
                  ? h('div', { className: 'lmn-note' }, t('panel.empty'))
                  : entries.map((entry) =>
                      h(
                        'button',
                        {
                          key: entry.path,
                          className: 'lmn-item',
                          'aria-selected': file !== null && file.path === entry.path ? 'true' : 'false',
                          onClick: () =>
                            entry.type === 'directory'
                              ? void refreshEntries(project, entry.path)
                              : void openFile(project, entry.path),
                        },
                        h(
                          'span',
                          { className: 'lmn-item-name' },
                          entry.type === 'directory' ? `📁 ${entry.name}` : entry.name,
                        ),
                      ),
                    ),
              )
            : null,
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
                h('h3', null, project === null ? t('panel.empty') : t('panel.noFile')),
                h('p', null, project === null ? t('panel.emptyHint') : ''),
              ),
            )
          : h(
              'div',
              { className: 'lmn-editor' },
              h('textarea', {
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
                    onClick: () => setTab(key),
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

    function parentOf(relative) {
      if (relative === '') return ''
      const index = relative.lastIndexOf('/')
      return index === -1 ? '' : relative.slice(0, index)
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
            ctx.slots.inject('sidebar.panellist', () =>              ctx.slots.register(
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
