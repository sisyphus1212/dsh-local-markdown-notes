/**
 * The single source of truth for the `notes` Remote surface, shared by the Host
 * half (which turns it into prototype markers) and the Client half (which turns
 * it into the strict-codec contribution `ctx.remote.$mount` requires).
 *
 * Both halves must agree on names and argument order, because the Host gateway
 * derives its descriptor from the method signature: business parameters keep
 * their identifier as wire name, and a final literal `signal` becomes the
 * cancellation channel and is NOT a wire parameter.
 */

export const PACKAGE = '@local/local-markdown-notes'
export const NAMESPACE = 'notes'

/**
 * The Cordis Service key the Host half registers under
 * (`super(ctx, SERVICE, { namespace: NAMESPACE })`, see lib/service.js).
 *
 * Every descriptor must repeat it: `api-gateway` validates it as a nonempty
 * segment of the invocation and later resolves the receiver with
 * `ctx.get(descriptor.service)`. Omitting it used to abort `remote.$mount`
 * with `TypeError: Cannot read properties of undefined (reading 'length')`
 * inside `validateSegment`, so the namespace never mounted.
 */
export const SERVICE = 'notesRemote'

/**
 * @typedef {{name: string, typeSymbol: string}} WireParameter
 * @typedef {{method: string, parameters: WireParameter[], result: string, summary: string}} MethodSpec
 */

/** @type {MethodSpec[]} */
export const METHODS = [
  {
    method: 'listProjects',
    parameters: [],
    result: 'notes.ProjectList',
    summary: 'Every imported notes project, newest import first.',
  },
  {
    method: 'importProject',
    parameters: [],
    result: 'notes.Project',
    summary:
      'Open the OS directory chooser, register the picked directory as a project, and run git init inside it when it has no repository of its own.',
  },
  {
    method: 'removeProject',
    parameters: [{ name: 'projectId', typeSymbol: 'notes.ProjectId' }],
    result: 'notes.Removed',
    summary: 'Forget a project. The directory and its files are left untouched.',
  },
  {
    method: 'listEntries',
    parameters: [
      { name: 'projectId', typeSymbol: 'notes.ProjectId' },
      { name: 'relativePath', typeSymbol: 'notes.RelativePath' },
    ],
    result: 'notes.EntryList',
    summary: 'List the Markdown files and directories under a project-relative path.',
  },
  {
    method: 'readFile',
    parameters: [
      { name: 'projectId', typeSymbol: 'notes.ProjectId' },
      { name: 'relativePath', typeSymbol: 'notes.RelativePath' },
    ],
    result: 'notes.FileContent',
    summary: 'Read one Markdown file plus the version token needed to save it back.',
  },
  {
    method: 'writeFile',
    parameters: [
      { name: 'projectId', typeSymbol: 'notes.ProjectId' },
      { name: 'relativePath', typeSymbol: 'notes.RelativePath' },
      { name: 'content', typeSymbol: 'notes.FileText' },
      { name: 'expectedVersion', typeSymbol: 'notes.FileVersion' },
    ],
    result: 'notes.FileContent',
    summary: 'Save an edited Markdown file, refusing the write when the file moved on.',
  },
  {
    method: 'gitStatus',
    parameters: [{ name: 'projectId', typeSymbol: 'notes.ProjectId' }],
    result: 'notes.GitStatus',
    summary: 'Read-only `git status --porcelain=v1 -z` for the project root.',
  },
  {
    method: 'gitDiff',
    parameters: [
      { name: 'projectId', typeSymbol: 'notes.ProjectId' },
      { name: 'relativePath', typeSymbol: 'notes.RelativePath' },
    ],
    result: 'notes.GitDiff',
    summary: 'Read-only working-tree diff against HEAD, optionally limited to one path.',
  },
  {
    method: 'gitBaseline',
    parameters: [
      { name: 'projectId', typeSymbol: 'notes.ProjectId' },
      { name: 'relativePath', typeSymbol: 'notes.RelativePath' },
    ],
    result: 'notes.GitBaseline',
    summary:
      'Read-only text of one file as it stands in HEAD, for an unsaved buffer to be compared against. Null content means the file is not part of the repository.',
  },
  {
    method: 'gitBlame',
    parameters: [
      { name: 'projectId', typeSymbol: 'notes.ProjectId' },
      { name: 'relativePath', typeSymbol: 'notes.RelativePath' },
      { name: 'line', typeSymbol: 'notes.LineNumber' },
    ],
    result: 'notes.BlameEntry',
    summary: 'Read-only blame lookup for one line of one file.',
  },
  {
    method: 'createEntry',
    parameters: [
      { name: 'projectId', typeSymbol: 'notes.ProjectId' },
      { name: 'relativePath', typeSymbol: 'notes.RelativePath' },
      { name: 'kind', typeSymbol: 'notes.EntryKind' },
    ],
    result: 'notes.CreatedEntry',
    summary: 'Create one empty file or one directory, refusing to overwrite anything.',
  },
  {
    method: 'deleteEntry',
    parameters: [
      { name: 'projectId', typeSymbol: 'notes.ProjectId' },
      { name: 'relativePath', typeSymbol: 'notes.RelativePath' },
    ],
    result: 'notes.RemovedEntry',
    summary: 'Delete one Markdown file, or one directory that is already empty.',
  },
  {
    method: 'renameEntry',
    parameters: [
      { name: 'projectId', typeSymbol: 'notes.ProjectId' },
      { name: 'fromPath', typeSymbol: 'notes.RelativePath' },
      { name: 'toPath', typeSymbol: 'notes.RelativePath' },
    ],
    result: 'notes.RenamedEntry',
    summary: 'Rename one file or one directory in place, refusing a name that is taken.',
  },
  {
    method: 'searchNotes',
    parameters: [
      { name: 'projectId', typeSymbol: 'notes.ProjectId' },
      { name: 'query', typeSymbol: 'notes.SearchQuery' },
    ],
    result: 'notes.SearchResults',
    summary: 'Search every Markdown file of one project for a substring.',
  },
]

export const ENDPOINTS = METHODS.map((entry) => `${NAMESPACE}/${entry.method}`)

const SCHEMA_STUB = Object.freeze({})

/**
 * A strict codec good enough for both halves: the Client mount only validates
 * `codec.mode === 'strict'`, and arguments travel as plain JSON values whose
 * shape the Host method signature already narrows.
 *
 * @param {string} typeSymbol
 */
export function strictCodec(typeSymbol) {
  return {
    mode: 'strict',
    typeSymbol,
    create: () => SCHEMA_STUB,
    schema: SCHEMA_STUB,
  }
}

/**
 * Build the contribution the Client hands to `ctx.remote.$mount`.
 * @returns {{package: string, descriptors: object[]}}
 */
export function buildContribution() {
  return {
    package: PACKAGE,
    descriptors: METHODS.map((entry) => ({
      id: `${PACKAGE}#${NAMESPACE}/${entry.method}`,
      service: SERVICE,
      namespace: NAMESPACE,
      method: entry.method,
      description: entry.summary,
      invocation: { kind: 'direct' },
      parameters: entry.parameters.map((parameter) => ({
        name: parameter.name,
        wire: parameter.name,
        source: 'json',
        codec: strictCodec(parameter.typeSymbol),
      })),
      result: strictCodec(entry.result),
    })),
  }
}

/**
 * The prototype marker list the Host gateway reads. `exportName` is omitted so
 * the RPC endpoint segment is the method name itself.
 */
export function remoteMarkers() {
  return METHODS.map((entry) =>
    Object.freeze({ method: entry.method, invocation: Object.freeze({ kind: 'direct' }) }),
  )
}
