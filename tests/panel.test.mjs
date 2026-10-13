/**
 * Panel render tests.
 *
 * These execute the REAL built bundle (`lib/client.js`) with a stub React and a
 * fake Cordis context, drive the same `apply()` the shell drives, then expand
 * the returned element tree the way a renderer would. That makes the panel's
 * rendered structure — columns, card anatomy, labels, style variables —
 * assertable without a browser, and catches the class of failure a live check
 * hides behind the slot error boundary.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const BUNDLE = new URL('../lib/client.js', import.meta.url)
const source = readFileSync(BUNDLE, 'utf8')

// The panel starts a 1s interval for live durations. In a test render there is
// no unmount, so an unpatched setInterval would keep the runner alive forever.
// Record the callbacks instead: these tests assert rendered output, not ticks.
const realSetInterval = globalThis.setInterval
const realClearInterval = globalThis.clearInterval
globalThis.setInterval = () => 0
globalThis.clearInterval = () => {}
process.on('exit', () => {
  globalThis.setInterval = realSetInterval
  globalThis.clearInterval = realClearInterval
})

/** React stand-in: hooks are stateful across a render, elements are plain data. */
function createReact() {
  let state = []
  let index = 0
  const React = {
    createElement(type, props, ...children) {
      return {
        type,
        props: { ...(props || {}), children: children.length > 1 ? children : children[0] },
      }
    },
    useState(initial) {
      const i = index++
      if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial
      return [state[i], v => { state[i] = typeof v === 'function' ? v(state[i]) : v }]
    },
    useReducer(reducer, initial) {
      const i = index++
      if (!(i in state)) state[i] = initial
      return [state[i], action => { state[i] = reducer(state[i], action) }]
    },
    useRef(initial) {
      const i = index++
      if (!(i in state)) state[i] = { current: initial }
      return state[i]
    },
    useEffect(fn) { fn() },
    useLayoutEffect(fn) { fn() },
    useMemo(fn) { return fn() },
    useCallback(fn) { return fn },
  }
  React.Component = class Component {
    constructor(props) { this.props = props; this.state = {} }
    setState(next) { this.state = { ...this.state, ...(typeof next === 'function' ? next(this.state) : next) } }
    render() { return null }
  }
  return {
    React,
    /** Clear hook state entirely (a fresh mount). */
    reset() { state = []; index = 0 },
    /** Start another render pass over the SAME state (a re-render). */
    beginRender() { index = 0 },
  }
}

/**
 * Expand an element tree into host elements, invoking function and class
 * components the way a renderer would.
 *
 * Errors propagate: a component that throws fails its test with the real stack
 * instead of a swallowed crash face.
 */
function expand(node, React) {
  if (node === null || node === undefined || typeof node === 'boolean') return null
  if (typeof node === 'string' || typeof node === 'number') return node
  if (Array.isArray(node)) return node.map(child => expand(child, React))
  const { type, props } = node
  if (typeof type === 'function') {
    const isClass = type.prototype && typeof type.prototype.render === 'function'
    const rendered = isClass ? new type(props).render() : type(props)
    return expand(rendered, React)
  }
  return { type, props: { ...props, children: expand(props.children, React) } }
}

/** Load the bundle and return its module exports plus the captured registration. */
function loadBundle(React) {
  let captured = null
  const win = { __ModuleLoader__: { load(reg) { captured = reg } } }
  const doc = {
    createElement: () => ({ dataset: {}, style: {}, set: undefined, appendChild() {} }),
    querySelector: () => null,
    head: { appendChild() {} },
  }
  const storage = new Map()
  const localStorage = {
    getItem: k => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => { storage.set(k, v) },
    removeItem: k => { storage.delete(k) },
  }
  const shellRequire = spec => (spec === 'react' ? React : createRequire(import.meta.url)(spec))
  // eslint-disable-next-line no-new-func
  new Function('window', 'document', 'localStorage', 'require', source)(win, doc, localStorage, shellRequire)
  assert.ok(captured, 'bundle must register through window.__ModuleLoader__.load')
  return { mod: captured.factory(shellRequire), storage }
}

