/**
 * Print the full catalog record for specific slot keys from an installed
 * `app.asar`.
 *
 * `dump-slots.mjs` lists every slot; this expands the ones you name, including
 * the upstream doc comment and the registration example DSH ships with it —
 * which is usually the fastest way to learn a slot's contract.
 *
 * Usage:
 *   node tools/slot-doc.mjs <path-to-app.asar> <slot-key> [slot-key...]
 */
import { readFileSync } from 'node:fs'

const ASAR = process.argv[2]
const wanted = new Set(process.argv.slice(3))
if (!ASAR || wanted.size === 0) {
  console.error('usage: node tools/slot-doc.mjs <path-to-app.asar> <slot-key> [slot-key...]')
  process.exit(2)
}
const buf = readFileSync(ASAR)
const anchor = buf.indexOf(Buffer.from('replaceRisk', 'utf8'))
if (anchor === -1) {
  console.error('catalog anchor not found (is this a DSH app.asar?)')
  process.exit(1)
}
const text = buf.subarray(Math.max(0, anchor - 400000), Math.min(buf.length, anchor + 900000)).toString('utf8')

// Records are flat JSON-ish objects; split on the "key:" field boundary.
const starts = []
const reKey = /\bkey:\s*"/g
let m
while ((m = reKey.exec(text)) !== null) starts.push(m.index)
starts.push(text.length)

let found = 0
for (let i = 0; i < starts.length - 1; i++) {
  const chunk = text.slice(starts[i], starts[i + 1])
  const key = /key:\s*"([^"]+)"/.exec(chunk)?.[1]
  if (key === undefined || !wanted.has(key)) continue
  found += 1
  const unesc = (s) => s?.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  const field = (name) => unesc(new RegExp(`\\b${name}:\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(chunk)?.[1])
  console.log('='.repeat(100))
  console.log(`KEY     : ${key}`)
  console.log(`KIND    : ${field('kind')}   SCOPE: ${field('scope')}`)
  console.log(`SUMMARY : ${field('summary')}`)
  console.log(`OWNER   : ${field('ownerShare') ?? field('owner') ?? '-'}`)
  console.log(`DOC     :\n${field('doc')}`)
  console.log(`EXAMPLE :\n${field('example')}`)
  console.log(`SOURCE  : ${field('source')}`)
  console.log()
}
if (found === 0) console.error(`no catalog record matched: ${[...wanted].join(', ')}`)
