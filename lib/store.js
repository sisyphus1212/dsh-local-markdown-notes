/**
 * Project registry persistence.
 *
 * The records live in the Host's already-composed storage stack: this plugin
 * opens its own domain schema through `ctx.storageDomain` instead of inserting
 * another storage provider row (a second `domain` provider mount is what made
 * the host exit 1 on 2026-11-06 with `storage form 'domain' is already
 * mounted`).
 *
 * @module @local/local-markdown-notes/lib/store
 */

/** Domain + table names must satisfy the storage medium's unit-name rule. */
export const DOMAIN_NAME = 'local_markdown_notes'
export const PROJECTS_TABLE = 'projects'
export const DOMAIN_VERSION = 1

/**
 * Hand-rolled record validator: `domainTable` only requires a `parse` method
 * that returns the record or throws, so the registry needs no schema library.
 */
const projectRecordSchema = {
  parse(raw) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new TypeError('project record must be an object')
    }
    for (const field of ['id', 'name', 'rootPath']) {
      if (typeof raw[field] !== 'string' || raw[field].length === 0) {
        throw new TypeError(`project record field "${field}" must be a non-empty string`)
      }
    }
    return {
      id: raw.id,
      name: raw.name,
      rootPath: raw.rootPath,
      gitInitialized: raw.gitInitialized === true,
      createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : 0,
      updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0,
    }
  },
}

/**
 * The domain declaration handed to `ctx.storageDomain.open`.
 * @param {object} domainTable - `domainTable` from `@deepseek-ai/dsh-storage-domain`.
 */
export function defineNotesDomain(domainTable) {
  return {
    name: DOMAIN_NAME,
    version: DOMAIN_VERSION,
    tables: { [PROJECTS_TABLE]: domainTable(projectRecordSchema) },
  }
}

/** In-memory ordering + access over the persisted table. */
export class ProjectStore {
  /**
   * @param {object} table - `domain.table('projects')`.
   */
  constructor(table) {
    this.table = table
  }

  /** @returns {object[]} newest import first */
  list() {
    const records = []
    for (const [, value] of this.table.entries()) records.push(value)
    records.sort((left, right) => right.createdAt - left.createdAt || left.id.localeCompare(right.id))
    return records
  }

  /** @param {string} id */
  get(id) {
    return this.table.get(id)
  }

  /**
   * @param {object} record
   * @returns {Promise<object>} the stored record, stamped with `updatedAt`
   */
  async put(record) {
    const next = { ...record, updatedAt: Date.now() }
    await this.table.put(next.id, next)
    return next
  }

  /** @param {string} id */
  async remove(id) {
    return this.table.delete(id)
  }
}