/**
 * Drive apply() and return the registered entries plus the copy the plugin
 * registered, so `t` resolves the real strings rather than echoing keys.
 */
function register(mod, ctx) {
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
    ...ctx,
  }
  mod.apply(fakeCtx)
  registrations.t = key => dictionary.zh?.[key] ?? key
  return registrations
}

/** Collect every element in a tree with a matching className. */
function findAll(node, className, out = []) {
  if (node === null || node === undefined || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const child of node) findAll(child, className, out)
    return out
  }
  const classes = String(node.props?.className || '').split(/\s+/)
  if (classes.includes(className)) out.push(node)
  findAll(node.props?.children, className, out)
  return out
}

/** Flatten a tree to its text. */
function textOf(node) {
  if (node === null || node === undefined) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (typeof node === 'object') return textOf(node.props?.children)
  return ''
}

const NOW = Date.now()

/** A sessions snapshot with one running, one finished, one idle session. */
function sessionsSnapshot() {
  return {
    ids: ['run', 'done', 'idle'],
    byId: {
      run: { id: 'run', title: 'Running session', displayTitle: 'Running session', cwd: 'D:\\work\\alpha', running: true, blank: false, updatedAt: NOW },
      done: { id: 'done', title: 'Finished session', displayTitle: 'Finished session', cwd: 'D:\\work\\beta', running: false, completed: true, blank: false, updatedAt: NOW - 60_000 },
      idle: { id: 'idle', title: 'Idle session', displayTitle: 'Idle session', cwd: 'D:\\work\\gamma', running: false, blank: false, updatedAt: NOW - 120_000 },
    },
    current: undefined,
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
  }
}

/**
 * Seed the store with one item per session, the way the picker would.
 *
 * Auto-add is deliberately NOT exercised here — it only accepts new/running/
 * finished sessions, and that rule is covered by the core tests. These render
 * tests want all three columns populated.
 */
function seedStore(store, snapshot) {
  for (const id of snapshot.ids) {
    const row = snapshot.byId[id]
    if (!row || row.blank === true || row.origin === 'subagent') continue
    store.current.items[id] = {
      id,
      title: row.title || row.displayTitle || '',
      cwd: row.cwd || '',
      project: (row.cwd || '').replaceAll('/', '\\').split('\\').filter(Boolean).at(-1) || '未指定项目',
      createdAt: row.updatedAt,
      updatedAt: row.updatedAt,
      status: row.running ? 'doing' : row.completed ? 'review' : 'todo',
      lastRuntimeType: row.running ? 'active' : 'idle',
      activeFlags: [],
      priority: false,
      priorityColor: null,
      addedAt: NOW,
      nativeTurn: null,
      nativeTimeChecked: true,
      manualPaused: false,
      panelReadAt: 0,
    }
  }
  store.current.doingOrder = Object.values(store.current.items)
    .filter(item => item.status === 'doing').map(item => item.id)
  return store
}

/** Build a panel harness: bundle + registrations + seeded store. */
function harness(snapshot = sessionsSnapshot()) {
  const react = createReact()
  const { mod } = loadBundle(react.React)
  const registrations = register(mod, {
    layout: { selectPanel() {} },
    uiWorkspace: { openSession() {} },
    sessions: { binding: () => undefined },
  })
  const main = registrations.find(r => r.options.name === 'main')
  assert.ok(main, 'the plugin must register a main panel')
  const injected = main.options.inject()
  seedStore(injected.store, snapshot)
  const props = {
    t: registrations.t,
    useSessions: selector => selector(snapshot),
    store: injected.store,
    ctx: injected.ctx,
  }
  const render = () => {
    react.beginRender()
    return expand(main.component(props), react.React)
  }
  react.reset()
  return { ...react, mod, registrations, main, injected, snapshot, props, render, tree: render() }
}

// -- registration -----------------------------------------------------------

