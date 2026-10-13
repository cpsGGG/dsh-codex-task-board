/**
 * Scan an installed `app.asar` for the strings a plugin depends on.
 *
 * An asar is a pickle header + JSON directory table + raw file payloads, so a
 * plain byte search over the whole archive finds every literal — no unpacking
 * needed. Useful for checking a shipped slot contract or API surface without
 * relying on a source tree, which may be a different version entirely.
 *
 * Usage:
 *   node tools/scan-asar.mjs <path-to-app.asar> <needle> [needle...]
 *
 * The archive path is required on purpose: this tool ships in a public repo and
 * must not assume one machine's install layout.
 */
import { readFileSync } from 'node:fs'

const ASAR = process.argv[2]
const needles = process.argv.slice(3)
if (!ASAR || needles.length === 0) {
  console.error('usage: node tools/scan-asar.mjs <path-to-app.asar> <needle> [needle...]')
  process.exit(2)
}
const buf = readFileSync(ASAR)
console.log(`archive: ${ASAR} (${buf.length} bytes)`)

for (const needle of needles) {
  const hits = []
  let from = 0
  const target = Buffer.from(needle, 'utf8')
  while (true) {
    const at = buf.indexOf(target, from)
    if (at === -1) break
    hits.push(at)
    from = at + 1
    if (hits.length >= 40) break
  }
  console.log(`\n=== ${JSON.stringify(needle)} : ${hits.length}${hits.length >= 40 ? '+' : ''} hit(s) ===`)
  for (const at of hits.slice(0, 12)) {
    const start = Math.max(0, at - 110)
    const end = Math.min(buf.length, at + needle.length + 110)
    const ctx = buf.subarray(start, end).toString('utf8').replace(/[\u0000-\u001f]/g, '·')
    console.log(`  @${at}: …${ctx}…`)
  }
}
