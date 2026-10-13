/**
 * Dump the shipped client slot catalog from an installed `app.asar`.
 *
 * The catalog is a machine-generated array of records (key / kind / scope /
 * summary) that DSH ships inside its client bundle. It is the authoritative
 * list of slots a plugin can register into, and it reflects the version
 * actually installed — which may be newer than any source checkout.
 *
 * Usage:
 *   node tools/dump-slots.mjs <path-to-app.asar>
 *
 * Then read one record in full with:
 *   node tools/slot-doc.mjs <path-to-app.asar> <slot-key>
 */
import { readFileSync } from 'node:fs'

const ASAR = process.argv[2]
if (!ASAR) {
  console.error('usage: node tools/dump-slots.mjs <path-to-app.asar>')
  process.exit(2)
}
const buf = readFileSync(ASAR)
// Locate the catalog by BYTE offset (utf8), then decode only that window:
// decoding the whole archive as text is both slow and lossy.
const anchor = buf.indexOf(Buffer.from('replaceRisk', 'utf8'))
if (anchor === -1) {
  console.error('catalog anchor not found (is this a DSH app.asar?)')
  process.exit(1)
}
const start = Math.max(0, anchor - 400000)
const end = Math.min(buf.length, anchor + 900000)
const window = buf.subarray(start, end).toString('utf8')

const re = /key:\s*"([^"]+)",\s*kind:\s*"([^"]+)",\s*scope:\s*"([^"]+)",\s*summary:\s*"((?:[^"\\]|\\.)*)"/g
const seen = new Map()
let m
while ((m = re.exec(window)) !== null) {
  const [, key, kind, scope, summary] = m
  if (!seen.has(key)) seen.set(key, { kind, scope, summary })
}
console.log(`slot entries found: ${seen.size}\n`)
for (const [key, v] of seen) {
  console.log(`${key.padEnd(46)} ${v.kind.padEnd(8)} ${v.scope.padEnd(14)} ${v.summary.replace(/\\n/g, ' ').slice(0, 110)}`)
}