test('the plugin registers a sidebar entry and a main panel under one id', () => {
  const h = harness()
  const names = h.registrations.map(r => r.options.name).sort()
  assert.deepEqual(names, ['main', 'sidebar.panellist'])
  const nav = h.registrations.find(r => r.options.name === 'sidebar.panellist')
  const main = h.registrations.find(r => r.options.name === 'main')
  // The sidebar row selects the panel by the SAME id — that pairing is what
  // makes the board a first-class destination rather than an overlay.
  assert.equal(nav.options.id, main.options.key)
  assert.equal(typeof nav.options.label, 'function')
})

test('the panel declares the services it reads', () => {
  const h = harness()
  assert.deepEqual(h.mod.inject, ['slots', 'layout', 'locale', 'sessions', 'uiWorkspace'])
})

// -- structure --------------------------------------------------------------

test('the panel renders the three columns with their original names and hints', () => {
  const columns = findAll(harness().tree, 'dtb-column')
  assert.equal(columns.length, 3)
  assert.deepEqual(columns.map(c => c.props['data-status']), ['todo', 'doing', 'review'])
  assert.deepEqual(columns.map(c => textOf(findAll(c, 'dtb-column-hint')[0])),
    ['刚加入、尚未开始', 'DSH 正在工作', '等待回答、批准或检查'])
  assert.deepEqual(columns.map(c => c.props.style['--tb-color']),
    ['#8b8b8b', '#339cff', '#e5a23c'])
})

test('the panel renders the original chrome', () => {
  const h = harness()
  // The sync stamp is written by the fold effect, so it lands on the render
  // after mount — assert the first paint, then the settled one.
  assert.equal(textOf(findAll(h.tree, 'dtb-connection')[0]), '正在连接 DSH…')
  const tree = h.render()
  assert.equal(textOf(findAll(tree, 'dtb-heading')[0]), '任务面板跨项目会话 · 本地保存')
  assert.equal(textOf(findAll(tree, 'dtb-button-primary')[0]), '＋ 添加会话')
  assert.equal(findAll(tree, 'dtb-search')[0].props.children[1].props.placeholder, '搜索面板中的会话…')
  assert.equal(textOf(findAll(tree, 'dtb-footer')[0]), '3 条会话完成后移出面板，不会删除原会话')
  assert.match(textOf(findAll(tree, 'dtb-connection')[0]), /^已同步 · /)
})

test('an empty board renders the original empty state in every column', () => {
  const empty = { ids: [], byId: {}, current: undefined, phase: 'ready', subagentsByParent: {}, jobsBySession: {} }
  const tree = harness(empty).tree
  const empties = findAll(tree, 'dtb-empty')
  assert.equal(empties.length, 3)
  assert.deepEqual(empties.map(e => textOf(e)), ['暂无会话', '暂无会话', '暂无会话'])
  assert.equal(textOf(findAll(tree, 'dtb-footer')[0]), '0 条会话完成后移出面板，不会删除原会话')
})

// -- cards ------------------------------------------------------------------

test('sessions land in the right columns from live host facts', () => {
  const tree = harness().tree
  const byStatus = Object.fromEntries(findAll(tree, 'dtb-column').map(column => [
    column.props['data-status'],
    findAll(column, 'dtb-card').map(card => textOf(findAll(card, 'dtb-card-project')[0])),
  ]))
  assert.deepEqual(byStatus.todo, ['gamma'])
  assert.deepEqual(byStatus.doing, ['alpha'])
  assert.deepEqual(byStatus.review, ['beta'])
})

test('a doing card carries the pause control, other cards do not', () => {
  const tree = harness().tree
  const doing = findAll(tree, 'dtb-column').find(c => c.props['data-status'] === 'doing')
  const control = findAll(doing, 'dtb-task-control')
  assert.equal(control.length, 1)
  assert.equal(textOf(control[0]), 'Ⅱ 暂停')
  assert.equal(control[0].props['data-paused'], 'false')
  assert.equal(control[0].props.title, '中断当前一轮，并留在处理中')

  const todo = findAll(tree, 'dtb-column').find(c => c.props['data-status'] === 'todo')
  assert.equal(findAll(todo, 'dtb-task-control').length, 0)
})

