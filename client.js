window.__ModuleLoader__.load({
  id: '@local/local-markdown-notes',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'local-markdown-notes'
    const PANEL_ID = 'local-markdown-notes'
    const SLOT_ORDER = 20
// Name of the `@` source this plugin registers. It doubles as the serializer
// routing key carried by every chip it inserts, so it must stay stable.
const NOTES_SOURCE = 'local-notes'

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
      'panel.blameAuthor': '作者',
      'panel.blameDate': '日期',
      'panel.blameCommit': '提交',
      'panel.blameSummary': '说明',
      'panel.newFile': '新建文件',
      'panel.newFolder': '新建文件夹',
      'panel.namePlaceholder': '文件夹名',
      'panel.fileNamePlaceholder': '文件名.md',
      'panel.previewEmpty': '这个文件还没有内容。',
    'panel.outline': '目录',
      'panel.edit': '编辑',
      'panel.preview': '预览',
      'panel.untitledName': '未命名',
      'panel.resize': '拖动调整下方面板高度',
      'panel.restoreMissing': '上次打开的文件已经不在了，请从左侧重新选择。',
      'panel.searchPlaceholder': '搜索笔记',
      'panel.searchClear': '清除搜索',
      'panel.searching': '搜索中…',
      'panel.searchEmpty': '没有找到匹配内容。',
      'panel.searchHint': '输入关键词搜索当前文件夹',
      'panel.searchHits': '处匹配',
      'panel.searchFiles': '个文件',
      'panel.searchScanned': '已扫描',
      'panel.searchTruncated': '结果不完整',
      'panel.rename': '重命名',
      'panel.delete': '删除',
      'panel.renamePlaceholder': '新文件名',
      'panel.deleteQuestion': '确定删除？',
      'panel.confirm': '确认',
      'panel.cancel': '取消',
      'panel.deletedNotice': '文件已删除',
      'reference.section': '笔记',
      'panel.addToChat': '新建会话并加入此笔记',
      'panel.addedToChat': '已新建会话，笔记已在输入框',
      'panel.chatUnavailable': '当前没有可用的会话空间。',
      'panel.chatBusy': '新会话的消息框暂时不能接收，稍后再试。',
      'panel.chatFailed': '新建会话失败，请稍后再试。',
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
      'panel.blameAuthor': 'Author',
      'panel.blameDate': 'Date',
      'panel.blameCommit': 'Commit',
      'panel.blameSummary': 'Summary',
      'panel.newFile': 'New file',
      'panel.newFolder': 'New folder',
      'panel.namePlaceholder': 'Folder name',
      'panel.fileNamePlaceholder': 'name.md',
      'panel.previewEmpty': 'This file is still empty.',
    'panel.outline': 'Outline',
      'panel.edit': 'Edit',
      'panel.preview': 'Preview',
      'panel.untitledName': 'Untitled',
      'panel.resize': 'Drag to resize the bottom panel',
      'panel.restoreMissing': 'The file you had open is gone. Pick another one on the left.',
      'panel.searchPlaceholder': 'Search notes',
      'panel.searchClear': 'Clear search',
      'panel.searching': 'Searching…',
      'panel.searchEmpty': 'No matches.',
      'panel.searchHint': 'Type to search the current folder',
      'panel.searchHits': 'matches',
      'panel.searchFiles': 'files',
      'panel.searchScanned': 'scanned',
      'panel.searchTruncated': 'partial results',
      'panel.rename': 'Rename',
      'panel.delete': 'Delete',
      'panel.renamePlaceholder': 'New file name',
      'panel.deleteQuestion': 'Delete this file?',
      'panel.confirm': 'Confirm',
      'panel.cancel': 'Cancel',
      'panel.deletedNotice': 'The file was deleted.',
      'reference.section': 'Notes',
      'panel.addToChat': 'New chat with this note',
      'panel.addedToChat': 'New chat opened, note in its message box',
      'panel.chatUnavailable': 'No workspace is open right now.',
      'panel.chatBusy': 'The new message box is not ready yet. Try again.',
      'panel.chatFailed': 'The new chat could not be created. Try again.',
    }

    const STYLE = `
.lmn-root{display:flex;height:100%;min-height:0;background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary,CanvasText);font-size:13px;line-height:18px}
.lmn-side{width:260px;flex:0 0 260px;border-right:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));display:flex;flex-direction:column;min-height:0}
.lmn-side-head{display:flex;align-items:center;gap:4px;padding:6px 6px 6px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.lmn-side-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-secondary,#61666b)}
.lmn-search{display:flex;align-items:center;gap:4px;padding:6px 8px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.lmn-search-input{flex:1;min-width:0;height:24px;padding:0 6px;font:inherit;font-size:12px;color:var(--dsw-alias-label-primary,CanvasText);background:var(--dsw-alias-bg-layer-2,transparent);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:4px;outline:none}
.lmn-search-input:focus{border-color:var(--dsw-alias-brand-primary,#0f1115)}
.lmn-search-clear{flex:0 0 auto;height:24px;padding:0 6px;font:inherit;font-size:11px;background:none;border:0;border-radius:4px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer}
.lmn-search-clear:hover{background:rgba(127,127,127,.18);color:var(--dsw-alias-label-primary,CanvasText)}
.lmn-search-note{padding:6px 12px;font-size:11px;line-height:15px;color:var(--dsw-alias-label-secondary,#61666b)}
.lmn-hits{display:flex;flex-direction:column;padding:0 0 6px}
.lmn-hit{display:block;width:100%;text-align:left;font:inherit;background:none;border:0;padding:3px 8px 4px;cursor:pointer;color:inherit;border-radius:3px}
.lmn-hit:hover,.lmn-hit:focus-visible{background:rgba(127,127,127,.18)}
.lmn-hit.is-selected{background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.08))}
.lmn-hit-path{display:block;font-size:11px;line-height:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary,#61666b)}
.lmn-hit-text{display:block;font-size:12px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:pre}
.lmn-hit-line{display:inline-block;min-width:18px;margin-right:5px;text-align:right;font-size:11px;color:var(--dsw-alias-label-secondary,#61666b)}
.lmn-hit-mark{background:rgba(255,196,0,.38);color:var(--dsw-alias-label-primary,CanvasText);border-radius:2px}
.lmn-btn{font:inherit;color:inherit;cursor:pointer;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));background:var(--dsw-alias-bg-layer-2,transparent);padding:3px 8px}
.lmn-btn:hover{background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.04))}
.lmn-btn[disabled]{opacity:.5;cursor:default}
.lmn-btn-primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#0f1115));color:var(--dsw-alias-label-primary-foreground,#fff);border-color:transparent}
.lmn-btn.lmn-btn-primary:hover{background:var(--dsw-alias-button-primary-hover,#43454a);color:var(--dsw-alias-label-primary-foreground,#fff)}
.lmn-btn.lmn-btn-primary:focus-visible{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#0f1115));color:var(--dsw-alias-label-primary-foreground,#fff);border-color:transparent}
.lmn-btn-danger{color:var(--dsw-alias-state-error-primary,#ec1313);border-color:var(--dsw-alias-state-error-primary,#ec1313)}
.lmn-btn.lmn-btn-danger:hover{background:var(--dsw-alias-state-error-primary,#ec1313);color:var(--dsw-alias-label-primary-foreground,#fff)}
.lmn-confirm{padding-top:3px;padding-bottom:3px}
.lmn-confirm-text{flex:1;min-width:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lmn-list{overflow:auto;min-height:0;padding:0}
.lmn-tree{display:flex;flex-direction:column;padding:0 0 6px}
.lmn-node{display:block;min-width:0}
.lmn-row{position:relative;display:flex;align-items:center;gap:3px;height:22px;padding-right:4px;cursor:pointer;user-select:none;border-radius:3px}
.lmn-row:hover{background:rgba(127,127,127,.18)}
.lmn-row.is-selected{background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.08))}
.lmn-chevron{flex:0 0 16px;width:16px;height:16px;display:grid;place-items:center;color:var(--dsw-alias-label-secondary,#61666b)}
.lmn-icon{flex:0 0 16px;width:16px;height:16px;display:grid;place-items:center;color:var(--dsw-alias-label-secondary,#61666b)}
.lmn-name{flex:1;min-width:0;font-size:13px;line-height:22px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lmn-name-root{font-size:11px;font-weight:600;letter-spacing:.05em}
.lmn-remove{flex:0 0 auto;opacity:0;transition:opacity .1s;padding:0 4px;line-height:16px;font:inherit;font-size:12px;background:none;border:0;border-radius:4px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer}
.lmn-row:hover .lmn-remove,.lmn-remove:focus-visible{opacity:1}
.lmn-iconbtn{flex:0 0 auto;display:grid;place-items:center;width:22px;height:22px;padding:0;background:none;border:0;border-radius:4px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer}
.lmn-iconbtn:hover{background:rgba(127,127,127,.18);color:var(--dsw-alias-label-primary,CanvasText)}
.lmn-iconbtn[disabled]{opacity:.4;cursor:default}
.lmn-row-actions{flex:0 0 auto;display:flex;align-items:center;gap:1px;margin-left:2px}
.lmn-row .lmn-iconbtn{width:20px;height:20px;opacity:0;transition:opacity .1s}
.lmn-row:hover .lmn-iconbtn,.lmn-row .lmn-iconbtn:focus-visible{opacity:1}
/* A disabled action still has to be seen: hiding it outright made the whole
   action group vanish while a dialog-less create was pending, which read as
   "the buttons are gone". Dim it instead and keep the row affordance alive. */
.lmn-row .lmn-iconbtn[disabled]{opacity:.35;cursor:default}
.lmn-row:hover .lmn-iconbtn[disabled]{opacity:.35}
.lmn-main{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0}
.lmn-toolbar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.lmn-path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:var(--dsw-alias-label-secondary,#61666b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.lmn-editor{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.lmn-doc{flex:1;min-height:0;width:100%;padding:0 20px;box-sizing:border-box;display:flex;flex-direction:column}
.lmn-code-body{position:relative;flex:1;min-width:0;min-height:0;display:flex}
/* Edit-time colour is painted by a mirrored layer underneath the textarea, so
   the textarea keeps the caret and the selection but draws no glyphs of its
   own. Its scrollbar is hidden because a visible one would narrow its content
   box and wrap long lines at a different column than the mirror. */
.lmn-hl{position:absolute;top:0;right:0;bottom:0;left:0;margin:0;overflow:hidden;pointer-events:none;padding:14px 0 24px;color:var(--dsw-alias-label-primary,CanvasText);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:20px;tab-size:2;white-space:pre-wrap;overflow-wrap:break-word;word-break:normal}
.lmn-hl-line{min-height:20px;white-space:pre-wrap;overflow-wrap:break-word}
.lmn-editor textarea{position:relative;z-index:1;flex:1;min-height:0;resize:none;border:0;outline:none;padding:14px 0 24px;background:transparent;color:transparent;caret-color:var(--dsw-alias-label-primary,CanvasText);-webkit-text-fill-color:transparent;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:20px;tab-size:2;scrollbar-width:none;-ms-overflow-style:none}
.lmn-editor textarea::-webkit-scrollbar{width:0;height:0}
.lmn-editor textarea::selection{background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.18))}
/* The host paints a global focus ring on every focused control. Our editor
   already shows the caret, so the ring only boxes the whole page in blue. */
.lmn-root .lmn-editor textarea:focus,.lmn-root .lmn-editor textarea:focus-visible{outline:none}
/* Editing shows line numbers; the preview deliberately does not, because
   rendered Markdown has no source lines to point at. */
.lmn-code{flex:1;min-height:0;display:flex;min-width:0}
.lmn-gutter{flex:0 0 auto;overflow:hidden;padding:14px 8px 24px 0;color:var(--dsw-alias-label-tertiary,#81858c);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:20px;user-select:none;-webkit-user-select:none;cursor:default}
/* One row is a 3px change bar plus the number. The bar keeps its width when
   there is nothing to draw, so line numbers never shift as marks come and go. */
.lmn-gutter-line{display:flex;align-items:stretch;height:20px;line-height:20px}
.lmn-gutter-mark{flex:0 0 3px;width:3px;margin-right:6px;border-radius:1px;background:transparent}
.lmn-gutter-num{flex:0 0 auto;min-width:22px;text-align:right}
/* VS Code Light+ diff colours; the two dark blocks below carry Dark+. */
.lmn-gutter-mark.is-added{background:#81b88b}
.lmn-gutter-mark.is-modified{background:#1b81a8}
.lmn-gutter-mark.is-deleted{background:#ca4b51}
body[data-ds-dark-theme] .lmn-gutter-mark.is-added{background:#81b88b}
body[data-ds-dark-theme] .lmn-gutter-mark.is-modified{background:#4b91e2}
body[data-ds-dark-theme] .lmn-gutter-mark.is-deleted{background:#ca4b51}
/* A bare hit strip above the bottom pane. The visible rule stays on the pane
   itself, so the splitter only has to be grabbable, not painted. */
.lmn-splitter{flex:0 0 auto;height:6px;margin-bottom:-1px;cursor:row-resize;background:transparent;touch-action:none}
.lmn-splitter:hover,.lmn-splitter[data-dragging="true"]{background:var(--dsw-alias-border-l2,rgba(0,0,0,.1))}
.lmn-bottom{flex:0 0 auto;border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));max-height:44%;display:flex;flex-direction:column;min-height:0}
.lmn-tabs{display:flex;gap:4px;padding:6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.lmn-tab{font:inherit;color:var(--dsw-alias-label-secondary,#61666b);background:none;border:0;border-radius:6px;padding:3px 8px;cursor:pointer}
.lmn-tab[aria-selected="true"]{color:inherit;background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.08))}
.lmn-pane{overflow:auto;min-height:0;padding:8px 12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word}
.lmn-note{padding:10px 12px;color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px}
.lmn-dirty{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:999px;font-size:12px;background:var(--dsw-alias-state-warn-tertiary,#fff4e0);color:var(--dsw-alias-state-warn-primary,#b25e09)}
.lmn-dirty::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.lmn-error{margin:8px 12px;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-state-error-primary,#ec1313);border:1px solid var(--dsw-alias-state-error-primary,#ec1313)}
.lmn-status{display:flex;flex-direction:column;gap:2px}
.lmn-status button{font:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:inherit;text-align:left;background:none;border:0;border-radius:6px;padding:2px 6px;cursor:pointer}
.lmn-status button:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04))}
.lmn-badge{display:inline-block;min-width:60px;color:var(--dsw-alias-label-tertiary,#81858c)}
.lmn-empty-center{flex:1;display:grid;place-items:center;padding:24px;text-align:center;color:var(--dsw-alias-label-tertiary,#81858c)}
.lmn-empty-center h3{margin:0 0 6px;font-size:14px;color:var(--dsw-alias-label-primary,CanvasText)}
.lmn-kv{display:flex;gap:6px}
.lmn-kv b{font-weight:600}
.lmn-blame-bar{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:10px 0 0 44px;min-width:0}
.lmn-blame-chip{position:relative;display:inline-flex;align-items:center;max-width:100%;min-width:0;padding:2px 8px;border-radius:6px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));color:var(--dsw-alias-label-secondary,#61666b);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px;outline:none;cursor:default}
.lmn-blame-chip-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lmn-blame-chip:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l2,rgba(0,0,0,.1))}
.lmn-blame-card{display:none;position:absolute;top:calc(100% + 6px);left:0;z-index:20;min-width:240px;max-width:360px;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));box-shadow:0 6px 24px rgba(0,0,0,.18);color:var(--dsw-alias-label-primary,CanvasText);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word;text-align:left;cursor:auto}
.lmn-blame-chip:hover .lmn-blame-card,.lmn-blame-chip:focus-within .lmn-blame-card{display:block}
.lmn-blame-card b{font-weight:600;color:var(--dsw-alias-label-secondary,#61666b);margin-right:4px}
.lmn-create{display:flex;align-items:center;gap:4px;padding:2px 6px;min-width:0}
.lmn-create input{flex:1;min-width:0;font:inherit;font-size:12px;color:inherit;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:6px;padding:2px 6px;outline:none}
.lmn-create input:focus{border-color:var(--dsw-alias-brand-primary,#0f1115)}
.lmn-indent{position:absolute;top:0;bottom:0;width:1px;background:var(--dsw-alias-border-l1,rgba(0,0,0,.07));pointer-events:none}
.lmn-seg{display:inline-flex;align-items:center;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:8px;overflow:hidden}
.lmn-seg button{font:inherit;color:var(--dsw-alias-label-secondary,#61666b);background:none;border:0;padding:3px 10px;cursor:pointer}
.lmn-seg button[aria-pressed="true"]{color:var(--dsw-alias-label-primary,CanvasText);background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.08))}
.lmn-seg button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04))}
.lmn-render{flex:1;min-height:0;overflow:auto;padding:14px 0 24px 44px;color:var(--dsw-alias-label-primary,CanvasText);font-size:13px;line-height:20px;word-break:break-word}
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
.lmn-render pre{margin:10px 0;padding:10px 12px;border-radius:8px;overflow:auto;background:var(--dsw-alias-markdown-code-block,rgba(0,0,0,.04));border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px;white-space:pre-wrap;word-break:break-word;tab-size:4}
.lmn-render pre code{background:none;border:0;padding:0;font-size:inherit}
.lmn-render code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;padding:1px 4px;border-radius:4px;background:var(--dsw-alias-markdown-inline-code,rgba(0,0,0,.06))}
.lmn-render pre[data-lang]{position:relative;padding-top:26px}
.lmn-render pre[data-lang]::before{content:attr(data-lang);position:absolute;top:6px;right:12px;font-size:10px;line-height:14px;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary,#81858c);pointer-events:none}
/* Editor syntax colours, spelled as literals on purpose. The host defines
   --dsw-static-* on <body> for its own chrome, so a var() here would resolve to
   those UI colours and never reach the fallback. These are the VS Code Light+
   values; the two dark blocks below carry the Dark+ set. */
.lmn-tok-comment{color:#008000;font-style:italic}
.lmn-tok-keyword{color:#0000FF}
.lmn-tok-type{color:#267F99}
.lmn-tok-function,.lmn-tok-builtin{color:#795E26}
.lmn-tok-string{color:#A31515}
.lmn-tok-number{color:#098658}
.lmn-tok-constant{color:#0070C1}
.lmn-tok-control{color:#AF00DB}
.lmn-tok-property{color:#0451A5}
.lmn-tok-tag{color:#800000}
.lmn-tok-variable{color:#001080}
.lmn-tok-regex{color:#811F3F}
body[data-ds-dark-theme] .lmn-tok-comment{color:#6A9955}
body[data-ds-dark-theme] .lmn-tok-keyword{color:#569CD6}
body[data-ds-dark-theme] .lmn-tok-type{color:#4EC9B0}
body[data-ds-dark-theme] .lmn-tok-function,body[data-ds-dark-theme] .lmn-tok-builtin{color:#DCDCAA}
body[data-ds-dark-theme] .lmn-tok-string{color:#CE9178}
body[data-ds-dark-theme] .lmn-tok-number{color:#B5CEA8}
body[data-ds-dark-theme] .lmn-tok-constant{color:#4FC1FF}
body[data-ds-dark-theme] .lmn-tok-control{color:#C586C0}
body[data-ds-dark-theme] .lmn-tok-property{color:#9CDCFE}
body[data-ds-dark-theme] .lmn-tok-tag{color:#569CD6}
body[data-ds-dark-theme] .lmn-tok-variable{color:#9CDCFE}
body[data-ds-dark-theme] .lmn-tok-regex{color:#D16969}
@media (prefers-color-scheme:dark){
body:not([data-ds-light-theme]) .lmn-tok-comment{color:#6A9955}
body:not([data-ds-light-theme]) .lmn-tok-keyword{color:#569CD6}
body:not([data-ds-light-theme]) .lmn-tok-type{color:#4EC9B0}
body:not([data-ds-light-theme]) .lmn-tok-function,body:not([data-ds-light-theme]) .lmn-tok-builtin{color:#DCDCAA}
body:not([data-ds-light-theme]) .lmn-tok-string{color:#CE9178}
body:not([data-ds-light-theme]) .lmn-tok-number{color:#B5CEA8}
body:not([data-ds-light-theme]) .lmn-tok-constant{color:#4FC1FF}
body:not([data-ds-light-theme]) .lmn-tok-control{color:#C586C0}
body:not([data-ds-light-theme]) .lmn-tok-property{color:#9CDCFE}
body:not([data-ds-light-theme]) .lmn-tok-tag{color:#569CD6}
body:not([data-ds-light-theme]) .lmn-tok-variable{color:#9CDCFE}
body:not([data-ds-light-theme]) .lmn-tok-regex{color:#D16969}
body:not([data-ds-light-theme]) .lmn-gutter-mark.is-added{background:#81b88b}
body:not([data-ds-light-theme]) .lmn-gutter-mark.is-modified{background:#4b91e2}
body:not([data-ds-light-theme]) .lmn-gutter-mark.is-deleted{background:#ca4b51}
}
/* Markdown structure painted in the editor mirror. These use alias tokens, so
   they follow the theme without a second dark block. */
.lmn-md-heading{color:var(--dsw-alias-label-primary,CanvasText);font-weight:600}
.lmn-md-quote{color:var(--dsw-alias-label-secondary,#61666b);font-style:italic}
.lmn-md-link{color:var(--dsw-alias-link,#1667d9)}
.lmn-md-em{font-style:italic}.lmn-md-image{max-width:100%;height:auto;border-radius:6px;margin:4px 0}.lmn-md-table{border-collapse:collapse;margin:10px 0;font-size:12px}.lmn-md-table th,.lmn-md-table td{border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));padding:4px 8px;vertical-align:top}.lmn-md-table th{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));font-weight:600}.lmn-md-list{margin:8px 0;padding-left:22px}.lmn-md-list .lmn-md-list{margin:2px 0 0}.lmn-md-task{margin:0 6px 0 0;vertical-align:-1px}.lmn-md-task-line{display:inline-flex;align-items:baseline;gap:2px}.lmn-md-task-done{opacity:.65;text-decoration:line-through}.lmn-md-callout{margin:10px 0;padding:8px 12px;border-left:3px solid var(--dsw-alias-brand-primary,#0f1115);border-radius:6px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03))}.lmn-md-callout-title{font-weight:600;margin-bottom:2px}.lmn-md-callout-body{color:var(--dsw-alias-label-secondary,#61666b)}.lmn-md-callout.is-note{border-left-color:#2f6fe0}.lmn-md-callout.is-info{border-left-color:#2f6fe0}.lmn-md-callout.is-tip{border-left-color:#2e9e5b}.lmn-md-callout.is-important{border-left-color:#8b53d6}.lmn-md-callout.is-warning{border-left-color:#c9971b}.lmn-md-callout.is-caution{border-left-color:#c9971b}.lmn-md-callout.is-danger{border-left-color:#e0424a}.lmn-md-math{max-width:100%}.lmn-md-math.is-block{display:block;margin:10px 0;overflow-x:auto;overflow-y:hidden;text-align:center}.lmn-md-math-raw{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.lmn-md-diagram{margin:10px 0;overflow-x:auto;text-align:center}.lmn-md-diagram svg{max-width:100%;height:auto}.lmn-md-diagram-source{margin:10px 0}.lmn-md-diagram-error{padding:2px 0;font-size:11px;color:var(--dsw-alias-label-secondary,#61666b)}.lmn-md-quote-block{margin:8px 0}.lmn-md-fn-ref{font-size:11px;line-height:0;margin-left:1px}.lmn-md-fn-ref a{text-decoration:none;font-weight:600}.lmn-md-footnotes{margin-top:14px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b)}.lmn-md-footnote{font-size:12px;line-height:18px}.lmn-md-footnote-back{margin-left:4px;text-decoration:none}.lmn-md-footnote-missing{color:#e0424a}
.lmn-render table{margin:10px 0;border-collapse:collapse;font-size:12px}
.lmn-render th,.lmn-render td{border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));padding:4px 8px;text-align:left;vertical-align:top}
.lmn-render th{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));font-weight:600}
 .lmn-preview{flex:1;min-height:0;display:flex;min-width:0}.lmn-outline{width:168px;flex:0 0 168px;min-height:0;overflow:auto;padding:14px 0 24px 12px;border-left:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.06));font-size:12px;line-height:18px}.lmn-outline-item{display:block;padding:2px 6px;border-radius:4px;color:var(--dsw-alias-label-secondary,#61666b);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lmn-outline-item:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));color:var(--dsw-alias-label-primary,CanvasText)}.lmn-outline-item.is-level-2{padding-left:6px}.lmn-outline-item.is-level-3{padding-left:16px}.lmn-outline-item.is-level-4{padding-left:26px}.lmn-outline-item.is-level-5{padding-left:36px}.lmn-outline-item.is-level-6{padding-left:46px}.lmn-md-toc{margin:10px 0;padding:8px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}.lmn-md-toc .lmn-outline-item{white-space:normal}.lmn-render-empty{padding:14px 0 14px 44px;color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px}
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
      ['gitBaseline', ['projectId', 'relativePath'], 'notes.GitBaseline'],
      ['gitBlame', ['projectId', 'relativePath', 'line'], 'notes.BlameEntry'],
      ['createEntry', ['projectId', 'relativePath', 'kind'], 'notes.CreatedEntry'],
      ['deleteEntry', ['projectId', 'relativePath'], 'notes.RemovedEntry'],
      ['renameEntry', ['projectId', 'fromPath', 'toPath'], 'notes.RenamedEntry'],
      ['searchNotes', ['projectId', 'query'], 'notes.SearchResults'],
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
        gitBaseline: (projectId, relativePath) =>
          call('gitBaseline', [projectId, relativePath]),
        gitBlame: (projectId, relativePath, line) => call('gitBlame', [projectId, relativePath, line]),
        createEntry: (projectId, relativePath, kind) =>
          call('createEntry', [projectId, relativePath, kind]),
        deleteEntry: (projectId, relativePath) => call('deleteEntry', [projectId, relativePath]),
        renameEntry: (projectId, fromPath, toPath) =>
          call('renameEntry', [projectId, fromPath, toPath]),
        searchNotes: (projectId, query) => call('searchNotes', [projectId, query]),
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

    /**
     * Longest-common-subsequence matches between two runs of lines.
     *
     * Only used on the middle of a file, after the unchanged head and tail have
     * been trimmed away, so the table stays small for the edits a person makes.
     * A block too large to afford the table falls back to "everything here
     * changed", which is a coarse but never wrong answer.
     */
    const LCS_CELLS = 1000000

    function lcsPairs(oldBlock, newBlock) {
      const rows = oldBlock.length
      const cols = newBlock.length
      if (rows === 0 || cols === 0) return []
      if ((rows + 1) * (cols + 1) > LCS_CELLS) return []
      const width = cols + 1
      const table = new Uint32Array((rows + 1) * width)
      for (let i = rows - 1; i >= 0; i -= 1) {
        for (let j = cols - 1; j >= 0; j -= 1) {
          table[i * width + j] =
            oldBlock[i] === newBlock[j]
              ? table[(i + 1) * width + j + 1] + 1
              : Math.max(table[(i + 1) * width + j], table[i * width + j + 1])
        }
      }
      const pairs = []
      let i = 0
      let j = 0
      while (i < rows && j < cols) {
        if (oldBlock[i] === newBlock[j]) {
          pairs.push([i, j])
          i += 1
          j += 1
        } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
          i += 1
        } else {
          j += 1
        }
      }
      return pairs
    }

    /**
     * Paint one changed region: the lines that survived an edit are untouched,
     * the first `min(removed, added)` new lines are modifications, any surplus
     * new lines are additions, and removals with nothing in their place are
     * anchored to the line above the gap — where an editor draws a deletion
     * marker, because a removed line has no row of its own in the buffer.
     */
    function markRegion(oldBlock, newBlock, offset, marks) {
      const pairs = lcsPairs(oldBlock, newBlock)
      const regions = []
      let cursorOld = 0
      let cursorNew = 0
      for (const [i, j] of pairs) {
        if (i > cursorOld || j > cursorNew) regions.push([cursorOld, i, cursorNew, j])
        cursorOld = i + 1
        cursorNew = j + 1
      }
      if (cursorOld < oldBlock.length || cursorNew < newBlock.length) {
        regions.push([cursorOld, oldBlock.length, cursorNew, newBlock.length])
      }

      for (const [oldFrom, oldTo, newFrom, newTo] of regions) {
        const removed = oldTo - oldFrom
        const addedCount = newTo - newFrom
        const paired = Math.min(removed, addedCount)
        for (let k = 0; k < paired; k += 1) marks.modified.add(offset + newFrom + k + 1)
        for (let k = paired; k < addedCount; k += 1) marks.added.add(offset + newFrom + k + 1)
        if (removed > paired) marks.deleted.add(Math.max(1, offset + newFrom))
      }
    }

    /**
     * Which lines of `buffer` differ from `before`.
     *
     * This is the gutter's only source of truth: comparing the buffer against
     * the committed text means an unsaved edit shows up the moment it is typed,
     * exactly as an editor's quick diff does, instead of waiting for a save.
     */
    function diffLineMarks(before, after) {
      const marks = { added: new Set(), modified: new Set(), deleted: new Set() }
      const oldLines = String(before ?? '').split('\n')
      const newLines = String(after ?? '').split('\n')

      // Trimming the shared head and tail keeps the quadratic part tiny: a
      // typical edit is a handful of lines in a file of thousands.
      let head = 0
      const headLimit = Math.min(oldLines.length, newLines.length)
      while (head < headLimit && oldLines[head] === newLines[head]) head += 1
      let oldEnd = oldLines.length
      let newEnd = newLines.length
      while (oldEnd > head && newEnd > head && oldLines[oldEnd - 1] === newLines[newEnd - 1]) {
        oldEnd -= 1
        newEnd -= 1
      }

      markRegion(oldLines.slice(head, oldEnd), newLines.slice(head, newEnd), head, marks)
      return marks
    }

    /** One shared "nothing changed" value, so an unchanged file never re-renders. */
    const EMPTY_MARKS = { added: new Set(), modified: new Set(), deleted: new Set() }

    /**
     * The gutter marks for one buffer.
     *
     * `before === null` means there is nothing to compare against — the file is
     * not part of the repository, or its baseline could not be read — so no
     * mark is drawn rather than calling every line new.
     */
    function lineMarks(before, after) {
      if (before === null || before === undefined) return EMPTY_MARKS
      return diffLineMarks(before, after)
    }

    // --- Markdown renderer -------------------------------------------------
    // The preview is built from React elements, never from HTML strings, so a
    // note's contents can never become markup the browser executes. The two
    // deliberate exceptions are math and diagrams: KaTeX and Mermaid emit
    // their own sanitised markup, and both are fetched on demand, so a folder
    // of plain notes never pays for them.

    const MD_FENCE = /^\s*(```|~~~)\s*([A-Za-z0-9_+#.-]*)/
    const MD_HEADING = /^(#{1,6})\s+(.*)$/
    const MD_RULE = /^\s*([-*_])(\s*\1){2,}\s*$/
    const MD_QUOTE = /^\s*>\s?(.*)$/
    const MD_BULLET = /^[-*+]\s+(.*)$/
    const MD_ORDERED = /^\d+[.)]\s+(.*)$/
    const MD_TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/
    const MD_FOOTNOTE_DEF = /^\[\^([^\]\s]+)\]:[ \t]*(.*)$/
    const MD_CALLOUT = /^\[!(NOTE|TIP|INFO|IMPORTANT|WARNING|CAUTION|DANGER)\][ \t]*(.*)$/i
    const MD_TASK = /^\[([ xX])\][ \t]+(.*)$/
    const MD_MATH_OPEN = /^\s*\$\$[ \t]*(.*)$/
    const MD_TOC = /^\s*\[toc\]\s*$/i
    const MD_INLINE = /(`[^`\n]+`)|(!\[[^\]\n]*\]\([^)\s]+\))|(\[[^\]\n]*\]\([^)\s]+\))|(\[\^[^\]\n]+\])|(\*\*[^*\n]+\*\*)|(~~[^~\n]+~~)|(\*[^*\n]+\*)|(\$[^$\n]+\$)/g

    const CALLOUT_LABEL = {
      note: '注意',
      tip: '提示',
      info: '信息',
      important: '重要',
      warning: '警告',
      caution: '当心',
      danger: '危险',
    }

    const MATH_CHUNK = './client.katex.js'
    const MERMAID_CHUNK = './client.mermaid.js'

    /** Load one package-local client chunk, or resolve null when unavailable. */
    function loadClientChunk(spec) {
      if (typeof require !== 'function' || typeof require.async !== 'function') {
        return Promise.resolve(null)
      }
      return Promise.resolve(require.async(spec)).then((loaded) => loaded ?? null, () => null)
    }

    let katexChunk = null
    let mermaidChunk = null

    /** The KaTeX module, fetched once and shared by every formula on screen. */
    function loadKatex() {
      if (katexChunk === null) katexChunk = loadClientChunk(MATH_CHUNK)
      return katexChunk
    }

    /** The Mermaid module, fetched once and shared by every diagram. */
    function loadMermaid() {
      if (mermaidChunk === null) mermaidChunk = loadClientChunk(MERMAID_CHUNK)
      return mermaidChunk
    }

    /** Whether the app is in its dark theme, for diagram colours. */
    function prefersDarkTheme() {
      try {
        const root = document?.documentElement
        if (root === undefined || root === null) return false
        const theme = String(root.dataset?.dsTheme ?? '')
        return theme === 'dark'
      } catch {
        return false
      }
    }

    /** Run one async effect and ignore the result if the node went away. */
    function useLoaded(loader) {
      const [loaded, setLoaded] = React.useState(null)
      React.useEffect(() => {
        let alive = true
        loader().then((module) => {
          if (alive && module !== null) setLoaded(module)
        })
        return () => {
          alive = false
        }
      }, [])
      return loaded
    }

    /** One formula: KaTeX typesetting, or the source until KaTeX arrives. */
    function MathSpan({ tex, display, keyName }) {
      const katex = useLoaded(loadKatex)
      const [html, setHtml] = React.useState(null)
      React.useEffect(() => {
        if (katex === null) return
        try {
          setHtml(katex.renderToString(tex, {
            displayMode: display,
            throwOnError: false,
            strict: 'ignore',
            trust: false,
            output: 'html',
          }))
        } catch {
          setHtml(null)
        }
      }, [katex, tex, display])
      if (html === null) {
        return h('code', { key: keyName, className: 'lmn-md-math-raw' },
          display ? `$$${tex}$$` : `$${tex}$`)
      }
      return h(display ? 'div' : 'span', {
        key: keyName,
        className: display ? 'lmn-md-math is-block' : 'lmn-md-math',
        dangerouslySetInnerHTML: { __html: html },
      })
    }

    /** One diagram: Mermaid renders its own SVG, and the source stays as a fallback. */
    function MermaidDiagram({ code, keyName }) {
      const mermaid = useLoaded(loadMermaid)
      const [svg, setSvg] = React.useState(null)
      const [failed, setFailed] = React.useState(false)
      React.useEffect(() => {
        if (mermaid === null) return
        let alive = true
        const id = `lmn-mermaid-${Math.random().toString(36).slice(2, 9)}`
        try {
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: prefersDarkTheme() ? 'dark' : 'default',
            fontFamily: 'inherit',
          })
          Promise.resolve(mermaid.render(id, code)).then((result) => {
            if (alive) setSvg(String(result?.svg ?? ''))
          }, () => {
            if (alive) setFailed(true)
          })
        } catch {
          setFailed(true)
        }
        return () => {
          alive = false
        }
      }, [mermaid, code])
      if (svg !== null && svg !== '') {
        return h('div', {
          key: keyName,
          className: 'lmn-md-diagram',
          dangerouslySetInnerHTML: { __html: svg },
        })
      }
      return h('div', { key: keyName, className: 'lmn-md-diagram-source' },
        h('pre', null, h('code', null, code)),
        failed ? h('div', { className: 'lmn-md-diagram-error' }, '这张图没能渲染，显示源码。') : null)
    }

    /** Keep one `$…$` from swallowing currency: `$5` and `$10` stay text. */
    function looksLikeMath(token) {
      if (token.length < 3) return false
      if (/^\$\s/.test(token) || /\s\$$/.test(token)) return false
      return true
    }

    /** Split one line of Markdown into its inline leaves. */
    function renderInline(text, keyPrefix, ctx) {
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
        } else if (token.startsWith('![')) {
          const cut = token.indexOf('](')
          out.push(h('img', {
            key,
            className: 'lmn-md-image',
            src: token.slice(cut + 2, -1),
            alt: token.slice(2, cut),
            loading: 'lazy',
          }))
        } else if (token.startsWith('[^')) {
          out.push(footnoteRef(token.slice(2, -1), key, ctx))
        } else if (token.startsWith('[')) {
          const cut = token.indexOf('](')
          out.push(
            h('a', { key, href: token.slice(cut + 2, -1), target: '_blank', rel: 'noreferrer' },
              token.slice(1, cut)),
          )
        } else if (token.startsWith('**')) {
          out.push(h('strong', { key }, token.slice(2, -2)))
        } else if (token.startsWith('~~')) {
          out.push(h('del', { key }, token.slice(2, -2)))
        } else if (token.startsWith('$')) {
          if (looksLikeMath(token)) {
            out.push(h(MathSpan, { key, keyName: key, tex: token.slice(1, -1), display: false }))
          } else {
            out.push(token)
          }
        } else {
          out.push(h('em', { key }, token.slice(1, -1)))
        }
        last = match.index + token.length
        match = MD_INLINE.exec(text)
      }
      if (last < text.length) out.push(text.slice(last))
      return out
    }

    /** One `[^name]` reference; numbering follows first use, as readers expect. */
    function footnoteRef(name, key, ctx) {
      if (ctx === null || ctx === undefined) {
        return h('sup', { key }, `[${name}]`)
      }
      let order = ctx.order.get(name)
      if (order === undefined) {
        order = ctx.order.size + 1
        ctx.order.set(name, order)
        const body = ctx.definitions.get(name)
        ctx.used.push({ name, order, body: body ?? null })
      }
      return h('sup', { key, className: 'lmn-md-fn-ref' },
        h('a', { href: `#lmn-fn-${name}`, id: `lmn-fnref-${name}` }, String(order)))
    }

    /** Split one table row into trimmed cells. */
    function tableCells(row) {
      return row
        .replace(/^\s*\|/, '')
        .replace(/\|\s*$/, '')
        .split('|')
        .map((cell) => cell.trim())
    }

    /** Read `:--`, `:-:` and `--:` into left, center and right alignment. */
    function tableAlignments(separator) {
      return tableCells(separator).map((cell) => {
        const left = cell.startsWith(':')
        const right = cell.endsWith(':')
        if (left && right) return 'center'
        if (right) return 'right'
        if (left) return 'left'
        return ''
      })
    }

    /** Leading whitespace, which is what tells a nested list from a sibling. */
    function indentWidth(line) {
      let width = 0
      for (const character of line) {
        if (character === ' ') width += 1
        else if (character === '\t') width += 4
        else break
      }
      return width
    }

    /** The bullet or number of one list item, or null when the line is not one. */
    function listItemOf(line, ordered) {
      const body = line.trimStart()
      const match = ordered ? MD_ORDERED.exec(body) : MD_BULLET.exec(body)
      if (match === null) return null
      if (!ordered && MD_ORDERED.test(body)) return null
      return { text: match[1], ordered }
    }

    // --- Code highlighting -------------------------------------------------
    // A small scanner, not a parser: it recognises comments, quoted strings,
    // numbers and bare words, and colours a bare word only when the language
    // lists it. Everything else stays literal text, so an unsupported construct
    // is shown as written instead of being dropped. Every language below is
    // optional — a fence whose language is unknown keeps the plain rendering.

    /** Turn a whitespace-separated word list into a lookup set. */
    function words(text) {
      return new Set(text.split(/\s+/).filter(Boolean))
    }

    const HL_JS = {
      kind: 'code',
      lineComment: ['//'],
      blockComment: [['/*', '*/']],
      quotes: ["'", '"', '`'],
      escapes: true,
      regex: true,
      classNames: true,
      keywords: words('as async await break case catch class const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch throw try typeof var while with yield this'),
      control: words('break case catch continue do else finally for if return throw try'),
      constants: words('true false null undefined NaN Infinity'),
      builtins: words('console window document Object Array Promise JSON Math String Number Boolean Symbol Map Set WeakMap WeakSet Date RegExp Error process require globalThis parseInt parseFloat isNaN setTimeout clearTimeout'),
      types: words('any bigint never number object string symbol unknown void'),
    }

    const HL_C = {
      kind: 'code',
      lineComment: ['//'],
      blockComment: [['/*', '*/']],
      quotes: ["'", '"'],
      escapes: true,
      directives: true,
      classNames: true,
      keywords: words('auto break case const continue default do else enum extern for goto if inline register restrict return sizeof static struct switch typedef union volatile while _Alignas _Alignof _Atomic _Generic _Noreturn _Static_assert _Thread_local'),
      control: words('break case continue default do else for goto if return switch while'),
      constants: words('NULL true false'),
      builtins: words('printf fprintf sprintf snprintf vprintf malloc calloc realloc free memcpy memset memmove memcmp strlen strcmp strncmp strcpy strncpy strcat fopen fclose fread fwrite fseek fflush fprintf perror exit abort assert'),
      types: words('bool char double float int long short signed unsigned void size_t ssize_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t uintptr_t ptrdiff_t FILE va_list'),
    }

    const HL_PYTHON = {
      kind: 'code',
      lineComment: ['#'],
      blockComment: [],
      quotes: ["'", '"'],
      triple: true,
      escapes: true,
      decorators: true,
      classNames: true,
      keywords: words('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'),
      control: words('break continue elif else except finally for if return try while with'),
      constants: words('None True False self cls'),
      builtins: words('print len range enumerate zip isinstance issubclass open sorted sum min max abs round type repr input super setattr getattr hasattr any all map filter'),
      types: words('bool bytes dict float int list set str tuple complex object'),
    }

    const HL_SHELL_KEYWORDS = words('if then else elif fi for while until do done case esac in function select return local export readonly declare shift break continue exit set unset trap source alias')
    const HL_SHELL_BUILTINS = words([
      'echo printf read cd pwd ls cat head tail grep egrep fgrep sed awk find xargs sort uniq wc cut tr tee',
      'mkdir rmdir cp mv rm ln chmod chown chgrp df du mount umount touch stat file',
      'ps kill pkill top free uname hostname date sleep test true false yes',
      'git npm pnpm yarn node npx python python3 pip pip3 curl wget tar gzip gunzip zcat ssh scp rsync',
      'systemctl journalctl service ip ifconfig ping traceroute ss netstat lsof dmesg lsmod modprobe insmod rmmod ethtool',
      'vim vi nano less more man sudo su env nohup watch export tee',
    ].join(' '))

    const HL_SPECS = {
      javascript: HL_JS,
      typescript: {
        ...HL_JS,
        keywords: words('abstract as async await class const declare default delete enum export extends from function get implements import in infer instanceof interface keyof let namespace new of override private protected public readonly satisfies set static super type typeof var void while with yield this'),
        types: words('any bigint boolean never number object string symbol unknown'),
      },
      json: {
        kind: 'code',
        lineComment: [],
        blockComment: [],
        quotes: ['"'],
        escapes: true,
        jsonKeys: true,
        keywords: words(''),
        constants: words('true false null'),
        builtins: words(''),
        types: words(''),
      },
      bash: {
        kind: 'shell',
        lineComment: ['#'],
        quotes: ["'", '"'],
        keywords: HL_SHELL_KEYWORDS,
        prefixes: words('sudo doas env time nohup exec command xargs watch'),
        constants: words('true false'),
        builtins: HL_SHELL_BUILTINS,
      },
      powershell: {
        kind: 'shell',
        lineComment: ['#'],
        quotes: ["'", '"'],
        keywords: words('begin break catch class continue data do dynamicparam else elseif end enum exit filter finally for foreach from function if in param process return switch throw trap try until using var while workflow'),
        constants: words('$true $false $null'),
        builtins: words('Write-Host Write-Output Get-ChildItem Get-Content Set-Content Remove-Item New-Item Copy-Item Move-Item Select-Object Where-Object ForEach-Object Test-Path Join-Path Split-Path Invoke-Expression'),
      },
      python: HL_PYTHON,
      go: {
        kind: 'code',
        lineComment: ['//'],
        blockComment: [['/*', '*/']],
        quotes: ['"', '`', "'"],
        escapes: true,
        keywords: words('break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var'),
        control: words('break case continue default defer else fallthrough for goto if range return select switch'),
        constants: words('nil true false iota'),
        builtins: words('append cap close copy delete len make new panic print println recover'),
        types: words('any bool byte error float32 float64 int int8 int16 int32 int64 rune string uint uint8 uint16 uint32 uint64 uintptr complex64 complex128'),
      },
      rust: {
        kind: 'code',
        lineComment: ['//'],
        blockComment: [['/*', '*/']],
        quotes: ['"', "'"],
        escapes: true,
        classNames: true,
        keywords: words('as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub ref return self static struct super trait type unsafe use where while'),
        control: words('break continue else for if loop match return while'),
        constants: words('true false None Some Ok Err'),
        builtins: words('assert assert_eq format panic print println vec write writeln'),
        types: words('bool char f32 f64 i8 i16 i32 i64 i128 isize str u8 u16 u32 u64 u128 usize String Vec Option Result Box HashMap'),
      },
      c: HL_C,
      cpp: {
        ...HL_C,
        keywords: words('alignas alignof and asm auto break case catch class const constexpr const_cast continue decltype default delete do dynamic_cast else enum explicit export extern false for friend goto if inline mutable namespace new noexcept nullptr operator or private protected public register reinterpret_cast return sizeof static static_cast struct switch template this throw true try typedef typeid typename union using virtual volatile while'),
        builtins: words('printf fprintf sprintf snprintf cout cin cerr endl std string vector map unordered_map set pair make_pair malloc free memcpy memset strlen strcmp sort push_back size empty'),
        types: words('bool char double float int long short signed unsigned void size_t ssize_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t uintptr_t ptrdiff_t FILE va_list string vector map unordered_map set pair unique_ptr shared_ptr'),
      },
      java: {
        kind: 'code',
        lineComment: ['//'],
        blockComment: [['/*', '*/']],
        quotes: ["'", '"'],
        escapes: true,
        classNames: true,
        keywords: words('abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while record sealed permits var'),
        control: words('break case catch continue default do else finally for if return switch throw try while'),
        constants: words('true false null'),
        builtins: words('System out println print String Integer Long Double Boolean Math List ArrayList Map HashMap Set HashSet Objects Optional Stream'),
        types: words('boolean byte char double float int long short void String Object Integer Long Double Boolean List ArrayList Map HashMap Set HashSet'),
      },
      sql: {
        kind: 'code',
        lineComment: ['--'],
        blockComment: [['/*', '*/']],
        quotes: ["'", '"'],
        escapes: false,
        fold: true,
        keywords: words('add all alter and as asc by case create default delete desc distinct drop else end exists foreign from full group having in index inner insert into is join key left like limit not null offset on or order outer primary references right select set table then union unique update values view when where with'),
        control: words(''),
        constants: words('true false null'),
        builtins: words('count sum avg min max coalesce cast now date_trunc extract'),
        types: words('bigint boolean date decimal double float int integer json numeric real smallint text timestamp varchar'),
      },
      yaml: { kind: 'yaml' },
      css: { kind: 'css' },
      html: { kind: 'markup' },
      xml: { kind: 'markup' },
      ini: { kind: 'ini' },
      dockerfile: {
        kind: 'shell',
        lineComment: ['#'],
        quotes: ["'", '"'],
        instructions: words('FROM RUN CMD LABEL MAINTAINER EXPOSE ENV ADD COPY ENTRYPOINT VOLUME USER WORKDIR ARG ONBUILD STOPSIGNAL HEALTHCHECK SHELL'),
        keywords: HL_SHELL_KEYWORDS,
        prefixes: words('sudo env exec'),
        constants: words('true false'),
        builtins: HL_SHELL_BUILTINS,
      },
    }

    const HL_ALIASES = {
      js: 'javascript',
      jsx: 'javascript',
      mjs: 'javascript',
      cjs: 'javascript',
      node: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      sh: 'bash',
      shell: 'bash',
      zsh: 'bash',
      ksh: 'bash',
      fish: 'bash',
      console: 'bash',
      ps1: 'powershell',
      pwsh: 'powershell',
      ps: 'powershell',
      py: 'python',
      python3: 'python',
      golang: 'go',
      rs: 'rust',
      cpp: 'cpp',
      'c++': 'cpp',
      cc: 'cpp',
      cxx: 'cpp',
      hpp: 'cpp',
      hh: 'cpp',
      h: 'c',
      java: 'java',
      yml: 'yaml',
      jsonc: 'json',
      postgres: 'sql',
      postgresql: 'sql',
      mysql: 'sql',
      html5: 'html',
      htm: 'html',
      svg: 'xml',
      xhtml: 'xml',
      scss: 'css',
      less: 'css',
      toml: 'ini',
      conf: 'ini',
      cfg: 'ini',
      docker: 'dockerfile',
      'docker-compose': 'yaml',
    }

    /** Languages whose fence means "leave this alone", not "guess at it". */
    const HL_PLAIN = words('text txt plain plaintext log logs output none raw')

    // Both patterns are sticky by `lastIndex`, so they carry the global flag:
    // without it `exec` rescans from 0 and only ever matches the first word.
    const HL_NUMBER = /(?:0[xXbBoO][0-9a-fA-F_]+|\d[\d_]*(?:\.[\d_]+)?(?:[eE][+-]?\d+)?)/g
    const HL_WORD = /[A-Za-z_$][\w$]*/g

    /**
     * Walk one code block and classify what it finds.
     *
     * Returns a list of strings (literal text) and `{className, text}` records;
     * concatenating every part reproduces the input exactly.
     */
    /** Collect literal text and coloured tokens, preserving every character. */
    function codeEmitter() {
      const parts = []
      let plain = ''
      const flush = () => {
        if (plain !== '') {
          parts.push(plain)
          plain = ''
        }
      }
      return {
        text(value) {
          if (value !== '') plain += value
        },
        token(className, value) {
          if (value === '') return
          flush()
          parts.push({ className, text: value })
        },
        done() {
          flush()
          return parts
        },
      }
    }

    /** End index of the shell variable starting at `start`, or null. */
    function readShellVariable(code, start) {
      const length = code.length
      let index = start + 1
      if (index >= length) return null
      const char = code[index]
      if (char === '{' || char === '(') {
        const close = char === '{' ? '}' : ')'
        let depth = 1
        index += 1
        while (index < length && depth > 0) {
          if (code[index] === '\\') {
            index += 2
            continue
          }
          if (code[index] === char) depth += 1
          else if (code[index] === close) depth -= 1
          index += 1
        }
        return depth === 0 ? index : null
      }
      if (/[A-Za-z_]/.test(char)) {
        while (index < length && /[A-Za-z0-9_]/.test(code[index])) index += 1
        return index
      }
      if (/[0-9@*#?$!-]/.test(char)) return index + 1
      return null
    }

    /** Pick the scanner for one spec. */
    function tokenizeCode(code, spec) {
      if (spec.kind === 'shell') return tokenizeShell(code, spec)
      if (spec.kind === 'yaml') return tokenizeYaml(code)
      if (spec.kind === 'css') return tokenizeCss(code)
      if (spec.kind === 'markup') return tokenizeMarkup(code)
      if (spec.kind === 'ini') return tokenizeIni(code)
      return tokenizeGeneric(code, spec)
    }

    /** C family, Python, Go, Rust and friends: comments, strings, words. */
    function tokenizeGeneric(code, spec) {
      const out = codeEmitter()
      const length = code.length
      const regexAllowedBefore = /[([{,;:=!&|?+\-*%^~<>]/
      const regexAllowedWords = new Set([
        'return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'new', 'do', 'else', 'yield', 'await',
      ])
      let index = 0
      let lineStart = true

      const previousSignificant = (from) => {
        let cursor = from - 1
        while (cursor >= 0 && (code[cursor] === ' ' || code[cursor] === '\t')) cursor -= 1
        return cursor
      }
      const previousWord = (from) => {
        let cursor = from - 1
        while (cursor >= 0 && (code[cursor] === ' ' || code[cursor] === '\t')) cursor -= 1
        const end = cursor + 1
        while (cursor >= 0 && /[\w$]/.test(code[cursor])) cursor -= 1
        return code.slice(cursor + 1, end)
      }

      while (index < length) {
        const char = code[index]

        if (char === '\n') {
          out.text(char)
          index += 1
          lineStart = true
          continue
        }

        if (lineStart && spec.directives === true && char === '#') {
          const directive = /^#\s*[A-Za-z_]\w*/.exec(code.slice(index))
          if (directive !== null) {
            out.token('keyword', directive[0])
            index += directive[0].length
            if (/^#\s*(?:include|import)/.test(directive[0])) {
              while (index < length && (code[index] === ' ' || code[index] === '\t')) {
                out.text(code[index])
                index += 1
              }
              if (code[index] === '<') {
                const close = code.indexOf('>', index)
                if (close !== -1) {
                  out.token('string', code.slice(index, close + 1))
                  index = close + 1
                }
              }
            }
            lineStart = false
            continue
          }
        }

        const mark = spec.lineComment.find((candidate) => code.startsWith(candidate, index))
        if (
          mark !== undefined &&
          (mark !== '#' ||
            spec.directives === true ||
            index === 0 ||
            /\s|[([{,:;=]/.test(code[index - 1]))
        ) {
          const stop = code.indexOf('\n', index)
          const end = stop === -1 ? length : stop
          out.token('comment', code.slice(index, end))
          index = end
          continue
        }

        const block = spec.blockComment.find((pair) => code.startsWith(pair[0], index))
        if (block !== undefined) {
          const close = code.indexOf(block[1], index + block[0].length)
          const end = close === -1 ? length : close + block[1].length
          out.token('comment', code.slice(index, end))
          index = end
          continue
        }

        if (spec.decorators === true && char === '@') {
          const decorator = /^@[\w.]+/.exec(code.slice(index))
          if (decorator !== null) {
            out.token('function', decorator[0])
            index += decorator[0].length
            lineStart = false
            continue
          }
        }

        if (spec.regex === true && char === '/') {
          const before = previousSignificant(index)
          const beforeChar = before >= 0 ? code[before] : ''
          const beforeWord = previousWord(index)
          const allowed =
            before < 0 || regexAllowedBefore.test(beforeChar) || regexAllowedWords.has(beforeWord)
          if (allowed) {
            let cursor = index + 1
            let inClass = false
            let closed = false
            while (cursor < length) {
              const inner = code[cursor]
              if (inner === '\\') {
                cursor += 2
                continue
              }
              if (inner === '\n') break
              if (inClass) {
                if (inner === ']') inClass = false
                cursor += 1
                continue
              }
              if (inner === '[') {
                inClass = true
                cursor += 1
                continue
              }
              if (inner === '/') {
                cursor += 1
                closed = true
                break
              }
              cursor += 1
            }
            if (closed) {
              while (cursor < length && /[a-z]/.test(code[cursor])) cursor += 1
              out.token('regex', code.slice(index, cursor))
              index = cursor
              lineStart = false
              continue
            }
          }
        }

        if (spec.quotes.includes(char)) {
          const triple = spec.triple === true && code.startsWith(char + char + char, index)
          const quote = triple ? char + char + char : char
          let cursor = index + quote.length
          let closed = false
          while (cursor < length) {
            if (spec.escapes === true && code[cursor] === '\\') {
              cursor += 2
              continue
            }
            if (triple ? code.startsWith(quote, cursor) : code[cursor] === char) {
              cursor += quote.length
              closed = true
              break
            }
            if (triple !== true && code[cursor] === '\n' && char !== '`') break
            cursor += 1
          }
          if (!closed) {
            // An unterminated quote is punctuation, not the start of a string;
            // emitting it as text keeps the rest of the block intact.
            out.text(char)
            index += 1
            lineStart = false
            continue
          }
          let className = 'string'
          if (spec.jsonKeys === true) {
            let after = cursor
            while (after < length && (code[after] === ' ' || code[after] === '\t')) after += 1
            if (code[after] === ':') className = 'property'
          }
          out.token(className, code.slice(index, cursor))
          index = cursor
          lineStart = false
          continue
        }

        HL_NUMBER.lastIndex = index
        const digits = HL_NUMBER.exec(code)
        if (digits !== null && digits.index === index) {
          out.token('number', digits[0])
          index += digits[0].length
          lineStart = false
          continue
        }

        HL_WORD.lastIndex = index
        const word = HL_WORD.exec(code)
        if (word !== null && word.index === index) {
          const text = word[0]
          const looked = spec.fold === true ? text.toLowerCase() : text
          let cursor = index + text.length
          while (cursor < length && (code[cursor] === ' ' || code[cursor] === '\t')) cursor += 1
          let className = null
          if (spec.control !== undefined && spec.control.has(looked)) className = 'control'
          else if (spec.keywords.has(looked)) className = 'keyword'
          else if (spec.constants !== undefined && spec.constants.has(looked)) className = 'constant'
          else if (spec.builtins !== undefined && spec.builtins.has(looked)) className = 'builtin'
          else if (spec.types !== undefined && spec.types.has(looked)) className = 'type'
          else if (spec.props !== undefined && spec.props.has(looked)) className = 'property'
          else if (
            spec.classNames === true &&
            /^[A-Z][A-Za-z0-9_]*$/.test(text) &&
            /^[A-Z0-9_]+$/.test(text) === false
          ) {
            className = 'type'
          } else if (code[cursor] === '(') {
            className = 'function'
          }
          if (className === null) out.text(text)
          else out.token(className, text)
          index += text.length
          lineStart = false
          continue
        }

        out.text(char)
        lineStart = lineStart && (char === ' ' || char === '\t')
        index += 1
      }

      return out.done()
    }

    const HL_SHELL_WORD_STOP = /[\s|;&<>()"'`$=\\]/

    /** Bash and friends: the command position decides what a word means. */
    function tokenizeShell(code, spec) {
      const out = codeEmitter()
      const length = code.length
      const storesCommand = new Set(['if', 'then', 'else', 'elif', 'for', 'while', 'until', 'do', 'case', 'in', 'select'])
      let index = 0
      let expectCommand = true

      while (index < length) {
        const char = code[index]

        if (char === '\n') {
          out.text(char)
          index += 1
          expectCommand = true
          continue
        }
        if (char === ' ' || char === '\t') {
          out.text(char)
          index += 1
          continue
        }
        if (char === '\\') {
          if (code[index + 1] === '\n') {
            out.text('\\\n')
            index += 2
            continue
          }
          out.text(code.slice(index, index + 2))
          index += 2
          continue
        }
        if (char === '#' && (index === 0 || /[\s;|&(]/.test(code[index - 1]))) {
          const stop = code.indexOf('\n', index)
          const end = stop === -1 ? length : stop
          out.token('comment', code.slice(index, end))
          index = end
          continue
        }
        if (char === "'" || char === '"') {
          let cursor = index + 1
          let closed = false
          while (cursor < length) {
            if (char === '"' && code[cursor] === '\\') {
              cursor += 2
              continue
            }
            if (code[cursor] === char) {
              cursor += 1
              closed = true
              break
            }
            if (code[cursor] === '\n') break
            cursor += 1
          }
          if (!closed) {
            out.text(char)
            index += 1
            continue
          }
          out.token('string', code.slice(index, cursor))
          index = cursor
          expectCommand = false
          continue
        }
        if (char === '`') {
          let cursor = index + 1
          let closed = false
          while (cursor < length) {
            if (code[cursor] === '\\') {
              cursor += 2
              continue
            }
            if (code[cursor] === '`') {
              cursor += 1
              closed = true
              break
            }
            cursor += 1
          }
          if (!closed) {
            out.text(char)
            index += 1
            continue
          }
          out.token('string', code.slice(index, cursor))
          index = cursor
          continue
        }
        if (char === '$') {
          const end = readShellVariable(code, index)
          if (end !== null) {
            out.token('variable', code.slice(index, end))
            index = end
            continue
          }
          out.text(char)
          index += 1
          continue
        }
        if (char === '|') {
          if (code[index + 1] === '|') {
            out.text('||')
            index += 2
          } else {
            out.text('|')
            index += 1
          }
          expectCommand = true
          continue
        }
        if (char === '&' && code[index + 1] === '&') {
          out.text('&&')
          index += 2
          expectCommand = true
          continue
        }
        if (char === ';') {
          out.text(';')
          index += 1
          expectCommand = true
          continue
        }
        if (char === '(' || char === ')') {
          out.text(char)
          index += 1
          if (char === '(') expectCommand = true
          continue
        }
        if (char === '=' || char === '<' || char === '>') {
          out.text(char)
          index += 1
          continue
        }

        let cursor = index
        while (cursor < length && HL_SHELL_WORD_STOP.test(code[cursor]) === false) cursor += 1
        if (cursor === index) {
          out.text(char)
          index += 1
          continue
        }
        const word = code.slice(index, cursor)
        index = cursor
        const lower = spec.fold === true ? word.toLowerCase() : word
        const atCommand = expectCommand
        const assignment = code[index] === '=' && /^[A-Za-z_]\w*$/.test(word)

        if (spec.instructions !== undefined && spec.instructions.has(word.toUpperCase())) {
          out.token('keyword', word)
          expectCommand = true
          continue
        }
        if (word.startsWith('-') && word.length > 1) {
          out.token('constant', word)
          expectCommand = false
          continue
        }
        if (assignment) {
          out.token('property', word)
          continue
        }
        if (/^[\d.]+$/.test(word)) {
          out.token('number', word)
          expectCommand = false
          continue
        }
        if (spec.keywords.has(lower)) {
          out.token('keyword', word)
          expectCommand = storesCommand.has(lower)
          continue
        }
        if (spec.constants !== undefined && spec.constants.has(lower)) {
          out.token('constant', word)
          expectCommand = false
          continue
        }
        if (atCommand && spec.prefixes !== undefined && spec.prefixes.has(lower)) {
          out.token('builtin', word)
          continue
        }
        if (atCommand) {
          if (spec.builtins !== undefined && spec.builtins.has(lower)) out.token('builtin', word)
          else out.token('function', word)
          expectCommand = false
          continue
        }
        if (word.includes('/')) {
          out.token('type', word)
          continue
        }
        if (spec.builtins !== undefined && spec.builtins.has(lower)) {
          out.token('builtin', word)
          continue
        }
        out.text(word)
      }

      return out.done()
    }

    /** YAML: keys, plain scalars, anchors and comments, one line at a time. */
    function tokenizeYaml(code) {
      const out = codeEmitter()
      const lines = code.split('\n')
      for (let index = 0; index < lines.length; index += 1) {
        if (index > 0) out.text('\n')
        paintYamlLine(lines[index], out)
      }
      return out.done()
    }

    function paintYamlLine(line, out) {
      const indent = /^[ \t]*/.exec(line)[0]
      out.text(indent)
      let rest = line.slice(indent.length)
      if (rest === '') return

      if (rest[0] === '#') {
        out.token('comment', rest)
        return
      }
      if (/^(?:---|\.\.\.)\s*$/.test(rest)) {
        out.token('comment', rest)
        return
      }
      if (/^-(\s|$)/.test(rest)) {
        out.token('keyword', '-')
        rest = rest.slice(1)
        if (rest[0] === ' ') {
          out.text(' ')
          rest = rest.slice(1)
        }
        if (rest === '') return
        if (rest[0] === '#') {
          out.token('comment', rest)
          return
        }
      }

      const pair = /^([^\s#:][^:#]*?)([ \t]*)(:)(?=[ \t]|$)/.exec(rest)
      if (pair !== null) {
        out.token('property', pair[1])
        out.text(pair[2] + ':')
        paintYamlValue(rest.slice(pair[0].length), out)
        return
      }
      paintYamlValue(rest, out)
    }

    function paintYamlValue(text, out) {
      let index = 0
      while (index < text.length) {
        const char = text[index]
        if (char === '#' && (index === 0 || /[ \t]/.test(text[index - 1]))) {
          out.token('comment', text.slice(index))
          return
        }
        if (char === '"' || char === "'") {
          let cursor = index + 1
          let closed = false
          while (cursor < text.length) {
            if (char === '"' && text[cursor] === '\\') {
              cursor += 2
              continue
            }
            if (text[cursor] === char) {
              if (char === "'" && text[cursor + 1] === "'") {
                cursor += 2
                continue
              }
              cursor += 1
              closed = true
              break
            }
            cursor += 1
          }
          if (closed) {
            out.token('string', text.slice(index, cursor))
            index = cursor
            continue
          }
          out.text(char)
          index += 1
          continue
        }
        if (char === '&' || char === '*') {
          const name = /^[&*][\w-]+/.exec(text.slice(index))
          if (name !== null && (index === 0 || /[ \t]/.test(text[index - 1]))) {
            out.token('type', name[0])
            index += name[0].length
            continue
          }
          out.text(char)
          index += 1
          continue
        }
        if ((char === '|' || char === '>') && /^[ \t]*$/.test(text.slice(index + 1))) {
          out.token('keyword', char)
          index += 1
          continue
        }
        if (char === '~') {
          out.token('constant', char)
          index += 1
          continue
        }
        if (/[A-Za-z_]/.test(char)) {
          let cursor = index
          while (cursor < text.length && /[\w.-]/.test(text[cursor])) cursor += 1
          const word = text.slice(index, cursor)
          const lower = word.toLowerCase()
          if (['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(lower)) out.token('constant', word)
          else out.text(word)
          index = cursor
          continue
        }
        if (/\d/.test(char)) {
          const number = /^\d[\d.:+-]*/.exec(text.slice(index))
          if (number !== null) {
            out.token('number', number[0])
            index += number[0].length
            continue
          }
        }
        out.text(char)
        index += 1
      }
    }

    /** CSS: selectors versus declarations, decided by the next `{` or `;`. */
    function tokenizeCss(code) {
      const out = codeEmitter()
      const length = code.length
      let index = 0

      const statementHitsBrace = (from) => {
        for (let cursor = from; cursor < length; cursor += 1) {
          const char = code[cursor]
          if (char === '{') return true
          if (char === ';' || char === '}' || char === ')' || char === ',') return false
        }
        return false
      }
      const propertyAhead = (from) => {
        let cursor = from
        while (cursor < length && (code[cursor] === ' ' || code[cursor] === '\t')) cursor += 1
        return code[cursor] === ':' && code[cursor + 1] !== ':'
      }

      while (index < length) {
        const char = code[index]
        if (char === '\n') {
          out.text(char)
          index += 1
          continue
        }
        if (code.startsWith('/*', index)) {
          const close = code.indexOf('*/', index + 2)
          const end = close === -1 ? length : close + 2
          out.token('comment', code.slice(index, end))
          index = end
          continue
        }
        if (char === '"' || char === "'") {
          let cursor = index + 1
          let closed = false
          while (cursor < length) {
            if (code[cursor] === '\\') {
              cursor += 2
              continue
            }
            if (code[cursor] === char) {
              cursor += 1
              closed = true
              break
            }
            if (code[cursor] === '\n') break
            cursor += 1
          }
          if (closed) {
            out.token('string', code.slice(index, cursor))
            index = cursor
            continue
          }
          out.text(char)
          index += 1
          continue
        }
        if (char === '@') {
          const at = /^@[\w-]+/.exec(code.slice(index))
          if (at !== null) {
            out.token('keyword', at[0])
            index += at[0].length
            continue
          }
        }
        if (char === '!') {
          const important = /^!\s*important/.exec(code.slice(index))
          if (important !== null) {
            out.token('keyword', important[0])
            index += important[0].length
            continue
          }
        }
        if (char === '#' && /^#[0-9a-fA-F]{3,8}(?![\w-])/.test(code.slice(index))) {
          const hex = /^#[0-9a-fA-F]{3,8}/.exec(code.slice(index))[0]
          out.token('number', hex)
          index += hex.length
          continue
        }
        if (char === '-' && code[index + 1] === '-') {
          const custom = /^--[\w-]+/.exec(code.slice(index))
          if (custom !== null) {
            out.token('property', custom[0])
            index += custom[0].length
            continue
          }
        }
        if (/[A-Za-z_]/.test(char) || (char === '-' && /[A-Za-z_]/.test(code[index + 1] ?? ''))) {
          const word = /^-?[A-Za-z_][\w-]*/.exec(code.slice(index))[0]
          const end = index + word.length
          const previous = index === 0 ? '' : code[index - 1]
          if (previous === '.' || previous === '#') out.token('tag', word)
          else if (statementHitsBrace(end)) out.token('tag', word)
          else if (propertyAhead(end)) out.token('property', word)
          else if (code[end] === '(') out.token('function', word)
          else out.text(word)
          index = end
          continue
        }
        if (/\d/.test(char)) {
          const number = /^\d+\.?\d*(?:%|[A-Za-z]+)?/.exec(code.slice(index))
          if (number !== null) {
            out.token('number', number[0])
            index += number[0].length
            continue
          }
        }
        out.text(char)
        index += 1
      }

      return out.done()
    }

    /** HTML/XML: tags, attributes and entities. */
    function tokenizeMarkup(code) {
      const out = codeEmitter()
      const length = code.length
      let index = 0
      let inTag = false

      while (index < length) {
        const char = code[index]
        if (code.startsWith('<!--', index)) {
          const close = code.indexOf('-->', index + 4)
          const end = close === -1 ? length : close + 3
          out.token('comment', code.slice(index, end))
          index = end
          continue
        }
        if (code.startsWith('<![CDATA[', index)) {
          const close = code.indexOf(']]>', index + 9)
          const end = close === -1 ? length : close + 3
          out.token('comment', code.slice(index, end))
          index = end
          continue
        }
        if (char === '<') {
          const declaration = /^<![A-Za-z]/.exec(code.slice(index))
          if (declaration !== null) {
            const close = code.indexOf('>', index)
            const end = close === -1 ? length : close + 1
            out.token('comment', code.slice(index, end))
            index = end
            continue
          }
          const opener = /^<\/?/.exec(code.slice(index))
          const name = /^[A-Za-z][\w:.-]*/.exec(code.slice(index + (opener === null ? 0 : opener[0].length)))
          if (opener !== null && name !== null) {
            out.text(opener[0])
            index += opener[0].length
            out.token('tag', name[0])
            index += name[0].length
            inTag = true
            continue
          }
          out.text(char)
          index += 1
          continue
        }
        if (inTag) {
          if (char === '>') {
            out.text('>')
            index += 1
            inTag = false
            continue
          }
          if (char === '/' && code[index + 1] === '>') {
            out.text('/>')
            index += 2
            inTag = false
            continue
          }
          if (char === '"' || char === "'") {
            let cursor = index + 1
            let closed = false
            while (cursor < length) {
              if (code[cursor] === char) {
                cursor += 1
                closed = true
                break
              }
              cursor += 1
            }
            if (closed) {
              out.token('string', code.slice(index, cursor))
              index = cursor
              continue
            }
          }
          if (/[A-Za-z_:]/.test(char)) {
            const name = /^[A-Za-z_:][\w:.-]*/.exec(code.slice(index))[0]
            out.token('property', name)
            index += name.length
            continue
          }
          out.text(char)
          index += 1
          continue
        }
        if (char === '&') {
          const entity = /^&[#\w]+;/.exec(code.slice(index))
          if (entity !== null) {
            out.token('constant', entity[0])
            index += entity[0].length
            continue
          }
        }
        out.text(char)
        index += 1
      }

      return out.done()
    }

    /** INI/TOML: sections, keys and simple values. */
    function tokenizeIni(code) {
      const out = codeEmitter()
      const lines = code.split('\n')
      for (let index = 0; index < lines.length; index += 1) {
        if (index > 0) out.text('\n')
        const line = lines[index]
        const indent = /^[ \t]*/.exec(line)[0]
        out.text(indent)
        const rest = line.slice(indent.length)
        if (rest === '') continue
        if (rest[0] === '#' || rest[0] === ';') {
          out.token('comment', rest)
          continue
        }
        const section = /^\[[^\]]*\]/.exec(rest)
        if (section !== null) {
          out.token('tag', section[0])
          out.text(rest.slice(section[0].length))
          continue
        }
        const pair = /^([^=:\s][^=:]*?)([ \t]*)([=:])(?=[ \t]|$)/.exec(rest)
        if (pair !== null) {
          out.token('property', pair[1])
          out.text(pair[2] + pair[3])
          paintIniValue(rest.slice(pair[0].length), out)
          continue
        }
        paintIniValue(rest, out)
      }
      return out.done()
    }

    function paintIniValue(text, out) {
      let index = 0
      while (index < text.length) {
        const char = text[index]
        if ((char === '#' || char === ';') && (index === 0 || /[ \t]/.test(text[index - 1]))) {
          out.token('comment', text.slice(index))
          return
        }
        if (char === '"' || char === "'") {
          let cursor = index + 1
          let closed = false
          while (cursor < text.length) {
            if (text[cursor] === '\\') {
              cursor += 2
              continue
            }
            if (text[cursor] === char) {
              cursor += 1
              closed = true
              break
            }
            cursor += 1
          }
          if (closed) {
            out.token('string', text.slice(index, cursor))
            index = cursor
            continue
          }
          out.text(char)
          index += 1
          continue
        }
        if (/[A-Za-z_]/.test(char)) {
          let cursor = index
          while (cursor < text.length && /[\w.-]/.test(text[cursor])) cursor += 1
          const word = text.slice(index, cursor)
          if (['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(word.toLowerCase())) {
            out.token('constant', word)
          } else out.text(word)
          index = cursor
          continue
        }
        if (/\d/.test(char)) {
          const number = /^\d[\d.:+-]*/.exec(text.slice(index))
          if (number !== null) {
            out.token('number', number[0])
            index += number[0].length
            continue
          }
        }
        out.text(char)
        index += 1
      }
    }

    /** Best guess for an unlabelled fence; null when nothing recognisable. */
    function detectLanguage(code) {
      const sample = String(code ?? '').trim()
      if (sample === '') return null
      if (/^<(!doctype|html|\?xml|svg)\b/i.test(sample)) return 'xml'
      if (/^#!.*\bpython/.test(sample)) return 'python'
      if (/^#!\s*\S*\/(?:env\s+)?(?:ba|z|k|fi)?sh\b/.test(sample)) return 'bash'
      if (/^#!.*\bnode\b/.test(sample)) return 'javascript'
      if (/(^|\n)\s*FROM\s+\S/.test(sample) && /(^|\n)\s*(RUN|COPY|ADD|CMD|ENTRYPOINT|WORKDIR)\s/.test(sample)) {
        return 'dockerfile'
      }
      if (/^\s*[{[]/.test(sample)) {
        try {
          JSON.parse(sample)
          return 'json'
        } catch {
          // not JSON after all
        }
      }
      if (/(^|\n)\s*(SELECT|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE)\b/i.test(sample)) {
        return 'sql'
      }
      if (/(^|\n)\s*(package\s+\w+|func\s+\w+\s*\(|type\s+\w+\s+struct)\b/.test(sample)) return 'go'
      if (/(^|\n)\s*(def\s+\w+\s*\(|class\s+\w+|from\s+[\w.]+\s+import\s|import\s+[\w.]+\s*$)/.test(sample)) {
        return 'python'
      }
      if (/(^|\n)#include\s*[<"]/.test(sample)) return 'c'
      if (/(^|\n)\s*(public\s+)?(class|interface)\s+\w+/.test(sample)) return 'java'
      if (/(^|\n)\s*(fn\s+\w+|let\s+mut\s+|pub\s+fn\s+|use\s+[\w:]+;)/.test(sample)) return 'rust'
      if (/(^|\n)\s*(function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|=>|export\s+(default\s+)?(function|const|class))/.test(sample)) {
        return 'javascript'
      }
      if (/(^|\n)\s*[\w.-]+\s*:\s+\S/.test(sample) && /(^|\n)\s*-\s+\S/.test(sample)) return 'yaml'
      if (/(^|\n)\s*(int|void|char|float|double|unsigned|static|struct)\s+\w+\s*\(/.test(sample)) return 'c'
      if (/(^|\n)\s*[.#@]?[\w-]+\s*\{[^}]*[\w-]+\s*:/.test(sample)) return 'css'
      return null
    }

    /** Parts for one code string, or null when the language is not painted. */
    function codeParts(code, language) {
      const key = String(language ?? '').trim().toLowerCase()
      if (HL_PLAIN.has(key)) return null
      let spec = HL_SPECS[HL_ALIASES[key] ?? key]
      if (spec === undefined) {
        const guess = detectLanguage(code)
        if (guess !== null) spec = HL_SPECS[guess]
      }
      if (spec === undefined) return null
      return tokenizeCode(code, spec)
    }

    /**
     * Render one fenced block body, highlighted when the language is known.
     *
     * The result is a React child list, never markup, exactly like the rest of
     * the preview.
     */
    function highlightCode(code, language) {
      const parts = codeParts(code, language)
      if (parts === null) return code
      let counter = 0
      let coloured = false
      const children = parts.map((part) => {
        if (typeof part === 'string') return part
        coloured = true
        const node = h('span', { key: `h${counter}`, className: `lmn-tok-${part.className}` }, part.text)
        counter += 1
        return node
      })
      return coloured ? children : code
    }

    /**
     * Split highlighted parts back onto their source lines.
     *
     * The editor needs the same colours as the preview, but its mirror layer is
     * one element per line, so a token that spans a newline becomes one span
     * per line. Rendered text still matches `lines` exactly.
     */
    function paintCodeLines(lines, language) {
      const parts = codeParts(lines.join('\n'), language)
      if (parts === null) return lines.map((line) => line)
      const perLine = lines.map(() => [])
      let line = 0
      let counter = 0
      for (const part of parts) {
        const text = typeof part === 'string' ? part : part.text
        const className = typeof part === 'string' ? null : part.className
        const pieces = text.split('\n')
        for (let piece = 0; piece < pieces.length; piece += 1) {
          if (piece > 0) line += 1
          if (pieces[piece] === '') continue
          const target = perLine[Math.min(line, perLine.length - 1)]
          if (className === null) target.push(pieces[piece])
          else {
            target.push(
              h(
                'span',
                { key: `c${line}:${counter}`, className: `lmn-tok-${className}` },
                pieces[piece],
              ),
            )
            counter += 1
          }
        }
      }
      return perLine.map((children) => (children.length === 1 ? children[0] : children))
    }

    // --- Edit-time highlighting ---------------------------------------------
    // The editor paints colour with a mirrored layer under a transparent
    // textarea, so every element here must reproduce its source line character
    // for character: only span wrappers may be added, never text. A dropped or
    // doubled character would slide the painted glyphs out from under the
    // caret.

    /** Highlight the inline spans of one Markdown line, keeping every marker. */
    function colorizeInline(text, keyPrefix) {
      const out = []
      let last = 0
      let counter = 0
      MD_INLINE.lastIndex = 0
      let match = MD_INLINE.exec(text)
      while (match !== null) {
        if (match.index > last) out.push(text.slice(last, match.index))
        const token = match[0]
        const className = token.startsWith('`')
          ? 'lmn-tok-string'
          : token.startsWith('**')
            ? 'lmn-tok-function'
            : token.startsWith('[')
              ? 'lmn-md-link'
              : 'lmn-md-em'
        out.push(h('span', { key: `${keyPrefix}:${counter}`, className }, token))
        counter += 1
        last = match.index + token.length
        match = MD_INLINE.exec(text)
      }
      if (last < text.length) out.push(text.slice(last))
      return out
    }

    const MD_EDIT_HEADING = /^([ \t]*)(#{1,6})([ \t]+)(.*)$/
    const MD_EDIT_BULLET = /^([ \t]*)([-*+]|\d+[.)])([ \t]+)(.*)$/
    const MD_EDIT_QUOTE = /^([ \t]*)(>)([ \t]?)(.*)$/

    /**
     * A command cheatsheet is a Markdown file whose lines are shell commands
     * with no fence around them. None of those lines is a Markdown construct,
     * so the structural painter would leave them as plain text; when most of
     * the document reads that way, its lines are painted as commands instead.
     */
    const RX_COMMAND_LINE = /^[ \t]*([A-Za-z0-9][\w.+-]*)[ \t]+\S/
    const RX_COMMAND_LEAD = /^([ \t]*)([A-Za-z0-9][\w.+-]*)([\s\S]*)$/
    const RX_COMMAND_NAME = /^[a-z][a-z0-9.+-]*$/
    const RX_COMMAND_CONTINUATION = /^[ \t]+(?:'|"|--?[A-Za-z]|\S+=)/
    const RX_SHELL_HINT = /['"]|\/|=|(?:^|\s)--?[A-Za-z]|\\[ \t]*$/
    const CMD_TOKEN =
      /('[^']*')|("[^"]*")|(?<=[\s,=(])(--?[A-Za-z][\w-]*)|([\w.+-]*\/[\w./+-]*)|(\b\d[\d:.]*\b)/g

    /**
     * True when the draft is a note of commands rather than prose.
     *
     * A lowercase leading word plus a shell hint ("=", a slash, a quote, a
     * flag or a trailing line continuation) marks a command line, and an
     * indented continuation of one counts as part of it. Prose keeps a
     * capitalised first word, so ordinary sentences stay uncounted.
     */
    function looksLikeCommandNote(lines) {
      let commands = 0
      let prose = 0
      let fence = null
      for (const line of lines) {
        if (fence !== null) {
          if (line.trim() === fence) fence = null
          continue
        }
        const opened = MD_FENCE.exec(line)
        if (opened !== null) {
          // Code inside a fence is not a Markdown line; counting it as a command
          // would repaint prose documents that merely contain a snippet.
          fence = opened[1]
          continue
        }
        if (line.trim() === '') continue
        if (MD_EDIT_HEADING.test(line) || MD_EDIT_QUOTE.test(line) || MD_EDIT_BULLET.test(line)) {
          continue
        }
        const head = RX_COMMAND_LINE.exec(line)
        if (head !== null && RX_COMMAND_NAME.test(head[1]) && RX_SHELL_HINT.test(line)) commands += 1
        else if (RX_COMMAND_CONTINUATION.test(line)) commands += 1
        else prose += 1
      }
      return commands >= 2 && commands > prose
    }

    /** Paint the quoted arguments, paths, flags and numbers of one command. */
    function paintCommandText(text, keyPrefix) {
      const out = []
      let last = 0
      let counter = 0
      CMD_TOKEN.lastIndex = 0
      let match = CMD_TOKEN.exec(text)
      while (match !== null) {
        if (match.index > last) out.push(text.slice(last, match.index))
        const className =
          match[1] !== undefined || match[2] !== undefined
            ? 'lmn-tok-string'
            : match[3] !== undefined
              ? 'lmn-tok-constant'
              : match[4] !== undefined
                ? 'lmn-tok-type'
                : 'lmn-tok-number'
        out.push(h('span', { key: `${keyPrefix}:${counter}`, className }, match[0]))
        counter += 1
        last = match.index + match[0].length
        match = CMD_TOKEN.exec(text)
      }
      if (last < text.length) out.push(text.slice(last))
      return out
    }

    /** Paint one command line, keeping its command name distinguishable. */
    function paintCommandLine(line, keyPrefix) {
      const lead = RX_COMMAND_LEAD.exec(line)
      if (lead === null) return paintCommandText(line, keyPrefix)
      return [
        lead[1],
        h('span', { key: `${keyPrefix}:cmd`, className: 'lmn-tok-function' }, lead[2]),
        ...paintCommandText(lead[3], keyPrefix),
      ]
    }

    /**
     * Past this size the mirrored layer is not worth its render cost; the editor
     * falls back to uncoloured lines and stays responsive.
     */
    const HL_EDIT_LIMIT = 200 * 1024

    /**
     * Paint a whole draft as one element per source line.
     *
     * Fences switch the scanner into the fenced language, so a fenced block is
     * coloured exactly like the preview renders it.
     */
    function highlightMarkdown(source) {
      const text = String(source ?? '')
      const lines = text.split('\n')
      if (text.length > HL_EDIT_LIMIT) {
        return lines.map((line, index) =>
          h('div', { key: index, className: 'lmn-hl-line' }, line),
        )
      }

      const out = []
      const commandNote = looksLikeCommandNote(lines)

      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        const key = index

        const opened = MD_FENCE.exec(line)
        if (opened !== null) {
          // Scan the whole fence once: a block is highlighted as one string, so
          // block comments and multi-line strings stay intact across lines.
          const marker = opened[1]
          const language = String(opened[2] ?? '').trim().toLowerCase()
          out.push(h('div', { key, className: 'lmn-hl-line' }, h('span', { className: 'lmn-tok-comment' }, line)))
          let end = index + 1
          while (end < lines.length && lines[end].trim() !== marker) end += 1
          const body = lines.slice(index + 1, end)
          const painted = paintCodeLines(body, language)
          for (let offset = 0; offset < body.length; offset += 1) {
            out.push(h('div', { key: index + 1 + offset, className: 'lmn-hl-line' }, painted[offset]))
          }
          if (end < lines.length) {
            out.push(
              h(
                'div',
                { key: end, className: 'lmn-hl-line' },
                h('span', { className: 'lmn-tok-comment' }, lines[end]),
              ),
            )
          }
          index = end
          continue
        }

        const heading = MD_EDIT_HEADING.exec(line)
        if (heading !== null) {
          out.push(
            h(
              'div',
              { key, className: 'lmn-hl-line' },
              h('span', { className: 'lmn-tok-comment' }, `${heading[1]}${heading[2]}`),
              h(
                'span',
                { className: 'lmn-md-heading' },
                heading[3],
                colorizeInline(heading[4], `h${index}`),
              ),
            ),
          )
          continue
        }

        const quote = MD_EDIT_QUOTE.exec(line)
        if (quote !== null) {
          out.push(
            h(
              'div',
              { key, className: 'lmn-hl-line' },
              h('span', { className: 'lmn-tok-comment' }, `${quote[1]}${quote[2]}${quote[3]}`),
              h('span', { className: 'lmn-md-quote' }, quote[4]),
            ),
          )
          continue
        }

        const bullet = MD_EDIT_BULLET.exec(line)
        if (bullet !== null) {
          out.push(
            h(
              'div',
              { key, className: 'lmn-hl-line' },
              bullet[1],
              h('span', { className: 'lmn-tok-keyword' }, bullet[2]),
              bullet[3],
              colorizeInline(bullet[4], `b${index}`),
            ),
          )
          continue
        }

        if (commandNote && line.trim() !== '') {
          out.push(h('div', { key, className: 'lmn-hl-line' }, paintCommandLine(line, `c${index}`)))
          continue
        }

        out.push(h('div', { key, className: 'lmn-hl-line' }, colorizeInline(line, `t${index}`)))
      }

      return out
    }

    /**
     * Render a Markdown draft into React children.
     *
     * Everything unrecognised falls through to a paragraph of literal text, so
     * an unknown construct is shown as written rather than dropped.
     */
    /**
     * Every heading the preview will paint, in paint order.
     *
     * The renderer numbers headings the same way, so an id worked out here can
     * be reused as the anchor of the matching element.
     */
    function outlineOf(flow) {
      const headings = []
      let fence = null
      for (const line of flow) {
        const open = MD_FENCE.exec(line)
        if (open !== null) {
          if (fence === null) fence = open[1]
          else if (line.trim() === fence) fence = null
          continue
        }
        if (fence !== null) continue
        const heading = MD_HEADING.exec(line)
        if (heading === null) continue
        headings.push({
          id: `lmn-h-${headings.length}`,
          level: heading[1].length,
          text: heading[2].trim(),
        })
      }
      return headings
    }

    /** Jump the preview to one heading, without leaving the panel. */
    function jumpToHeading(id) {
      try {
        const target = typeof document?.getElementById === 'function'
          ? document.getElementById(id)
          : null
        if (target !== null && target !== undefined && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ block: 'start' })
        }
      } catch {
        // A missing anchor is not worth an error: the preview stays put.
      }
    }

    /** One clickable entry of an outline, indented by heading level. */
    function outlineEntry(entry, keyPrefix) {
      return h('a', {
        key: `${keyPrefix}-${entry.id}`,
        className: `lmn-outline-item is-level-${entry.level}`,
        href: `#${entry.id}`,
        onClick: (event) => {
          event?.preventDefault?.()
          jumpToHeading(entry.id)
        },
      }, entry.text)
    }

    /** Render the note, with footnote definitions lifted out of the flow. */
    function renderMarkdown(source) {
      const lines = String(source ?? '').split(/\r?\n/)
      const definitions = new Map()
      const flow = []
      let openFence = null
      for (const line of lines) {
        const fence = MD_FENCE.exec(line)
        if (fence !== null) {
          if (openFence === null) openFence = fence[1]
          else if (line.trim() === openFence) openFence = null
          flow.push(line)
          continue
        }
        if (openFence !== null) {
          flow.push(line)
          continue
        }
        const definition = MD_FOOTNOTE_DEF.exec(line)
        if (definition !== null) {
          definitions.set(definition[1], definition[2])
          continue
        }
        flow.push(line)
      }

      const outline = outlineOf(flow)
      const blocks = []
      let index = 0
      let counter = 0
      let headingCount = 0
      const nextKey = () => `md${counter++}`
      const ctx = { definitions, order: new Map(), used: [] }

      /** One bullet or numbered list, recursing into indented children. */
      function renderList(ordered, indent) {
        const items = []
        while (index < flow.length) {
          const line = flow[index]
          if (line.trim() === '') {
            const next = flow[index + 1]
            if (next !== undefined && indentWidth(next) >= indent && listItemOf(next, ordered) !== null) {
              index += 1
              continue
            }
            break
          }
          if (indentWidth(line) < indent) break
          const item = listItemOf(line, ordered)
          if (item === null) break
          index += 1

          const children = []
          while (index < flow.length && flow[index].trim() !== '' && indentWidth(flow[index]) > indent) {
            const nestedOrdered = listItemOf(flow[index], true) !== null
            const nestedBullet = listItemOf(flow[index], false) !== null
            if (!nestedOrdered && !nestedBullet) break
            children.push(renderList(nestedOrdered, indentWidth(flow[index])))
          }

          const task = MD_TASK.exec(item.text)
          const key = `li${items.length}`
          const label = task === null
            ? renderInline(item.text, key, ctx)
            : [
              h('input', {
                key: 'box',
                type: 'checkbox',
                className: 'lmn-md-task',
                checked: task[1].toLowerCase() === 'x',
                readOnly: true,
                tabIndex: -1,
              }),
              h('span', { key: 'text', className: task[1].toLowerCase() === 'x' ? 'lmn-md-task-done' : undefined },
                renderInline(task[2], `${key}:text`, ctx)),
            ]
          items.push(h('li', { key },
            task === null ? label : h('span', { className: 'lmn-md-task-line' }, label),
            children.length > 0 ? children : null))
        }

        return h(ordered ? 'ol' : 'ul', { key: nextKey(), className: 'lmn-md-list' }, items)
      }

      /** A fenced block: a diagram, a formula, or highlighted code. */
      function renderFence(marker, language, body) {
        const code = body.join('\n')
        if (language === 'mermaid') {
          return h(MermaidDiagram, { key: nextKey(), keyName: nextKey(), code })
        }
        if (language === 'math' || language === 'katex' || language === 'tex' || language === 'latex') {
          return h(MathSpan, { key: nextKey(), keyName: nextKey(), tex: code.trim(), display: true })
        }
        const attrs = { key: nextKey() }
        if (language !== '') attrs['data-lang'] = language
        return h('pre', attrs, h('code', null, highlightCode(code, language)))
      }

      /** `[!NOTE]`-style callout, or a plain quote when the marker is absent. */
      function renderQuote(body) {
        const head = MD_CALLOUT.exec(body[0] ?? '')
        if (head === null) {
          return h('blockquote', { key: nextKey(), className: 'lmn-md-quote-block' },
            renderInline(body.join('\n'), nextKey(), ctx))
        }
        const kind = head[1].toLowerCase()
        const title = head[2].trim()
        const rest = body.slice(1)
        return h('div', { key: nextKey(), className: `lmn-md-callout is-${kind}` },
          h('div', { className: 'lmn-md-callout-title' }, title === '' ? CALLOUT_LABEL[kind] ?? kind : title),
          rest.length === 0 ? null : h('div', { className: 'lmn-md-callout-body' },
            renderInline(rest.join('\n'), nextKey(), ctx)))
      }

      while (index < flow.length) {
        const line = flow[index]

        const fence = MD_FENCE.exec(line)
        if (fence !== null) {
          const marker = fence[1]
          const language = String(fence[2] ?? '').trim().toLowerCase()
          const body = []
          index += 1
          while (index < flow.length && flow[index].trim() !== marker) {
            body.push(flow[index])
            index += 1
          }
          index += 1
          blocks.push(renderFence(marker, language, body))
          continue
        }

        if (line.trim() === '') {
          index += 1
          continue
        }

        const heading = MD_HEADING.exec(line)
        if (heading !== null) {
          const level = heading[1].length
          const anchor = outline[headingCount]?.id ?? `lmn-h-${headingCount}`
          headingCount += 1
          blocks.push(h(`h${level}`, {
            key: nextKey(),
            className: 'lmn-md-heading',
            id: anchor,
          }, renderInline(heading[2], nextKey(), ctx)))
          index += 1
          continue
        }

        if (MD_TOC.test(line)) {
          index += 1
          const entries = outline.filter((entry) => entry.level >= 2)
          const shown = entries.length > 0 ? entries : outline
          if (shown.length === 0) continue
          blocks.push(h('nav', { key: nextKey(), className: 'lmn-md-toc', 'aria-label': 'Contents' },
            shown.map((entry) => outlineEntry(entry, 'toc'))))
          continue
        }

        if (MD_RULE.test(line)) {
          blocks.push(h('hr', { key: nextKey(), className: 'lmn-md-rule' }))
          index += 1
          continue
        }

        const mathOpen = MD_MATH_OPEN.exec(line)
        if (mathOpen !== null) {
          const first = mathOpen[1]
          const closeAt = first.indexOf('$$')
          index += 1
          if (closeAt >= 0) {
            blocks.push(h(MathSpan, {
              key: nextKey(),
              keyName: nextKey(),
              tex: first.slice(0, closeAt).trim(),
              display: true,
            }))
            continue
          }
          const body = first.trim() === '' ? [] : [first]
          while (index < flow.length) {
            const current = flow[index]
            const close = current.indexOf('$$')
            index += 1
            if (close >= 0) {
              const head = current.slice(0, close)
              if (head.trim() !== '') body.push(head)
              break
            }
            body.push(current)
          }
          blocks.push(h(MathSpan, { key: nextKey(), keyName: nextKey(), tex: body.join('\n').trim(), display: true }))
          continue
        }

        if (MD_QUOTE.test(line)) {
          const body = []
          while (index < flow.length) {
            const quoted = MD_QUOTE.exec(flow[index])
            if (quoted === null) break
            body.push(quoted[1])
            index += 1
          }
          blocks.push(renderQuote(body))
          continue
        }

        if (line.includes('|') && index + 1 < flow.length && MD_TABLE_SEP.test(flow[index + 1])) {
          const head = tableCells(line)
          const alignments = tableAlignments(flow[index + 1])
          index += 2
          const rows = []
          while (index < flow.length && flow[index].includes('|') && flow[index].trim() !== '') {
            rows.push(tableCells(flow[index]))
            index += 1
          }
          const cellStyle = (column) => {
            const alignment = alignments[column] ?? ''
            return alignment === '' ? undefined : { textAlign: alignment }
          }
          blocks.push(
            h(
              'table',
              { key: nextKey(), className: 'lmn-md-table' },
              h(
                'thead',
                null,
                h('tr', null, head.map((cell, column) =>
                  h('th', { key: `h${column}`, style: cellStyle(column) },
                    renderInline(cell, `th${column}`, ctx)))),
              ),
              h(
                'tbody',
                null,
                rows.map((row, rowIndex) =>
                  h('tr', { key: `r${rowIndex}` }, row.map((cell, column) =>
                    h('td', { key: `c${column}`, style: cellStyle(column) },
                      renderInline(cell, `td${rowIndex}.${column}`, ctx))))),
              ),
            ),
          )
          continue
        }

        const ordered = MD_ORDERED.test(line.trimStart()) && !MD_BULLET.test(line.trimStart())
        if (MD_BULLET.test(line.trimStart()) || ordered) {
          blocks.push(renderList(ordered, indentWidth(line)))
          continue
        }

        const body = []
        while (index < flow.length) {
          const current = flow[index]
          if (
            current.trim() === '' ||
            MD_FENCE.test(current) ||
            MD_HEADING.test(current) ||
            MD_RULE.test(current) ||
            MD_QUOTE.test(current) ||
            MD_MATH_OPEN.test(current) ||
            MD_BULLET.test(current.trimStart()) ||
            MD_ORDERED.test(current.trimStart())
          ) {
            break
          }
          body.push(current)
          index += 1
        }
        if (body.length === 0) {
          // Nothing consumed: emit the line literally so the loop always advances.
          body.push(flow[index])
          index += 1
        }
        blocks.push(h('p', { key: nextKey(), className: 'lmn-md-paragraph' },
          renderInline(body.join('\n'), nextKey(), ctx)))
      }

      if (ctx.used.length > 0) {
        blocks.push(
          h('section', { key: nextKey(), className: 'lmn-md-footnotes' },
            h('hr', { className: 'lmn-md-rule' }),
            h('ol', null, ctx.used.map((note, position) => h('li', {
              key: `fn${position}`,
              id: `lmn-fn-${note.name}`,
              className: 'lmn-md-footnote',
            },
            note.body === null
              ? h('span', { className: 'lmn-md-footnote-missing' }, `[^${note.name}] 没有定义`)
              : renderInline(note.body, `fn${position}`, null),
            h('a', { className: 'lmn-md-footnote-back', href: `#lmn-fnref-${note.name}` }, '↩'))))),
        )
      }

      return blocks
    }

    /**
     * What the panel remembers about the last thing the user had open.
     *
     * The `main` slot is keyed by panel id, so switching to another sidebar
     * entry tears this component down and every `useState` in it falls back to
     * its initial value. Keeping the fields worth keeping in this module-scope
     * object is what lets the panel come back to the same file instead of a
     * blank page. The `localStorage` copy carries the same fields across a
     * full page reload.
     */
    const SESSION_KEY = 'local-markdown-notes:session'
    const VIEW_MODES = ['edit', 'preview']
    const BOTTOM_TABS = ['status', 'diff', 'blame']

    const session = {
      projectId: null,
      openDirs: [],
      filePath: null,
      viewMode: 'edit',
      bottomHeight: null,
      tab: 'status',
      // An unsaved buffer and whether it differs from the file on disk. Only
      // the in-memory copy carries these: a reload starts from disk again.
      draft: null,
      dirty: false,
    }

    let sessionHydrated = false

    function storedViewMode(value) {
      return VIEW_MODES.includes(value) ? value : 'edit'
    }

    function storedTab(value) {
      return BOTTOM_TABS.includes(value) ? value : 'status'
    }

    function storedHeight(value) {
      return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : null
    }

    /** The `openDirs` map a stored session describes, with the root expanded. */
    function sessionOpenDirs(state) {
      const next = {}
      if (state.projectId === null) return next
      next[treeKey(state.projectId, '')] = true
      for (const relative of state.openDirs) next[treeKey(state.projectId, relative)] = true
      return next
    }

    /**
     * Read the cross-reload part of the session.
     *
     * `localStorage` is absent in the Node tests and a privacy-restricted
     * browser throws on access instead of answering null, so both have to be
     * handled: a broken store may never break editing.
     */
    function readStoredSession() {
      try {
        if (typeof localStorage === 'undefined') return null
        const raw = localStorage.getItem(SESSION_KEY)
        if (typeof raw !== 'string' || raw === '') return null
        const parsed = JSON.parse(raw)
        return parsed !== null && typeof parsed === 'object' ? parsed : null
      } catch {
        return null
      }
    }

    /**
     * Persist the lightweight fields. `children`, `diff`, `blame` and `status`
     * are deliberately left out: they are rebuilt from the Host on restore.
     */
    function writeStoredSession() {
      try {
        if (typeof localStorage === 'undefined') return
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            projectId: session.projectId,
            openDirs: session.openDirs,
            filePath: session.filePath,
            viewMode: session.viewMode,
            bottomHeight: session.bottomHeight,
            tab: session.tab,
          }),
        )
      } catch {
        // A full or blocked store must never interfere with editing.
      }
    }

    /** Read the stored session once per page load, before the first render. */
    function hydrateSession() {
      if (sessionHydrated) return
      sessionHydrated = true
      const stored = readStoredSession()
      if (stored === null) return
      session.projectId = typeof stored.projectId === 'string' && stored.projectId !== '' ? stored.projectId : null
      session.openDirs = Array.isArray(stored.openDirs)
        ? stored.openDirs.filter((relative) => typeof relative === 'string')
        : []
      session.filePath = typeof stored.filePath === 'string' && stored.filePath !== '' ? stored.filePath : null
      session.viewMode = storedViewMode(stored.viewMode)
      session.bottomHeight = storedHeight(stored.bottomHeight)
      session.tab = storedTab(stored.tab)
    }

    /** Forget everything, in memory and on disk. */
    function clearSession() {
      session.projectId = null
      session.openDirs = []
      session.filePath = null
      session.draft = null
      session.dirty = false
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(SESSION_KEY)
      } catch {
        // Same tolerance as the write path.
      }
    }

    function App({ api, t, chat }) {
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
      const [lineEntry, setLineEntry] = React.useState(null)
      // The committed text of the open file, read once per open: the gutter
      // compares it against the live buffer on every render, so typing needs
      // no request of its own.
      const [baseline, setBaseline] = React.useState(null)
      const [viewTarget, setViewTarget] = React.useState('')
      const [searchQuery, setSearchQuery] = React.useState('')
      const [searchResult, setSearchResult] = React.useState(null)
      const [searching, setSearching] = React.useState(false)
      const [hitKey, setHitKey] = React.useState(null)
      const [creating, setCreating] = React.useState(null)
      const [renaming, setRenaming] = React.useState(null)
      const [deleting, setDeleting] = React.useState(null)
      const [viewMode, setViewMode] = React.useState('edit')
      const [bottomHeight, setBottomHeight] = React.useState(null)
      const [resizing, setResizing] = React.useState(false)
      const bottomRef = React.useRef(null)
      const resizeRef = React.useRef(null)

      /**
       * Auto-save follows VS Code's `files.autoSave: afterDelay`.
       *
       * In VS Code every change restarts one timer (`discardAutoSave()` then
       * `setTimeout`), so a save lands once typing pauses rather than every N
       * milliseconds. The delay here is shorter than VS Code's own 1000 ms
       * default because this panel holds short notes and waiting a second for
       * the write felt slow.
       */
      const AUTO_SAVE_DELAY = 600
      // A second net for a buffer left dirty without a further edit, a blur or
      // a pause: VS Code has no equivalent, this panel asked for one.
      const AUTO_SAVE_INTERVAL = 10 * 60 * 1000
      const saveTimer = React.useRef(null)
      // A timer outlives the render that set it, so it must not close over that
      // render's `save`; this ref always holds the newest one.
      const saveRef = React.useRef(null)
      // VS Code keeps a `versionId` per model and refuses to clobber a buffer
      // that changed while a save was in flight. The counter below is that
      // version: every keystroke bumps it, and a save that returns to a
      // different number knows the user typed during the write.
      const draftVersion = React.useRef(0)
      const savingRef = React.useRef(false)

      const scheduleAutoSave = React.useCallback(() => {
        if (saveTimer.current !== null) {
          window.clearTimeout(saveTimer.current)
          saveTimer.current = null
        }
        saveTimer.current = window.setTimeout(() => {
          saveTimer.current = null
          void saveRef.current?.({ quiet: true })
        }, AUTO_SAVE_DELAY)
      }, [])

      const report = React.useCallback((caught) => {
        setError({ message: caught?.message ?? String(caught), code: caught?.code ?? '' })
        setBusy(null)
      }, [])

      const refreshProjects = React.useCallback(async () => {
        try {
          const value = await api.listProjects()
          const list = Array.isArray(value?.projects) ? value.projects : []
          setProjects(list)
          setError(null)
          // Returned so the restore path can resolve a stored id without
          // waiting a render to read the state it just set.
          return list
        } catch (caught) {
          report(caught)
          return null
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
            session.openDirs = session.openDirs.filter((entry) => entry !== relative)
            writeStoredSession()
            // A folded folder must not stay the destination for new entries:
            // the create box would write somewhere the user can no longer see.
            setViewTarget((current) =>
              current === relative || current.startsWith(relative + '/') ? parentOf(relative) : current,
            )
            return
          }
          setOpenDirs((current) => ({ ...current, [key]: true }))
          setViewTarget(relative)
          if (!session.openDirs.includes(relative)) {
            session.openDirs = [...session.openDirs, relative]
            writeStoredSession()
          }
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

      /**
       * Read the committed text the gutter compares against.
       *
       * The comparison itself happens during render, against the live buffer,
       * so one read per file open is enough: typing changes the buffer, not
       * `HEAD`, and saving changes neither. An unreadable baseline carries no
       * marks — a decoration is a hint, never a reportable failure, so this
       * never surfaces an error banner.
       */
      const refreshMarks = React.useCallback(
        async (target, relative) => {
          if (target === null || typeof relative !== 'string' || relative === '') {
            setBaseline(null)
            return
          }
          try {
            const value = await api.gitBaseline(target.id, relative)
            setBaseline({ path: relative, content: value?.content ?? null })
          } catch {
            setBaseline(null)
          }
        },
        [api],
      )

      const openProject = React.useCallback(
        async (target, options = {}) => {
          // Restoring a session re-opens the project the user already had; it
          // must not wipe the file and draft the restore is about to put back.
          const reset = options.reset !== false
          setProject(target)
          if (reset) {
            setFile(null)
            setDraft('')
            setBlame(null)
            setLineEntry(null)
            setBaseline(null)
            setDiff(null)
            setDiffPath(null)
            setNotice(null)
            setCreating(null)
            setViewTarget('')
            // Hits belong to the project that produced them, so switching
            // folders must not leave another folder's results on screen.
            setSearchQuery('')
            setSearchResult(null)
            setHitKey(null)
            session.filePath = null
            session.draft = null
            session.dirty = false
          }
          session.projectId = target.id
          session.openDirs = []
          writeStoredSession()
          // Expanding the root is what makes the tree show anything: the root
          // node is the project itself, so '' is its directory.
          setOpenDirs((current) => ({ ...current, [treeKey(target.id, '')]: true }))
          await loadPath(target, '')
          await refreshStatus(target)
        },
        [loadPath, refreshStatus],
      )

      /**
       * Load a file into the editor.
       *
       * `options.restore` is the session-restore path: an unsaved buffer the
       * session still holds for this very file wins over the disk copy, so
       * switching panels does not silently throw away typing. A failure there
       * stays quiet — the user never asked for that file in the first place —
       * and is reported as `false` so the caller can fall back to a blank page.
       */
      const openFile = React.useCallback(
        async (target, relative, options = {}) => {
          const restoring = options.restore === true
          try {
            setBusy('read')
            const value = await api.readFile(target.id, relative)
            setFile({ path: value.path, version: value.version, content: value.content })
            const carried = restoring && session.dirty && session.filePath === value.path ? session.draft : null
            setDraft(carried === null ? value.content : carried)
            // A different file is now in the editor, so a write still in flight
            // for the previous one must not be taken as "the user typed".
            draftVersion.current += 1
            setBlame(null)
            setLineEntry(null)
            setNotice(null)
            setViewTarget(parentOf(value.path))
            setError(null)
            session.projectId = target.id
            session.filePath = value.path
            session.draft = carried === null ? value.content : carried
            session.dirty = carried !== null
            writeStoredSession()
            // The gutter marks describe the file on disk against HEAD, so they
            // are refreshed after every read, never derived from the buffer.
            await refreshMarks(target, value.path)
            return true
          } catch (caught) {
            if (restoring) {
              setFile(null)
              setDraft('')
            } else {
              report(caught)
            }
            return false
          } finally {
            setBusy(null)
          }
        },
        [api, refreshMarks, report],
      )

      /**
       * Write the buffer back to disk.
       *
       * `quiet` is the auto-save path (the debounce timer, leaving the editor
       * and the ten-minute net). It skips the work when the buffer already
       * matches the disk and never announces itself: a note that saves while
       * the user is typing must not flash "已保存" in the toolbar. Both paths
       * write the same bytes through the same call, because a second save
       * implementation is a second place for the version check to drift.
       */
      const save = React.useCallback(async (options = {}) => {
        const quiet = options.quiet === true
        if (project === null || file === null) return
        if (savingRef.current) {
          // A write is already in flight and will settle the buffer when it
          // returns; this attempt is only here because typing went on. The
          // running save re-arms the debounce for those keystrokes on its way
          // out, so nothing is left behind and no second write starts here.
          return
        }
        if (quiet && draft === file.content) return
        // VS Code's `versionId`: remember which buffer this write carries, and
        // on return tell whether the user typed while it was on the wire.
        const startedAt = draftVersion.current
        const content = draft
        savingRef.current = true
        try {
          setBusy('save')
          const value = await api.writeFile(project.id, file.path, content, file.version)
          const moved = draftVersion.current !== startedAt
          // The disk holds `content` either way, so the version and the
          // committed copy move even when the buffer did not.
          setFile({ path: value.path, version: value.version, content: value.content })
          setError(null)
          session.filePath = value.path
          if (moved) {
            // Typing continued mid-write. The buffer is newer than the disk, so
            // it is left exactly as the user typed it and stays dirty; writing
            // `value.content` back over it here is what used to swallow the
            // keystrokes. The finally block re-arms the debounce for them.
            session.dirty = true
          } else {
            setDraft(value.content)
            if (!quiet) setNotice('panel.saved')
            session.draft = value.content
            session.dirty = false
          }
          writeStoredSession()
          // The bars compare HEAD's copy against the buffer, and the buffer may
          // just have moved, so the baseline is re-read to keep the two in step.
          await refreshStatus(project)
          await refreshMarks(project, value.path)
        } catch (caught) {
          if (caught?.code === 'FS_STALE_VERSION' || caught?.code === 'notes/stale') {
            setNotice('panel.staleTitle')
          }
          report(caught)
        } finally {
          savingRef.current = false
          setBusy(null)
          // Anything typed while the write was in flight still needs a turn.
          if (draftVersion.current !== startedAt) scheduleAutoSave()
        }
      }, [api, draft, file, project, refreshMarks, refreshStatus, report, scheduleAutoSave])

      // The auto-save timers outlive the render that armed them, so they read
      // the newest `save` through this ref instead of closing over an old one.
      saveRef.current = save

      /**
       * A ten-minute net under the debounce and the blur save.
       *
       * A buffer can stay dirty without either firing — the user types one
       * character and then just watches the screen — so the note is written
       * once a decade of edits would otherwise have gone unsaved. The interval
       * is armed once per mount and cleared on the way out.
       */
      React.useEffect(() => {
        if (typeof window.setInterval !== 'function') return
        const handle = window.setInterval(() => {
          void saveRef.current?.({ quiet: true })
        }, AUTO_SAVE_INTERVAL)
        return () => window.clearInterval(handle)
      }, [])

      /**
       * Come back to whatever the user had open.
       *
       * This runs once per mount, and a mount happens every time the sidebar
       * switches away and back, because the `main` slot is keyed. The module
       * session survives that; a reload reads the same fields back out of
       * `localStorage`. Every step here is best-effort: a project that was
       * removed or a file that was renamed away leaves a blank editor with one
       * readable line, never an error banner or a stuck spinner.
       */
      React.useEffect(() => {
        let cancelled = false
        void (async () => {
          hydrateSession()
          // Applied before the first paint of any restored content: they are
          // pure view state and never depend on the Host answering.
          setViewMode(session.viewMode)
          setTab(session.tab)
          if (session.bottomHeight !== null) setBottomHeight(session.bottomHeight)

          const list = await refreshProjects()
          if (cancelled) return
          if (session.projectId === null) return

          const target = (list ?? []).find((item) => item.id === session.projectId)
          if (target === undefined) {
            // The project is gone from the registry: start clean and quiet.
            clearSession()
            return
          }

          // Snapshot first: re-opening the project resets the write-back fields.
          const openDirs = [...session.openDirs]
          const filePath = session.filePath
          await openProject(target, { reset: false })
          if (cancelled) return

          const directories = openDirs
            .filter((relative) => typeof relative === 'string' && relative !== '')
            // Shallow first, so a child folder is expanded inside a parent that
            // is already on screen.
            .sort((left, right) => left.split('/').length - right.split('/').length)
          if (directories.length > 0) {
            session.openDirs = directories
            setOpenDirs(sessionOpenDirs(session))
            for (const relative of directories) {
              if (cancelled) return
              await loadPath(target, relative)
            }
          }

          if (filePath === null) {
            writeStoredSession()
            return
          }
          const restored = await openFile(target, filePath, { restore: true })
          if (cancelled) return
          if (!restored) {
            session.filePath = null
            session.draft = null
            session.dirty = false
            writeStoredSession()
            setNotice('panel.restoreMissing')
          }
        })()
        return () => {
          cancelled = true
        }
      }, [refreshProjects, openProject, openFile, loadPath])

      /**
       * The search box runs against the Host, not the tree it happens to have
       * loaded: the tree only ever holds the folders the user unfolded, while a
       * search has to reach every Markdown file under the root.
       */
      const searchTimer = React.useRef(null)
      const searchSeq = React.useRef(0)
      // A hit can only be scrolled to once the editor has rendered that file:
      // the request is remembered here and consumed by the effect below.
      const pendingHit = React.useRef(null)

      const runSearch = React.useCallback(
        async (target, query) => {
          if (target === null) return
          const trimmed = typeof query === 'string' ? query.trim() : ''
          const seq = (searchSeq.current += 1)
          if (trimmed === '') {
            setSearchResult(null)
            setSearching(false)
            return
          }
          setSearching(true)
          try {
            const value = await api.searchNotes(target.id, trimmed)
            if (seq !== searchSeq.current) return
            setSearchResult({
              query: typeof value?.query === 'string' ? value.query : trimmed,
              hits: Array.isArray(value?.hits) ? value.hits : [],
              scanned: typeof value?.scanned === 'number' ? value.scanned : 0,
              matched: typeof value?.matched === 'number' ? value.matched : 0,
              truncated: value?.truncated === true,
            })
            setError(null)
          } catch (caught) {
            if (seq !== searchSeq.current) return
            setSearchResult(null)
            report(caught)
          } finally {
            if (seq === searchSeq.current) setSearching(false)
          }
        },
        [api, report],
      )

      const onSearchInput = React.useCallback(
        (event) => {
          const next = event.target.value
          setSearchQuery(next)
          if (searchTimer.current !== null) window.clearTimeout(searchTimer.current)
          if (project === null) return
          if (next.trim() === '') {
            // Bumping the sequence discards an answer that is already in flight,
            // otherwise clearing the box can be undone by a late result.
            searchSeq.current += 1
            setSearchResult(null)
            setSearching(false)
            return
          }
          const target = project
          searchTimer.current = window.setTimeout(() => {
            searchTimer.current = null
            void runSearch(target, next)
          }, 200)
        },
        [project, runSearch],
      )

      const clearSearch = React.useCallback(() => {
        if (searchTimer.current !== null) window.clearTimeout(searchTimer.current)
        searchTimer.current = null
        searchSeq.current += 1
        setSearchQuery('')
        setSearchResult(null)
        setSearching(false)
        setHitKey(null)
      }, [])

      /** 1-based line number to a 0-based character offset inside the opened file. */
      const lineOffset = (text, line) => {
        const body = typeof text === 'string' ? text : ''
        let offset = 0
        for (let index = 1; index < line; index += 1) {
          const next = body.indexOf('\n', offset)
          if (next === -1) return body.length
          offset = next + 1
        }
        return offset
      }

      /**
       * Opening a hit reuses the normal file path so saving and blame still work.
       *
       * The caret cannot be placed here: the textarea that will hold the file is
       * rendered by the commit that follows these state updates, so at this point
       * the DOM still shows the previous buffer (or no editor at all). The request
       * is parked in `pendingHit` and the caret is placed once that commit lands.
       */
      const openHit = React.useCallback(
        async (hit) => {
          if (project === null) return
          setHitKey(`${hit.path}:${hit.line}`)
          pendingHit.current = { path: hit.path, line: hit.line }
          const opened = await openFile(project, hit.path)
          if (!opened) {
            pendingHit.current = null
            return
          }
          setViewMode('edit')
        },
        [openFile, project],
      )

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
              setLineEntry(null)
              setDiff(null)
              setDiffPath(null)
              setStatus(null)
              clearSession()
            }
            await refreshProjects()
          } catch (caught) {
            report(caught)
          }
        },
        [api, project, refreshProjects, report],
      )

      /**
       * Open the inline name box under one directory row: the directory whose
       * inline action was clicked, expanded first so the box is visible.
       */
      const beginCreate = React.useCallback(
        (kind, target) => {
          if (project === null) return
          const directory = target ?? viewTarget
          setCreating({
            target: directory,
            kind,
            value: kind === 'file' ? `${t('panel.untitledName')}.md` : '',
          })
          setViewTarget(directory)
          setOpenDirs((current) => ({ ...current, [treeKey(project.id, directory)]: true }))
          setNotice(null)
          // Revealing a directory that was never listed would leave it stuck on
          // the loading placeholder, so pull its children in now.
          if (children[treeKey(project.id, directory)] === undefined) {
            void loadPath(project, directory)
          }
        },
        [children, loadPath, project, t, viewTarget],
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

      /** Open the inline name box on a file row, pre-filled with its current name. */
      const beginRename = React.useCallback(
        (relative) => {
          if (project === null) return
          const parent = parentOf(relative)
          const cut = relative.lastIndexOf('/')
          setRenaming({ path: relative, parent, value: relative.slice(cut + 1) })
          setDeleting(null)
          setNotice(null)
        },
        [project],
      )

      const cancelRename = React.useCallback(() => {
        setRenaming(null)
      }, [])

      /**
       * Rename the file the inline box names.
       *
       * The Host refuses a name that collides with an existing entry and a name
       * that is not Markdown, so the client only trims and appends `.md` when it
       * is missing — the same normalisation a create goes through.
       */
      const confirmRename = React.useCallback(async () => {
        if (renaming === null || project === null) return
        const { path, parent, value } = renaming
        const name = normalizeNewName(value, 'file')
        if (name === '') {
          setRenaming(null)
          return
        }
        const target = joinRelative(parent, name)
        if (target === path) {
          setRenaming(null)
          return
        }
        try {
          setBusy('rename')
          const renamed = await api.renameEntry(project.id, path, target)
          const movedPath = renamed?.path ?? target
          setRenaming(null)
          await loadPath(project, parent)
          // Keep following the file when the renamed one is the one on screen.
          if (file !== null && file.path === path) {
            await openFile(project, movedPath)
          }
          await refreshStatus(project)
          setError(null)
        } catch (caught) {
          report(caught)
        } finally {
          setBusy(null)
        }
      }, [api, file, loadPath, openFile, project, refreshStatus, renaming, report])

      /** Ask before deleting: a file row is one click away from losing a note. */
      const beginDelete = React.useCallback((relative) => {
        setRenaming(null)
        setDeleting({ path: relative })
        setNotice(null)
      }, [])

      const cancelDelete = React.useCallback(() => {
        setDeleting(null)
      }, [])

      const confirmDelete = React.useCallback(async () => {
        if (deleting === null || project === null) return
        const { path } = deleting
        try {
          setBusy('delete')
          await api.deleteEntry(project.id, path)
          setDeleting(null)
          const parent = parentOf(path)
          await loadPath(project, parent)
          // The open file is gone: clear the editor instead of showing a ghost.
          if (file !== null && file.path === path) {
            setFile(null)
            setDraft('')
            setBlame(null)
            setLineEntry(null)
            setDiff(null)
            setDiffPath(null)
            setNotice('panel.deletedNotice')
            clearSession()
          }
          await refreshStatus(project)
          setError(null)
        } catch (caught) {
          report(caught)
        } finally {
          setBusy(null)
        }
      }, [api, deleting, file, loadPath, project, refreshStatus, report])

      /**
       * Open a new chat carrying one row as its first reference.
       *
       * Every row offers this — a folder goes in as a folder chip and a file as
       * a file chip — because either can be the subject of a conversation.
       */
      const addToChat = React.useCallback(
        async (target, relative, name, isDirectory) => {
          if (target === null) return
          setNotice(null)
          const outcome = await chat.open(noteReference(target.rootPath, relative, name, isDirectory))
          if (outcome === 'ok') setNotice('panel.addedToChat')
          else if (outcome === 'busy') setNotice('panel.chatBusy')
          else if (outcome === 'failed') setNotice('panel.chatFailed')
          else setNotice('panel.chatUnavailable')
        },
        [chat],
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
      // Both the gutter and the colour layer are siblings of the textarea, so
      // they can only follow the text by copying the scroll offset on every
      // scroll event.
      const codeAreaRef = React.useRef(null)
      const gutterRef = React.useRef(null)
      const hlRef = React.useRef(null)

      const syncGutterScroll = React.useCallback(() => {
        const area = codeAreaRef.current
        if (area === null) return
        const gutter = gutterRef.current
        if (gutter !== null) gutter.scrollTop = area.scrollTop
        const layer = hlRef.current
        if (layer !== null) {
          layer.scrollTop = area.scrollTop
          layer.scrollLeft = area.scrollLeft
        }
      }, [])

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

      /**
       * Places the caret a hit asked for, once the editor actually shows that
       * file in edit mode. Doing it inside `openHit` lands on whatever textarea
       * the previous buffer left behind, which puts the caret at offset 0.
       */
      React.useEffect(() => {
        const hit = pendingHit.current
        if (hit === null) return
        if (file === null || file.path !== hit.path) return
        if (viewMode !== 'edit') return
        const area = codeAreaRef.current
        if (area === null) return
        pendingHit.current = null
        const text = typeof area.value === 'string' ? area.value : draft
        const offset = lineOffset(text, hit.line)
        if (typeof area.focus === 'function') area.focus()
        if (typeof area.setSelectionRange === 'function') area.setSelectionRange(offset, offset)
        // Bring the matched line into view instead of leaving it scrolled away.
        const lines = Math.max(1, String(text).split('\n').length)
        const tall = typeof area.scrollHeight === 'number' ? area.scrollHeight : 0
        const visible = typeof area.clientHeight === 'number' ? area.clientHeight : 0
        if (tall > 0 && visible > 0) {
          const rowHeight = tall / lines
          const target = (hit.line - 1) * rowHeight
          area.scrollTop = Math.max(0, target - Math.floor(visible / 3))
          syncGutterScroll()
        }
      }, [draft, file, viewMode, syncGutterScroll])

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

      /**
       * The Explorer row icons, drawn on a 16px grid. `newFile` and `newFolder`
       * carry a small plus; `rename` is the pencil, `delete` the bin, and
       * `toSession` a speech bubble with a plus — the one action every row
       * carries, because either a file or a whole folder can be handed to the
       * chat.
       */
      const ICON_PATHS = {
        newFile: 'M9.5 1.5h-5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V4.5zM9.5 1.5v3h3M8 8v4M6 10h4',
        newFolder: 'M1.8 3.4a.9.9 0 0 1 .9-.9h3l1.3 1.4h5.2a.9.9 0 0 1 .9.9v7.5a.9.9 0 0 1-.9.9H2.7a.9.9 0 0 1-.9-.9zM8 7.6v4M6 9.6h4',
        rename: 'M11.2 2.3 13.7 4.8 5.6 12.9 2.3 13.7 3.1 10.4zM9.7 3.8l2.5 2.5',
        delete: 'M2.8 4.3h10.4M6.3 4.3V2.9a.6.6 0 0 1 .6-.6h2.2a.6.6 0 0 1 .6.6v1.4M4.3 4.3l.7 8.4a.9.9 0 0 0 .9.8h4.2a.9.9 0 0 0 .9-.8l.7-8.4M6.6 6.9v3.9M9.4 6.9v3.9',
        toSession:
          'M3.1 2.6h9.8a1.1 1.1 0 0 1 1.1 1.1v6.1a1.1 1.1 0 0 1-1.1 1.1H5.4l-2.3 2.4V10.9a1.1 1.1 0 0 1-1.1-1.1V3.7a1.1 1.1 0 0 1 1.1-1.1zM8 4.6v3.2M6.4 6.2h3.2',
      }

      /** A compact square icon button, the way the Explorer header carries its actions. */
      const iconButton = (kind, label, onClick) =>
        h(
          'button',
          {
            className: 'lmn-iconbtn',
            title: label,
            'aria-label': label,
            disabled: busy === 'create' || busy === 'rename' || busy === 'delete',
            onClick,
          },
          h(
            'svg',
            { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true' },
            h('path', {
              d: ICON_PATHS[kind] ?? ICON_PATHS.newFolder,
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.1,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }),
          ),
        )

      /**
       * Hand this row to the chat.
       *
       * It sits beside the create/rename/delete groups rather than inside them
       * because every row carries it — a folder goes in as a folder chip and a
       * file as a file chip — so it is the one action that is always present.
       */
      const chatAction = (target, relative, name, isDirectory) =>
        iconButton('toSession', t('panel.addToChat'), (event) => {
          event.stopPropagation()
          addToChat(target, relative, name, isDirectory)
        })

      /** The two create actions, shown inline on a folder row the way the Explorer does. */
      const rowActions = (relative, target, name) =>
        h(
          'span',
          { className: 'lmn-row-actions' },
          iconButton('newFile', t('panel.newFile'), (event) => {
            event.stopPropagation()
            beginCreate('file', relative)
          }),
          iconButton('newFolder', t('panel.newFolder'), (event) => {
            event.stopPropagation()
            beginCreate('directory', relative)
          }),
          chatAction(target, relative, name, true),
        )

      /** Rename, delete and hand-to-chat, shown inline on a file row. */
      const fileActions = (relative, target, name) =>
        h(
          'span',
          { className: 'lmn-row-actions' },
          iconButton('rename', t('panel.rename'), (event) => {
            event.stopPropagation()
            beginRename(relative)
          }),
          iconButton('delete', t('panel.delete'), (event) => {
            event.stopPropagation()
            beginDelete(relative)
          }),
          chatAction(target, relative, name, false),
        )

      /** Children of one directory, rendered one indent step deeper. */
      const childNodes = (target, relative, depth) => {
        const key = treeKey(target.id, relative)
        const known = children[key]
        const pending =
          creating !== null &&
          project !== null &&
          project.id === target.id &&
          creating.target === relative
            ? [createRow(depth)]
            : []
        if (known === undefined) {
          return pending.length > 0
            ? [...pending, h('div', { key: `${key}:loading`, className: 'lmn-note' }, t('panel.loading'))]
            : [h('div', { key: `${key}:loading`, className: 'lmn-note' }, t('panel.loading'))]
        }
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
            placeholder: creating !== null && creating.kind === 'file' ? 'untitled.md' : t('panel.namePlaceholder'),
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

      /**
       * The inline rename box, rendered directly under the row it renames so the
       * name being replaced stays visible while the new one is typed.
       */
      const renameRow = (depth) => {
        const finish = () => void confirmRename()
        return h(
          'div',
          { key: 'rename', className: 'lmn-create', style: { paddingLeft: (8 + depth * 10) + 'px' } },
          h('input', {
            autoFocus: true,
            value: renaming === null ? '' : renaming.value,
            placeholder: t('panel.renamePlaceholder'),
            'aria-label': t('panel.renamePlaceholder'),
            onChange: (event) => {
              const value = event.target.value
              setRenaming((current) => (current === null ? current : { ...current, value }))
            },
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void confirmRename()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                cancelRename()
              }
            },
            onBlur: () => cancelRename(),
            onKeyUp: () => {},
          }),
          h('button', { className: 'lmn-btn', onMouseDown: (event) => event.preventDefault(), onClick: finish }, '✓'),
        )
      }

      /**
       * The delete confirmation, inline under the row. Deleting a note is not
       * undoable here, so it takes a second, explicit click — a browser confirm
       * would block the whole page and cannot be styled or tested.
       */
      const deleteRow = (depth) =>
        h(
          'div',
          { key: 'delete', className: 'lmn-create lmn-confirm', style: { paddingLeft: (8 + depth * 10) + 'px' } },
          h('span', { className: 'lmn-confirm-text' }, t('panel.deleteQuestion')),
          h(
            'button',
            {
              className: 'lmn-btn lmn-btn-danger',
              onMouseDown: (event) => event.preventDefault(),
              onClick: () => void confirmDelete(),
            },
            t('panel.confirm'),
          ),
          h(
            'button',
            {
              className: 'lmn-btn',
              onMouseDown: (event) => event.preventDefault(),
              onClick: () => cancelDelete(),
            },
            t('panel.cancel'),
          ),
        )

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
          isDirectory
            ? rowActions(relative, target, entry.name)
            : fileActions(relative, target, entry.name),
        )
        // The inline boxes sit under their own row, at the same indentation.
        const renamingThis = !isDirectory && renaming !== null && renaming.path === relative
        const deletingThis = !isDirectory && deleting !== null && deleting.path === relative
        return h(
          'div',
          { key: relative, className: 'lmn-node' },
          row,
          renamingThis ? renameRow(depth) : null,
          deletingThis ? deleteRow(depth) : null,
          open ? childNodes(target, relative, depth + 1) : null,
        )
      }

      /**
       * Selecting a project opens it; clicking the project that is already open
       * folds it again, the way a folder row behaves.
       */
      const activateProject = (item) => {
        if (project !== null && project.id === item.id) {
          const key = treeKey(item.id, '')
          const open = openDirs[key] === true
          setOpenDirs((current) => ({ ...current, [key]: !open }))
          if (open) setViewTarget('')
          return
        }
        void openProject(item)
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
            onClick: () => activateProject(item),
          },
          chevron(true, open),
          folderGlyph(open),
          h('span', { className: 'lmn-name lmn-name-root' }, item.name.toUpperCase()),
          active ? rowActions('', item, item.name) : null,
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

      /**
       * One hit row: the file and line above the matched text, with the matched
       * run highlighted. `column` is an offset inside `text`, not inside the file
       * line, because the Host clips long lines to a window before returning.
       */
      const hitRow = (hit, index) => {
        const text = typeof hit?.text === 'string' ? hit.text : ''
        const query = searchResult?.query ?? ''
        const at = typeof hit?.column === 'number' ? hit.column : -1
        const end = at < 0 ? at : Math.min(text.length, at + query.length)
        const body = []
        if (at > 0) body.push(text.slice(0, at))
        if (at >= 0 && end > at) {
          body.push(h('span', { key: 'mark', className: 'lmn-hit-mark' }, text.slice(at, end)))
        }
        if (at < 0) body.push(text)
        else if (end < text.length) body.push(text.slice(end))
        const key = `${hit.path}:${hit.line}`
        return h(
          'button',
          {
            key: `${key}:${index}`,
            className: hitKey === key ? 'lmn-hit is-selected' : 'lmn-hit',
            title: `${hit.path}:${hit.line}`,
            onClick: () => void openHit(hit),
          },
          h(
            'span',
            { className: 'lmn-hit-path' },
            h('span', { className: 'lmn-hit-line' }, String(hit.line)),
            hit.path,
          ),
          h('span', { className: 'lmn-hit-text' }, body),
        )
      }

      const searchBox = h(
        'div',
        { className: 'lmn-search' },
        h('input', {
          className: 'lmn-search-input',
          type: 'search',
          value: searchQuery,
          placeholder: t('panel.searchPlaceholder'),
          'aria-label': t('panel.searchPlaceholder'),
          spellCheck: false,
          onChange: onSearchInput,
          onKeyDown: (event) => {
            if (event.key === 'Escape') clearSearch()
          },
        }),
        searchQuery === ''
          ? null
          : h(
              'button',
              {
                className: 'lmn-search-clear',
                title: t('panel.searchClear'),
                'aria-label': t('panel.searchClear'),
                onClick: clearSearch,
              },
              'x',
            ),
      )

      /**
       * While a query is typed the list is replaced by its hits; clearing the box
       * brings the explorer back untouched.
       */
      const searchList = (() => {
        if (project === null) return h('div', { className: 'lmn-search-note' }, t('panel.pickProject'))
        if (searching) return h('div', { className: 'lmn-search-note' }, t('panel.searching'))
        if (searchResult === null) return h('div', { className: 'lmn-search-note' }, t('panel.searchHint'))
        const hits = searchResult.hits
        if (hits.length === 0) return h('div', { className: 'lmn-search-note' }, t('panel.searchEmpty'))
        // `hits.length` is the number of matching lines; `matched` counts the files
        // they live in. Saying "hits" for the file count reads as a contradiction as
        // soon as one file has two matching lines.
        const stats = `${hits.length} ${t('panel.searchHits')} · ${searchResult.matched} ${t('panel.searchFiles')} · ${searchResult.scanned} ${t('panel.searchScanned')}${
          searchResult.truncated ? ` · ${t('panel.searchTruncated')}` : ''
        }`
        return h(
          'div',
          { className: 'lmn-hits' },
          h('div', { key: 'stats', className: 'lmn-search-note' }, stats),
          hits.map((hit, index) => hitRow(hit, index)),
        )
      })()

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
        searchBox,
        h(
          'div',
          { className: 'lmn-list lmn-tree' },
          searchQuery.trim() !== ''
            ? searchList
            : projects.length === 0
              ? h('div', { className: 'lmn-note' }, t('panel.empty'))
              : projects.map((item) => projectNode(item)),
        ),
      )

      /**
       * The GitLens-style chip above the editor: the commit that last touched the
       * cursor's line, with the full commit card revealed by CSS on hover or focus.
       */
      // Nothing to attribute means nothing to show: a line git cannot blame
      // (never committed, or outside history) renders no bar at all rather than
      // a placeholder chip that only says "uncommitted" and names no commit.
      const blameBar =
        lineEntry === null
          ? null
          : h(
              'div',
              { className: 'lmn-blame-bar' },
              h(
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

      // VS Code numbers every line, including the empty one a trailing newline
      // opens, so the gutter and the caret's notion of a line agree.
      const lineCount = Math.max(1, draft.split('\n').length)

      // The marks compare the live buffer against the committed text, so they
      // move as the user types instead of waiting for a write. A baseline read
      // for another file is ignored: it describes a different buffer.
      const marks =
        baseline !== null && file !== null && baseline.path === file.path
          ? lineMarks(baseline.content, draft)
          : EMPTY_MARKS

      // The bottom pane is content-sized until the user drags the splitter; from
      // then on it carries an explicit height so the two halves stay put.
      const BOTTOM_MIN = 60
      const endResize = (event) => {
        if (resizeRef.current === null) return
        resizeRef.current = null
        setResizing(false)
        event?.currentTarget?.releasePointerCapture?.(event.pointerId)
        // The dragged height is part of what coming back should restore, but it
        // is only worth a write once the pointer is released, not per pixel.
        session.bottomHeight = bottomHeight
        writeStoredSession()
      }
      const splitterProps = {
        role: 'separator',
        'aria-orientation': 'horizontal',
        'aria-label': t('panel.resize'),
        'data-dragging': resizing ? 'true' : 'false',
        onPointerDown: (event) => {
          const pane = bottomRef.current
          const total = pane?.parentElement?.getBoundingClientRect?.().height ?? 0
          if (pane === null || !(total > 0)) return
          event.preventDefault?.()
          // Keeping the pointer captured means the drag survives leaving the strip.
          event.currentTarget?.setPointerCapture?.(event.pointerId)
          resizeRef.current = {
            startY: event.clientY,
            startHeight: pane.getBoundingClientRect?.().height ?? 0,
            max: Math.max(BOTTOM_MIN + 60, total - 120),
          }
          setResizing(true)
        },
        onPointerMove: (event) => {
          const drag = resizeRef.current
          if (drag === null) return
          const next = drag.startHeight + (drag.startY - event.clientY)
          setBottomHeight(Math.round(Math.min(drag.max, Math.max(BOTTOM_MIN, next))))
        },
        onPointerUp: endResize,
        onPointerCancel: endResize,
      }
      const bottomStyle =
        bottomHeight === null ? undefined : { height: `${bottomHeight}px`, maxHeight: 'none' }

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
              h(
                'div',
                { className: 'lmn-doc' },
                blameBar,
                viewMode === 'preview'
                  ? draft === ''
                    ? h('div', { className: 'lmn-render-empty' }, t('panel.previewEmpty'))
                    : h('div', { className: 'lmn-preview' },
                        h('div', { className: 'lmn-render' }, renderMarkdown(draft)),
                        (() => {
                          const entries = outlineOf(String(draft).split(/\r?\n/))
                          if (entries.length < 2) return null
                          return h('aside', {
                            className: 'lmn-outline',
                            'aria-label': t('panel.outline'),
                          }, entries.map((entry) => outlineEntry(entry, 'side')))
                        })())
                  : h(
                      'div',
                      { className: 'lmn-code' },
                      h(
                        'div',
                        { className: 'lmn-gutter', 'aria-hidden': 'true', ref: gutterRef },
                        Array.from({ length: lineCount }, (_, index) => {
                          const number = index + 1
                          const mark = marks.added.has(number)
                            ? ' is-added'
                            : marks.modified.has(number)
                              ? ' is-modified'
                              : marks.deleted.has(number)
                                ? ' is-deleted'
                                : ''
                          return h(
                            'div',
                            { key: index, className: 'lmn-gutter-line' },
                            h('span', { className: `lmn-gutter-mark${mark}` }),
                            h('span', { className: 'lmn-gutter-num' }, String(number)),
                          )
                        }),
                      ),
                      h(
                        'div',
                        { className: 'lmn-code-body' },
                        h(
                          'div',
                          { className: 'lmn-hl', 'aria-hidden': 'true', ref: hlRef },
                          highlightMarkdown(draft),
                        ),
                        h('textarea', {
                          value: draft,
                          ref: codeAreaRef,
                          spellCheck: false,
                          onChange: (event) => {
                            const next = event.target.value
                            // Bumps the model version, exactly like VS Code's
                            // `versionId`, so an in-flight save can tell that
                            // these keystrokes arrived after it started.
                            draftVersion.current += 1
                            setDraft(next)
                            setNotice(null)
                            // Keep the unsaved buffer in the session so a panel
                            // switch cannot throw away typing.
                            if (file !== null) {
                              session.projectId = project?.id ?? session.projectId
                              session.filePath = file.path
                              session.draft = next
                              session.dirty = next !== (file.content ?? next)
                              writeStoredSession()
                              // Every keystroke restarts the one timer, so the
                              // write lands when typing pauses.
                              scheduleAutoSave()
                            }
                          },
                          onScroll: syncGutterScroll,
                          // Leaving the editor writes straight away: the timer
                          // would otherwise hold an unsaved note for its delay
                          // while the user is already reading something else.
                          onBlur: () => {
                            if (saveTimer.current !== null) {
                              window.clearTimeout(saveTimer.current)
                              saveTimer.current = null
                            }
                            void save({ quiet: true })
                          },
                          onKeyUp: (event) => void onSelectLine(event),
                          onClick: (event) => void onSelectLine(event),
                          'aria-label': file.path,
                        }),
                      ),
                    ),
              ),
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
                  onClick: () => {
                    session.viewMode = 'edit'
                    writeStoredSession()
                    setViewMode('edit')
                  },
                },
                t('panel.edit'),
              ),
              h(
                'button',
                {
                  className: 'lmn-btn',
                  'aria-pressed': viewMode === 'preview' ? 'true' : 'false',
                  onClick: () => {
                    session.viewMode = 'preview'
                    writeStoredSession()
                    setViewMode('preview')
                  },
                },
                t('panel.preview'),
              ),
            ),
            notice === 'panel.staleTitle' ? h('span', { className: 'lmn-note' }, t('panel.staleTitle')) : null,
            notice === 'panel.saved' ? h('span', { className: 'lmn-note' }, t('panel.saved')) : null,
            // Said quietly next to the reload button rather than as an error
            // banner: the session came back, only the file it named did not.
            notice === 'panel.restoreMissing'
              ? h('span', { className: 'lmn-note' }, t('panel.restoreMissing'))
              : null,
            // The four outcomes of opening a chat from a note. They sit in the
            // toolbar because that strip is already the panel's status line and
            // it stays visible whether or not a file is open.
            notice === 'panel.addedToChat'
              ? h('span', { className: 'lmn-note' }, t('panel.addedToChat'))
              : null,
            notice === 'panel.chatBusy'
              ? h('span', { className: 'lmn-note' }, t('panel.chatBusy'))
              : null,
            notice === 'panel.chatFailed'
              ? h('span', { className: 'lmn-note' }, t('panel.chatFailed'))
              : null,
            notice === 'panel.chatUnavailable'
              ? h('span', { className: 'lmn-note' }, t('panel.chatUnavailable'))
              : null,
            dirty ? h('span', { className: 'lmn-dirty' }, t('panel.modifiedDirty')) : null,
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
          h('div', { className: 'lmn-splitter', ...splitterProps }),
          h(
            'div',
            { className: 'lmn-bottom', ref: bottomRef, style: bottomStyle },
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
                      session.tab = key
                      writeStoredSession()
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

    /**
     * Absolute note path in the form the composer's mention parser accepts.
     *
     * A folder mention has to end in a slash to stay a folder, and the project
     * root has no relative part at all, so both are handled here rather than at
     * every call site.
     */
    function noteMention(rootPath, relativePath, isDirectory = false) {
      const root = String(rootPath ?? '').replace(/[\\/]+$/u, '')
      const rest = String(relativePath ?? '').replace(/[\\/]+$/u, '')
      const joined = rest === '' ? root : `${root}/${rest}`
      const absolute = (isDirectory ? `${joined}/` : joined).replace(/\\/gu, '/')
      // A mention ends at whitespace, so a path holding any must be quoted. The
      // closing quote is included for a file because it is a leaf; a folder
      // deliberately leaves it out so the composer keeps drilling into it.
      if (!/\s/u.test(absolute)) return `@${absolute}`
      return isDirectory ? `@"${absolute}` : `@"${absolute}"`
    }

    /**
     * The composer reference that turns one note row into a chip.
     *
     * The shape is the host's own: its file-drop handler builds the same
     * object, and only `source: 'reference'` gives the chip the official
     * rendering and its click-to-open behaviour.
     */
    function noteReference(rootPath, relativePath, label, isDirectory) {
      const name = String(label ?? '')
      return {
        source: 'reference',
        ref: noteMention(rootPath, relativePath, isDirectory),
        label: isDirectory ? `${name}/` : name,
        appearance: isDirectory ? 'folder' : 'file',
        clipboardText: noteMention(rootPath, relativePath, isDirectory),
      }
    }

    /**
     * The workspace the session on screen belongs to.
     *
     * A new chat has to be created inside a workspace, and the only one the
     * panel can be sure about is the one already holding the session the user
     * is looking at. The lookup mirrors the host's own navigation policy.
     */
    function currentWorkspaceId(ctx) {
      const sessionId = ctx.get('uiWorkspace')?.selection?.getSnapshot?.().sessionId
      if (typeof sessionId !== 'string' || sessionId === '') return undefined
      const items = ctx.get('workspaces')?.list?.getSnapshot?.().items
      if (!Array.isArray(items)) return undefined
      for (const item of items) {
        if (Array.isArray(item?.sessionIds) && item.sessionIds.includes(sessionId)) {
          return item.workspaceId
        }
      }
      return undefined
    }

    /**
     * The bridge that opens a fresh chat carrying one note.
     *
     * The note is not dropped into whatever message box happens to be open:
     * the user asked for a new conversation per click, so the chip has to
     * arrive in a session that did not exist a moment ago. That takes three
     * host calls in a fixed order — create the session, navigate to it (which
     * is what retains its binding), then add the chip — because the composer
     * refuses to build a shell for a session it has no binding for.
     *
     * Every failure is reported as a status string rather than thrown: a panel
     * that mounted before any workspace was open must still render.
     */
    function buildChatBridge(ctx) {
      return {
        /** Returns `'ok'`, `'busy'`, `'unavailable'` or `'failed'`. */
        async open(reference) {
          const conversation = ctx.get('conversation')
          const sessions = ctx.get('sessions')
          const uiWorkspace = ctx.get('uiWorkspace')
          if (conversation === undefined || sessions === undefined || uiWorkspace === undefined) {
            return 'unavailable'
          }
          const workspaceId = currentWorkspaceId(ctx)
          if (workspaceId === undefined) return 'unavailable'
          let sessionId
          try {
            sessionId = await sessions.create({ workspaceId })
          } catch {
            return 'failed'
          }
          if (typeof sessionId !== 'string' || sessionId === '') return 'failed'
          try {
            // Navigating retains the session, and retaining is what gives it a
            // binding; `shell()` below would throw without one.
            uiWorkspace.openSession(sessionId)
            // `shell()` builds the input shell on first use and restores the
            // saved draft while doing it, so it must run before anything is
            // added; adding first would be wiped by that restore.
            const shell = conversation.input.shell(sessionId)
            return shell.addFiles([reference], []) === true ? 'ok' : 'busy'
          } catch {
            return 'failed'
          }
        },
      }
    }

    /**
     * The `@` source that lets a note be inserted into any composer.
     *
     * It reuses the panel's own `listProjects`/`listEntries` facade rather than
     * re-reading the filesystem, so the menu can never list a folder the panel
     * does not show. References are absolute: the composer resolves mentions
     * against the session's working directory, which is the agent workspace and
     * not the imported folder.
     */
    function buildNotesSource(api, t) {
      // A flat note list is useless past a few hundred rows and this walk is on
      // the composer's keystroke path, so it stops early rather than growing
      // with the folder.
      const MAX_NOTES = 400
      // The menu is a jumping-off point, not a browser: once a query has this
      // many matches the extra rows only make it harder to reach the one wanted.
      const MAX_ROWS = 50

      async function walk(project, relativePath, notes, signal) {
        if (notes.length >= MAX_NOTES || signal?.aborted === true) return
        let listing
        try {
          listing = await api.listEntries(project.id, relativePath)
        } catch (error) {
          // One unreadable folder must not hide the rest of the project.
          return
        }
        for (const entry of listing.entries ?? []) {
          if (notes.length >= MAX_NOTES || signal?.aborted === true) return
          if (entry.type === 'directory') await walk(project, entry.path, notes, signal)
          else notes.push({ project, path: entry.path, name: entry.name })
        }
      }

      async function candidates(_projection, request) {
        const query = (request?.query ?? '').trim().toLowerCase()
        const signal = request?.signal
        let projects
        try {
          projects = (await api.listProjects()).projects ?? []
        } catch (error) {
          return []
        }
        const notes = []
        for (const project of projects) {
          await walk(project, '', notes, signal)
          if (notes.length >= MAX_NOTES) break
        }
        const rows = []
        for (const note of notes) {
          if (signal?.aborted === true) return []
          const path = note.path.toLowerCase()
          if (query !== '' && !path.includes(query) && !note.name.toLowerCase().includes(query)) continue
          const parent = note.path.includes('/') ? note.path.slice(0, note.path.lastIndexOf('/')) : ''
          rows.push({
            name: note.name,
            // The folder disambiguates same-named notes; the project name keeps
            // it readable once several folders are imported.
            description: parent === '' ? note.project.name : `${note.project.name}/${parent}`,
            icon: 'file',
            section: t('reference.section'),
            value: JSON.stringify({ ref: noteMention(note.project.rootPath, note.path), label: note.name }),
          })
          if (rows.length >= MAX_ROWS) break
        }
        return rows
      }

      return {
        trigger: '@',
        name: NOTES_SOURCE,
        // Sorted after the host's own `reference` source (order 0), so a note
        // never displaces the session's files at the top of the menu.
        order: 40,
        showGroupTitle: false,
        candidates,
        onPick({ candidate }) {
          let picked
          try {
            picked = JSON.parse(candidate.value)
          } catch (error) {
            return { text: '', continue: false }
          }
          return {
            insert: {
              source: NOTES_SOURCE,
              ref: picked.ref,
              label: picked.label,
              appearance: 'file',
              clipboardText: picked.ref,
            },
          }
        },
        codec: {
          clipboardText: (ref) => ref,
          // Must be a Promise: the composer rejects a reference whose source has
          // no serializer, and a non-thenable would throw at submit time.
          serialize: (ref) => Promise.resolve(ref),
        },
      }
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
        const chat = buildChatBridge(ctx)

        // The `@` menu is an optional host capability: a scoped injection waits
        // for the service without making it a hard dependency of the whole
        // plugin, so the panel still mounts on a host that never provides it.
        // `ctx.get('inputTriggers')` cannot be used here: it reads undefined
        // until the owning fiber is ready, which in practice is never at apply
        // time.
        ctx.inject(['inputTriggers'], (scope) => {
          scope.effect(
            () => scope.inputTriggers.registerSource(buildNotesSource(api, t)),
            'local-markdown-notes: @ notes source',
          )
        })

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
                  inject: () => ({ api, t, chat }),
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
