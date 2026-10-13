/**
 * Bundle `src/client.mjs` (+ `src/core.mjs`, `src/panel.css`) into the single
 * artifact the DSH web shell loads: `lib/client.js`.
 *
 * The client module system does not serve ES modules. A plugin bundle is a
 * classic script that calls
 *
 *     window.__ModuleLoader__.load({ id, factory: (require) => { ... } })
 *
 * and resolves its externals through the injected `require` (the shell's frozen
 * module table). So this build inlines the two local modules, rewrites the
 * `react` import into a `require`, and wraps the result in that banner.
 *
 * No bundler dependency: the module graph here is two files, and a real
 * bundler would only add a toolchain the profile does not have.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PKG = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const ID = PKG.name

/** Strip `export` keywords and collect the names the entry needs. */
function toInlineModule(source, exported) {
  const names = []
  let out = source
  // `export const x = ...` / `export function f(...)` → plain declarations.
  out = out.replace(/^export\s+(const|let|var|function|class)\s+([A-Za-z0-9_$]+)/gm, (_, kind, name) => {
    names.push(name)
    return `${kind} ${name}`
  })
  // `export { a, b }` / `export { a as b }` → drop (inlined scope is shared).
  out = out.replace(/^export\s*\{[^}]*\}\s*;?$/gm, '')
  if (exported) {
    const missing = exported.filter(name => !names.includes(name))
    if (missing.length) throw new Error(`client entry imports names core.mjs does not export: ${missing.join(', ')}`)
  }
  return out
}

const coreSource = readFileSync(join(root, 'src', 'core.mjs'), 'utf8')
const entrySource = readFileSync(join(root, 'src', 'client.mjs'), 'utf8')
const cssSource = readFileSync(join(root, 'src', 'panel.css'), 'utf8')

// Which core symbols the entry pulls in (validates the inlining is complete).
const importMatch = /import\s*\{([^}]*)\}\s*from\s*'\.\/core\.mjs'/.exec(entrySource)
if (!importMatch) throw new Error('src/client.mjs must import from ./core.mjs')
const imported = importMatch[1].split(',').map(s => s.trim()).filter(Boolean)

// Entry: drop the ESM import lines; `react` becomes the module-table require.
let body = entrySource
  .replace(/^import\s+React\s+from\s+'react'\s*$/m, '')
  .replace(/^import\s*\{[^}]*\}\s*from\s*'\.\/core\.mjs'\s*$/m, '')
  .replace(/^export\s+const\s+inject\s*=/m, 'const inject =')
  .replace(/^export\s+function\s+apply/m, 'function apply')
if (/^\s*(import|export)\s/m.test(body)) {
  throw new Error('src/client.mjs still contains a module-level import/export after rewriting')
}

const banner = `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {
"use strict";
var module = { exports: {} };
var exports = module.exports;
var React = require("react");

//#region src/panel.css (self-injected, removed with the bundle)
(function () {
  var id = ${JSON.stringify(`${ID}/panel.css`)};
  if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(id) + "]") === null) {
    var tag = document.createElement("style");
    tag.dataset.plugin = ${JSON.stringify(ID)};
    tag.dataset.pluginCss = id;
    tag.textContent = ${JSON.stringify(cssSource)};
    document.head.appendChild(tag);
  }
})();
//#endregion

//#region src/core.mjs
${toInlineModule(coreSource, imported)}
//#endregion

//#region src/client.mjs
${body}
//#endregion

exports.inject = inject;
exports.apply = apply;
return module.exports;
} });
`

const outDir = join(root, 'lib')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'client.js'), banner, 'utf8')

// The node half: an inert apply() that gives the host Loader a row to mount.
writeFileSync(join(outDir, 'index.js'), `/**
 * Task board, node half.
 *
 * Browser-only plugin: the host Loader still needs a row to mount so the
 * client-modules scan can discover \`dsh.client\` and serve \`lib/client.js\`.
 * @returns {void}
 */
export function apply() {}
`, 'utf8')

const bytes = Buffer.byteLength(banner, 'utf8')
console.log(`built ${ID}`)
console.log(`  lib/client.js  ${bytes.toLocaleString()} bytes`)
console.log(`  lib/index.js   node half (inert)`)