test('every card carries the original anatomy and status note', () => {
  const cards = findAll(harness().tree, 'dtb-card')
  assert.equal(cards.length, 3)
  for (const card of cards) {
    assert.equal(textOf(findAll(card, 'dtb-card-priority')[0]), '☆')
    assert.equal(textOf(findAll(card, 'dtb-card-remove')[0]), '✓')
    assert.equal(findAll(card, 'dtb-unread-dot').length, 1)
    assert.equal(findAll(card, 'dtb-card-note').length, 1)
    assert.equal(findAll(card, 'dtb-work-duration').length, 1)
    assert.equal(findAll(card, 'dtb-card-title-row').length, 1)
    assert.equal(findAll(card, 'dtb-card-meta').length, 1)
    assert.equal(findAll(card, 'dtb-card-work-row').length, 1)
    assert.equal(card.props.title, '打开原始会话')
    assert.equal(card.props.tabIndex, 0)
    assert.equal(card.props['data-unread'], 'true')
  }
  // Cards are collected in column order (todo, doing, review), which is also
  // the original's left-to-right reading order.
  const notes = cards.map(card => textOf(findAll(card, 'dtb-card-note')[0]))
  assert.deepEqual(notes, ['尚未开始', 'DSH 正在处理', '已停止运行，等待你检查'])
  const titles = cards.map(card => textOf(findAll(card, 'dtb-card-title-row')[0].props.children[1]))
  assert.deepEqual(titles, ['Idle session', 'Running session', 'Finished session'])
})

test('a priority card carries the palette style variables', () => {
  const h = harness()
  // Star the first card directly in the store, then re-render that state.
  const first = Object.values(h.injected.store.current.items)[0]
  first.priority = true
  first.priorityColor = 'teal'
  const tree = h.render()
  const card = findAll(tree, 'dtb-card').find(c => c.props['data-priority'] === 'true')
  assert.ok(card, 'the starred card must render data-priority=true')
  assert.equal(card.props['data-priority-color'], 'teal')
  assert.equal(card.props.style['--tb-priority-color'], '#61aaa4')
  assert.equal(card.props.style['--tb-priority-accent'], '#8dc5bf')
  assert.equal(card.props.style['--tb-priority-angle'], '128deg')
  assert.equal(textOf(findAll(card, 'dtb-card-priority')[0]), '★')
})

test('an unread card shows the dot and a read one hides it', () => {
  const h = harness()
  // Mark the running session read.
  h.injected.store.current.items.run.panelReadAt = NOW + 1000
  const tree = h.render()
  const cards = findAll(tree, 'dtb-card')
  const unreadFlags = cards.map(card => card.props['data-unread'])
  assert.equal(unreadFlags.filter(f => f === 'false').length, 1)
  const readDot = findAll(cards.find(c => c.props['data-unread'] === 'false'), 'dtb-unread-dot')[0]
  assert.equal(readDot.props['data-unread'], 'false')
})

// -- interaction ------------------------------------------------------------

test('the search box filters cards but keeps the column totals', () => {
  const h = harness()
  // Type into the panel search, then re-render with the new query state.
  findAll(h.tree, 'dtb-search')[0].props.children[1].props.onChange({ target: { value: 'alpha' } })
  const second = h.render()
  const visible = findAll(second, 'dtb-card')
  assert.equal(visible.length, 1, 'only the alpha session matches')
  assert.equal(textOf(findAll(visible[0], 'dtb-card-project')[0]), 'alpha')
  // The column pills still count every item of the status, filtered or not —
  // exactly as the original did (the totals never follow the query).
  assert.deepEqual(findAll(second, 'dtb-count').map(c => textOf(c)), ['1', '1', '1'])
})

