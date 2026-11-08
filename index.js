/**
 * Host half of the local Markdown notes plugin.
 *
 * The plugin declares only the services it consumes. The storage stack, the
 * subprocess runtime, the filesystem and the Typert gateway are all already
 * composed by the profile, so this plugin must never insert provider rows for
 * them — a second `domain` mount is what made the host exit 1 with
 * `storage form 'domain' is already mounted` on 2026-11-06.
 *
 * @module @local/local-markdown-notes
 */

import { NotesRemote, createNotesRemote, markRemoteMethods } from './lib/service.js'
import { registerNotesTools } from './lib/tools.js'

export const name = 'local-markdown-notes'

export const inject = ['storageDomain', 'fs', 'subprocess', 'directoryPicker']

/**
 * @param {object} ctx plugin context
 */
export async function apply(ctx) {
  markRemoteMethods(NotesRemote)
  const { remote, domain } = await createNotesRemote(ctx)
  ctx.effect(() => () => domain.close(), 'local-markdown-notes: close project registry')
  // The Agent talks to the same `NotesRemote` the panel calls, so a note written
  // in conversation passes the same containment check and version guard as one
  // saved by hand.
  registerNotesTools(ctx, remote)
}

export { NotesRemote, markRemoteMethods }
