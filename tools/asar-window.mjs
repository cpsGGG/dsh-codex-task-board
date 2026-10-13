/**
 * Print a UTF-8 text window from an installed `app.asar`.
 *
 * Companion to `scan-asar.mjs`: once a needle's offset is known, this shows the
 * surrounding code or docs. Offsets come from `scan-asar.mjs` output.
 *
 * Usage:
 *   node tools/asar-window.mjs <path-to-app.asar> <needle|byte-offset> [before] [after]
 */
import { readFileSync } from 'node:fs'

const ASAR = process.argv[2]
const needle = process.argv[3]
if (!ASAR || needle === undefined) {
  console.error('usage: node tools/asar-window.mjs <path-to-app.asar> <needle|byte-offset> [before] [after]')
  process.exit(2)
}
const before = Number(process.argv[4] ?? 1500)
const after = Number(process.argv[5] ?? 4500)

const buf = readFileSync(ASAR)
const at = /^\d+$/.test(needle) ? Number(needle) : buf.indexOf(Buffer.from(needle, 'utf8'))
if (at === -1) {
  console.error('needle not found')
  process.exit(1)
}
console.log(`--- offset ${at} (needle ${JSON.stringify(needle)}) ---`)
console.log(buf.subarray(Math.max(0, at - before), Math.min(buf.length, at + after)).toString('utf8'))