test('a search that matches nothing shows the filtered empty state', () => {
  const h = harness()
  findAll(h.tree, 'dtb-search')[0].props.children[1].props.onChange({ target: { value: 'zzzz' } })
  const tree = h.render()
  assert.equal(findAll(tree, 'dtb-card').length, 0)
  assert.deepEqual(findAll(tree, 'dtb-empty').map(e => textOf(e)),
    ['没有匹配的会话', '没有匹配的会话', '没有匹配的会话'])
})

test('the picker excludes subagent children and blank drafts', () => {
  const snapshot = sessionsSnapshot()
  snapshot.ids.push('draft', 'child')
  snapshot.byId.draft = { id: 'draft', title: 'New session', displayTitle: 'New session', cwd: 'D:\\work\\alpha', running: false, blank: true, updatedAt: NOW }
  snapshot.byId.child = { id: 'child', title: 'Subagent', displayTitle: 'Subagent', cwd: 'D:\\work\\alpha', running: false, blank: false, origin: 'subagent', updatedAt: NOW }
  const h = harness(snapshot)
  findAll(h.tree, 'dtb-button-primary')[0].props.onClick()
  const tree = h.render()
  const rows = findAll(tree, 'dtb-picker-row')
  const titles = rows.map(r => textOf(findAll(r, 'dtb-picker-title')[0]))
  assert.deepEqual(titles, ['Running session', 'Finished session', 'Idle session'])
  assert.ok(!titles.includes('New session'), 'a blank draft must not be offered')
  assert.ok(!titles.includes('Subagent'), 'a subagent child must not be offered')
  // The picker renders the original copy.
  assert.equal(textOf(findAll(tree, 'dtb-picker-head')[0]), '添加 DSH 会话×')
  assert.equal(textOf(findAll(tree, 'dtb-picker-copy')[0]), '搜索所有项目中的旧会话，选择后加入任务面板。')
  // Every offered session is already on the board, so each row reads 已加入.
  assert.equal(textOf(findAll(rows[0], 'dtb-picker-add')[0]), '已加入')
})

test('a tracked session shows 已加入 and cannot be added twice', () => {
  const h = harness()
  findAll(h.tree, 'dtb-button-primary')[0].props.onClick()
  const tree = h.render()
  const addButtons = findAll(tree, 'dtb-picker-add')
  assert.equal(addButtons.length, 3)
  for (const button of addButtons) {
    assert.equal(textOf(button), '已加入')
    assert.equal(button.props.disabled, true)
  }
})

test('completing a card removes it and offers a single-level undo', () => {
  const h = harness()
  const before = findAll(h.tree, 'dtb-card').length
  const removeButton = findAll(h.tree, 'dtb-card-remove')[0]
  removeButton.props.onClick({ stopPropagation() {} })
  const afterRemove = h.render()
  assert.equal(findAll(afterRemove, 'dtb-card').length, before - 1)
  assert.equal(textOf(findAll(afterRemove, 'dtb-toast')[0]), '已从面板移出，原会话仍保留撤销')

  const undo = findAll(afterRemove, 'dtb-toast')[0].props.children[1]
  undo.props.onClick()
  const afterUndo = h.render()
  assert.equal(findAll(afterUndo, 'dtb-card').length, before)
  assert.equal(findAll(afterUndo, 'dtb-toast').length, 0)
})

test('starring a card assigns a colour from the palette', () => {
  const h = harness()
  const star = findAll(h.tree, 'dtb-card-priority')[0]
  star.props.onClick({ stopPropagation() {} })
  const tree = h.render()
  const starred = findAll(tree, 'dtb-card').find(c => c.props['data-priority'] === 'true')
  assert.ok(starred, 'the clicked card must be starred')
  const colorKey = starred.props['data-priority-color']
  assert.ok(Object.hasOwn({ gold: 1, red: 1, blue: 1, green: 1, purple: 1, cyan: 1, orange: 1, pink: 1, lime: 1, indigo: 1, teal: 1, magenta: 1, coral: 1, mint: 1, azure: 1, slate: 1 }, colorKey),
    `expected a palette key, got ${colorKey}`)
  assert.match(starred.props.style['--tb-priority-color'], /^#[0-9a-f]{6}$/)
})
