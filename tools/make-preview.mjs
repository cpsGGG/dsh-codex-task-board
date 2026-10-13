/**
 * Generate `preview/board.html` — a self-contained, dependency-free preview of
 * the panel, rendered from the REAL built bundle with fictional data.
 *
 * Why this exists: a screenshot of a live board leaks whatever the maintainer
 * happens to have open (workspace names, session titles, file paths). This
 * fixture renders the same component against a fixed cast of demo sessions, so
 * the artifact is reproducible, safe to publish, and doubles as a way to see
 * the UI without installing anything.
 *
 * The trick is that the panel is pure `React.createElement` output. A minimal
 * React stand-in plus a tree-to-HTML serializer is enough to render it in Node;
 * the CSS is inlined verbatim from `src/panel.css`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(join(root, 'lib', 'client.js'), 'utf8')
const css = readFileSync(join(root, 'src', 'panel.css'), 'utf8')

// ---------------------------------------------------------------------------
// React stand-in (mirrors tests/panel.test.mjs)
// ---------------------------------------------------------------------------

let hookState = []
let hookIndex = 0
const React = {
  createElement(type, props, ...children) {
    return { type, props: { ...(props || {}), children: children.length > 1 ? children : children[0] } }
  },
  useState(initial) {
    const i = hookIndex++
    if (!(i in hookState)) hookState[i] = typeof initial === 'function' ? initial() : initial
    return [hookState[i], v => { hookState[i] = typeof v === 'function' ? v(hookState[i]) : v }]
  },
  useReducer(reducer, initial) {
    const i = hookIndex++
    if (!(i in hookState)) hookState[i] = initial
    return [hookState[i], action => { hookState[i] = reducer(hookState[i], action) }]
  },
  useRef(initial) { const i = hookIndex++; if (!(i in hookState)) hookState[i] = { current: initial }; return hookState[i] },
  useEffect() {},
  useLayoutEffect() {},
  useMemo(fn) { return fn() },
  useCallback(fn) { return fn },
}
React.Component = class Component {
  constructor(props) { this.props = props; this.state = {} }
  setState(next) { this.state = { ...this.state, ...(typeof next === 'function' ? next(this.state) : next) } }
  render() { return null }
}

// ---------------------------------------------------------------------------
// Load the real bundle
// ---------------------------------------------------------------------------

let captured = null
globalThis.window = { __ModuleLoader__: { load(reg) { captured = reg } } }
globalThis.document = {
  createElement: () => ({ dataset: {}, style: {}, appendChild() {} }),
  querySelector: () => null,
  head: { appendChild() {} },
}
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }

const shellRequire = spec => (spec === 'react' ? React : createRequire(import.meta.url)(spec))
new Function('window', 'document', 'localStorage', 'require', source)(
  globalThis.window, globalThis.document, globalThis.localStorage, shellRequire)
if (!captured) throw new Error('bundle did not register')

const mod = captured.factory(shellRequire)

// ---------------------------------------------------------------------------
// Demo data — entirely fictional
// ---------------------------------------------------------------------------

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const now = Date.now()

const demo = [
  { id: 'd1', title: 'Migrate the auth service to the new token format', cwd: 'D:\\work\\acme-web', running: true, updatedAt: now - 4 * MINUTE, status: 'doing', turn: { id: 'turn-1', status: 'inProgress', startedAtMs: now - 221_000, completedAtMs: null, durationMs: null, source: 'server' } },
  { id: 'd2', title: 'Add dark mode to the settings panel', cwd: 'D:\\work\\acme-web', running: false, updatedAt: now - 22 * MINUTE, status: 'todo', priority: true, color: 'teal' },
  { id: 'd3', title: 'Investigate flaky integration test on CI', cwd: 'D:\\work\\demo-api', running: false, updatedAt: now - 3 * HOUR, status: 'todo', priority: true, color: 'gold' },
  { id: 'd4', title: 'Rewrite the changelog generator', cwd: 'D:\\work\\docs-site', running: false, updatedAt: now - 9 * HOUR, status: 'review', unread: true },
  { id: 'd5', title: 'Tidy up the fixture loader', cwd: 'D:\\work\\demo-api', running: false, updatedAt: now - 26 * HOUR, status: 'review' },
  { id: 'd6', title: 'Draft the v2 migration guide', cwd: 'D:\\work\\docs-site', running: false, updatedAt: now - 3 * 24 * HOUR, status: 'todo' },
  { id: 'd7', title: 'Benchmark the parser rewrite', cwd: 'D:\\work\\acme-web', running: false, updatedAt: now - 5 * 24 * HOUR, status: 'review', turn: { id: 'turn-9', status: 'interrupted', startedAtMs: now - 5 * 24 * HOUR - 60_000, completedAtMs: now - 5 * 24 * HOUR, durationMs: 60_000, source: 'server' } },
]

const snapshot = {
  ids: demo.map(d => d.id),
  byId: Object.fromEntries(demo.map(d => [d.id, {
    id: d.id,
    title: d.title,
    displayTitle: d.title,
    cwd: d.cwd,
    running: d.running,
    completed: d.status === 'review',
    blank: false,
    updatedAt: d.updatedAt,
  }])),
  current: undefined,
  phase: 'ready',
  subagentsByParent: {},
  jobsBySession: {},
}

/** Seed the board store so every demo session appears with its intended state. */
function seedStore(store) {
  for (const d of demo) {
    store.current.items[d.id] = {
      id: d.id,
      title: d.title,
      cwd: d.cwd,
      project: d.cwd.replaceAll('/', '\\').split('\\').filter(Boolean).at(-1),
      createdAt: d.updatedAt,
      updatedAt: d.updatedAt,
      status: d.status,
      lastRuntimeType: d.running ? 'active' : 'idle',
      activeFlags: [],
      priority: d.priority === true,
      priorityColor: d.color ?? null,
      addedAt: d.updatedAt,
      nativeTurn: d.turn ?? null,
      nativeTimeChecked: true,
      manualPaused: false,
      panelReadAt: d.unread ? 0 : now + HOUR,
    }
  }
  store.current.doingOrder = demo.filter(d => d.status === 'doing').map(d => d.id)
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const registrations = []
let dictionary = {}
const fakeCtx = {
  effect: fn => fn(),
  locale: {
    register(_ns, dict) { dictionary = dict },
    bind: () => key => dictionary.zh?.[key] ?? key,
  },
  slots: {
    inject(_name, cb) { cb() },
    register(options, component) { registrations.push({ options, component }); return () => {} },
  },
  layout: { selectPanel() {} },
  uiWorkspace: { openSession() {} },
  sessions: { binding: () => undefined },
}

mod.apply(fakeCtx)
const main = registrations.find(r => r.options.name === 'main')
const injected = main.options.inject()
seedStore(injected.store)

hookState = []
hookIndex = 0
const props = {
  t: key => dictionary.zh?.[key] ?? key,
  useSessions: selector => selector(snapshot),
  store: injected.store,
  ctx: injected.ctx,
}
const element = main.component(props)

/** Expand components into host elements, exactly as a renderer would. */
function expand(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return null
  if (typeof node === 'string' || typeof node === 'number') return node
  if (Array.isArray(node)) return node.map(expand)
  const { type, props: p } = node
  if (typeof type === 'function') {
    const isClass = type.prototype && typeof type.prototype.render === 'function'
    return expand(isClass ? new type(p).render() : type(p))
  }
  return { type, props: { ...p, children: expand(p.children) } }
}

const VOID = new Set(['input', 'br', 'hr', 'img', 'meta', 'link'])
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

/**
 * React prop name → HTML attribute name.
 *
 * React spells DOM properties in camelCase; the CSS only matches the HTML
 * spelling, so this mapping is what makes the stylesheet apply at all.
 */
const ATTR = {
  className: 'class',
  htmlFor: 'for',
  tabIndex: 'tabindex',
  strokeWidth: 'stroke-width',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  fillRule: 'fill-rule',
  clipRule: 'clip-rule',
  strokeDasharray: 'stroke-dasharray',
  autoFocus: 'autofocus',
  readOnly: 'readonly',
}
/** React-internal props that never reach the DOM. */
const SKIP = new Set(['key', 'ref', '__self', '__source'])

/** Serialize a host element tree to HTML. */
function toHtml(node) {
  if (node === null || node === undefined || node === false) return ''
  if (typeof node === 'string' || typeof node === 'number') return esc(node)
  if (Array.isArray(node)) return node.map(toHtml).join('')
  const { type, props: p } = node
  const attrs = []
  for (const [key, value] of Object.entries(p || {})) {
    if (key === 'children' || SKIP.has(key)) continue
    if (value === undefined || value === null || value === false) continue
    if (key === 'style') {
      const decl = Object.entries(value).map(([k, v]) => `${k}:${v}`).join(';')
      if (decl) attrs.push(`style="${esc(decl)}"`)
      continue
    }
    // Event handlers are inert in a static page.
    if (/^on[A-Z]/.test(key) || typeof value === 'function') continue
    const name = ATTR[key] ?? key
    attrs.push(`${name}="${esc(value === true ? '' : value)}"`)
  }
  const head = `<${type}${attrs.length ? ' ' + attrs.join(' ') : ''}>`
  if (VOID.has(type)) return head
  return `${head}${toHtml(p?.children)}</${type}>`
}

const boardHtml = toHtml(expand(element))

// ---------------------------------------------------------------------------
// Emit a standalone page
// ---------------------------------------------------------------------------

const outDir = join(root, 'preview')
mkdirSync(outDir, { recursive: true })

const page = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>dsh-task-board — preview</title>
<style>
/* Static preview of the panel with fictional data. Generated by
   tools/make-preview.mjs from the real bundle — do not edit by hand. */
html, body { margin: 0; height: 100%; }
body {
  background: light-dark(#f4f4f5, #0f0f10);
  color-scheme: light dark;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", system-ui, sans-serif;
}
.preview-shell {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  height: 100%;
}
.preview-sidebar {
  background: light-dark(#fafafa, #161617);
  border-right: 1px solid light-dark(rgba(0,0,0,.10), rgba(255,255,255,.08));
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}
.preview-brand { font-weight: 600; font-size: 15px; letter-spacing: .01em; margin-bottom: 12px; }
.preview-new {
  height: 38px; display: flex; align-items: center; justify-content: center;
  border: 1px solid light-dark(rgba(0,0,0,.12), rgba(255,255,255,.12));
  border-radius: 12px; margin-bottom: 12px; font-weight: 500;
}
.preview-nav {
  height: 36px; display: flex; align-items: center; gap: 8px; padding: 0 8px;
  border-radius: 8px; background: light-dark(rgba(0,0,0,.055), rgba(255,255,255,.07));
  font-weight: 500;
}
.preview-nav svg { flex: none; }
.preview-section { margin: 14px 8px 4px; font-size: 12px; opacity: .55; }
.preview-item { height: 32px; display: flex; align-items: center; padding: 0 8px; border-radius: 8px; opacity: .8; font-size: 13px; }
.preview-main { min-width: 0; height: 100%; overflow: hidden; }
</style>
<style>
${css}
</style>
</head>
<body>
<div class="preview-shell">
  <aside class="preview-sidebar">
    <div class="preview-brand">DeepSeek Harness</div>
    <div class="preview-new">＋ 新会话</div>
    <div class="preview-nav">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 5.5h6v5h-6z"/><path d="M13.5 5.5h6v8h-6z"/><path d="M4.5 13.5h6v5h-6z"/><path d="M13.5 16.5h6v2h-6z"/></svg>
      任务面板
    </div>
    <div class="preview-section">工作区</div>
    <div class="preview-item">acme-web</div>
    <div class="preview-item">demo-api</div>
    <div class="preview-item">docs-site</div>
  </aside>
  <main class="preview-main">
${boardHtml}
  </main>
</div>
</body>
</html>
`

writeFileSync(join(outDir, 'board.html'), page, 'utf8')
console.log(`wrote preview/board.html (${Buffer.byteLength(page, 'utf8').toLocaleString()} bytes)`)
console.log(`demo sessions: ${demo.length}  (doing ${demo.filter(d => d.status === 'doing').length}, todo ${demo.filter(d => d.status === 'todo').length}, review ${demo.filter(d => d.status === 'review').length})`)
