import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(here, '..', 'lib', 'service.js'), 'utf8')

/**
 * These are structural assertions over `lib/service.js`, matching the style of
 * service-surface.test.js: the module is not imported because it pulls in the
 * Typert runtime, which only exists inside a running Host.
 *
 * They guard the one path that made the Client's stale-write branch
 * unreachable: a filesystem code that does not match the `<domain>/<reason>`
 * envelope used to be replaced by the fallback code, so `FS_STALE_VERSION`
 * arrived as `notes/write-failed` and the "file changed on disk" notice never
 * appeared.
 */
test('a filesystem version conflict reaches the Client as notes/stale', () => {
  assert.match(source, /FS_STALE_VERSION:\s*'notes\/stale'/)
  assert.match(source, /CODE_ALIASES\[raw\]\s*\?\?/)
})

test('other filesystem codes keep their meaning instead of collapsing to one fallback', () => {
  for (const alias of ['FS_NOT_FOUND', 'FS_ALREADY_EXISTS', 'FS_NOT_A_DIRECTORY']) {
    assert.match(source, new RegExp(`${alias}:\\s*'notes/`), `${alias} needs an alias`)
  }
})

test('an unknown upstream code still falls back to the caller-supplied code', () => {
  assert.match(source, /CODE_PATTERN\.test\(raw\)\s*\?\s*raw\s*:\s*fallbackCode/)
})
